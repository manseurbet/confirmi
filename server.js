const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Sessions
app.use(session({
  secret: "confirmi_secret_key",
  resave: false,
  saveUninitialized: true
}));

/* =========================
   DOSSIERS & FICHIERS
========================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const transactionsFile = path.join(__dirname, "transactions.json");
if (!fs.existsSync(transactionsFile)) fs.writeFileSync(transactionsFile, JSON.stringify([]));

const usersFile = path.join(__dirname, "users.json");
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png"];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* =========================
   ROUTES UTILISATEURS
========================= */
// Inscription
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Champs obligatoires" });

  const users = JSON.parse(fs.readFileSync(usersFile));
  if (users.find(u => u.username === username)) return res.json({ success: false, message: "Utilisateur existant" });

  const hashed = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashed });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

// Connexion
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Champs obligatoires" });

  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.json({ success: false, message: "Données invalides" });

  req.session.user = username;
  res.json({ success: true });
});

// Déconnexion
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

/* =========================
   ROUTES VENDEUR
========================= */
function authMiddleware(req, res, next) {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Non autorisé" });
  next();
}

// Création confirmation
app.post("/create-confirmation", authMiddleware, upload.single("productPhoto"), (req, res) => {
  const { clientName, clientPhone, productRef, amount, description } = req.body;
  const file = req.file;

  if (!clientName || !clientPhone || !productRef || !amount) return res.status(400).json({ success: false, message: "Champs obligatoires manquants" });
  if (!/^\d{10}$/.test(clientPhone)) return res.status(400).json({ success: false, message: "Téléphone invalide (10 chiffres)" });
  if (!file) return res.status(400).json({ success: false, message: "Photo du produit obligatoire" });

  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const transactionId = Date.now().toString();

  const transaction = {
    transactionId,
    clientName,
    clientPhone,
    productRef,
    amount,
    description,
    photo: "/uploads/" + file.filename,
    paymentMethod: null,
    attachment: null,
    confirmed: false
  };

  transactions.push(transaction);
  fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

  const clientLink = `${req.headers.origin}/client.html?id=${transactionId}`;
  res.json({ success: true, clientLink });
});

/* =========================
   ROUTES CLIENT
========================= */
app.get("/transaction/:id", (req, res) => {
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const transaction = transactions.find(t => t.transactionId == req.params.id);
  if (!transaction) return res.status(404).json({ success: false, message: "Transaction introuvable" });
  res.json({ success: true, transaction });
});

/* =========================
   LANCEMENT SERVEUR
========================= */
app.listen(PORT, () => {
  console.log(`✅ Confirmi en ligne : http://localhost:${PORT}`);
});
