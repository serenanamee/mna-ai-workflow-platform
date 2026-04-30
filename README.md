# M&A AI Workflow Platform

Live Demo:  
https://serenanamee.github.io/mna-ai-workflow-platform/

---

## Overview

A prototype system that transforms fragmented M&A advisory tasks into a structured, AI-supported workflow.

Instead of treating AI as a standalone tool, this project focuses on turning repetitive advisory work — such as company analysis, due diligence, and document generation — into a systemised process that can scale beyond individual consultants.

Built to demonstrate how an M&A firm can move from manual, experience-driven execution to a workflow where data, analysis, and decisions are continuously structured, reused, and connected.

---

## Workflow

This system is designed around how M&A advisory work actually happens:

Business Development  
→ Leads are created and tracked in a CRM pipeline  

Company Analysis  
→ Financial data and company materials are uploaded  
→ AI extracts key insights, risks, and valuation references  

Structured Output  
→ Analysis is converted into reusable formats (reports, checklists, buyer profiles)  

Deal Execution  
→ Outputs feed directly into investment memos, teasers, and transaction documents  

Each step is connected, allowing information to flow across the pipeline instead of being recreated manually.

---

## End-to-End Flow

The system connects business development, analysis, and execution into a single workflow:

1. Lead Creation  
   A new company is created and tracked in the CRM pipeline  

2. Data Input  
   Financial statements and company materials are uploaded  

3. Data Handling  
   Documents are stored (e.g. GCP / AWS) and prepared for processing  

4. Data Enrichment  
   Public information is retrieved via Manus AI to supplement internal data  

5. AI Analysis  
   Claude processes both internal documents and enriched data  

6. Structured Output  
   The system generates:
   - Company overview  
   - Risk factors  
   - Valuation reference  
   - Buyer profile suggestions  
   - Due diligence checklist  

7. CRM Integration  
   Analysis results are written back to the corresponding CRM lead  

8. Advisor Workflow  
   Advisors review, edit, and move the deal through pipeline stages  

9. Document Generation  
   Investment memo or teaser is generated directly from analysis results  

---

## System Modules

### CRM Pipeline

- Kanban-based pipeline: Leads → Contacted → Qualified → In Analysis → Deal  
- Lead cards with company data, interaction logs, and AI analysis status  
- Stage-based workflow with triggerable AI analysis  
- Designed for business development and deal tracking  

---

### Analysis Hub

- Input: company name, industry, financial data (PDF or text), transaction type  

- AI workflow:
  - Public data enrichment (Manus AI - simulated)
  - Financial and business analysis (Claude)

- Output:
  - Company overview  
  - Risk factors  
  - Valuation reference  
  - Buyer profile suggestions  
  - Due diligence checklist  

- Results are structured and saved back into CRM  

---

### Memo Generator

- Generates:
  - Investment memo  
  - Seller teaser  
  - Buyer brief  
  - Due diligence report  

- Auto-filled from AI analysis results  
- Eliminates manual copy-paste between documents  
- Supports English and Traditional Chinese  

---

## Why This Matters

In traditional M&A workflows, most work is:

- Repetitive (reading financials, summarising, drafting documents)  
- Fragmented (spread across documents, emails, and spreadsheets)  
- Dependent on individual experience  

This system reframes the workflow into:

- Structured inputs (company data, financials)  
- Repeatable AI-assisted processing  
- Standardised outputs that can be reviewed, edited, and reused  

The goal is not full automation from day one, but to progressively reduce manual workload and make advisory processes scalable.

---

## Demo Mode

The platform runs in Demo Mode by default (no API key required).

Pre-built responses simulate:
- Manus data enrichment  
- Claude analysis outputs  

To enable live AI output:
- Add an Anthropic API key in the header input  

---

## Architecture

The prototype follows a modular frontend architecture:

```plaintext
UI Layer
- index.html
- styles.css

Application Layer
- app.js (routing, rendering, interaction logic)

State Layer
- crm.js (centralised appState, pipeline logic)

AI Layer
- claude.js (analysis, mock/live mode)

Data Layer
- sampleLeads.js (initial dataset)
```
API Key Security

`This prototype calls the Anthropic API directly from the browser for demonstration purposes.`

In production:

Browser → Backend (/api/analyze) → Anthropic API
API keys stored securely in backend (.env)
Backend acts as proxy to prevent exposure

Example (Express proxy):
```
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

## Technology Stack

| Layer             | Technology |
|------------------|-----------|
| Frontend         | HTML · CSS · Vanilla JS |
| AI Analysis      | Claude (Anthropic) |
| Data Enrichment  | Manus AI (simulated) |
| State Management | Centralised appState |
| Deployment       | GitHub Pages |

---

## Roadmap

- Integrate full multi-step AI analysis (DD, matching, valuation)
- Automate AI trigger based on CRM stage transitions
- Add persistent database (Supabase / PostgreSQL)
- Enable multi-user roles (Advisor / BD)
- Export reports (PDF / structured documents)
- Integrate real external data enrichment (Manus API)

---

## Author

Built by Serena Chang as a portfolio project for AI Application / Workflow Engineering roles.

- GitHub: https://github.com/serenanamee  
- LinkedIn: https://www.linkedin.com/in/ixserena169/s  
- Medium: https://medium.com/@serenamee  
