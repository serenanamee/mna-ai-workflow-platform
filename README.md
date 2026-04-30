# M&A AI Workflow Platform

Live Demo:  
https://serenanamee.github.io/mna-ai-workflow-platform/

An end-to-end system that transforms manual M&A advisory work into a structured, AI-assisted workflow.

This prototype demonstrates how deal sourcing, company analysis, and document generation can be connected into a single system — reducing manual effort and improving scalability.

---

## Why This Matters

M&A advisory work is traditionally:

- Manual and time-intensive
- Dependent on individual experience
- Difficult to scale across multiple deals

This system demonstrates how these processes can be:

- Structured into repeatable workflows
- Assisted by AI for faster execution
- Connected across different roles (BD ↔ Advisor)

---

## End-to-End Workflow

Business development creates a lead in the CRM system.

Company materials and financial documents are uploaded and stored in cloud infrastructure (GCP / AWS).

Public data is enriched through external sources (simulated Manus AI).

Claude processes both internal documents and external data to generate structured analysis, including:

- Company overview
- Key risks
- Valuation reference
- Buyer fit
- Due diligence checklist

The analysis results are written back to the CRM lead card.

Advisors review, edit, and move the deal forward within the pipeline.

Investment memos or teasers can be generated with a single action.

---

## How the System Works

1. Create or select a lead in CRM
2. Upload company data or financials
3. Run AI analysis (Claude + Manus enrichment)
4. Review structured output directly in CRM
5. Generate investment memo with one click
6. Advance deal stage within pipeline

This creates a continuous workflow instead of disconnected tools.

---

## Key Features

### CRM Pipeline
- Track deals from lead to execution
- Maintain interaction history and deal status
- Structured stages: Leads → Contacted → Qualified → In Analysis → Deal
- Auto-suggestion to run analysis when lead reaches Qualified
- Direct integration with AI analysis results

### AI Analysis
- Extract insights from financial data and documents
- Combine internal inputs with Manus public data enrichment
- Generate structured outputs:
  - Company overview
  - Key risks
  - Valuation reference
  - Buyer profile
  - Due diligence checklist

### Memo Generator
- Generate investment memo, seller teaser, or buyer brief
- Automatically pre-fills from CRM lead analysis
- Eliminates manual copy-paste between tools

---

## Demo Mode

The platform runs in **Demo Mode by default** (no API key required).

Pre-built responses simulate:

- Public data enrichment (Manus AI)
- Claude analysis output

To enable live AI output, add an Anthropic API key in the header input.

---

## Architecture

| Layer | Component | Details |
|---|---|---|
| Frontend | `index.html` · `styles.css` | View templates and styling |
| Application | `app.js` | Navigation, rendering, event handlers |
| State | `services/crm.js` | Centralised `appState`, lead management |
| AI | `services/claude.js` | Analysis, mock/live mode, safe JSON parser |
| Data | `data/sampleLeads.js` | Initial CRM dataset |

---

## API Key Security

This prototype calls the Anthropic API directly from the browser for demonstration purposes only.

In production, the architecture should be:

Browser → Backend (/api/analyze) → Anthropic API

The backend securely stores the API key in `.env` and proxies requests to prevent exposure.

Example (Express proxy):

```js
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

No build step required. Open `index.html` directly in a browser, or serve locally:

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
| Data Enrichment | Manus AI (simulated in prototype) |
| State Management | Centralised `appState` object |
| Deployment | GitHub Pages |

---

## Roadmap

- [ ] Backend API layer for secure key management
- [ ] Real Manus API integration for public data enrichment
- [ ] Persistent database (Supabase / PostgreSQL)
- [ ] Export reports as PDF
- [ ] Multi-user system with role separation (Advisor / BD)
- [ ] AI output traceability (source-linked, Claude FS compatible)

---

## Author

Built by **Serena Chang** as a portfolio project for AI Application / Workflow Engineering roles.

- GitHub: [github.com/serenanamee](https://github.com/serenanamee)
- LinkedIn: [linkedin.com/in/ixserena169](https://www.linkedin.com/in/ixserena169/)
- Medium: [medium.com/@serenamee](https://medium.com/@serenamee)
