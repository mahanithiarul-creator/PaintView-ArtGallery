### PaintView: Advanced Online Art Gallery System

## Introduction
PaintView is a modern, scalable, e-commerce-style online art gallery system designed to display thousands of artworks including paintings, sketches, drawings, digital art and more. The system includes advanced filtering options, infinite scrolling, compare functionality, favorites, user authentication simulation, and a Node.js backend API capable of syncing artworks through scraper stubs and API integrations such as SerpAPI, RapidAPI Pinterest Scraper or ZenRows. It is built to look like professional platforms, while focusing on art exploration rather than purchasing.

## Output Images
Below are example output representations.

![Web Page](<img width="1919" height="977" alt="image" src="https://github.com/user-attachments/assets/07ccb538-e26e-4d06-94f3-356eeba47d3d" />)

## Overview
PaintView allows users to browse artworks in an interactive and highly optimized interface. The system implements backend-driven pagination with infinite scroll and uses an Express.js backend for serving artworks. It includes authentication simulation, artwork like and view counters, trending and popular artworks calculation, and an extensible sync system that can trigger web scraping or third-party API calls to populate the gallery with thousands of artworks.

The frontend is fully responsive and uses a modern UI with enhanced filtering, sorting, and category navigation designed to mimic large-scale e-commerce platforms.

## Features
- Real artworks included (Mona Lisa, The Starry Night, etc.)
- Infinite scrolling gallery with lazy loading
- Node.js API for artworks, likes, views, and sync
- Filtering by category, medium, style, views, likes, search, and date
- Sorting: Trending, Popular, Newest, Oldest, Alphabetical
- Favorites system with persistent local storage
- Compare bar allowing comparison of two artworks
- Sign-in and Sign-out simulation
- Lightbox image view
- Trending and Popular side panels
- Responsive sidebar with advanced filters
- Sync endpoint to simulate or connect to real data ingestion (SerpAPI, RapidAPI, ZenRows, Puppeteer)

## Tech Stack
Frontend:
- HTML5
- CSS3 (Enhanced gradient UI)
- Vanilla JavaScript

Backend:
- Node.js
- Express.js
- CORS
- Body-parser

Optional Integrations:
- Puppeteer (Web Scraping)
- SerpAPI Pinterest Search
- RapidAPI Pinterest Scraper
- ZenRows API

## Technical Architecture
The system follows a simple yet expandable architecture.

Client (index.html, CSS, JS)
Makes HTTP requests and renders artworks using infinite scroll.

API Server (server.js)
Handles CRUD-like operations for artworks:
- GET /api/artworks: Paginated fetching with filters
- POST /api/artworks/:id/view: Increment views
- POST /api/artworks/:id/like: Increment likes
- POST /api/sync: Trigger ingestion worker or scraping stub

Data Layer
In-memory storage (for demo). Can be extended to Redis, MongoDB, PostgreSQL or Cloud storage.

Architecture Flow:
1. Frontend loads initial page
2. JavaScript requests artworks from backend
3. Backend returns artworks and pagination metadata
4. Infinite scroll fetches more pages
5. Like and View endpoints update counters
6. Sync endpoint populates new artworks into backend memory

## Installation
Clone the repository using Git:

```bash
git clone https://github.com/your-username/paintview.git
cd paintview
```

## Setup
Install backend dependencies:

```bash
npm init -y
npm install express cors body-parser
```

The frontend does not require any install steps.

## Usage
Step 1: Start Backend

```bash
node server.js
```

Backend defaults to:

```
http://localhost:3000
```

Step 2: Start Frontend (Recommended)

Option A: VS Code Live Server
Right-click index.html → Open with Live Server

Option B: Serve using node

```bash
npx serve . -l 5500
```

Open the frontend in your browser:
```
http://localhost:5500/index.html
```

## Project Structure
```
paintview/
│
├── index.html               Frontend UI
├── styles.css               Styling and layout
├── app.js                   Frontend logic (infinite scroll, filters, compare, favorites)
└── server.js                Node.js API server (artworks, likes, views, sync)
```

## Workflow
1. User opens gallery and infinite scroll loads initial artworks.
2. Filters apply API queries and reload the gallery.
3. Selecting an artwork updates detail panel and triggers view count increment.
4. Clicking Like sends POST to backend.
5. User may add items to Favorites or Compare.
6. Sync button can ingest additional artworks via backend scrapers.
7. Backend returns paginated artwork sets for performance.
8. UI continuously loads new pages until all artworks are fetched.

## Components
Frontend Components:
- Header with Search and Auth
- Sidebar Filters
- Gallery Grid with Infinite Scroll
- Detail Panel
- Favorites and Compare System
- Lightbox Viewer
- Trending and Popular Lists

Backend Components:
- Artwork Store (in-memory)
- Pagination and Filtering Engine
- Views and Likes Counters
- Sync Ingestion Stub
- REST API Router

## Future Implementations
- Real user authentication with JWT or OAuth
- Persistent database (PostgreSQL, MongoDB)
- Redis for counters
- Cloudinary or S3 for image hosting
- Vector embeddings for artwork similarity search
- Recommendation engine based on user behavior
- Complete web scraping pipelines with Puppeteer workers
- Admin panel for artwork management
- Full caching system for performance

## Conclusion
PaintView is a highly extensible, full-stack art gallery system designed to operate like an e-commerce platform. It demonstrates essential concepts such as filtering, sorting, infinite scrolling, backend integration, and UI responsiveness. The system is ideal for learning full-stack development patterns and can be extended into a production-grade art discovery platform with minimal effort.
