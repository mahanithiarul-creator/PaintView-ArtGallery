// app.js - Enhanced frontend with infinite scroll, compare, favorites, auth, and backend integration.

// Configuration
const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? `${location.protocol}//${location.hostname}:3000` : '';
const PER_PAGE = 24; // per fetch

// DOM refs
const galleryGrid = document.getElementById('galleryGrid');
const detailImg = document.getElementById('detailImg');
const detailTitle = document.getElementById('detailTitle');
const detailArtist = document.getElementById('detailArtist');
const detailDesc = document.getElementById('detailDesc');
const detailLikes = document.getElementById('detailLikes');
const detailLikeBtn = document.getElementById('detailLike');
const detailFavBtn = document.getElementById('detailFav');
const detailCompareBtn = document.getElementById('detailCompare');
const miniTrending = document.getElementById('miniTrending');
const miniPopular = document.getElementById('miniPopular');
const syncBtn = document.getElementById('syncBtn');

const signinBtn = document.getElementById('signinBtn');
const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const authSubmit = document.getElementById('authSubmit');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authStatus = document.getElementById('authStatus');

const globalSearch = document.getElementById('globalSearch');
const searchBtn = document.getElementById('searchBtn');
const filterCategory = document.getElementById('filterCategory');
const filterStyle = document.getElementById('filterStyle');
const minViewsEl = document.getElementById('minViews');
const minLikesEl = document.getElementById('minLikes');
const sortSelect = document.getElementById('sortSelect');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');
const crumbs = document.getElementById('crumbCategory');

const favCountEl = document.getElementById('favCount');
const compareBar = document.getElementById('compareBar');
const compareSlots = document.getElementById('compareSlots');
const compareClear = document.getElementById('compareClear');
const openLightbox = document.getElementById('openLightboxDetail') || document.getElementById('openLightbox');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const closeLightbox = document.getElementById('closeLightbox');

const categoryNav = document.getElementById('categoryNav');
const applyBtn = document.getElementById('applyFilters');

// State
let page = 1;
let isLoading = false;
let endReached = false;
let paintings = []; // local cache
let filtered = [];
let selectedId = null;
let favorites = JSON.parse(localStorage.getItem('pv_favs') || '[]'); // array of ids
let compare = JSON.parse(localStorage.getItem('pv_compare') || '[]'); // up to 2 ids
let user = JSON.parse(localStorage.getItem('pv_user') || 'null');

// Helpers
const byId = id => paintings.find(p => p.id === id);
const updateFavCount = () => { favCountEl.textContent = favorites.length; };
const persistFavs = () => { localStorage.setItem('pv_favs', JSON.stringify(favorites)); updateFavCount(); };
const persistCompare = () => { localStorage.setItem('pv_compare', JSON.stringify(compare)); renderCompareBar(); };

// Escape helper
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

// Render a block of artworks
function renderItems(items) {
  const frag = document.createDocumentFragment();
  items.forEach(p => {
    const el = document.createElement('div');
    el.className = 'art-card';
    el.innerHTML = `
      <img loading="lazy" src="${p.img}" alt="${escapeHtml(p.title)}" data-id="${p.id}" />
      <div class="art-meta">
        <div>
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="sub">${escapeHtml(p.artist)} · ${p.year || ''}</div>
        </div>
        <div>
          <div class="sub">${(p.views||0).toLocaleString()} views</div>
          <div class="sub">♡ ${(p.likes||0).toLocaleString()}</div>
        </div>
      </div>
      <figcaption class="muted">${escapeHtml((p.desc||'').slice(0,120))}${(p.desc||'').length>120?'…':''}</figcaption>
    `;
    el.querySelector('img').addEventListener('click', () => selectArtwork(p.id));
    // favorite highlight
    if (favorites.includes(p.id)) {
      el.style.border = '1px solid rgba(255,100,100,0.12)';
    }
    frag.appendChild(el);
  });
  galleryGrid.appendChild(frag);
}

