# M&A AI Workflow Platform

A prototype system that connects CRM pipeline management, AI-assisted company analysis, and investment memo generation into one end-to-end workflow.

Built to demonstrate how an M&A advisory firm can systematise the process of lead management, due diligence, and document production using Claude (Anthropic) and Manus AI.

---

## What It Does

```
Lead Generation  →  Company Analysis  →  Document Output  →  Deal Execution
     CRM              Analysis Hub         Memo Generator       CRM Pipeline
```

**Pipeline (CRM)**
- Kanban view across five stages: Leads → Contacted → Qualified → In Analysis → Deal
- Lead cards with company details, interaction log, and analysis status
- Auto-suggestion to run AI analysis when a lead reaches Qualified
- One-click to advance stage, add notes, or trigger analysis

**Analysis Hub**
- Input: company name, industry, financial data (PDF or text), transaction type
- Step 1: Manus enrichment — fetches public data (website, news, business registry, industry peers)
- Step 2: Claude analysis — generates structured report (overview, risks, valuation, buyer profile, DD checklist)
- Output saves directly to the linked CRM lead card, advancing stage to In Analysis

**Memo Generator**
- Generates investment memo, seller teaser, buyer brief, or due diligence report
- Pre-fills from the active lead's AI analysis — no copy-paste required
- Supports English and Traditional Chinese output

---

## Demo Mode

The platform runs in **Demo Mode** by default (no API key required). Pre-built responses demonstrate the full workflow including the Manus enrichment step and Claude analysis output.

To enable live AI output, add an Anthropic API key in the header input.

---

## Architecture

```
index.html          — App shell and view templates
styles.css          — All styles
app.js              — Navigation, view rendering, event handlers

data/
  sampleLeads.js    — Initial CRM data

services/
  crm.js            — Centralised state (appState), lead CRUD, stage logic
  claude.js         — Claude API calls, mock mode, safe JSON parser
```

### API Key Security

> **This prototype calls the Anthropic API directly from the browser for demonstration purposes only.**

In production, the architecture should be:

```
Browser  →  POST /api/analyze (your backend)  →  Anthropic API
```

The backend stores `ANTHROPIC_API_KEY` in `.env` and proxies requests to Anthropic. This prevents the key from being exposed client-side.

A simple Express proxy example:

```js
// server.js
app.post('/api/analyze', async (req, res) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
});
```

---

## Running Locally

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 3000
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML · CSS · Vanilla JS |
| AI Analysis | Claude (Anthropic) — `claude-sonnet-4-20250514` |
| Public Enrichment | Manus AI (simulated in prototype) |
| State Management | Centralised `appState` object |
| Deployment | Any static host (Render, Netlify, GitHub Pages) |

---

## Roadmap

- [ ] Backend proxy for API key security
- [ ] Real Manus API integration for public data enrichment
- [ ] Persistent storage (database / Supabase)
- [ ] Export reports as PDF
- [ ] Multi-user access with role separation (advisor / BD)
- [ ] Audit trail for AI outputs (source-linked, Claude FS compatible)

---

## Author

Built by **Serena Chang** as a portfolio demonstration for the 168 M&A Platform AI Application Specialist role.

- GitHub: [github.com/serenanamee](https://github.com/serenanamee)
- LinkedIn: [linkedin.com/in/ixserena169](https://linkedin.com/in/ixserena169)
- Medium: [medium.com/@serenamee](https://medium.com/@serenamee)
