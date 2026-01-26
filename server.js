const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer pour les uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Pour lire le body des formulaires en JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "frontend")));

// Charger les transactions
const transactionsPath = path.join(__dirname, "transaction.json");
let transactions = {};
if (fs.existsSync(transactionsPath)) {
  transactions = JSON.parse(fs.readFileSync(transactionsPath, "utf-8"));
}

// Endpoint pour récupérer une transaction
app.get("/get-transaction/:id", (req, res) => {
  const id = req.params.id;
  const transaction = transactions[id];
  if (!transaction) return res.json({ success: false });
  res.json({ success: true, transaction });
});

// Endpoint pour confirmer une transaction
app.post("/confirm-transaction/:id", upload.single("attachment"), (req, res) => {
  const id = req.params.id;
  const transaction = transactions[id];
  if (!transaction) return res.json({ success: false, message: "Transaction introuvable" });

  if (transaction.confirmed) {
    return res.json({ success: false, message: "Cette commande a déjà été confirmée." });
  }

  transaction.paymentMethod = req.body.paymentMethod || transaction.paymentMethod;
  if (req.file) transaction.attachment = req.file.filename;
  transaction.confirmed = true;

  // Sauvegarder les transactions
  fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));

  res.json({ success: true });
});

// Lancer le serveur
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

