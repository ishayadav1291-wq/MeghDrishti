# MeghDrishti (मेघदृष्टि)
### National Weather Big Data Analytics & Real-Time Disaster Intelligence Command System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps_Platform-Earth_3D-4285F4?style=flat&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75B2?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![D3.js](https://img.shields.io/badge/D3.js-v7_Transitions-F9A03C?style=flat&logo=d3.js&logoColor=white)](https://d3js.org/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 🛰️ Executive Overview

**MeghDrishti (मेघदृष्टि)** is an enterprise-grade national meteorological command and disaster response platform designed for India's National Disaster Management Authority (NDMA), State Disaster Management Authorities (SDMAs), and civil defense command centers.

The platform continuously synthesizes ground-truth crowdsourced reports, emergency SMS gateways, social media telemetry, IMD Doppler radars, and INSAT-3DR satellite imagery into a single unified operational picture. Powered by Google Maps Platform (Google Earth 3D) and Gemini 3.5 Flash server-side grounding, it automates rumor detection, trust scoring, and Common Alerting Protocol (CAP) notifications across six regional languages.

---

## 🌟 Key Capabilities

### 1. Dual-Engine GIS & Photorealistic Google Earth 3D
- **Google Earth 3D Mode**: High-resolution photorealistic satellite imagery and hybrid terrain mapping with $0^\circ$, $45^\circ$, and $65^\circ$ perspective tilt angles and heading rotation.
- **Meteorological Overlays**: Calibrated IMD Doppler weather radar dBZ reflectivity overlays (Bay of Bengal & Peninsular India) and INSAT-3DR multispectral cloud cover layers.
- **National GIS Mode**: Clean, unwatermarked OpenStreetMap fallback with custom high-contrast mission control dark styling.

### 2. Live Google Maps Grounding via Gemini 3.5 Flash
- Integrated server-side Maps Grounding route (`/api/maps-grounding`) that queries nearby emergency shelters, flood relief hubs, and hospitals based on coordinate proximity.
- Automatically extracts genuine, clickable `maps.google.com` links and verified place titles into operational HUDs.

### 3. Big Data Analytics & D3.js Predictive Transitions
- **Dynamic Line Morphing**: $24\text{h}$ historical observation and $+8\text{h}$ predictive forecast trajectories that animate smoothly via `d3.transition().duration(700).ease(d3.easeCubicOut)`.
- **95% Confidence Intervals**: Expanding uncertainty envelopes that dynamically adapt to new data injections without re-mounting or DOM flashing.
- **28-State Geographic Heatmap Cartogram**: State-by-state hazard indexing across Maharashtra, Assam, Odisha, Delhi NCR, Tamil Nadu, and Kerala.
- **Temporal Ingestion Matrix**: High-density $24\text{h} \times 7\text{d}$ incident frequency grid.

### 4. Explainable AI Trust Scoring ($0\text{–}100$)
- **Multi-Vector Corroboration**: Evaluates telemetry based on four weighted pillars:
  - IMD Doppler Radar & CWC Sensor Correlation ($30\%$)
  - Spatio-Temporal Event Clustering ($30\%$)
  - Source Credibility & History ($20\%$)
  - Media & EXIF Forensics ($20\%$)
- **Misinformation Quarantine**: Automatically flags uncorroborated viral media and deepfakes to protect first responder logistics.

### 5. Common Alerting Protocol (CAP) Hub & Emergency SOS
- Generates OASIS CAP-compliant multi-hazard warning broadcasts (Flash Flood, Landslide, Cyclone, Extreme Heat).
- Emergency citizen SOS dispatch mode with offline SMS parsing format (`REPORT [TYPE] [LOCATION] [SEVERITY]`).
- Multilingual accessibility: **English, हिन्दी (Hindi), বাংলা (Bengali), தமிழ் (Tamil), मराठी (Marathi), and తెలుగు (Telugu)**.

---

## 🏗️ Technical Architecture

```
MeghDrishti Root
├── server.ts               # Express Full-Stack Server + Vite Middlewares + Gemini Maps Grounding
├── src/
│   ├── App.tsx             # Main Command Center Container & Navigation Router
│   ├── components/
│   │   ├── GoogleEarthMap.tsx               # Google Maps Platform / Google Earth 3D Viewport
│   │   ├── GisMapIndia.tsx                  # Leaflet / OpenStreetMap GIS Engine
│   │   ├── WeatherIntensityForecastChart.tsx# D3.js Predictive Transition Chart
│   │   ├── BigDataAnalytics.tsx             # 28-State Heatmap & Temporal Matrix
│   │   ├── LiveIngestionFeed.tsx            # Multi-channel Event Feed & Stream Simulator
│   │   ├── AuthorityReviewPanel.tsx         # NDMA / CWC Incident Verification Panel
│   │   ├── CAPAlertsHub.tsx                 # OASIS CAP Standard Emergency Broadcasts
│   │   ├── CitizenPortal.tsx                # Crowdsourced Citizen Reporting & Shelter Finder
│   │   └── TopNavigation.tsx                # Status Cockpit & Language Switcher
│   ├── types/
│   │   └── weather.ts                       # Complete TypeScript Domain Models
│   ├── utils/
│   │   └── aiEngine.ts                      # Trust Scoring & Duplicate Clustering Algorithms
│   └── data/
│       └── mockData.ts                      # High-Fidelity Regional Disaster Scenarios
├── .env.example            # Environment variables blueprint
├── package.json            # Scripts & dependencies
└── tsconfig.json           # Strict TypeScript configuration
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v20.0+` or `v22.0+`
- **npm** or **bun** / **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
cd meghdrishti
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the keys in `.env.local`:
```env
# Gemini API Key (for server-side Google Maps Grounding)
GEMINI_API_KEY="your-gemini-api-key"

# Google Maps Platform Key (for Google Earth 3D & Maps JavaScript API)
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 5. Production Build & Execution
```bash
npm run build
npm start
```

---

## 🔒 Security & Data Hygiene
- **Zero API Key Leakage**: All Gemini AI SDK calls run strictly inside the backend Express layer (`server.ts`). No sensitive secrets are bundled into client-side JS artifacts.
- **Git Protection**: `.env` and `.env.local` files are strictly ignored via `.gitignore`. Only `.env.example` is committed.

---

## 📄 License
This project is licensed under the Apache License 2.0.
