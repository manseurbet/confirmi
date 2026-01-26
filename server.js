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
app.use(express.static(path.join(__dirname, "frontend")));

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
app.post("/create-transaction", (req, res) => {
  const { clientName, productRef, amount, description } = req.body;

  if (!clientName || !productRef || !amount) {
    return res.status(400).json({ success: false, message: "Données manquantes" });
  }

  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const transactionId = Date.now();

  const transaction = {
    transactionId,
    clientName,
    productRef,
    amount,
    description,
    paymentMethod: null,
    attachment: null
  };

  transactions.push(transaction);
  fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

  const clientLink = `${req.protocol}://${req.get("host")}/client.html?id=${transactionId}`;

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
    const transactions = JSON.parse(fs.readFileSync(transactionsFile));
    const transaction = transactions.find(t => t.transactionId == req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction introuvable" });
    }

    if (transaction.paymentMethod) {
      return res.status(400).json({ success: false, message: "Transaction déjà validée" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Mode de paiement requis" });
    }

    if (paymentMethod !== "Especes" && !req.file) {
      return res.status(400).json({ success: false ;});
    }

    transaction.paymentMethod = paymentMethod;

    if (req.file) {
      transaction.attachment = req.file.filename;
      transaction.originalFilename = req.file.originalname;
    }

    fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

    res.json({ success: true });
  }
);

/* =========================
   LANCEMENT SERVEUR
========================= */
app.listen(PORT, () => {
  console.log(`✅ Confirmi en ligne : http://localhost:${PORT}`);
});

