/* ═══════════════════════════════════════════════════════════════
   FONDAZIONE ARTENNIS – main.js
   ═══════════════════════════════════════════════════════════════
   Librerie:  GSAP 3.12 + ScrollTrigger (inclusi via CDN in HTML)

   Moduli:
     1. Configurazione
     2. Navbar + mobile menu
     3. Hero entrance (GSAP timeline)
     4. Scroll reveal (fade-up)
     5. Timeline animata (disegno linea + card reveal)
     6. WordPress REST API → news/blog
     7. Newsletter → Google Sheets via Apps Script
     8. Smooth scroll
     9. Utility functions

   ──────────────────────────────────────────────────────────────
   ░░  SETUP NEWSLETTER → GOOGLE SHEETS  ░░
   ──────────────────────────────────────────────────────────────

   PASSO 1 – Crea un Google Sheet con queste colonne:
     A: Timestamp | B: Nome | C: Email | D: Consenso

   PASSO 2 – In Google Sheets → Estensioni → Apps Script
     Incolla questo codice:

     ┌─────────────────────────────────────────────────────────┐
     │ function doPost(e) {                                    │
     │   const sheet = SpreadsheetApp                         │
     │     .getActiveSpreadsheet()                             │
     │     .getActiveSheet();                                  │
     │                                                         │
     │   const data = JSON.parse(e.postData.contents);        │
     │                                                         │
     │   sheet.appendRow([                                     │
     │     data.timestamp,                                     │
     │     data.name  || '—',                                  │
     │     data.email,                                         │
     │     data.consent ? 'Sì' : 'No'                         │
     │   ]);                                                   │
     │                                                         │
     │   return ContentService                                 │
     │     .createTextOutput(JSON.stringify({result:'ok'}))   │
     │     .setMimeType(ContentService.MimeType.JSON);        │
     │ }                                                       │
     └─────────────────────────────────────────────────────────┘

   PASSO 3 – Clic su "Distribuisci" → "Nuova distribuzione"
     · Tipo:       App web
     · Esegui come: Me
     · Accesso:    Chiunque
     → Copia l'URL che appare

   PASSO 4 – Incolla l'URL qui sotto come GOOGLE_SHEET_URL

   Nota: il fetch usa mode:'no-cors' (richiesto da Apps Script).
   Questo non restituisce una risposta leggibile dal browser,
   ma i dati arrivano correttamente nel foglio.
   ═══════════════════════════════════════════════════════════════ */

/* ─── 1. CONFIGURAZIONE ────────────────────────────────────── */

// ↓↓↓ Sostituisci con il tuo URL dopo il setup Apps Script
const GOOGLE_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbym1HjhWagRNwW942MG70YgR91sndICtyIEi0uRFuH4WJuOlU25_Vf4hpV1NF3j2Z0bzw/exec';

// WordPress REST API – recupera gli ultimi 6 post con immagini embed
const WP_API_URL =
  'https://www.artennis.it/wp-json/wp/v2/posts' +
  '?per_page=6&_embed&orderby=date&order=desc';

/* ─── Init al caricamento ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initSmoothScroll();
  loadWordPressNews();
  initNewsletterForm();

  // GSAP richiede che ScrollTrigger sia disponibile globalmente
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initHeroAnimation();
    initScrollReveal();
    initTimelineAnimation();
  } else {
    // Fallback: rende visibili gli elementi senza animazioni
    document.querySelectorAll('[data-anim]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.hero-title-inner').forEach(el => {
      el.style.transform = 'none';
    });
    document.querySelectorAll('.hero-eyebrow, .hero-subtitle, .hero-ctas').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
});

/* ═══════════════════════════════════════════════════════════════
   2. NAVBAR
   ═══════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // stato immediato al caricamento
}

/* ═══════════════════════════════════════════════════════════════
   2b. MOBILE MENU
   ═══════════════════════════════════════════════════════════════ */
function initMobileNav() {
  const hamburger   = document.getElementById('hamburger');
  const mobileClose = document.getElementById('mobileClose');
  const mobileNav   = document.getElementById('mobileNav');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  if (!hamburger || !mobileNav) return;

  let isOpen = false;

  const open = () => {
    isOpen = true;
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Anima le 3 linee dell'hamburger → X
    const spans = hamburger.querySelectorAll('span');
    if (typeof gsap !== 'undefined') {
      gsap.to(spans[0], { rotation: 45,  y: 7,  duration: 0.3 });
      gsap.to(spans[1], { opacity: 0,          duration: 0.2 });
      gsap.to(spans[2], { rotation: -45, y: -7, duration: 0.3 });
    }
  };

  const close = () => {
    isOpen = false;
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const spans = hamburger.querySelectorAll('span');
    if (typeof gsap !== 'undefined') {
      gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
      gsap.to(spans[1], { opacity: 1,        duration: 0.3 });
      gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
    }
  };

  hamburger.addEventListener('click', () => isOpen ? close() : open());
  if (mobileClose) mobileClose.addEventListener('click', close);
  mobileLinks.forEach(link => link.addEventListener('click', close));

  // Chiudi con ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close();
  });
}

