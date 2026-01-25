// Récupération des éléments HTML
const nomInput = document.getElementById('nom');
const emailInput = document.getElementById('email');
const montantInput = document.getElementById('montant');
const recuInput = document.getElementById('recu');
const validerBtn = document.getElementById('valider');
const message = document.getElementById('message');

// Sécurité : vérifier que les éléments existent
if (!validerBtn || !message) {
  console.error('Éléments HTML manquants');
}

// Action au clic sur VALIDER
validerBtn.addEventListener('click', async () => {
  console.log('✅ Bouton VALIDER cliqué');

  const nom = nomInput.value.trim();
  const email = emailInput.value.trim();
  const montant = montantInput.value.trim();
  const recu = recuInput.files[0];

  console.log('📦 Données récupérées :', { nom, email, montant, recu });

  // Vérification des champs
  if (!nom || !email || !montant || !recu) {
    message.style.color = 'red';
    message.textContent = '❌ Tous les champs sont obligatoires.';
    console.warn('⛔ Champs manquants');
    return;
  }

  // Message immédiat
  message.style.color = 'blue';
  message.textContent = '⏳ Validation en cours...';

  // Création du formulaire
  const formData = new FormData();
  formData.append('nom', nom);
  formData.append('email', email);
  formData.append('montant', montant);
  formData.append('recu', recu);

  try {
    console.log('📡 Envoi vers le backend...');
    const response = await fetch('http://localhost:3000/api/transaction', {
      method: 'POST',
      body: formData
    });

    console.log('📥 Réponse reçue');

    const result = await response.json();
    console.log('📄 Résultat serveur :', result);

    if (!response.ok) {
      throw new Error(result.error || 'Erreur serveur');
    }

    // SUCCÈS
    message.style.color = 'green';
    message.textContent = '✅ Transaction enregistrée avec succès';

  } catch (err) {
    console.error('🔥 Erreur :', err);
    message.style.color = 'red';
    message.textContent = '❌ Échec de la validation (serveur ou réseau)';
  }
});

