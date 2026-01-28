const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const transactionsFile = path.join(__dirname, "transactions.json");

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* =========================
   GET UNE TRANSACTION
========================= */
app.get("/transaction/:id", (req, res) => {
  try {
    const transactions = JSON.parse(fs.readFileSync(transactionsFile));
    const transaction = transactions.find(
      t => t.transactionId == req.params.id
    );

    if (!transaction) {
      return res.json({ success: false });
    }

    res.json({ success: true, transaction });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

/* =========================
   GET TOUTES LES TRANSACTIONS
========================= */
app.get("/transactions", (req, res) => {
  try {
    const transactions = JSON.parse(fs.readFileSync(transactionsFile));
    res.json({ success: true, transactions });
  } catch (err) {
    console.error(err);
    res.json({ success: false, transactions: [] });
  }
});

/* =========================
   CONFIRMATION CLIENT
========================= */
app.post(
  "/confirm-transaction/:id",
  upload.single("attachment"),
  (req, res) => {
    try {
      const { paymentMethod } = req.body;
      const transactions = JSON.parse(fs.readFileSync(transactionsFile));
      const transaction = transactions.find(
        t => t.transactionId == req.params.id
      );

      if (!transaction) {
        return res.json({
          success: false,
          message: "Transaction introuvable"
        });
      }

      if (transaction.confirmed) {
        return res.json({
          success: false,
          message: "Cette commande a déjà été confirmée."
        });
      }

      if (!paymentMethod) {
        return res.json({
          success: false,
          message: "Mode de paiement requis"
        });
      }

      // ❗ Espèces = PAS de pièce
      if (paymentMethod !== "cash" && !req.file) {
        return res.json({
          success: false,
          message: "Pièce justificative requise"
        });
      }

      transaction.paymentMethod = paymentMethod;
      transaction.confirmed = true;

      if (req.file) {
        transaction.attachment = req.file.filename;
        transaction.originalFilename = req.file.originalname;
      }

      fs.writeFileSync(
        transactionsFile,
        JSON.stringify(transactions, null, 2)
      );

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.json({ success: false });
    }
  }
);

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("Confirmi server running on port", PORT);
});

