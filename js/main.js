const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

const yearElement = document.querySelector('#current-year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

const lightbox = document.querySelector('#lightbox');
const lightboxTitle = document.querySelector('.lightbox-title');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxText = document.querySelector('.lightbox-text');
const lightboxClose = document.querySelector('.lightbox-close');
let lastFocusedElement = null;

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll('.gallery-tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    if (!lightbox || !lightboxTitle || !lightboxImage) return;
    lastFocusedElement = tile;
    const tileImage = tile.querySelector('img');
    lightboxImage.src = tileImage ? tileImage.src : '';
    lightboxImage.alt = tileImage ? tileImage.alt : '';
    lightboxTitle.textContent = tile.dataset.galleryTitle || 'A moment worth keeping';
    if (lightboxText) lightboxText.textContent = tile.dataset.galleryText || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose?.focus();
  });
});

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox();
});

// Theme picker (light, warm, dark). The saved choice is applied before first paint by the
// small script in <head>; this handles the buttons, the saved preference and the browser theme colour.
const themeButtons = document.querySelectorAll('[data-theme-option]');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themeOption === theme));
  });
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim());
  }
}

applyTheme(document.documentElement.dataset.theme || 'ivory');

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = button.dataset.themeOption;
    applyTheme(theme);
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (error) {
      // Storage is unavailable (private mode); the theme still changes for this visit.
    }
  });
});

// Family flip cards: hover or keyboard focus flips them on devices with a pointer;
// on touch screens a tap flips the card and a second tap flips it back.
const canHover = window.matchMedia('(hover: hover)').matches;
document.querySelectorAll('.flip-card').forEach((card) => {
  card.addEventListener('click', () => {
    if (canHover) return;
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
  });
});

// Images: try a backup source once, then fall back to a plain placeholder instead of a broken icon.
document.querySelectorAll('img.image-placeholder').forEach((img) => {
  img.addEventListener('error', () => {
    const fallback = img.dataset.fallback;
    if (fallback && img.getAttribute('src') !== fallback) {
      img.src = fallback;
      return;
    }
    img.removeAttribute('src');
    img.alt = '';
    img.classList.add('is-broken');
  });
});

// Resume download: save the PDF instead of opening it in the browser.
document.querySelectorAll('a[download]').forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    const fileName = link.getAttribute('download') || 'resume.pdf';
    let href = link.href;
    let blobUrl = '';
    try {
      const response = await fetch(link.href);
      if (!response.ok) throw new Error('Download failed');
      blobUrl = URL.createObjectURL(await response.blob());
      href = blobUrl;
    } catch (error) {
      // Fetching can fail when the page is opened straight from disk; use the normal link instead.
    }
    const temp = document.createElement('a');
    temp.href = href;
    temp.download = fileName;
    document.body.appendChild(temp);
    temp.click();
    temp.remove();
    if (blobUrl) setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  });
});
