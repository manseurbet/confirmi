<!DOCTYPE html>
<html lang="ar" dir="rtl">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmi – صفحة البائع</title>
<style>
body{margin:0;font-family:Arial, sans-serif;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;text-align:right;}
.container{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.box{max-width:500px;width:100%;background:#0b1220;border-radius:16px;padding:32px 26px;box-shadow:0 20px 60px rgba(0,0,0,0.4);}
h1{font-size:28px;margin-bottom:12px;text-align:center;}
h1 span{color:#22c55e;}
.score-card { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center; border: 1px solid #334155; }
.score-label { font-size: 14px; color: #94a3b8; margin-bottom: 5px; }
.score-value { font-size: 24px; font-weight: bold; color: #22c55e; }
form{ display:flex; flex-direction:column; gap:15px; }
label{ font-weight:bold; font-size:14px; }
input, textarea{ width:100%; padding:12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#fff; font-size:14px; box-sizing:border-box; }
button{ width:100%; padding:14px; background:#22c55e; color:#022c22; border:none; border-radius:10px; font-size:16px; font-weight:bold; cursor:pointer; transition:0.3s; }
button:hover{ background:#16a34a; }
.btn-home { background: #334155; color: white; margin-bottom: 20px; }
#resultSection{ display:none; margin-top:25px; padding:20px; background:#122135; border-radius:12px; border:1px dashed #22c55e; text-align:center; }
.link-input { background:#0b1220; border:1px solid #334155; padding:10px; border-radius:6px; margin:10px 0; width:100%; text-align:center; color:#38bdf8; font-family:monospace; }
.btn-secondary { background:#334155; color:#fff; margin-top:10px; }
.btn-whatsapp { background:#25d366; color:#fff; margin-top:10px; }
.btn-sms { background:#0ea5e9; color:#fff; margin-top:10px; }
</style>
<body>
<div class="container">
  <div class="box">
    <button class="btn-home" onclick="location.href='/'">🏠 العودة للرئيسية</button>
    <h1>Confirmi <span>✓</span></h1>
    <div class="score-card">
        <div class="score-label">⭐ تقييم موثوقية الزبون:</div>
        <div id="scoreDisplay"><span class="score-value" id="scoreNum">--</span> <span id="badgeText"></span></div>
    </div>
    <form id="orderForm">
      <input type="hidden" id="sellerId">
      <label>رقم هاتف الزبون</label>
      <input type="tel" id="clientPhone" placeholder="0XXXXXXXXX" required>
      <label>اسم الزبون</label>
      <input type="text" id="clientName" required>
      <label>رمز المنتج / اسم المنتج</label>
      <input type="text" id="productRef" required>
      <label>السعر (دج)</label>
      <input type="number" id="amount" required>
      <label>الوصف</label>
      <textarea id="description" rows="2"></textarea>
      <label>صورة المنتج</label>
      <input type="file" id="productPhoto" accept="image/*">
      <button type="submit">إنشاء رابط التأكيد</button>
    </form>
    <div id="resultSection">
      <p style="color:#22c55e; font-weight:bold;">✅ تم إنشاء الرابط بنجاح!</p>
      <input type="text" id="finalLink" class="link-input" readonly>
      <button class="btn-secondary" onclick="copyLink()">نسخ الرابط 📋</button>
      <button class="btn-whatsapp" onclick="sendWhatsApp()">WhatsApp 💬</button>
      <button class="btn-sms" onclick="sendSMS()">SMS 📱</button>
    </div>
  </div>
</div>
<script>
const sellerId = localStorage.getItem('sellerId') || 'seller_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('sellerId', sellerId);
document.getElementById('sellerId').value = sellerId;

const phoneInput = document.getElementById('clientPhone');
phoneInput.addEventListener('input', async () => {
    if(phoneInput.value.trim().length >= 10){
        const res = await fetch(`/score/client/${phoneInput.value.trim()}?sellerId=${sellerId}`);
        const data = await res.json();
        document.getElementById('scoreNum').innerText = data.score + '%';
        document.getElementById('badgeText').innerText = data.badge;
    }
});

document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('sellerId', sellerId);
    formData.append('clientName', document.getElementById('clientName').value);
    formData.append('clientPhone', document.getElementById('clientPhone').value);
    formData.append('productRef', document.getElementById('productRef').value);
    formData.append('amount', document.getElementById('amount').value);
    formData.append('description', document.getElementById('description').value);
    const photo = document.getElementById('productPhoto').files[0];
    if(photo) formData.append('productPhoto', photo);
    const res = await fetch('/create-confirmation', { method: 'POST', body: formData });
    const data = await res.json();
    if(data.success){
        document.getElementById('finalLink').value = data.clientLink;
        document.getElementById('resultSection').style.display = 'block';
    }
};

function copyLink() { navigator.clipboard.writeText(document.getElementById("finalLink").value); alert("تم النسخ!"); }
function sendWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent("تأكيد الطلب: " + document.getElementById("finalLink").value)}`, '_blank'); }
function sendSMS() { window.location.href = `sms:?body=${encodeURIComponent("تأكيد الطلب: " + document.getElementById("finalLink").value)}`; }
</script>
</body>
</html>
<html lang="fr">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmi – Nouvelle Commande</title>
    <style>
        body{ margin:0; font-family:Arial, sans-serif; background:#0f172a; color:#fff; display:flex; justify-content:center; padding:20px; }
        .box{ max-width:400px; width:100%; background:#1e293b; padding:20px; border-radius:12px; }
        h1{ text-align:center; color:#38bdf8; }
        form{ display:flex; flex-direction:column; gap:15px; }
        label{ font-size:14px; color:#94a3b8; }
        input, textarea{ padding:10px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#fff; }
        button{ padding:12px; background:#38bdf8; color:#0f172a; border:none; border-radius:6px; font-weight:bold; cursor:pointer; }
        button:hover{ background:#0ea5e9; }
        #result{ margin-top:20px; padding:15px; background:#122135; border-radius:8px; display:none; word-break:break-all; }
    </style>
<body>
<div class="box">
    <h1>📦 Nouvelle Commande</h1>
    <form id="orderForm">
        <label>Nom du Client</label>
        <input type="text" name="clientName" required>
        <label>Téléphone Client</label>
        <input type="text" name="clientPhone" id="clientPhone" required>
        <div id="clientScoreInfo" style="font-size:12px; margin-top:-10px;"></div>
        <label>Référence Produit</label>
        <input type="text" name="productRef" required>
        <label>Montant (DZD)</label>
        <input type="number" name="amount" required>
        <label>Description (optionnel)</label>
        <textarea name="description"></textarea>
        <label>Photo du Produit</label>
        <input type="file" name="productPhoto" accept="image/*">
        <button type="submit">Générer le lien de confirmation</button>
    </form>
    <div id="result">
        <p>Lien à envoyer au client :</p>
        <strong id="clientLink"></strong>
        <button onclick="copyLink()" style="margin-top:10px; width:100%; background:#22c55e;">Copier le lien</button>
    </div>
</div>
<script>
    const phoneInput = document.getElementById('clientPhone');
    phoneInput.addEventListener('blur', async () => {
        if(phoneInput.value){
            const res = await fetch(`/score/client/${phoneInput.value}`);
            const data = await res.json();
            document.getElementById('clientScoreInfo').innerHTML = `Score Client: ${data.score}% ${data.badge}`;
        }
    });

    document.getElementById('orderForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('/create-confirmation', { method: 'POST', body: formData });
        const data = await res.json();
        if(data.success){
            document.getElementById('result').style.display = 'block';
            document.getElementById('clientLink').innerText = data.clientLink;
        } else {
            alert("Erreur lors de la création");
        }
    };

    function copyLink(){
        const link = document.getElementById('clientLink').innerText;
        navigator.clipboard.writeText(link);
        alert("Lien copié !");
    }
</script>
</body>
</html>
