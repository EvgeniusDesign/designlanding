/* =====================================================================
   0) ПРЕЛОАДЕР — ховається, коли шрифти й картинки готові
   (з мінімальним часом показу, щоб не блимав на швидкому завантаженні)
===================================================================== */
(function () {
  const pre = document.getElementById("preloader");
  if (!pre) return;

  document.documentElement.classList.add("is-loading");
  const shownAt = Date.now();
  const MIN_MS = 900;

  function hide() {
    const wait = Math.max(0, MIN_MS - (Date.now() - shownAt));
    setTimeout(function () {
      pre.classList.add("preloader--hidden");
      document.documentElement.classList.remove("is-loading");
      document.documentElement.classList.add("page-ready");
      pre.addEventListener("transitionend", function () { pre.remove(); }, { once: true });
    }, wait);
  }

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const windowLoaded = new Promise(function (resolve) {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

  Promise.all([fontsReady, windowLoaded]).then(hide);
})();

/* =====================================================================
   0b) ПОБУКВЕНИЙ ВИЇЗД ЗАГОЛОВКА HERO: рядок 1 → рядок 2 → плашка
===================================================================== */
(function () {
  const title = document.querySelector(".hero__title");
  const hlT = title && title.querySelector(".hl__t");
  const hl = title && title.querySelector(".hl");
  if (!title || !hlT || !hl) return;

  const LETTER_STEP = 0.018; // с між буквами
  const LETTER_DUR = 0.38;   // с, має збігатись з .letter в CSS
  const PLATE_DUR = 0.28;    // с, має збігатись з .hl::before в CSS
  const GAP = 0.04;          // пауза між етапами

  function splitTextNode(textNode) {
    const parent = textNode.parentNode;
    const text = textNode.textContent.replace(/\s+/g, " ");
    const frag = document.createDocumentFragment();
    const spans = [];
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "letter";
      span.textContent = ch === " " ? " " : ch;
      frag.appendChild(span);
      spans.push(span);
    }
    parent.replaceChild(frag, textNode);
    return spans;
  }

  function stage(spans, startDelay) {
    spans.forEach(function (span, i) {
      span.style.animationDelay = (startDelay + i * LETTER_STEP).toFixed(3) + "s";
    });
    return startDelay + (spans.length ? (spans.length - 1) * LETTER_STEP : 0) + LETTER_DUR;
  }

  const line1Node = title.firstChild;
  const line1End = (line1Node && line1Node.nodeType === Node.TEXT_NODE)
    ? stage(splitTextNode(line1Node), 0)
    : 0;

  const line2End = stage(splitTextNode(hlT.firstChild), line1End + GAP);

  const plateDelay = line2End + GAP;
  hl.style.setProperty("--plate-delay", plateDelay.toFixed(3) + "s");

  const selbox = document.querySelector(".hero .selbox");
  if (selbox) {
    const selboxDelay = plateDelay + PLATE_DUR + GAP;
    selbox.style.setProperty("--selbox-delay", selboxDelay.toFixed(3) + "s");
  }
})();

/* =====================================================================
   0c) СКРОЛ-РЕВІЛ — заголовки/картки/іконки з'являються знизу з фейдом
   по черзі при попаданні в зону видимості (блок "4 дні" + "для кого")
===================================================================== */
(function () {
  const targets = document.querySelectorAll(".program .sec-title, .program .day, .forwhom__title, .forwhom__q, .who, .after__title, .result, .author__title, .author__photo, .author__stage, .bullet, .offer__head, .price-wrapper, .manager__card");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in-view"); });
    return;
  }

  const io = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

  targets.forEach(function (el) { io.observe(el); });
})();

/* =====================================================================
   0d) ЗАФІКСОВАНА КНОПКА ВНИЗУ ЕКРАНА — з'являється, коли hero повністю
   прокручено, і ховається, як тільки в зоні видимості з'являється футер
===================================================================== */
(function () {
  const stickyCta = document.getElementById("sticky-cta");
  const hero = document.querySelector(".hero");
  const footer = document.querySelector(".footer");
  if (!stickyCta || !hero || !footer || !("IntersectionObserver" in window)) return;

  let heroVisible = true;
  let footerVisible = false;

  function update() {
    stickyCta.classList.toggle("sticky-cta--visible", !heroVisible && !footerVisible);
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.target === hero) heroVisible = entry.isIntersecting;
      if (entry.target === footer) footerVisible = entry.isIntersecting;
    });
    update();
  }, { threshold: 0 });

  io.observe(hero);
  io.observe(footer);
})();

/* =====================================================================
   1) ПОСИЛАННЯ НА ОПЛАТУ
   Встав сюди URL сторінки оплати — усі кнопки (.cta) підхоплять його.
   Приклад: const PAYMENT_URL = "https://secure.wayforpay.com/....";
===================================================================== */
const PAYMENT_URL = "";

/* =====================================================================
   2) ТАЙМЕР АКЦІЇ  (за замовчуванням 10 хвилин, зберігається в браузері)
===================================================================== */
const COUNTDOWN_MINUTES = 10;

(function () {
  // wire CTA buttons
  if (PAYMENT_URL) {
    document.querySelectorAll("a.cta").forEach(function (a) {
      a.setAttribute("href", PAYMENT_URL);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }

  // countdown
  const hEl = document.querySelector("[data-h]");
  const mEl = document.querySelector("[data-m]");
  const sEl = document.querySelector("[data-s]");
  if (!hEl || !mEl || !sEl) return;

  const KEY = "promo_deadline_v1";
  let deadline = parseInt(localStorage.getItem(KEY), 10);
  const now = Date.now();
  if (!deadline || deadline < now) {
    deadline = now + COUNTDOWN_MINUTES * 60 * 1000;
    localStorage.setItem(KEY, String(deadline));
  }

  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60);
    const s = left % 60;
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
    if (left <= 0) clearInterval(timer);
  }
  tick();
  const timer = setInterval(tick, 1000);
})();

/* =====================================================================
   3) ЗАБОРОНА МАСШТАБУВАННЯ (pinch / подвійний тап / ctrl+scroll)
   Робить сторінку немасштабованою на будь-якому пристрої.
===================================================================== */
(function () {
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
  });
  let lastTouchEnd = 0;
  document.addEventListener("touchend", function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener("wheel", function (e) {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
  });
})();
