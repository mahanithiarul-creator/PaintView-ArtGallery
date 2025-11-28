// server.js - Minimal Node/Express demo backend (single-file)
// Usage: `node server.js`
// npm packages required: express, cors, body-parser
// Optional for Puppeteer: puppeteer

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory "database" of artworks
let artworks = [
  {
    id: 'mona-lisa',
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    year: '1503',
    medium: 'oil',
    category: 'paintings',
    style: 'realism',
    desc: 'Portrait of Lisa Gherardini — Louvre Museum (public domain link)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Mona_Lisa.jpg',
    views: 250000,
    likes: 54000,
    createdAt: new Date('1503-01-01').getTime()
  },
  {
    id: 'starry-night',
    title: 'The Starry Night',
    artist: 'Vincent van Gogh',
    year: '1889',
    medium: 'oil',
    category: 'paintings',
    style: 'post-impressionism',
    desc: "Van Gogh's swirling night sky",
    img: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/The_Starry_Night.jpg',
    views: 180000,
    likes: 42000,
    createdAt: new Date('1889-06-01').getTime()
  },
  {
    id: 'the-scream',
    title: 'The Scream',
    artist: 'Edvard Munch',
    year: '1893',
    medium: 'oil',
    category: 'paintings',
    style: 'expressionism',
    desc: 'Iconic expressionist work',
    img: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/The_Scream.jpg',
    views: 120000,
    likes: 27000,
    createdAt: new Date('1893-01-01').getTime()
  },
  {
    id: 'girl-with-pearl',
    title: 'Girl with a Pearl Earring',
    artist: 'Johannes Vermeer',
    year: '1665',
    medium: 'oil',
    category: 'paintings',
    style: 'baroque',
    desc: "The 'Mona Lisa of the North'",
    img: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Meisje_met_de_parel.jpg',
    views: 95000,
    likes: 21000,
    createdAt: new Date('1665-01-01').getTime()
  },
  {
    id: 'ink-sketch',
    title: 'Study of Hands (Sketch)',
    artist: 'Albrecht Dürer',
    year: '1500',
    medium: 'ink',
    category: 'sketches',
    style: 'realism',
    desc: 'A detailed sketch study.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Albrecht_D%C3%BCrer_014.jpg',
    views: 32000,
    likes: 5400,
    createdAt: new Date('1500-01-01').getTime()
  }
];

// Redis-like counters (in-memory maps) to simulate fast increments
const viewCounters = new Map(); // key: id -> int
const likeCounters = new Map();

// Helper: find artwork
function findArt(id){
  return artworks.find(a => a.id === id);
}