// Select artwork (detail)
async function selectArtwork(id) {
  selectedId = id;
  const p = byId(id);
  if (!p) return;
  // call view endpoint
  try {
    await fetch(`${API}/api/artworks/${encodeURIComponent(id)}/view`, { method: 'POST' });
  } catch (e) { /* ignore network errors in demo */ }
  // increment locally for UI responsiveness
  p.views = (p.views||0) + 1;
  // update detail card
  detailImg.src = p.img;
  detailTitle.textContent = p.title;
  detailArtist.textContent = `${p.artist || ''} · ${p.year || ''}`;
  detailDesc.textContent = p.desc || '';
  detailLikes.textContent = (p.likes||0).toLocaleString();
  renderMiniLists();
}

// Like action
detailLikeBtn?.addEventListener('click', async () => {
  if (!selectedId) return;
  try {
    const res = await fetch(`${API}/api/artworks/${encodeURIComponent(selectedId)}/like`, { method: 'POST' });
    const body = await res.json();
    const p = byId(selectedId);
    if (p) p.likes = body.likes;
    detailLikes.textContent = (p.likes||0).toLocaleString();
    renderMiniLists();
  } catch (e) {
    console.warn('like failed', e);
  }
});

// Favorite action
detailFavBtn?.addEventListener('click', () => {
  if (!selectedId) return;
  if (!favorites.includes(selectedId)) favorites.push(selectedId);
  else favorites = favorites.filter(x => x !== selectedId);
  persistFavs();
  renderMiniLists();
  // visual feedback
});

// Compare action
detailCompareBtn?.addEventListener('click', () => {
  if (!selectedId) return;
  if (!compare.includes(selectedId)) {
    if (compare.length >= 2) compare.shift(); // keep only last 2
    compare.push(selectedId);
  } else {
    compare = compare.filter(x => x !== selectedId);
  }
  persistCompare();
});

// Compare bar rendering
function renderCompareBar() {
  if (compare.length === 0) {
    compareBar.classList.add('hidden');
    return;
  }
  compareBar.classList.remove('hidden');
  compareSlots.innerHTML = '';
  compare.forEach(id => {
    const p = byId(id);
    const slot = document.createElement('div');
    slot.className = 'compare-slot';
    slot.innerHTML = `<img src="${p.img}" alt="${escapeHtml(p.title)}" /><div><strong>${escapeHtml(p.title)}</strong><div class="muted small">${escapeHtml(p.artist)}</div></div><button data-id="${p.id}" class="btn-secondary small remove-compare">✕</button>`;
    compareSlots.appendChild(slot);
  });
  // wire remove buttons
  [...compareSlots.querySelectorAll('.remove-compare')].forEach(b => b.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    compare = compare.filter(x => x !== id);
    persistCompare();
  }));
}

compareClear?.addEventListener('click', () => { compare = []; persistCompare(); });

// Mini lists (trending & popular)
function trendingScore(p) {
  const hoursSince = Math.max(1, (Date.now() - (p.createdAt || Date.now())) / 36e5);
  const decay = Math.pow(hoursSince + 2, 1.2);
  return ((p.views || 0) * 0.6 + (p.likes || 0) * 2.0) / decay;
}
function renderMiniLists() {
  const trending = [...paintings].sort((a,b)=> trendingScore(b) - trendingScore(a)).slice(0,5);
  const popular = [...paintings].sort((a,b)=> (b.views||0) - (a.views||0)).slice(0,5);
  miniTrending.innerHTML = trending.map(p => `<li data-id="${p.id}">${escapeHtml(p.title)} — ${escapeHtml(p.artist)}</li>`).join('');
  miniPopular.innerHTML = popular.map(p => `<li data-id="${p.id}">${escapeHtml(p.title)} — ${(p.views||0).toLocaleString()} views</li>`).join('');
  // click handlers
  [...miniTrending.children, ...miniPopular.children].forEach(li => li.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    selectArtwork(id);
  }));
}

// Auth: simple simulation
function updateAuthUI() {
  if (user && user.email) {
    authStatus.textContent = `Sign out (${user.email.split('@')[0]})`;
  } else {
    authStatus.textContent = 'Sign In';
  }
}
signinBtn.addEventListener('click', () => {
  if (user) { // sign out
    localStorage.removeItem('pv_user'); user = null; updateAuthUI(); alert('Signed out (demo)');
  } else {
    authModal.classList.remove('hidden');
  }
});
authClose.addEventListener('click', () => authModal.classList.add('hidden'));
authSubmit.addEventListener('click', () => {
  const email = authEmail.value.trim(); const password = authPassword.value;
  if (!email || !password) { alert('Provide email and password (demo)'); return; }
  user = { email }; localStorage.setItem('pv_user', JSON.stringify(user)); updateAuthUI(); authModal.classList.add('hidden'); alert('Signed in (demo)');
});
updateAuthUI();

