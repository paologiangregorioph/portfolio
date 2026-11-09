document.addEventListener('DOMContentLoaded', () => {
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const main = document.querySelector('main[id]');
  if (main && !document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + main.id;
    skip.textContent = 'Vai al contenuto';
    document.body.prepend(skip);
  }

  initNav();
  initCollection();
});

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  nav.id ||= 'main-navigation';
  toggle.setAttribute('aria-controls', nav.id);

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-active', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  }

  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    setOpen(open);
    if (open) nav.querySelector('a')?.focus();
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    setOpen(false);
    if (toggle.getClientRects().length) toggle.focus();
  });
}

function getPhotoTitle(photo) {
  return photo.displayName || photo.title || '';
}

function cloudinaryPhotoUrl(photo, width, height) {
  const size = height ? `w_${width},h_${height}` : `w_${width}`;
  const color = photo.signatureColor === 'black' ? 'black' : 'white';
  // Keep the size and placement in sync with the generator's contrast analysis.
  const signatureLayer = width =>
    `l_Firma/c_scale,fl_relative,w_${width}/co_${color},e_colorize:100/fl_layer_apply,g_south_east,x_0.015,y_0.015`;
  const signature = `if_ar_lt_1.0/${signatureLayer(0.37)}/if_else/${signatureLayer(0.29)}/if_end`;
  return photo.src.replace(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?=v\d+\/)/,
    `$1c_limit,${size}/${signature}/q_auto/f_auto/`
  );
}

function setPhotoThumbnail(img, photo) {
  const widths = [480, 800, 1200];
  const original = photo.src;
  const src = cloudinaryPhotoUrl(photo, 480);
  img.alt = photo.alt || getPhotoTitle(photo);
  img.sizes = '(max-width: 520px) 92vw, (max-width: 960px) 46vw, (max-width: 1480px) 30vw, 470px';
  const srcset = src === original ? '' : widths
    .map(width => `${cloudinaryPhotoUrl(photo, width)} ${width}w`)
    .join(', ');
  if (srcset) img.srcset = srcset;
  img.src = src;
}

function initCollection() {
  const grid = document.querySelector('.collection-grid');
  if (!grid) return;

  const category = document.body.dataset.collection || grid.dataset.category || 'all';
  const catalog = typeof PHOTOS !== 'undefined' && Array.isArray(PHOTOS) ? PHOTOS : null;
  const photos = catalog?.filter(photo => category === 'all' || photo.category === category) ?? [];
  const empty = document.createElement('p');
  empty.className = 'collection-empty';
  grid.after(empty);

  if (!photos.length) {
    empty.textContent = catalog
      ? 'Questa raccolta è ancora vuota.'
      : 'La galleria non è disponibile. Ricarica la pagina per riprovare.';
    return;
  }

  const thumbnails = new Map();
  const openViewer = createPhotoViewer(thumbnails);
  let visiblePhotos = photos;
  const tools = document.createElement('div');
  tools.className = 'collection-tools';
  const count = document.createElement('p');
  count.className = 'collection-count';
  count.setAttribute('role', 'status');
  const cards = photos.map((photo, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'collection-card';
    card.setAttribute('aria-haspopup', 'dialog');
    card.innerHTML = `
      <span class="collection-card__media"><img alt="" loading="lazy" decoding="async"></span>
      <span class="collection-card__caption">
        <span class="collection-card__title"></span>
        <span class="collection-card__meta" aria-hidden="true"></span>
      </span>
    `;
    const title = getPhotoTitle(photo);
    card.querySelector('.collection-card__title').textContent = title || `Foto ${index + 1}`;
    card.querySelector('.collection-card__meta').textContent = String(index + 1).padStart(2, '0');
    const img = card.querySelector('img');
    thumbnails.set(photo, img);
    setPhotoThumbnail(img, photo);
    if (img.alt === title) img.alt = '';
    card.addEventListener('click', () => openViewer(visiblePhotos, visiblePhotos.indexOf(photo), card));
    return card;
  });
  grid.replaceChildren(...cards);

  function updateCount() {
    count.textContent = visiblePhotos.length === 1 ? '1 foto' : `${visiblePhotos.length} foto`;
  }

  if (photos.length >= 12) {
    const label = document.createElement('label');
    label.className = 'archive-filter';
    label.innerHTML = '<span>Cerca nella raccolta</span><input type="search" placeholder="Titolo della foto">';
    const input = label.querySelector('input');
    const searchable = photos.map(photo => `${getPhotoTitle(photo)} ${photo.description || ''}`.toLocaleLowerCase('it'));
    input.addEventListener('input', () => {
      const query = input.value.trim().toLocaleLowerCase('it');
      visiblePhotos = photos.filter((photo, index) => {
        const matches = searchable[index].includes(query);
        cards[index].hidden = !matches;
        return matches;
      });
      empty.hidden = visiblePhotos.length > 0;
      updateCount();
    });
    tools.append(label);
  }

  empty.textContent = 'Nessuna foto corrisponde alla ricerca.';
  empty.hidden = true;
  updateCount();
  tools.append(count);
  grid.before(tools);
}

