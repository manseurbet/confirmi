const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;


/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
   ROUTE VENDEUR
========================= */
app.post("/create-confirmation", (req, res) => {
const { clientName, clientPhone, productRef, amount, description } = req.body;

if (!clientName || !clientPhone || !productRef || !amount) {
  return res.status(400).json({
    success: false,
    message: "Numéro de téléphone obligatoire"
  });
}

  const confirmations = JSON.parse(fs.readFileSync(transactionsFile));

const existing = confirmations.find(c => {
  return (
    c.clientName === clientName &&
    c.clientPhone === clientPhone &&
    c.productRef === productRef &&
    c.amount == amount
  );
});

  if (existing) {
    const clientLink = `${req.headers.origin}/client.html?id=${existing.transactionId}`;
    return res.json({ success: true, clientLink });
  }

  const transactionId = Date.now().toString();

  const transaction = {
    transactionId,
    clientName,
   clientPhone,
    productRef,
    amount,
    description,
    paymentMethod: null,
    attachment: null
  };

  confirmations.push(transaction);
  fs.writeFileSync(transactionsFile, JSON.stringify(confirmations, null, 2));

  const clientLink = `${req.headers.origin}/client.html?id=${transactionId}`;
  res.json({ success: true, clientLink });
});

/* =========================
   ROUTE CLIENT – LECTURE
========================= */
app.get("/transaction/:id", (req, res) => {
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const transaction = transactions.find(t => t.transactionId == req.params.id);

  if (!transaction) {
    return res.status(404).json({ success: false });
  }

  res.json({ success: true, transaction });
});

/* =========================
   ROUTE CLIENT – VALIDATION
========================= */
app.post(
  "/confirm-transaction/:id",
  upload.single("attachment"),
  (req, res) => {

    const { paymentMethod } = req.body;
    const transactions = JSON.parse(fs.readFileSync(transactionsFile, "utf8"));
    const transaction = transactions.find(
      t => t.transactionId == req.params.id
    );

    // 1️⃣ Transaction introuvable
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction introuvable"
      });
    }

    // 2️⃣ Déjà confirmée → STOP
    if (transaction.confirmed === true) {
      return res.json({
        success: false,
        message: "Cette commande a déjà été confirmée."
      });
    }

    // 3️⃣ Mode de paiement requis
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Mode de paiement requis"
      });
    }

    // 4️⃣ Si pas espèces → fichier obligatoire
    if (paymentMethod.toLowerCase() !== "especes" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Pièce justificative requise"
      });
    }

    // 5️⃣ Validation
    transaction.paymentMethod = paymentMethod;
    transaction.confirmed = true;

    if (req.file) {
      transaction.attachment = req.file.filename;
      transaction.originalFilename = req.file.originalname;
    }

    // 6️⃣ Sauvegarde
    fs.writeFileSync(
      transactionsFile,
      JSON.stringify(transactions, null, 2)
    );

    res.json({ success: true });
  }
);

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
