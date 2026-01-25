const express = require("express");
const path = require("path");

const app = express();

// fichiers statiques
app.use(express.static(path.join(__dirname, "frontend")));

// page par défaut
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "vendeur.html"));
});

// port compatible Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Confirmi server OK sur le port " + PORT);
});
