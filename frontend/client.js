document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const txId = params.get("tx");

  if (!txId) {
    alert("Lien invalide");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/transaction/${txId}`);
    const data = await res.json();

    if (!data.success) {
      alert("Transaction introuvable");
      return;
    }

    // Champs gris (non modifiables)
    document.getElementById("transactionId").value = txId;
    document.getElementById("clientName").value = data.seller.clientName;
    document.getElementById("reference").value = data.seller.reference;

  } catch (err) {
    console.error(err);
    alert("Erreur serveur lors du chargement du client");
  }
});

