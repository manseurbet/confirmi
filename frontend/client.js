// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
// Middleware
// ----------------------

// Servir tous les fichiers dans le dossier frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Pour lire le JSON des requêtes POST
app.use(express.json());

// ----------------------
// Fichier de transactions
// ----------------------
const transactionsFile = path.join(__dirname, "transactions.json");

// Crée le fichier s'il n'existe pas
if (!fs.existsSync(transactionsFile)) {
  fs.writeFileSync(transactionsFile, JSON.stringify([]));
}

// ----------------------
// Route pour créer une transaction
// ----------------------
app.post("/create-transaction", (req, res) => {
  const { clientName, productRef, amount, description } = req.body;

  if (!clientName || !productRef || !amount) {
    return res.json({ success: false });
  }

  // ID unique pour la transaction
  const transactionId = Date.now();

  // Lecture et ajout de la nouvelle transaction
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const newTransaction = { transactionId, clientName, productRef, amount, description };
  transactions.push(newTransaction);
  fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

  // Génération du lien client
  const clientLink = `${req.protocol}://${req.get("host")}/client.html?id=${transactionId}`;

  res.json({ success: true, clientLink });
});

// ----------------------
// Route pour récupérer une transaction par ID (pour client.html)
// ----------------------
app.get("/transaction/:id", (req, res) => {
  const { id } = req.params;
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const transaction = transactions.find(t => t.transactionId == id);

  if (!transaction) return res.status(404).json({ success: false, message: "Transaction non trouvée" });

  res.json({ success: true, transaction });
});

// ----------------------
// Lancement du serveur
// ----------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