// Filters & Search
function buildFilterQuery(pageNum = 1) {
  const q = globalSearch.value.trim();
  const cat = filterCategory.value;
  const style = filterStyle.value;
  const minViews = parseInt(minViewsEl.value || 0);
  const minLikes = parseInt(minLikesEl.value || 0);
  const sort = sortSelect.value || 'trending';
  const params = new URLSearchParams({
    page: pageNum,
    perPage: PER_PAGE,
    q,
    cat,
    style,
    minViews,
    minLikes,
    sort
  });
  return params.toString();
}

async function fetchPage(pn = 1) {
  if (isLoading || endReached) return;
  isLoading = true;
  document.body.style.cursor = 'wait';
  try {
    const qs = buildFilterQuery(pn);
    const res = await fetch(`${API}/api/artworks?${qs}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const body = await res.json();
    const items = body.results || [];
    // append to local list and render
    paintings = paintings.concat(items);
    renderItems(items);
    renderMiniLists();
    if (!body.hasMore) endReached = true;
    page = pn + 1;
  } catch (e) {
    console.warn('fetch failed', e);
    endReached = true;
  } finally {
    isLoading = false;
    document.body.style.cursor = '';
  }
}

// Infinite scroll observer
const observer = new IntersectionObserver(entries => {
  for (const ent of entries) {
    if (ent.isIntersecting && !isLoading && !endReached) {
      fetchPage(page);
    }
  }
}, { rootMargin: '400px' });

// sentinel element appended at end
const sentinel = document.createElement('div');
sentinel.style.height = '1px';
galleryGrid.parentElement.appendChild(sentinel);
observer.observe(sentinel);

// Reset and reload (when filters change)
function reloadAll() {
  page = 1; isLoading = false; endReached = false; paintings = []; galleryGrid.innerHTML = '';
  fetchPage(1);
}
applyFilters?.addEventListener('click', () => { reloadAll(); });
clearFilters?.addEventListener('click', () => {
  globalSearch.value = ''; filterCategory.value = 'all'; filterStyle.value = 'all'; minViewsEl.value = ''; minLikesEl.value = ''; sortSelect.value = 'trending';
  reloadAll();
});
searchBtn?.addEventListener('click', reloadAll);
globalSearch?.addEventListener('keyup', (e) => { if (e.key === 'Enter') reloadAll(); });

// header category nav
categoryNav?.addEventListener('click', (e) => {
  const li = e.target.closest('.cat');
  if (!li) return;
  [...categoryNav.querySelectorAll('.cat')].forEach(x => x.classList.remove('active'));
  li.classList.add('active');
  filterCategory.value = li.dataset.cat || 'all';
  crumbs.textContent = li.textContent;
  reloadAll();
});

// Sync button: triggers backend /api/sync
syncBtn?.addEventListener('click', async () => {
  syncBtn.disabled = true; syncBtn.textContent = 'Syncing…';
  try {
    const res = await fetch(`${API}/api/sync`, { method: 'POST' });
    const body = await res.json();
    alert('Sync requested: ' + (body.message || 'ok'));
    // after a sync, reload to fetch newly ingested items
    setTimeout(() => { reloadAll(); syncBtn.disabled = false; syncBtn.textContent = 'Sync from Web'; }, 1200);
  } catch (e) {
    syncBtn.disabled = false; syncBtn.textContent = 'Sync from Web'; alert('Sync failed (demo)');
  }
});

// Lightbox open/close
openLightbox?.addEventListener('click', () => {
  if (!selectedId) return;
  const p = byId(selectedId);
  if (!p) return;
  lightboxImg.src = p.img;
  lightboxCaption.textContent = `${p.title} — ${p.artist}`;
  lightbox.classList.remove('hidden');
});
closeLightbox?.addEventListener('click', () => lightbox.classList.add('hidden'));

// Initialization
function init() {
  updateFavCount();
  renderCompareBar();
  renderMiniLists();
  // initial fetch
  fetchPage(1);
}
init();
