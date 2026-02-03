const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARES (ORDRE CRITIQUE)
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔴 OBLIGATOIRE
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   DOSSIERS & FICHIERS
========================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const transactionsFile = path.join(__dirname, "transactions.json");
if (!fs.existsSync(transactionsFile)) {
  fs.writeFileSync(transactionsFile, JSON.stringify([]));
}

/* =========================
   MULTER – CONFIG PRO
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    let ext = "";

    if (file.mimetype === "image/jpeg") ext = ".jpg";
    else if (file.mimetype === "image/png") ext = ".png";
    else if (file.mimetype === "application/pdf") ext = ".pdf";

    cb(null, Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/* =========================
   ROUTE VENDEUR – CRÉATION
========================= */
app.post("/create-transaction", (req, res) => {
  console.log("➡️ /create-transaction appelée");
  console.log("BODY =", req.body);

  const { clientName, productRef, amount, description } = req.body;

  if (!clientName || !productRef || !amount) {
    return res.status(400).json({
      success: false,
      message: "Données manquantes"
    });
  }

  const transactions = JSON.parse(
    fs.readFileSync(transactionsFile, "utf8")
  );

  const transactionId = Date.now();

  const transaction = {
    transactionId,
    clientName,
    productRef,
    amount,
    description: description || "",
    paymentMethod: null,
    attachment: null,
    confirmed: false,
    createdAt: new Date()
  };

  transactions.push(transaction);

  fs.writeFileSync(
    transactionsFile,
    JSON.stringify(transactions, null, 2)
  );

  const clientLink = `${req.protocol}://${req.get(
    "host"
  )}/client.html?id=${transactionId}`;

  res.json({
    success: true,
    clientLink
  });
});

/* =========================
   ROUTE CLIENT – LECTURE
========================= */
app.get("/transaction/:id", (req, res) => {
  const transactions = JSON.parse(
    fs.readFileSync(transactionsFile, "utf8")
  );

  const transaction = transactions.find(
    t => t.transactionId == req.params.id
  );

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: "Transaction introuvable"
    });
  }

  res.json({
    success: true,
    transaction
  });
});

/* =========================
   ROUTE CLIENT – CONFIRMATION
========================= */
app.post(
  "/confirm-transaction/:id",
  upload.single("attachment"),
  (req, res) => {

    console.log("➡️ /confirm-transaction appelée");

    const { paymentMethod } = req.body;

    const transactions = JSON.parse(
      fs.readFileSync(transactionsFile, "utf8")
    );

    const transaction = transactions.find(
      t => t.transactionId == req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction introuvable"
      });
    }

    if (transaction.confirmed === true) {
      return res.json({
        success: false,
        message: "Cette transaction est déjà confirmée"
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Mode de paiement requis"
      });
    }

    if (
      paymentMethod.toLowerCase() !== "especes" &&
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message: "Pièce justificative requise"
      });
    }

    transaction.paymentMethod = paymentMethod;
    transaction.confirmed = true;

    if (req.file) {
      transaction.attachment = req.file.filename;
      transaction.originalFilename = req.file.originalname;
    }

    fs.writeFileSync(
      transactionsFile,
      JSON.stringify(transactions, null, 2)
    );

    res.json({ success: true });
  }
);

/* =========================
   LISTE TRANSACTIONS (DEBUG)
========================= */
app.get("/transactions", (req, res) => {
  try {
    const transactions = JSON.parse(
      fs.readFileSync(transactionsFile, "utf8")
    );
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lecture transactions"
    });
  }
});

/* =========================
   LANCEMENT SERVEUR
========================= */
app.listen(PORT, () => {
  console.log(`✅ Confirmi en ligne : http://localhost:${PORT}`);
});

