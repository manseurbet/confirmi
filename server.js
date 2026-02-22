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
   FILES
========================= */
const transactionsFile = path.join(__dirname, "transactions.json");
const scoresFile = path.join(__dirname, "scores.json");

if (!fs.existsSync(transactionsFile))
  fs.writeFileSync(transactionsFile, JSON.stringify([], null, 2));

if (!fs.existsSync(scoresFile))
  fs.writeFileSync(
    scoresFile,
    JSON.stringify({ clients: {}, vendeurs: {} }, null, 2)
  );

/* =========================
   MULTER
========================= */
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  })
});

/* =========================
   SCORE HELPERS
========================= */
function computeScore(obj) {
  const total = obj.ok + obj.ko;
  if (total === 0) return 100;
  return Math.round((obj.ok / total) * 100);
}

function badge(score) {
  if (score >= 80) return "🟢 موثوق";
  if (score >= 50) return "🟠 متوسط";
  return "🔴 غير موثوق";
}

/* =========================
   GET CLIENT SCORE (VENDEUR)
========================= */
app.get("/score/client/:phone", (req, res) => {
  const scores = JSON.parse(fs.readFileSync(scoresFile));
  const phone = req.params.phone;

  scores.clients[phone] ??= { ok: 0, ko: 0 };

  const s = computeScore(scores.clients[phone]);
  res.json({ score: s, badge: badge(s) });
});

/* =========================
   GET VENDEUR SCORE (CLIENT)
========================= */
app.get("/score/vendeur/:id", (req, res) => {
  const scores = JSON.parse(fs.readFileSync(scoresFile));
  const id = req.params.id;

  scores.vendeurs[id] ??= { ok: 0, ko: 0 };

  const s = computeScore(scores.vendeurs[id]);
  res.json({ score: s, badge: badge(s) });
});

/* =========================
   CREATE TRANSACTION
========================= */
app.post(
  "/create-confirmation",
  upload.single("productPhoto"),
  (req, res) => {
    const { clientName, clientPhone, productRef, amount, description } = req.body;

    if (!clientName || !clientPhone || !productRef || !amount)
      return res.json({ success: false });

    const transactions = JSON.parse(fs.readFileSync(transactionsFile));
    const scores = JSON.parse(fs.readFileSync(scoresFile));

    scores.clients[clientPhone] ??= { ok: 0, ko: 0 };

    const clientScore = computeScore(scores.clients[clientPhone]);
    const clientBadge = badge(clientScore);

    const transactionId = Date.now().toString();

    const transaction = {
      transactionId,
      vendeurId: "default-vendeur",
      clientName,
      clientPhone,
      productRef,
      amount,
      description,
      photo: req.file ? "/uploads/" + req.file.filename : null,
      paymentMethod: null,
      attachment: null,
      confirmed: false,
      clientScore,
      clientBadge
    };

    transactions.push(transaction);
    fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));

    const link = `${req.headers.origin}/client.html?id=${transactionId}`;
    res.json({ success: true, clientLink: link });
  }
);

/* =========================
   GET TRANSACTION (CLIENT)
========================= */
app.get("/transaction/:id", (req, res) => {
  const transactions = JSON.parse(fs.readFileSync(transactionsFile));
  const scores = JSON.parse(fs.readFileSync(scoresFile));

  const t = transactions.find(x => x.transactionId === req.params.id);
  if (!t) return res.json({ success: false });

  scores.vendeurs[t.vendeurId] ??= { ok: 0, ko: 0 };

  const vendeurScore = computeScore(scores.vendeurs[t.vendeurId]);

  t.vendorScore = vendeurScore;
  t.vendorBadge = badge(vendeurScore);

  res.json({ success: true, transaction: t });
});

/* =========================
   CONFIRM TRANSACTION
========================= */
app.post(
  "/confirm-transaction/:id",
  upload.single("attachment"),
  (req, res) => {
    const transactions = JSON.parse(fs.readFileSync(transactionsFile));
    const scores = JSON.parse(fs.readFileSync(scoresFile));

    const t = transactions.find(x => x.transactionId === req.params.id);
    if (!t) return res.json({ success: false });

    if (t.confirmed)
      return res.json({ success: false, message: "Déjà confirmée" });

    t.confirmed = true;
    t.paymentMethod = req.body.paymentMethod;

    if (req.file)
      t.attachment = "/uploads/" + req.file.filename;

    scores.clients[t.clientPhone] ??= { ok: 0, ko: 0 };
    scores.vendeurs[t.vendeurId] ??= { ok: 0, ko: 0 };

    scores.clients[t.clientPhone].ok++;
    scores.vendeurs[t.vendeurId].ok++;

    fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));
    fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));

    res.json({ success: true });
  }
);

/* =========================
   SERVER
========================= */
app.listen(PORT, () =>
  console.log("✅ Confirmi ON → http://localhost:3000")
);