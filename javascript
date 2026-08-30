<script>
  window.API_BASE = "https://prodbybigi-api.onrender.com";
</script>

<script>
  // ✅ PayPal (no trailing slash)
  window.PB_PAYPAL_CREATE_ORDER_URL = "https://createorder-f65rhsquva-uc.a.run.app";
  window.PB_PAYPAL_CAPTURE_ORDER_URL = "https://captureorder-f65rhsquva-uc.a.run.app";

  // ✅ M-Pesa STK Push (no trailing slash)
  window.PB_MPESA_STKPUSH_URL = "https://stkpush-f65rhsquva-uc.a.run.app";

  // ✅ We'll track the selected beat/license here
  window.__PB_SELECTED__ = window.__PB_SELECTED__ || null;
</script>

<script type="module" src="/js/firebase.js?v=21"></script>
<script src="/js/verify.js"></script>
<script src="/js/menu.js"></script>
<script src="/js/player.js?v=19"></script>
<script src="/js/cart.js"></script>
<script src="/js/cart-ui.js"></script>
<script src="/js/performance.js"></script>
<script src="/js/license-modal.js"></script>

<script>
  /* =========================
     SMART FINDER (SAFE VERSION)
     Homepage only
  ========================= */
  (function(){
    const input = document.getElementById("searchInput");
    const btn = document.getElementById("searchBtn");
    const chips = Array.from(document.querySelectorAll("[data-smart-fill]"));

    if(!input || !btn) return;

    const KNOWN_GENRES = [
      "trap",
      "drill",
      "afrobeats",
      "amapiano",
      "r&b",
      "hip hop",
      "hiphop",
      "dancehall",
      "bongo",
      "gengetone",
      "reggae"
    ];

    const KNOWN_MOODS = [
      "chill",
      "dark",
      "happy",
      "sad",
      "emotional",
      "lyrical",
      "aggressive",
      "club",
      "romantic",
      "melodic",
      "hard",
      "smooth"
    ];

    function normalizeText(str){
      return String(str || "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, " ")
        .trim();
    }

    function unique(arr){
      return [...new Set((arr || []).filter(Boolean))];
    }

    function parseSmartFinder(raw){
      const original = String(raw || "").trim();
      const normalized = normalizeText(original);

      const foundGenres = [];
      const foundMoods = [];

      KNOWN_GENRES.forEach(g => {
        if (normalized.includes(normalizeText(g))) foundGenres.push(g);
      });

      KNOWN_MOODS.forEach(m => {
        if (normalized.includes(normalizeText(m))) foundMoods.push(m);
      });

      let detectedTypeBeat = "";

      if (/\btype beat\b/i.test(original)) {
        detectedTypeBeat = original
          .replace(/\btype beat\b/i, "")
          .trim();
      } else {
        const artistCandidates = [
          "j cole","drake","burna boy","future","21 savage","travis scott",
          "central cee","gunna","lil baby","wizkid","asake","davido",
          "sza","the weeknd","tems","metro boomin","yeat","young thug"
        ];

        const hit = artistCandidates.find(name => normalized.includes(name));
        if (hit) {
          detectedTypeBeat = hit.replace(/\b\w/g, c => c.toUpperCase());
        }
      }

      const cleanedWords = original
        .split(/\s+/)
        .map(x => x.trim())
        .filter(Boolean);

      const tags = cleanedWords.filter(word => {
        const w = normalizeText(word);
        if (!w) return false;
        if (KNOWN_GENRES.includes(w)) return false;
        if (KNOWN_MOODS.includes(w)) return false;
        return true;
      });

      return {
        q: original,
        genre: unique(foundGenres),
        mood: unique(foundMoods),
        typeBeat: detectedTypeBeat,
        tags: unique(tags)
      };
    }

    function buildMarketplaceUrl(parsed){
      const url = new URL("/marketplace/", location.origin);

      if (parsed.q) url.searchParams.set("q", parsed.q);
      if (parsed.genre.length) url.searchParams.set("genre", parsed.genre.join(","));
      if (parsed.mood.length) url.searchParams.set("mood", parsed.mood.join(","));
      if (parsed.typeBeat) url.searchParams.set("typeBeat", parsed.typeBeat);
      if (parsed.tags.length) url.searchParams.set("tags", parsed.tags.join(","));
      url.searchParams.set("smart", "1");

      return url.pathname + url.search;
    }

    function goSmart(){
      const raw = (input.value || "").trim();
      if(!raw){
        location.href = "/marketplace/";
        return;
      }

      const parsed = parseSmartFinder(raw);
      const target = buildMarketplaceUrl(parsed);
      location.href = target;
    }

    btn.addEventListener("click", goSmart);

    input.addEventListener("keydown", (e)=>{
      if(e.key === "Enter"){
        e.preventDefault();
        goSmart();
      }
    });

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const fill = chip.getAttribute("data-smart-fill") || "";
        input.value = fill;
        input.focus();
      });
    });
  })();

  function money(n){
    const v = Number(n);
    if (!Number.isFinite(v)) return "$0.00";
    return "$" + v.toFixed(2);
  }

  function prettyProducerName(b){
    if (b.producerName && String(b.producerName).trim()) return String(b.producerName).trim();
    if (!b.producerId) return "Prod. Unknown";
    return "Prod. " + String(b.producerId).slice(0,8);
  }

  function coverHTML(url, title){
    if (url) {
      return `
        <img
          src="${url}"
          alt="${title || "Beat"}"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          referrerpolicy="no-referrer"
        />
      `;
    }

    const initials = String(title || "B").trim().slice(0,2).toUpperCase();

    return `
      <div style="height:100%;display:grid;place-items:center;font-weight:900;font-size:22px;color:#334155">
        ${initials}
      </div>
    `;
  }

  function beatPageUrl(b){
    const id = String(b?.id || "");
    return "/beat/?id=" + encodeURIComponent(id);
  }
  function producerPageUrl(b){
    const pid = String(b?.producerId || "");
    return "/producer-profile/?producerId=" + encodeURIComponent(pid);
  }

  function getBeatPremiereTime(b){
    return (
      b?.premiereAt?.toMillis?.() ||
      (b?.premiereAt?.seconds ? b.premiereAt.seconds * 1000 : null) ||
      Number(b?.premiereAt || b?.releaseAt || 0)
    );
  }

  function isUpcomingPremiereBeat(b){
    const premiereAt = getBeatPremiereTime(b);
    return (
      b?.isPremiere === true &&
      premiereAt &&
      Number.isFinite(premiereAt) &&
      premiereAt > Date.now()
    );
  }

  function formatPremiereCountdown(b){
    const premiereAt = getBeatPremiereTime(b);
    if (!premiereAt) return "Premiere soon";

    const diff = Math.max(0, premiereAt - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `Premieres in ${days}d ${hours}h`;
    if (hours > 0) return `Premieres in ${hours}h ${mins}m`;
    return `Premieres in ${mins}m`;
  }

  function preSaveHTML(b){
    return `
      <div class="presave-wrap">
        <button class="pb-pill presave-pill" type="button" data-presave="1" aria-label="Pre-save beat">
          <span class="ic">🔔</span>
          <span>Pre-save</span>
        </button>

        <div class="presave-countdown">
          ${formatPremiereCountdown(b)}
        </div>
      </div>
    `;
  }

  async function logAnalyticsEvent({ producerId, type, beatId=null }){
    try{
      const FB = window.FB;
      if (!FB?.auth?.currentUser) return;
      if (!producerId || !type) return;
      if (!FB?.db || typeof FB.addDoc !== "function" || typeof FB.collection !== "function") return;

      const ts =
        (typeof FB.serverTimestamp === "function")
          ? FB.serverTimestamp()
          : Date.now();

      await FB.addDoc(FB.collection(FB.db, "analyticsEvents"), {
        producerId: String(producerId),
        type: String(type),
        beatId: beatId ? String(beatId) : null,
        actorUid: FB.auth.currentUser.uid,
        createdAt: ts
      });
    }catch(err){
      console.warn("homepage analytics log failed:", err);
    }
  }

async function logBeatPlay(beat, playBtn){
  try{
    const b = beat || {};
    const producerId = String(b.producerId || "").trim();
    const beatId = String(b.id || "").trim();

    if (!producerId || !beatId) return;

    window.__ANA_SENT__ = window.__ANA_SENT__ || { play:{}, view:{} };
    const playKey = `${producerId}:${beatId}`;

    if (window.__ANA_SENT__.play[playKey]) return;
    window.__ANA_SENT__.play[playKey] = 1;

    const FB = window.FB;
    if (
      !FB?.db ||
      typeof FB.doc !== "function" ||
      typeof FB.updateDoc !== "function" ||
      typeof FB.increment !== "function"
    ){
      console.error("Homepage play tracking failed: Firebase helpers missing");
      delete window.__ANA_SENT__.play[playKey];
      return;
    }

    try{
      const ref = FB.doc(FB.db, "beats", beatId);
      await FB.updateDoc(ref, {
        plays: FB.increment(1),
        lastPlayedAt: Date.now()
      });
      console.log("✅ homepage plays incremented:", beatId);
    }catch(err){
      console.error("❌ homepage Firestore increment failed:", err);
      delete window.__ANA_SENT__.play[playKey];
      return;
    }

    try{
      if (typeof FB.trackEvent === "function"){
        await FB.trackEvent({
          type: "beat_play",
          beatId,
          producerId,
          path: location.pathname + location.search,
          meta: { surface: "home", action: "preview" }
        });
      }
    }catch(err){
      console.warn("Homepage trackEvent failed:", err);
    }

  }catch(err){
    console.error("logBeatPlay failed", err);
  }
}
window.logBeatPlay = logBeatPlay;

  /* ===========================
     ✅ FREE DOWNLOAD
  =========================== */
  const FreeDL = (() => {
    const $ = (id)=>document.getElementById(id);

    const backdrop = $("pbFreeBackdrop");
    const modal = $("pbFreeModal");
    const closeBtn = $("pbFreeClose");
    const sendBtn = $("pbFreeSend");
    const nameEl = $("pbFreeName");
    const emailEl = $("pbFreeEmail");
    const titleEl = $("pbFreeTitle");
    const statusEl = $("pbFreeStatus");

    let currentBeat = null;

    function open(beat){
      currentBeat = beat || null;
      titleEl.textContent = "Free Download" + (beat?.title ? ` — ${beat.title}` : "");
      statusEl.textContent = "";
      nameEl.value = "";
      emailEl.value = "";

      backdrop.style.display = "block";
      modal.style.display = "block";
      backdrop.setAttribute("aria-hidden","false");
      setTimeout(()=>nameEl.focus(), 30);
    }

    function close(){
      backdrop.style.display = "none";
      modal.style.display = "none";
      backdrop.setAttribute("aria-hidden","true");
      currentBeat = null;
    }

    async function send(){
      const fullName = (nameEl.value || "").trim();
      const email = (emailEl.value || "").trim().toLowerCase();

      if (!fullName) return alert("Enter your full name");
      if (!email || !email.includes("@")) return alert("Enter a valid email");
      if (!currentBeat?.id) return alert("Beat not found");

      const key = `pb_free_${currentBeat.id}_${email}`;
      if (localStorage.getItem(key) === "1"){
        statusEl.textContent = "✅ Already sent. Check inbox/spam.";
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = "Sending...";

      try{
        if (window.FB && typeof window.FB.logFreeDownload === "function"){
          await window.FB.logFreeDownload({
            beatId: currentBeat.id,
            beatTitle: currentBeat.title || "",
            producerId: currentBeat.producerId || "",
            producerName: currentBeat.producerName || "",
            fullName,
            email,
            createdAt: Date.now()
          });
        }

        localStorage.setItem(key, "1");
        statusEl.textContent = "✅ Sent! Check inbox/spam.";
        setTimeout(close, 900);
      }catch(err){
        console.error(err);
        alert("Failed: " + (err?.message || err));
      }

      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }

    backdrop?.addEventListener("click", close);
    closeBtn?.addEventListener("click", close);
    sendBtn?.addEventListener("click", send);

    return { open, close };
    })();

    document.addEventListener("click", (e)=>{
      const preBtn = e.target.closest("[data-presave='1']");
      if (!preBtn) return;

      e.preventDefault();
      e.stopPropagation();

      alert("✅ Pre-save added. We’ll remind you when this beat premieres.");
    });

    function isFreeBeat(b){
      if (!b) return true;

      const lic = b.licenses || {};

      const hasPaidLicense =
        Number(lic?.basic?.price || 0) > 0 ||
        Number(lic?.premium?.price || 0) > 0 ||
        Number(lic?.exclusive?.price || 0) > 0;

      if (hasPaidLicense) return false;

      return (
        b.freeDownload === true ||
        b.isFree === true
      );
    }
  function pillHTML(b){
    if (isUpcomingPremiereBeat(b)){
      return preSaveHTML(b);
    }
    return `<button class="pb-pill price-pill" type="button" aria-label="Choose license">
      <span class="ic lock-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" stroke-width="2"/>
        </svg>
      </span>
      <span>${money(
        b?.licenses?.basic?.price ??
        b?.licenses?.premium?.price ??
        b?.price ??
        0
      )}</span>
    </button>`;
  }

  function getChartScore(b){
    const plays = Number(b.plays || 0);
    const cartAdds = Number(b.cartAdds || 0);
    const downloads = Number(b.downloads || 0);
    const sales = Number(b.sales || 0);

    return (plays * 1) + (cartAdds * 3) + (downloads * 4) + (sales * 8);
  }

  /* =========================================================
     ✅ NEW: Selection tracker + Payment Modal logic
     Works without editing license-modal.js
  ========================================================= */
  (function(){
  const $ = (id)=>document.getElementById(id);

  const payBackdrop = $("pbPayBackdrop");
  const payModal = $("pbPayModal");
  const payClose = $("pbPayClose");
  const payTitle = $("pbPayTitle");
  const paySub = $("pbPaySub");
  const payAmountA = $("pbPayAmountA");
  const payAmountB = $("pbPayAmountB");
  const btnPaypal = $("pbPayWithPaypal");
  const btnMpesa = $("pbPayWithMpesa");
  const mpesaBox = $("pbMpesaBox");
  const mpesaPhone = $("pbMpesaPhone");
  const payStatus = $("pbPayStatus");
  const pbSendStkPush = $("pbSendStkPush");

  function getBeatById(beatId){
    return (window.__LATEST_BEATS__ || []).find(
      b => String(b?.id || "") === String(beatId || "")
    ) || null;
  }

  function getDefaultLicenseForBeat(beat){
    if (!beat) {
      return {
        licenseKey: "basic",
        amount: 0
      };
    }

    const lic = beat.licenses || {};

    if (Number(lic?.basic?.price || 0) > 0) {
      return {
        licenseKey: "basic",
        amount: Number(lic.basic.price)
      };
    }

    if (Number(lic?.premium?.price || 0) > 0) {
      return {
        licenseKey: "premium",
        amount: Number(lic.premium.price)
      };
    }

    if (Number(lic?.exclusive?.price || 0) > 0) {
      return {
        licenseKey: "exclusive",
        amount: Number(lic.exclusive.price)
      };
    }

    return {
      licenseKey: "basic",
      amount: Number(beat.price || 0)
    };
  }

  function syncSelectionFromModal(){
    const title = (document.getElementById("pbModalTitle")?.textContent || "").trim();
    const totalTxt = (document.getElementById("pbTotalPrice")?.textContent || "").trim();
    const totalAmount = Number(String(totalTxt).replace(/[^0-9.]/g, "")) || 0;

    const selectedCard =
      document.querySelector('#pbLicensesGrid [aria-pressed="true"]') ||
      document.querySelector('#pbLicensesGrid .selected') ||
      document.querySelector('#pbLicensesGrid .active') ||
      document.querySelector('#pbLicensesGrid [data-selected="true"]');

    let licenseKey = "";
    if (selectedCard) {
      licenseKey =
        selectedCard.dataset.licenseKey ||
        selectedCard.dataset.key ||
        "";
    }

    if (!licenseKey && selectedCard) {
      const txt = (selectedCard.textContent || "").toLowerCase();
      if (txt.includes("exclusive")) licenseKey = "exclusive";
      else if (txt.includes("premium")) licenseKey = "premium";
      else if (txt.includes("basic")) licenseKey = "basic";
    }

    if (!licenseKey) {
      const existing = window.__PB_SELECTED__ || {};
      licenseKey = existing.licenseKey || "basic";
    }

    window.__PB_SELECTED__ = {
      ...(window.__PB_SELECTED__ || {}),
      title: title || window.__PB_SELECTED__?.title || "",
      licenseKey,
      amount: totalAmount || window.__PB_SELECTED__?.amount || 0
    };

    console.log("✅ synced from modal", window.__PB_SELECTED__);
  }

  function openPayModal(){
    const sel = window.__PB_SELECTED__;

    if (!sel?.beatId) {
      alert("Select a beat and license first.");
      return;
    }

    const currentSel = window.__PB_SELECTED__;

    payTitle.textContent = "Choose payment method";
    paySub.textContent = `${currentSel.title || "Beat"} • License: ${currentSel.licenseKey || "basic"}`;
    payAmountA.textContent = money(currentSel.amount || 0);
    payAmountB.textContent = money(currentSel.amount || 0);
    payStatus.textContent = "";
    mpesaBox.style.display = "none";
    mpesaPhone.value = "";

    payBackdrop.style.display = "block";
    payModal.style.display = "block";
    payBackdrop.setAttribute("aria-hidden","false");
  }

  function closePayModal(){
    payBackdrop.style.display = "none";
    payModal.style.display = "none";
    payBackdrop.setAttribute("aria-hidden","true");
    mpesaBox.style.display = "none";
    payStatus.textContent = "";
  }

  payBackdrop?.addEventListener("click", closePayModal);
  payClose?.addEventListener("click", closePayModal);

  document.addEventListener("click", (e)=>{
    const card = e.target.closest("[data-beat-id]");
    if (!card) return;
    if (!e.target.closest(".price-pill")) return;

    const beatId = String(card.getAttribute("data-beat-id") || "");
    if (!beatId) return;

    const title =
      (card.querySelector(".t")?.textContent ||
       card.querySelector(".home-title-clamp")?.textContent ||
       "").trim();

    const beat = getBeatById(beatId);
    const fallback = getDefaultLicenseForBeat(beat);

    window.__PB_SELECTED__ = {
      beatId,
      title: title || "",
      licenseKey: fallback.licenseKey,
      amount: fallback.amount
    };

    console.log("✅ homepage default selection", window.__PB_SELECTED__);
  }, true);

  document.addEventListener("click", (e)=>{
    const clickedCard = e.target.closest("#pbLicensesGrid > *");
    if (!clickedCard) return;

    setTimeout(syncSelectionFromModal, 0);
  }, true);

  const buyNowBtn = document.getElementById("pbBuyNow");
  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();

      let sel = window.__PB_SELECTED__;
      if (!sel?.beatId) {
        alert("Select a beat and license first.");
        return;
      }

      syncSelectionFromModal();
      sel = window.__PB_SELECTED__;

      if (!sel?.licenseKey || !sel?.amount || sel.amount <= 0) {
        const beat = getBeatById(sel.beatId);
        const fallback = getDefaultLicenseForBeat(beat);

        window.__PB_SELECTED__ = {
          ...sel,
          licenseKey: fallback.licenseKey,
          amount: fallback.amount
        };

        sel = window.__PB_SELECTED__;
      }

      if (!sel?.amount || sel.amount <= 0) {
        alert("Select a license first.");
        return;
      }

      openPayModal();
    }, true);
  }

  async function payWithPaypal(){
    const sel = window.__PB_SELECTED__;
    if (!sel?.beatId) return alert("Select a beat first.");

    const body = {
      beatId: sel.beatId,
      licenseKey: sel.licenseKey || "basic"
    };

    btnPaypal.disabled = true;
    btnMpesa.disabled = true;
    payStatus.textContent = "Opening PayPal…";

    try{
      const r = await fetch(window.PB_PAYPAL_CREATE_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(body)
      });

      const data = await r.json().catch(()=> ({}));
      if (!r.ok) {
        console.error("PayPal createOrder failed:", data);
        alert(data?.error || "PayPal create order failed");
        payStatus.textContent = "";
        return;
      }

      const url = data.approveUrl || (data.approveLinks || []).find(x=>x.rel==="approve")?.href;
      if (!url) {
        console.error("No approveUrl:", data);
        alert("PayPal approval link missing.");
        payStatus.textContent = "";
        return;
      }

      location.href = url;
    } catch (err){
      console.error(err);
      alert("PayPal error: " + (err?.message || err));
      payStatus.textContent = "";
    } finally {
      btnPaypal.disabled = false;
      btnMpesa.disabled = false;
    }
  }

  function showMpesaBox(){
    mpesaBox.style.display = "block";
    payStatus.textContent = "";
    setTimeout(()=> mpesaPhone?.focus(), 50);
  }

  async function sendMpesaStkPush(){
    const sel = window.__PB_SELECTED__;
    if (!sel?.beatId) return alert("Select a beat first.");

    const phone = (mpesaPhone.value || "").trim();
    if (!phone) {
      payStatus.textContent = "Enter your phone number first.";
      return;
    }

    const digits = phone.replace(/\D/g,"");
    if (!(digits.startsWith("2547") || digits.startsWith("2541")) || digits.length !== 12) {
      payStatus.textContent = "Use format: 2547XXXXXXXX";
      return;
    }

    const amt = Number(sel.amount || 0);
    if (!amt || amt <= 0) {
      payStatus.textContent = "Price not detected. Try selecting the license again.";
      return;
    }

    const u = window.FB?.auth?.currentUser || window.FB?.user || null;
    if (!u?.uid){
      payStatus.textContent = "Please sign in to pay with M-Pesa.";
      setTimeout(()=> location.href="/login/", 600);
      return;
    }

    pbSendStkPush.disabled = true;
    btnPaypal.disabled = true;
    btnMpesa.disabled = true;
    payStatus.textContent = "Sending STK Push… check your phone.";

    const controller = new AbortController();
    const t = setTimeout(()=>controller.abort(), 25000);

    try{
      const body = {
        phone: digits,
        beatId: String(sel.beatId),
        buyerId: String(u.uid),
        licenseKey: String(sel.licenseKey || "basic"),
        amount: Math.round(amt),
        amountUsd: Number(amt)
      };

      const r = await fetch(window.PB_MPESA_STKPUSH_URL, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const data = await r.json().catch(()=> ({}));

      if (!r.ok) {
        console.error("STK push failed:", data);
        payStatus.textContent = data?.error || data?.ResponseDescription || `STK push failed (${r.status})`;
        return;
      }

      payStatus.textContent =
        "✅ STK Push sent.\nApprove on your phone." +
        (data?.orderId ? `\nOrder ID: ${data.orderId}` : "");

    } catch (err){
      console.error(err);
      if (String(err?.name) === "AbortError"){
        payStatus.textContent = "Timed out waiting for server. Check your STK endpoint.";
      } else {
        payStatus.textContent = "Error: " + (err?.message || err);
      }
    } finally {
      clearTimeout(t);
      pbSendStkPush.disabled = false;
      btnPaypal.disabled = false;
      btnMpesa.disabled = false;
    }
  }

  btnPaypal?.addEventListener("click", payWithPaypal);
  btnMpesa?.addEventListener("click", showMpesaBox);
  pbSendStkPush?.addEventListener("click", sendMpesaStkPush);
})();

  async function goToMyDashboard() {
    try {
      const auth = window.FB?.auth;
      const db = window.FB?.db;

      const user = auth?.currentUser;
      if (!user) {
        window.location.href = "/login/";
        return;
      }

      const snap = await window.FB.getDoc(
        window.FB.doc(db, "users", user.uid)
      );

      const role = String(
        snap.exists() ? (snap.data()?.role || "") : ""
      ).toLowerCase();

      if (role === "producer") {
        window.location.href = "/dashboard/";
        return;
      }

      if (role === "buyer") {
        window.location.href = "/buyer-dashboard/";
        return;
      }

      if (role === "admin") {
        window.location.href = "/admin-dashboard/";
        return;
      }

      window.location.href = "/buyer-dashboard/";
    } catch (e) {
      console.error("Dashboard redirect error:", e);
      window.location.href = "/buyer-dashboard/";
    }
  }

  window.addEventListener("firebase-ready", () => {
    document.getElementById("navDashboard")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await goToMyDashboard();
    });

    document.getElementById("mNavDashboard")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await goToMyDashboard();
    });
  });

  /* ==========================
     NEWSLETTER
  ========================== */
  (function(){

    const btn = document.getElementById("newsletterBtn");
    const email = document.getElementById("newsletterEmail");
    const name = document.getElementById("newsletterName");

    if(!btn || !email || !name) return;

    btn.addEventListener("click", async ()=>{

      const fullName = String(name.value || "").trim();
      const mail = String(email.value || "").trim().toLowerCase();

      if(!fullName){
        alert("Enter your name");
        return;
      }

      if(!mail){
        alert("Enter your email");
        return;
      }

      if(!mail.includes("@")){
        alert("Enter a valid email");
        return;
      }

      try{

        btn.disabled = true;

        btn.innerHTML = `
          <span class="news-spin"></span>
        `;
        
        await window.FB.addDoc(
          window.FB.collection(
            window.FB.db,
            "newsletterSubscribers"
          ),
          {
            name: fullName,
            email: mail,
            subscribed: true,
            source: "homepage",
            createdAt: window.FB.serverTimestamp()
          }
        );

        btn.innerHTML = "✓ Subscribed";
        btn.style.background = "#22c55e";
        btn.style.color = "#fff";

        name.disabled = true;
        email.disabled = true;

      }catch(err){

        console.error(err);

        btn.disabled = false;
        btn.innerHTML = "Subscribe";

        alert("Failed to subscribe");

      }

    });

  })();

  async function loadHomeBeats(){
    const status = document.getElementById("homeStatus");
    const strip  = document.getElementById("trendingStrip");
    const chart  = document.getElementById("chartGrid");

    const featuredStatus = document.getElementById("featuredStatus");
    const featuredStrip  = document.getElementById("featuredStrip");
    
    try{
      status.textContent = "Loading beats…";
      status.classList.remove("hidden");

      /* =========================================
         INSTANT LOAD (cache first)
      ========================================= */

      let beats = [];

      try{

        const cached = sessionStorage.getItem("audiory_home_beats");

        if(cached){
          beats = JSON.parse(cached);
          console.log("⚡ home beats loaded from cache");
        }

      }catch(e){
        console.warn("cache parse failed",e);
      }

      if(!beats.length){
        beats = await window.FB.fetchBeats({ max:30 });
        sessionStorage.setItem("audiory_home_beats",JSON.stringify(beats));
      }

      window.FB.fetchBeats({ max:30, force:true }).then(fresh=>{
        if(!fresh?.length) return;
        sessionStorage.setItem("audiory_home_beats",JSON.stringify(fresh));
      });

      /* ======================================
         FAST PRODUCER PROFILE LOAD
      ====================================== */

      try{

        const producerIds = [...new Set(beats.map(b => b.producerId).filter(Boolean))];

        const profilePromises = producerIds.map(id =>
          window.FB.getProducerProfile(id).catch(()=>null)
        );

        const profiles = await Promise.all(profilePromises);

        const profileMap = {};

       profiles.forEach((p,i)=>{
         if(!p) return;
         profileMap[producerIds[i]] = p;
       });

       beats.forEach(b=>{
         const prof = profileMap[b.producerId];
         b.producerPlan = prof?.plan || "";
       });

     }catch(e){
       console.warn("producer profiles load failed",e);
     }
      
      window.__LATEST_BEATS__ = beats;

      /* ======================================
         PRELOAD BEAT PAGES
      ====================================== */

      setTimeout(()=>{

        (beats || []).slice(0,3).forEach(b=>{

          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = "/beat/?id=" + encodeURIComponent(b.id);

          document.head.appendChild(link);

        });

      },1500);

      const now = Date.now();

      const featuredBeats = beats.filter(b => b.featured === true);
      console.log("ALL FEATURED TEST:", featuredBeats);

      const chartBeats = [...beats]
        .sort((a, b) => getChartScore(b) - getChartScore(a))
        .slice(0, 10);

      /* RANDOMIZE FEATURED ORDER */
      featuredBeats.sort(() => Math.random() - 0.5);

      /* FEATURED ROTATION */

      const rotationSize = 10;

      const rotationIndex =
        Math.floor(Date.now() / (1000 * 60 * 5)) % Math.ceil(featuredBeats.length / rotationSize);

      const start = rotationIndex * rotationSize;

      const visibleFeatured = featuredBeats.slice(start, start + rotationSize);

      strip.innerHTML = "";
      chart.innerHTML = "";
      featuredStrip.innerHTML = "";

      if(!beats.length){
        status.textContent = "No beats yet.";
        return;
      }

      status.classList.add("hidden");

      /* =====================
         FEATURED BEATS
      ===================== */

      if(featuredBeats.length){

        featuredStatus.classList.add("hidden");

        visibleFeatured.forEach((b)=>{

          const el = document.createElement("div");
          el.className = "card trend-card";
          el.setAttribute("data-beat-id", b.id);

          const audioUrl = b.previewAudio || b.audio || "";

          const beatUrl = beatPageUrl(b);
          const prodUrl = producerPageUrl(b);

          el.innerHTML = `
            <div class="beat-cover">
            <div class="featured-badge">Featured</div>
              <a class="beat-open" href="${beatUrl}" data-open-beat="1" aria-label="Open beat page">
                ${coverHTML(b.artwork, b.title)}
              </a>

              <button
                class="play-fab"
                data-ignore-license="1"
                data-audio-url="${audioUrl}"
                aria-label="Play preview"
                type="button">
                <span class="playIcon">▶</span>
              </button>
            </div>

            <div class="trend-meta">
              <a class="t" href="${beatUrl}" data-open-beat="1">
                ${b.title}
              </a>

              <a class="p producer-link" href="${prodUrl}" data-producer-link="1">
                ${prettyProducerName(b)} ${AudioryVerify.badge(b.producerPlan)}
              </a>
            </div>

            <div class="trend-actions">
                ${pillHTML(b)}
            </div>
          `;

          el.addEventListener("click", (e)=>{
            const freeBtn = e.target.closest("[data-free-download='1']");
            if (!freeBtn) return;
            e.preventDefault();
            e.stopPropagation();
            FreeDL.open(b);
          });

          el.addEventListener("click", (e)=>{
            if (e.target.closest(".play-fab")) return;
            if (e.target.closest("[data-free-download='1']")) return;
            if (e.target.closest(".price-pill")) return;
            if (e.target.closest("[data-producer-link='1']")) return;
            if (e.target.closest("[data-open-beat='1']")) return;
            location.href = beatUrl;
          });

         featuredStrip.appendChild(el);

       });

     }else{

       featuredStatus.textContent = "No featured beats right now";

     }

      beats.slice(0,12).forEach((b)=>{
        const el = document.createElement("div");
        el.className = "card trend-card";
        el.setAttribute("data-beat-id", b.id);

        const audioUrl = b.previewAudio || b.audio || "";
        const beatUrl = beatPageUrl(b);
        const prodUrl = producerPageUrl(b);

        el.innerHTML = `
          <div class="beat-cover">
            <a class="beat-open" href="${beatUrl}" data-open-beat="1" aria-label="Open beat page">
              ${coverHTML(b.artwork, b.title)}
            </a>

            <button class="play-fab" data-ignore-license="1" data-audio-url="${audioUrl}" aria-label="Play">
              <span class="playIcon">▶</span>
            </button>
          </div>

          <div class="trend-meta">
            <a class="t" href="${beatUrl}" data-open-beat="1">
              ${b.title}
            </a>

            <a class="p producer-link" href="${prodUrl}" data-producer-link="1">
              ${prettyProducerName(b)} ${AudioryVerify.badge(b.producerPlan)}
            </a>
          </div>

          <div class="trend-actions">
            ${pillHTML(b)}
          </div>
        `;

        el.addEventListener("click", (e)=>{
          const freeBtn = e.target.closest("[data-free-download='1']");
          if (!freeBtn) return;
          e.preventDefault(); e.stopPropagation();
          FreeDL.open(b);
        });

        el.addEventListener("click", (e)=>{
          if (e.target.closest(".play-fab")) return;
          if (e.target.closest("[data-free-download='1']")) return;
          if (e.target.closest(".price-pill")) return;
          if (e.target.closest("[data-producer-link='1']")) return;
          if (e.target.closest("[data-open-beat='1']")) return;
          location.href = beatUrl;
        });

        strip.appendChild(el);
      });

      chartBeats.forEach((b)=>{
        const el = document.createElement("div");
        el.className = "card chart-card";
        el.setAttribute("data-beat-id", b.id);
        el.style.padding = "10px";
        el.style.borderRadius = "18px";

        const audioUrl = b.previewAudio || b.audio || "";
        const beatUrl = beatPageUrl(b);
        const prodUrl = producerPageUrl(b);

        console.log("Chart beat:", b.title, "score:", getChartScore(b), {
          plays: b.plays || 0,
          cartAdds: b.cartAdds || 0,
          downloads: b.downloads || 0,
          sales: b.sales || 0
        });

        el.innerHTML = `
          <div class="beat-cover">
            <a class="beat-open" href="${beatUrl}" data-open-beat="1" aria-label="Open beat page">
              ${coverHTML(b.artwork, b.title)}
            </a>

            <button
              class="play-fab"
              data-ignore-license="1"
              data-audio-url="${audioUrl}"
              aria-label="Play preview"
              type="button">
              <span class="playIcon">▶</span>
            </button>
          </div>

         <div class="chart-meta-row">
           <div class="chart-text">
             <a class="home-title-clamp" href="${beatUrl}" data-open-beat="1">
               ${b.title}
             </a>

             <a class="home-producer-clamp producer-link" href="${prodUrl}" data-producer-link="1">
               ${prettyProducerName(b)} ${AudioryVerify.badge(b.producerPlan)}
             </a>
           </div>
         </div>

         <div class="chart-pill">
             ${pillHTML(b)}
         </div>
       `;

        el.addEventListener("click", (e)=>{
          const freeBtn = e.target.closest("[data-free-download='1']");
          if (!freeBtn) return;
          e.preventDefault(); e.stopPropagation();
          FreeDL.open(b);
        });

        el.addEventListener("click", (e)=>{
          if (e.target.closest(".play-fab")) return;
          if (e.target.closest("[data-free-download='1']")) return;
          if (e.target.closest(".price-pill")) return;
          if (e.target.closest("[data-producer-link='1']")) return;
          if (e.target.closest("[data-open-beat='1']")) return;
          location.href = beatUrl;
        });

        chart.appendChild(el);
      });

    }catch(err){
      console.error("[home] load error:", err);
      status.textContent = "Could not load beats. Check Firestore rules & console.";
    }
  }
 
  const appsBtn = document.getElementById("appsBtn");
  const appsDropdown = document.getElementById("appsDropdown");

  appsBtn?.addEventListener("click", (e)=>{
    e.stopPropagation();
    appsDropdown.classList.toggle("show");
  });

  document.addEventListener("click", ()=>{
    appsDropdown.classList.remove("show");
  });

  window.addEventListener("firebase-ready", () => {
    if (window.FB && typeof window.FB.fetchBeats === "function") loadHomeBeats();
  });
</script>

</body>
</html>