/* ═══════════════════════════════════════════════════════════════
   3. HERO ENTRANCE ANIMATION
   ═══════════════════════════════════════════════════════════════ */
function initHeroAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  // 1. Titolo fondazione – unica riga elegante che sale
  tl.to('.hero-title-inner', {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: 'power3.out',
  })

  // 3. Sottotitolo
  .to('.hero-subtitle', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, '-=0.55')

  // 4. CTA buttons
  .to('.hero-ctas', {
    opacity: 1,
    y: 0,
    duration: 0.7,
  }, '-=0.55')

  // 5. Composizione SVG arte+tennis entra da destra con leggero ritardo
  .to('.hero-art-deco', {
    opacity: 1,
    x: 0,
    duration: 1.2,
    ease: 'power3.out',
  }, '-=0.8');

  // Parallax lento dello sfondo mentre si scorre
  gsap.to('.hero-bg', {
    y: '25%',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });

  // Leggero float continuo sulla composizione SVG
  gsap.to('.hero-art-deco', {
    y: '-12px',
    duration: 4,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1.5,
  });
}

/* ═══════════════════════════════════════════════════════════════
   4. SCROLL REVEAL – elementi con [data-anim="fade-up"]
   ═══════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  document.querySelectorAll('[data-anim="fade-up"]').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0);

    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   5. TIMELINE – linea che si disegna + card che entrano
   ═══════════════════════════════════════════════════════════════ */
