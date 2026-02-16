const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

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

const usersFile = path.join(__dirname, "users.json");
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

/* =========================
   MULTER (PHOTOS)
========================= */
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* =========================
   INSCRIPTION VENDEUR
========================= */
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length < 3 ||
    password.length < 4
  ) {
    return res.json({
      success: false,
      message: "Données invalides"
    });
  }

  const users = JSON.parse(fs.readFileSync("users.json", "utf8"));

  if (users.find(u => u.username === username)) {
    return res.json({
      success: false,
      message: "Utilisateur déjà existant"
    });
  }

  users.push({ username, password });

  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

  res.json({ success: true });
});


/* =========================
   LOGIN VENDEUR
========================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Identifiants incorrects" });
  }

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

/* =========================
   CRÉATION COMMANDE (VENDEUR)
========================= */
app.post(
  "/create-confirmation",
  upload.single("productPhoto"),
  (req, res) => {

    const { clientName, clientPhone, productRef, amount, description } = req.body;

    if (!clientName || !clientPhone || !productRef || !amount) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants"
      });
    }

    if (!/^\d{10}$/.test(clientPhone)) {
      return res.status(400).json({
        success: false,
        message: "Téléphone invalide"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo du produit obligatoire"
      });
    }

    const transactions = JSON.parse(fs.readFileSync(transactionsFile));

    const transactionId = Date.now().toString();

    const transaction = {
      transactionId,
      clientName,
      clientPhone,
      productRef,
      amount,
      description,
      photo: "/uploads/" + req.file.filename,
      paymentMethod: null,
      attachment: null,
      confirmed: false
    };

    transactions.push(transaction);
    fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

    const clientLink = `${req.headers.origin}/client.html?id=${transactionId}`;
    res.json({ success: true, clientLink });
  }
);

/* =========================
   LECTURE COMMANDE (CLIENT)
========================= */
app.get("/transaction/:id", (req, res) => {
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const transaction = transactions.find(
    t => t.transactionId === req.params.id
  );

  if (!transaction) {
    return res.json({ success: false });
  }

  res.json({ success: true, transaction });
});

/* =========================
   CONFIRMATION CLIENT
========================= */
app.post(
  "/confirm-transaction/:id",
  upload.single("attachment"),
  (req, res) => {

    const { paymentMethod } = req.body;
    const transactions = JSON.parse(fs.readFileSync(transactionsFile));
    const transaction = transactions.find(
      t => t.transactionId === req.params.id
    );

    if (!transaction) {
      return res.json({ success: false, message: "Commande introuvable" });
    }

    if (transaction.confirmed) {
      return res.json({ success: false, message: "Déjà confirmée" });
    }

    if (!paymentMethod) {
      return res.json({ success: false, message: "Mode de paiement requis" });
    }

    if (paymentMethod !== "especes" && !req.file) {
      return res.json({
        success: false,
        message: "Justificatif requis"
      });
    }

    transaction.paymentMethod = paymentMethod;
    transaction.confirmed = true;

    if (req.file) {
      transaction.attachment = "/uploads/" + req.file.filename;
    }

    fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));
    res.json({ success: true });
  }
);

/* =========================
   LISTE COMMANDES
========================= */
app.get("/transactions", (req, res) => {
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  res.json({ success: true, transactions });
});

/* =========================
   SERVEUR
========================= */
app.listen(PORT, () => {
  console.log("✅ Confirmi en ligne : http://localhost:3000");
});
