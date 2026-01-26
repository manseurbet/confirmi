const vendeur = document.getElementById('vendeur');
const client = document.getElementById('client');
const montant = document.getElementById('montant');
const mode = document.getElementById('mode');
const description = document.getElementById('description');
const resultat = document.getElementById('resultat');
const genererBtn = document.getElementById('generer');

genererBtn.addEventListener('click', () => {
  const v = vendeur.value.trim();
  const c = client.value.trim();
  const m = montant.value.trim();
  const md = mode.value;

  if (!v || !c || !m || !md) {
    resultat.style.color = 'red';
    resultat.textContent = 'Tous les champs obligatoires doivent être remplis.';
    return;
  }

  const transactionId = 'TX-' + Date.now();

  const messageClient =
`Demande de paiement
Transaction : ${transactionId}
Vendeur : ${v}
Montant : ${m} DA
Mode : ${md}

Merci de fournir la preuve via l’application Solde Clair.`;

  resultat.style.color = 'green';
  resultat.innerText =
`Demande créée avec succès

ID transaction : ${transactionId}

Message à envoyer au client :
-----------------------------
${messageClient}`;
});
