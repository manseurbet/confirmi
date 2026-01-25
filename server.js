const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());

const TRANSACTIONS_FILE = "transactions.json";

/* ===============================
   ROUTES API – TOUJOURS EN PREMIER
   =============================== */

// Récupérer une transaction par ID
app.get("/transaction/:id", (req, res) => {
  const id = req.params.id;
  let transactions = [];
  try {
    transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE));
  } catch (err) {
    return res.status(500).json({ error: "Impossible de lire les transactions" });
  }

  const tx = transactions.find(t => t.id === id);
  if (!tx) return res.status(404).json({ error: "Transaction introuvable" });

  res.json(tx);
});

// Validation d'une transaction
app.post("/validate-transaction/:id", upload.single("paymentFile"), (req, res) => {
  const id = req.params.id;
  let transactions = [];
  try {
    transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE));
  } catch (err) {
    return res.status(500).json({ error: "Impossible de lire les transactions" });
  }

  const tx = transactions.find(t => t.id === id);
  if (!tx) return res.status(404).json({ error: "Transaction introuvable" });

  if (tx.status === "validated") {
    return res.status(400).json({ error: "Déjà validée" });
  }

  // Mise à jour
  tx.status = "validated";
  tx.paymentMethod = req.body.paymentMethod;
  if (req.file) tx.paymentFile = req.file.filename;

  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
  } catch (err) {
    return res.status(500).json({ error: "Impossible d’enregistrer la transaction" });
  }

  res.json({ success: true });
});

/* ===============================
   SERVIR LE FRONTEND
   =============================== */

// Ton dossier frontend contient tous les HTML, CSS, JS
app.use(express.static("frontend")); 

// Plus aucune route HTML spécifique !
// index.html, vendeur.html, client.html seront servis automatiquement

/* ===============================
   LANCEMENT DU SERVEUR
   =============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

