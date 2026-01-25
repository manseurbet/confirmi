const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());

const TRANSACTIONS_FILE = "transactions.json";

/* ===== ROUTES API ===== */
app.get("/transaction/:id", (req, res) => {
  const id = req.params.id;
  let transactions = [];
  try { transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE)); }
  catch (err) { return res.status(500).json({ error: "Impossible de lire les transactions" }); }

  const tx = transactions.find(t => t.id === id);
  if (!tx) return res.status(404).json({ error: "Transaction introuvable" });
  res.json(tx);
});

app.post("/validate-transaction/:id", upload.single("paymentFile"), (req, res) => {
  const id = req.params.id;
  let transactions = [];
  try { transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE)); }
  catch (err) { return res.status(500).json({ error: "Impossible de lire les transactions" }); }

  const tx = transactions.find(t => t.id === id);
  if (!tx) return res.status(404).json({ error: "Introuvable" });
  if (tx.status === "validated") return res.status(400).json({ error: "Déjà validée" });

  tx.status = "validated";
  tx.paymentMethod = req.body.paymentMethod;
  if (req.file) tx.paymentFile = req.file.filename;

  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
  res.json({ success: true });
});

/* ===== SERVIR FRONTEND ===== */
app.use(express.static("frontend")); // TON DOSSIER FRONTEND

/* ===== LANCEMENT DU SERVEUR ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