// GET /api/artworks - paginated, filterable
// Query parameters: page, perPage, q, cat, style, minViews, minLikes, sort
app.get('/api/artworks', (req, res) => {
  try {
    let { page = '1', perPage = '24', q = '', cat = 'all', style = '', minViews = '0', minLikes='0', sort='trending' } = req.query;
    page = Math.max(1, parseInt(page));
    perPage = Math.max(1, Math.min(200, parseInt(perPage)));
    minViews = parseInt(minViews) || 0;
    minLikes = parseInt(minLikes) || 0;
    q = (q || '').toLowerCase();

    // Filter
    let result = artworks.filter(a => {
      if (cat && cat !== 'all' && a.category !== cat) return false;
      if (style && style !== 'all' && a.style !== style) return false;
      if ((a.views || 0) < minViews) return false;
      if ((a.likes || 0) < minLikes) return false;
      if (q) {
        const hay = `${a.title} ${a.artist} ${a.desc} ${a.style}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });

    // Attach counts from counters (if present)
    result = result.map(a => {
      const views = viewCounters.has(a.id) ? (a.views + viewCounters.get(a.id)) : a.views;
      const likes = likeCounters.has(a.id) ? (a.likes + likeCounters.get(a.id)) : a.likes;
      return Object.assign({}, a, { views, likes });
    });

    // Sort
    if (sort === 'popular') result.sort((a,b)=> (b.views||0) - (a.views||0));
    else if (sort === 'newest') result.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    else if (sort === 'oldest') result.sort((a,b)=> (a.createdAt||0) - (b.createdAt||0));
    else if (sort === 'alpha') result.sort((a,b)=> a.title.localeCompare(b.title));
    else { // trending (time-decayed)
      result.sort((a,b) => {
        const scoreA = ((a.views||0)*0.6 + (a.likes||0)*2.0) / Math.pow(((Date.now()- (a.createdAt||Date.now()))/36e5) + 2, 1.2);
        const scoreB = ((b.views||0)*0.6 + (b.likes||0)*2.0) / Math.pow(((Date.now()- (b.createdAt||Date.now()))/36e5) + 2, 1.2);
        return scoreB - scoreA;
      });
    }

    const total = result.length;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paged = result.slice(start, end);
    const hasMore = end < total;
    res.json({ page, perPage, total, hasMore, results: paged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/artworks/:id/view -> increments view counter (fast)
app.post('/api/artworks/:id/view', (req, res) => {
  const id = req.params.id;
  const art = findArt(id);
  if (!art) return res.status(404).json({ error: 'not found' });
  viewCounters.set(id, (viewCounters.get(id) || 0) + 1);
  return res.status(204).end();
});

// POST /api/artworks/:id/like -> increments like counter and returns updated likes
app.post('/api/artworks/:id/like', (req, res) => {
  const id = req.params.id;
  const art = findArt(id);
  if (!art) return res.status(404).json({ error: 'not found' });
  likeCounters.set(id, (likeCounters.get(id) || 0) + 1);
  const newLikes = art.likes + (likeCounters.get(id) || 0);
  // For demo, also persist back to object every 100 increments or so (not implemented here)
  return res.json({ likes: newLikes });
});

/**
 * POST /api/sync
 * This endpoint is a stub/demo showing how you'd trigger a worker to fetch many artworks
 * using Puppeteer or APIs like SerpAPI / RapidAPI.
 *
 * In production:
 *  - This endpoint should enqueue a job (e.g., to Redis/Kafka) processed by a worker.
 *  - Worker will fetch sources, extract metadata, download or cache thumbnails, and insert them into DB.
 *
 * Example (comments):
 *
 * // Example SerpAPI request (SerpAPI Pinterest Search)
 * // GET https://serpapi.com/search.json?engine=pinterest&query=art+painting&api_key=YOUR_SERPAPI_KEY
 *
 * // Example RapidAPI Pinterest Scraper usage (fetch via RapidAPI endpoint, include headers 'x-rapidapi-key', etc.)
 *
 * // Example Puppeteer snippet (not executed here by default)
 * const puppeteer = require('puppeteer');
 * const browser = await puppeteer.launch({ headless: true });
 * const page = await browser.newPage();
 * await page.goto('https://example.com');
 * // evaluate and extract image URLs and metadata
 * await browser.close();
 *
 * We'll respond immediately for demo purposes.
 */
app.post('/api/sync', async (req, res) => {
  // This demo will "ingest" a small set of sample generated artworks to simulate sync.
  // In production: trigger worker and return 202 Accepted.
  const newItems = [];
  for (let i = 0; i < 50; i++) {
    const id = 'sync-' + Date.now() + '-' + i;
    const obj = {
      id,
      title: `Synced Artwork #${i+1}`,
      artist: ['Studio', 'Collector', 'Unknown'][Math.floor(Math.random()*3)],
      year: `${1990 + Math.floor(Math.random()*30)}`,
      medium: ['oil','acrylic','digital'][Math.floor(Math.random()*3)],
      category: ['paintings','drawings','sketches'][Math.floor(Math.random()*3)],
      style: ['abstract','realism','impressionism'][Math.floor(Math.random()*3)],
      desc: 'Auto-synced demo artwork (metadata from scraper)',
      img: `https://picsum.photos/seed/${Math.abs(Math.random()*1e9|0)}/800/600`,
      views: Math.floor(Math.random()*10000),
      likes: Math.floor(Math.random()*3000),
      createdAt: Date.now() - Math.floor(Math.random()*1000*60*60*24*365)
    };
    artworks.push(obj);
    newItems.push(obj);
  }
  // return a short message — in production, return job id and 202 status
  return res.json({ message: `Simulated ingestion of ${newItems.length} artworks (demo).`, added: newItems.length });
});

// Simple health route
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PaintView demo backend running on http://localhost:${PORT}`));