function initTimelineAnimation() {
  const progress = document.getElementById('timelineProgress');
  const timeline = document.getElementById('timeline');

  // Linea che "cresce" man mano che si scorre la sezione storia
  if (progress && timeline) {
    gsap.to(progress, {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: timeline,
        start: 'top 75%',
        end:   'bottom 65%',
        scrub: 0.8,
      }
    });
  }

  // Card da sinistra
  document.querySelectorAll('[data-anim="timeline-left"]').forEach((item) => {
    const dot  = item.querySelector('.timeline-dot');
    const card = item.querySelector('.timeline-card');

    // Dot compare con bounce
    if (dot) {
      gsap.fromTo(dot,
        { scale: 0 },
        {
          scale: 1,
          duration: 0.55,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: item, start: 'top 82%' }
        }
      );
    }

    // Card scivola da sinistra
    if (card) {
      gsap.to(item, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 82%' }
      });
    }
  });

  // Card da destra
  document.querySelectorAll('[data-anim="timeline-right"]').forEach((item) => {
    const dot  = item.querySelector('.timeline-dot');

    if (dot) {
      gsap.fromTo(dot,
        { scale: 0 },
        {
          scale: 1,
          duration: 0.55,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: item, start: 'top 82%' }
        }
      );
    }

    gsap.to(item, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 82%' }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   6. WORDPRESS REST API → NEWS SECTION
   ═══════════════════════════════════════════════════════════════ */
async function loadWordPressNews() {
  const grid    = document.getElementById('newsGrid');
  const loading = document.getElementById('newsLoading');
  const actions = document.getElementById('newsActions');
  if (!grid) return;

  try {
    const res = await fetch(WP_API_URL, {
      headers: { 'Accept': 'application/json' },
      // timeout manuale tramite AbortController
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const posts = await res.json();

    // Rimuovi spinner
    if (loading) loading.remove();

    if (!Array.isArray(posts) || posts.length === 0) {
      grid.innerHTML = buildNewsEmpty();
      return;
    }

    // Renderizza i post
    posts.forEach((post, idx) => {
      const card = buildNewsCard(post);
      grid.appendChild(card);

      // Animazione staggerata
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(card,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0,
            duration: 0.72,
            delay: idx * 0.09,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 87%' }
          }
        );
      } else {
        card.style.opacity = '1';
      }
    });

    if (actions) actions.style.display = 'block';

  } catch (err) {
    console.warn('[ARTennis] WordPress API:', err.message);
    if (loading) loading.remove();
    grid.innerHTML = buildNewsError();
  }
}

function buildNewsCard(post) {
  const article = document.createElement('article');
  article.className = 'news-card';

  // Immagine in evidenza
  let imgHtml = `<div class="news-card-img-placeholder">🎾</div>`;
  try {
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    if (media?.source_url) {
      const alt = decodeHtmlEntities(post.title?.rendered || '');
      imgHtml = `<img src="${escapeAttr(media.source_url)}" alt="${escapeAttr(alt)}" loading="lazy">`;
    }
  } catch (_) { /* immagine non disponibile */ }

  // Data formattata in italiano
  const date = post.date
    ? new Date(post.date).toLocaleDateString('it-IT', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : '';

  // Titolo decodificato
  const title = decodeHtmlEntities(post.title?.rendered || 'Articolo senza titolo');

  // Excerpt: strip HTML, tronca a 155 caratteri
  const rawExcerpt  = post.excerpt?.rendered || '';
  const textExcerpt = stripHtml(rawExcerpt);
  const excerpt     = textExcerpt.length > 155
    ? textExcerpt.slice(0, 155).trim() + '…'
    : textExcerpt;

  const link = post.link || '#';

  article.innerHTML = `
    <div class="news-card-img">${imgHtml}</div>
    <div class="news-card-body">
      ${date ? `<span class="news-card-date">${date}</span>` : ''}
      <h3 class="news-card-title">${title}</h3>
      ${excerpt ? `<p class="news-card-excerpt">${excerpt}</p>` : ''}
      <a href="${escapeAttr(link)}" target="_blank" rel="noopener" class="news-card-link">
        Leggi l'articolo
      </a>
    </div>
  `;

  return article;
}

function buildNewsEmpty() {
  return `<div class="news-error"><p>Nessun articolo disponibile al momento. Torna presto!</p></div>`;
}

function buildNewsError() {
  return `
    <div class="news-error">
      <p>Non è stato possibile caricare gli articoli in questo momento.</p>
      <a href="https://www.artennis.it" target="_blank" rel="noopener"
         class="btn btn-outline-dark" style="display:inline-flex; margin-top:1.25rem">
        Visita il sito WordPress →
      </a>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   7. NEWSLETTER → GOOGLE SHEETS
   ═══════════════════════════════════════════════════════════════ */
function initNewsletterForm() {
  const form    = document.getElementById('newsletterForm');
  if (!form) return;

  const emailInput   = document.getElementById('nlEmail');
  const nameInput    = document.getElementById('nlName');
  const consentInput = document.getElementById('nlConsent');
  const feedback     = document.getElementById('formFeedback');
  const submitBtn    = document.getElementById('nlSubmit');
  const btnLabel     = submitBtn?.querySelector('.btn-label');
  const btnLoading   = submitBtn?.querySelector('.btn-loading');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ── Validazione ──
    if (!emailInput.value || !isValidEmail(emailInput.value.trim())) {
      showFeedback(feedback, 'error', '⚠️  Inserisci un indirizzo email valido.');
      emailInput.focus();
      return;
    }
    if (!consentInput.checked) {
      showFeedback(feedback, 'error', '⚠️  Devi accettare l\'informativa sulla privacy per procedere.');
      consentInput.focus();
      return;
    }

    // ── Stato caricamento ──
    setSubmitting(true, submitBtn, btnLabel, btnLoading);
    showFeedback(feedback, '', '');

    const payload = {
      timestamp: new Date().toISOString(),
      name:      nameInput.value.trim() || '—',
      email:     emailInput.value.trim(),
      consent:   true,
    };

    // ── Demo mode (URL non configurato) ──
    const isDemoMode = GOOGLE_SHEET_URL.includes('INSERISCI_IL_TUO_URL_QUI');

    try {
      if (isDemoMode) {
        // Simula latenza di rete
        await sleep(900);
        console.info('[ARTennis Newsletter] Demo mode – dati che verrebbero inviati:', payload);
        handleNewsletterSuccess(form, feedback,
          '✅ [Demo] Iscrizione simulata! Configura GOOGLE_SHEET_URL in main.js per attivare l\'invio reale.'
        );
        return;
      }

      // ── Invio reale ad Apps Script ──
      // mode:'no-cors' è obbligatorio con Google Apps Script:
      // non possiamo leggere la risposta, ma i dati arrivano nel foglio.
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode:   'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      handleNewsletterSuccess(form, feedback,
        '✅ Iscrizione avvenuta con successo! Ti aggiorneremo presto.'
      );

    } catch (err) {
      console.error('[ARTennis Newsletter] Errore:', err);
      showFeedback(feedback, 'error',
        '❌ Si è verificato un errore. Riprova oppure scrivici a info@artennisfondazione.it'
      );
    } finally {
      setSubmitting(false, submitBtn, btnLabel, btnLoading);
    }
  });
}

function handleNewsletterSuccess(form, feedback, msg) {
  form.reset();
  showFeedback(feedback, 'success', msg);

  // Piccola animazione di conferma
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(feedback,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
    );
  }
}

function setSubmitting(loading, btn, label, loadingEl) {
  if (!btn) return;
  btn.disabled = loading;
  if (label)     label.style.opacity     = loading ? '0'       : '1';
  if (loadingEl) loadingEl.style.display = loading ? 'inline'  : 'none';
}

/* ═══════════════════════════════════════════════════════════════
   8. SMOOTH SCROLL (per ancora link interni)
   ═══════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  const NAVBAR_HEIGHT = 80;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   9. UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/** Valida formato email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Mostra messaggio nel div feedback */
function showFeedback(el, type, msg) {
  if (!el) return;
  el.className = `form-feedback${type ? ' ' + type : ''}`;
  el.textContent = msg;
}

/** Rimuove tag HTML da una stringa */
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

/** Decodifica entità HTML (&amp; &#039; ecc.) */
function decodeHtmlEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/** Escapes per attributi HTML (previene XSS) */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}

/** Sleep asincrono */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
