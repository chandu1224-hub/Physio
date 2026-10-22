# Physio at Home — VS Code starter project

A responsive React + Vite frontend inspired by the general physiotherapy discovery and booking flow at physiobuddies.in/search, using an original dark forest-green and mint visual theme based on the supplied screenshot.

## Requirements
- Node.js 18+ (recommended)
- VS Code

## Run locally
1. Extract this folder and open `physio-at-home` in VS Code.
2. Open **Terminal → New Terminal**.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open the local URL shown in the terminal (usually `http://localhost:5173`).

## What's included
- Opening logo splash screen
- Responsive home page, navigation, condition cards, steps, FAQs and footer
- Search form with condition, area and care-type options
- Animated nearby search with five cartoon clinician characters orbiting a location pin
- Five sample physiotherapist profiles, profile details and demo prices
- Booking request form that composes a message and opens WhatsApp to **+91 77958 55640**
- Floating WhatsApp contact link
- Mobile menu, search results, filters and toast feedback

## Important before launch
- The five clinician profiles, ratings, review counts, fees, experience, availability and distances are **illustrative demo data**, not real or verified healthcare professionals. Replace them with approved real profiles and verify credentials before publishing.
- This is a frontend prototype. Search uses local sample data; no real GPS/geospatial matching, authentication, database, payment gateway, live clinician availability, booking persistence or live tracking is connected.
- WhatsApp links open a prefilled message to the provided number. A user must press Send in WhatsApp, and your team must confirm the appointment.
- The 30-minute arrival wording is a design concept, not a guaranteed service-level promise. Change it to reflect actual operations.
- Do not use testimonials or medical claims as real without appropriate evidence and consent.

## Main files
- `src/main.jsx` — components, sample data, search, booking and WhatsApp interactions
- `src/styles.css` — complete visual theme and responsive styles
- `index.html` — page metadata and font loading