function createPhotoViewer(thumbnails) {
  document.querySelector('.lightbox')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Visualizzatore fotografico');
  dialog.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Chiudi visualizzatore" autofocus>&times;</button>
    <button type="button" class="lightbox-nav lightbox-prev" aria-label="Foto precedente">&larr;</button>
    <button type="button" class="lightbox-nav lightbox-next" aria-label="Foto successiva">&rarr;</button>
    <figure>
      <img alt="">
      <p class="lightbox-message" role="status" hidden></p>
      <figcaption aria-live="polite" aria-atomic="true">
        <span class="lightbox-title"></span>
        <span class="lightbox-desc" hidden></span>
        <span class="lightbox-counter"></span>
      </figcaption>
    </figure>
  `;
  document.body.append(dialog);

  const image = dialog.querySelector('img');
  const title = dialog.querySelector('.lightbox-title');
  const description = dialog.querySelector('.lightbox-desc');
  const counter = dialog.querySelector('.lightbox-counter');
  const message = dialog.querySelector('.lightbox-message');
  const previous = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  let photos = [];
  let index = 0;
  let trigger;
  let touchStart;
  let pendingImage;

  function cancelImageLoad() {
    if (!pendingImage) return;
    pendingImage.onload = pendingImage.onerror = null;
    pendingImage.removeAttribute('src');
    pendingImage = null;
  }

  function render() {
    cancelImageLoad();
    const photo = photos[index];
    const thumbnail = thumbnails.get(photo);
    const preview = thumbnail?.complete && thumbnail.naturalWidth ? thumbnail.currentSrc : '';
    title.textContent = getPhotoTitle(photo);
    description.textContent = photo.description || '';
    description.hidden = !photo.description;
    counter.textContent = `${index + 1} / ${photos.length}`;
    image.alt = photo.alt || getPhotoTitle(photo);
    image.hidden = !preview;
    message.hidden = true;
    if (preview) {
      image.src = preview;
    } else {
      image.removeAttribute('src');
    }

    const styles = getComputedStyle(dialog);
    const width = dialog.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const height = parseFloat(getComputedStyle(image).maxHeight);
    const ratio = preview ? thumbnail.naturalWidth / thumbnail.naturalHeight : 0;
    const fittedWidth = ratio ? Math.min(width, height * ratio) : width;
    const fittedHeight = ratio ? Math.min(height, width / ratio) : height;
    const pixels = Math.max(fittedWidth, fittedHeight) * window.devicePixelRatio;
    const size = pixels <= 800 ? 800 : pixels <= 1200 ? 1200 : 1600;
    const previewWidth = Number(preview.match(/\/c_limit,w_(\d+)\//)?.[1]);
    if (preview === photo.src || previewWidth * Math.max(1, 1 / ratio) >= size) return;

    message.classList.toggle('over-preview', Boolean(preview));
    message.classList.add('is-loading');
    message.textContent = preview ? 'Caricamento in alta qualità…' : 'Caricamento della foto…';
    message.hidden = false;

    const detailSource = cloudinaryPhotoUrl(photo, size, ratio >= 1 ? undefined : size);

    const detail = new Image();
    pendingImage = detail;
    detail.onload = async () => {
      await detail.decode().catch(() => {});
      if (pendingImage !== detail || !dialog.open) return;
      pendingImage = null;
      image.src = detail.currentSrc;
      image.hidden = false;
      message.hidden = true;
    };
    detail.onerror = () => {
      if (pendingImage !== detail || !dialog.open) return;
      pendingImage = null;
      message.classList.remove('is-loading');
      message.hidden = Boolean(preview);
      if (!preview) message.textContent = 'Impossibile caricare la foto.';
    };
    detail.src = detailSource;
  }

  function move(step) {
    if (photos.length < 2) return;
    index = (index + step + photos.length) % photos.length;
    render();
  }

  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  image.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  image.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length) return;
    const end = event.changedTouches[0];
    const distance = end.clientX - touchStart.clientX;
    const vertical = end.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(distance) > 48 && Math.abs(distance) > Math.abs(vertical) * 1.5) {
      move(distance < 0 ? 1 : -1);
    }
  }, { passive: true });
  image.addEventListener('touchcancel', () => { touchStart = null; });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    cancelImageLoad();
    document.body.classList.remove('viewer-open');
    touchStart = null;
    trigger.focus();
  });

  return (selection, start, opener) => {
    photos = selection;
    index = start;
    trigger = opener;
    previous.hidden = next.hidden = photos.length < 2;
    dialog.showModal();
    document.body.classList.add('viewer-open');
    render();
  };
}
