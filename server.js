const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ Ton domaine Render (change si tu passes en local)
const DOMAIN = process.env.DOMAIN || "https://confirmi.onrender.com";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// fichiers statiques
app.use(express.static(path.join(__dirname, "frontend")));

// stockage upload
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => cb(null, true)
});

// fichier JSON pour stocker les transactions
const DB_FILE = "transactions.json";

// fonctions utilitaires DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// création transaction
app.post("/create-transaction", (req, res) => {
  const { clientName, productRef, amount, description } = req.body;

  const id = Date.now().toString();
  const db = loadDB();

  db[id] = {
    id,
    clientName,
    productRef,
    amount,
    description,
    status: "pending",
    paymentMode: null,
    proof: null,
    validatedAt: null
  };

  saveDB(db);

  // 🔹 lien client complet avec domaine
  const clientLink = `${DOMAIN}/client.html?id=${id}`;

  res.json({
    success: true,
    clientLink
  });
});

// lecture transaction (SANS MODIFICATION)
app.get("/transaction/:id", (req, res) => {
  const db = loadDB();
  const transaction = db[req.params.id];

  if (!transaction) {
    return res.status(404).json({ success: false });
  }

  res.json(transaction);
});

// validation transaction (VERROU DÉFINITIF)
app.post("/validate/:id", upload.single("proof"), (req, res) => {
  const db = loadDB();
  const transaction = db[req.params.id];

  if (!transaction) {
    return res.status(404).json({ success: false });
  }

  if (transaction.status === "validated") {
    return res.status(403).json({
      success: false,
      message: "Transaction déjà validée"
    });
  }

  transaction.status = "validated";
  transaction.paymentMode = req.body.paymentMode || "espece";
  transaction.validatedAt = new Date().toISOString();

  if (req.file) {
    transaction.proof = req.file.filename;
  }

  saveDB(db);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("Serveur lancé sur port", PORT);
});
