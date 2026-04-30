/**
 * app.js
 * Main application logic — navigation, view rendering, event handlers.
 */

// ═══ STATE ═════════════════════════════════════════════════════════
let hubPdfB64 = null;
let activeDetailTab = 'overview';

// ═══ INIT ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initCRM();
  renderPipeline();
  renderSidebar();
  checkKey();
});

// ═══ API KEY ═══════════════════════════════════════════════════════
function checkKey() {
  const k = document.getElementById('apiKey').value.trim();
  const isReal = k.startsWith('sk-ant-');
  const isMock = !k;
  document.getElementById('api-dot').classList.toggle('ok', isReal);
  document.getElementById('api-dot').classList.toggle('mock', isMock || (!isReal && k.length === 0));
  document.getElementById('mode-label').textContent = isReal ? 'Live' : 'Demo Mode';
  document.getElementById('mode-label').style.color = isReal ? 'var(--green)' : 'var(--gold)';
}

function getApiKey() {
  return document.getElementById('apiKey').value.trim();
}

// ═══ NAVIGATION ════════════════════════════════════════════════════
function switchView(name, tabEl) {
  document.querySelectorAll('.view').forEach(v => { v.style.display = 'none'; v.classList.remove('on'); });
  document.getElementById('view-lead').style.display = 'none';
  const v = document.getElementById('view-' + name);
  if (v) { v.style.display = 'block'; v.classList.add('on'); }
  if (tabEl) {
    document.querySelectorAll('.hdr-tab').forEach(b => b.classList.remove('on'));
    tabEl.classList.add('on');
  }
  if (name === 'pipeline') renderPipeline();
  if (name === 'analysis-hub') setFlowStep(1);
}

function switchDetailTab(name, el) {
  activeDetailTab = name;
  document.querySelectorAll('.dtab-content').forEach(d => d.classList.remove('on'));
  document.querySelectorAll('.ldh-tab').forEach(t => t.classList.remove('on'));
  document.getElementById('dt-' + name).classList.add('on');
  el.classList.add('on');
}

// ═══ PIPELINE VIEW ═════════════════════════════════════════════════
function renderPipeline() {
  const counts = getStageCounts();
  document.getElementById('pc-all').textContent = counts.all;
  STAGES.forEach(s => {
    const el = document.getElementById('pc-' + s.replace(' ', '-'));
    if (el) el.textContent = counts[s] || 0;
  });

  const filtered = getLeads(appState.pipelineFilter);
  const grid = document.getElementById('po-grid');

  if (appState.pipelineFilter === 'all') {
    grid.className = 'po-grid';
    grid.innerHTML = STAGES.map(stage => {
      const col = appState.leads.filter(l => l.stage === stage);
      const isGold = stage === 'In Analysis';
      const isGreen = stage === 'Deal';
      return `<div class="po-col">
        <div class="po-col-h ${isGold ? 'gold' : isGreen ? 'green' : ''}">${stage} <span style="opacity:.65;font-size:.65rem">${col.length}</span></div>
        ${col.map(l => `<div class="po-card" onclick="openLead(${l.id})">
          <div class="po-company">${l.name}${l.analysis ? '<span class="ai-chip">AI</span>' : ''}</div>
          <div class="po-meta">${l.industry} · ${l.lastContact || '—'}</div>
        </div>`).join('')}
        ${col.length === 0 ? '<div class="po-empty">No leads</div>' : ''}
      </div>`;
    }).join('');
  } else {
    grid.className = 'po-list';
    grid.innerHTML = filtered.map(l => `
      <div class="po-row" onclick="openLead(${l.id})">
        <div><div class="po-company">${l.name}${l.analysis ? '<span class="ai-chip">AI</span>' : ''}</div>
        <div class="po-meta">${l.industry} · ${l.revenue} · ${l.contact}</div></div>
        <span class="stage-badge ${stageCls(l.stage)}">${l.stage}</span>
      </div>`).join('') || '<div style="color:var(--muted);font-size:.83rem;padding:1rem">No leads in this stage.</div>';
  }

  renderSidebar();
}

function filterPipeline(stage, el) {
  appState.pipelineFilter = stage;
  document.querySelectorAll('.ps-stage').forEach(s => s.classList.remove('on'));
  el.classList.add('on');
  renderPipeline();
}

// ═══ SIDEBAR ═══════════════════════════════════════════════════════
function renderSidebar() {
  const el = document.getElementById('sb-list');
  el.innerHTML = appState.leads.map(l => `
    <div class="sb-item ${appState.currentLeadId === l.id ? 'on' : ''}" onclick="openLead(${l.id})">
      <span class="sb-name">${l.name}</span>
      ${l.analysis ? '<span style="color:var(--gold);font-size:.6rem;font-family:JetBrains Mono,monospace">AI</span>' : ''}
    </div>`).join('');
}

// ═══ LEAD DETAIL ═══════════════════════════════════════════════════
function openLead(id) {
  appState.currentLeadId = id;
  const lead = getCurrentLead();
  if (!lead) return;

  document.querySelectorAll('.view').forEach(v => { v.style.display = 'none'; v.classList.remove('on'); });
  document.querySelectorAll('.hdr-tab').forEach(b => b.classList.remove('on'));
  document.getElementById('view-lead').style.display = 'block';

  // Header
  document.getElementById('ld-name').textContent = lead.name;
  document.getElementById('ld-meta').innerHTML =
    `${lead.industry} &nbsp;·&nbsp; ${lead.revenue} &nbsp;·&nbsp; ${lead.emp} employees &nbsp;·&nbsp; <span class="stage-badge ${stageCls(lead.stage)}">${lead.stage}</span>`;

  // Qualified suggestion banner
  const banner = document.getElementById('qualified-banner');
  if (shouldSuggestAnalysis(lead)) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  // Overview tab
  document.getElementById('ld-details').innerHTML = [
    ['Industry', lead.industry],
    ['Revenue', lead.revenue],
    ['Employees', lead.emp],
    ['Contact', lead.contact],
    ['Last Contact', lead.lastContact || '—'],
    ['AI Analysis', lead.analysis
      ? '<span style="color:var(--green)">Completed</span>'
      : '<span style="color:var(--muted)">Not yet run</span>'],
  ].map(([k, v]) => `<div class="detail-row"><span class="dk">${k}</span><span>${v}</span></div>`).join('');

  // Stage flow
  const idx = STAGES.indexOf(lead.stage);
  document.getElementById('ld-flow').innerHTML = STAGES.map((s, i) => `
    <div class="fs ${i === idx ? 'active-fs' : ''}">
      <div class="fs-n">0${i + 1}</div>
      <div class="fs-t">${s}</div>
    </div>
    ${i < STAGES.length - 1 ? '<div class="fa">›</div>' : ''}`).join('');

  // Analysis tab
  if (lead.analysis) {
    document.getElementById('no-analysis').style.display = 'none';
    document.getElementById('has-analysis').style.display = 'block';
    const a = lead.analysis;
    document.getElementById('ra-overview').textContent = a.overview || '—';
    document.getElementById('ra-risks').textContent = a.risks || '—';
    document.getElementById('ra-valuation').textContent = a.valuation || '—';
    document.getElementById('ra-buyers').textContent = a.buyers || '—';
    document.getElementById('ra-dd').textContent = a.dd || '—';
  } else {
    document.getElementById('no-analysis').style.display = 'block';
    document.getElementById('has-analysis').style.display = 'none';
  }

  // Notes tab
  document.getElementById('ld-notes').innerHTML = lead.notes.length
    ? lead.notes.map(n => `<div class="note-item">${n}</div>`).join('')
    : '<div style="color:var(--muted);font-size:.83rem;font-style:italic">No notes yet.</div>';

  switchDetailTab('overview', document.querySelectorAll('.ldh-tab')[0]);
  renderSidebar();
}

function advStage() {
  if (!appState.currentLeadId) return;
  const lead = advanceLeadStage(appState.currentLeadId);
  if (lead) openLead(lead.id);
}

function addNote() {
  const n = prompt('Add interaction note:');
  if (!n) return;
  addNoteToLead(appState.currentLeadId, n);
  openLead(appState.currentLeadId);
}

function goRunAnalysis() {
  const lead = getCurrentLead();
  if (lead) {
    document.getElementById('h-company').value = lead.name;
    document.getElementById('h-industry').value = lead.industry;
  }
  document.querySelectorAll('.hdr-tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.hdr-tab')[1].classList.add('on');
  document.getElementById('view-lead').style.display = 'none';
  document.getElementById('view-analysis-hub').style.display = 'block';
  document.getElementById('view-analysis-hub').classList.add('on');
  setFlowStep(1);
}

// ═══ ANALYSIS HUB ══════════════════════════════════════════════════
function handlePdf(input) {
  const f = input.files[0];
  if (!f) return;
  const tag = document.getElementById('h-filetag');
  tag.textContent = f.name;
  tag.style.display = 'inline-block';
  const r = new FileReader();
  r.onload = e => { hubPdfB64 = e.target.result.split(',')[1]; };
  r.readAsDataURL(f);
}

function setFlowStep(n) {
  for (let i = 1; i <= 5; i++) {
    document.getElementById('hf' + i)?.classList.toggle('active-fs', i === n);
  }
}

async function runHubAnalysis() {
  const company = document.getElementById('h-company').value.trim();
  const industry = document.getElementById('h-industry').value.trim();
  const text = document.getElementById('h-text').value.trim();
  const focus = document.getElementById('h-focus').value.trim();
  const typeMap = { full_acquisition: 'Full Acquisition', partial: 'Partial Stake', merger: 'Merger', partnership: 'Strategic Partnership' };
  const type = typeMap[document.getElementById('h-type').value];

  if (!company && !text && !hubPdfB64) { alert('Enter company name or data.'); return; }

  document.getElementById('h-btn').disabled = true;
  document.getElementById('h-results').style.display = 'none';

  // Step 1 → Step 2: Manus Enrichment
  setFlowStep(2);
  document.getElementById('h-loading').style.display = 'block';
  document.getElementById('h-loading').innerHTML = `<div class="loading-row"><div class="spinner"></div>Enriching public data via Manus…</div>
    <div id="manus-result" style="display:none;margin-top:.75rem"></div>`;

  const manusData = await runManusEnrichment(company);
  document.getElementById('manus-result').style.display = 'block';
  document.getElementById('manus-result').innerHTML = `
    <div class="enrich-box">
      <div class="enrich-title">Manus Public Data Enrichment</div>
      <div class="enrich-row"><span class="ek">Website</span><span>${manusData.website}</span></div>
      <div class="enrich-row"><span class="ek">News</span><span>${manusData.news}</span></div>
      <div class="enrich-row"><span class="ek">Registry</span><span>${manusData.registry}</span></div>
      <div class="enrich-row"><span class="ek">Industry peers</span><span>${manusData.industry}</span></div>
    </div>`;

  // Step 2 → Step 3: Claude Analysis
  await new Promise(r => setTimeout(r, 600));
  setFlowStep(3);
  document.getElementById('h-loading').insertAdjacentHTML('beforeend',
    `<div class="loading-row" style="margin-top:.5rem"><div class="spinner"></div>Claude is analysing — processing financials and generating structured report…</div>`);

  const prompt = `M&A analysis.\nCompany: ${company || 'Unknown'}\nIndustry: ${industry || '—'}\nTransaction: ${type}\nFocus: ${focus || 'General'}\nPublic enrichment data: ${JSON.stringify(manusData)}\n${text ? 'Financial data:\n' + text : ''}
Return ONLY valid JSON: { "overview": "...", "risks": "...", "valuation": "...", "buyers": "...", "dd": "..." }
Use bullet points with • for lists.`;

  let messages;
  if (hubPdfB64) {
    messages = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: hubPdfB64 } }, { type: 'text', text: prompt }] }];
  } else {
    messages = [{ role: 'user', content: prompt }];
  }

  try {
    const raw = await callClaude(messages, 'You are a senior M&A advisor. Return only valid JSON with keys: overview, risks, valuation, buyers, dd.', getApiKey());
    const j = safeParseAnalysis(raw);

    document.getElementById('hr-overview').textContent = j.overview || '—';
    document.getElementById('hr-risks').textContent = j.risks || '—';
    document.getElementById('hr-valuation').textContent = j.valuation || '—';
    document.getElementById('hr-buyers').textContent = j.buyers || '—';
    document.getElementById('hr-dd').textContent = j.dd || '—';
    document.getElementById('h-res-name').textContent = company || 'Company';
    document.getElementById('h-results').style.display = 'block';

    appState.lastAnalysis = { company, industry, ...j };
    setFlowStep(4);
  } catch (e) {
    alert('Analysis failed: ' + e.message);
    setFlowStep(1);
  } finally {
    document.getElementById('h-loading').style.display = 'none';
    document.getElementById('h-btn').disabled = false;
  }
}

function saveAnalysisToCrm() {
  if (!appState.lastAnalysis) return;
  const { company, industry, ...analysis } = appState.lastAnalysis;
  const lead = saveAnalysisToLead(company, industry, analysis);
  setFlowStep(5);
  renderSidebar();
  setTimeout(() => openLead(lead.id), 400);
}

// ═══ MEMO GENERATOR ════════════════════════════════════════════════
function prefillMemoFromLead(lead) {
  if (!lead || !lead.analysis) return;
  document.getElementById('m-company').value = lead.name;
  const a = lead.analysis;
  document.getElementById('m-data').value = [
    a.overview ? 'Overview:\n' + a.overview : '',
    a.risks ? '\nKey Risks:\n' + a.risks : '',
    a.valuation ? '\nValuation:\n' + a.valuation : '',
    a.buyers ? '\nSuggested Buyers:\n' + a.buyers : '',
  ].filter(Boolean).join('\n');
}

function prefillMemo() {
  const lead = getCurrentLead();
  if (lead && lead.analysis) {
    prefillMemoFromLead(lead);
  } else if (appState.lastAnalysis) {
    document.getElementById('m-company').value = appState.lastAnalysis.company || '';
    const a = appState.lastAnalysis;
    document.getElementById('m-data').value = [
      a.overview ? 'Overview:\n' + a.overview : '',
      a.risks ? '\nKey Risks:\n' + a.risks : '',
      a.valuation ? '\nValuation:\n' + a.valuation : '',
      a.buyers ? '\nSuggested Buyers:\n' + a.buyers : '',
    ].filter(Boolean).join('\n');
  }
}

async function runMemo() {
  const company = document.getElementById('m-company').value.trim();
  const data = document.getElementById('m-data').value.trim();
  if (!data) { alert('Please enter company data.'); return; }

  const typeMap = { investment_memo: 'Investment Memo', seller_teaser: 'Seller Teaser', buyer_brief: 'Buyer Brief', dd_report: 'Due Diligence Report' };
  const type = typeMap[document.getElementById('m-type').value];
  const audienceMap = { strategic_buyer: 'Strategic Buyer', pe_fund: 'PE / Investment Fund', management_team: 'Management Team', board: 'Board / Owner' };
  const audience = audienceMap[document.getElementById('m-audience').value];
  const lang = document.getElementById('m-lang').value === 'zh' ? 'Traditional Chinese' : 'English';

  document.getElementById('m-btn').disabled = true;
  document.getElementById('m-loading').style.display = 'block';
  document.getElementById('m-output').style.display = 'none';

  const prompt = `Write a professional ${type} for ${company || 'this company'}.\nAudience: ${audience}\nLanguage: ${lang}\nData:\n${data}\n\nWrite a complete, structured document. Use clear section headers. Professional M&A advisory tone. No placeholder text.`;

  try {
    const text = await callClaudeMemo([{ role: 'user', content: prompt }], getApiKey());
    document.getElementById('m-text').textContent = text;
    document.getElementById('m-output-label').textContent = type + (company ? ' — ' + company : '');
    document.getElementById('m-output').style.display = 'block';
  } catch (e) {
    alert('Generation failed: ' + e.message);
  } finally {
    document.getElementById('m-loading').style.display = 'none';
    document.getElementById('m-btn').disabled = false;
  }
}

function copyMemo() {
  navigator.clipboard.writeText(document.getElementById('m-text').textContent)
    .then(() => alert('Copied to clipboard.'));
}

// ═══ ADD LEAD MODAL ═════════════════════════════════════════════════
function openAddLeadModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }

function submitAddLead() {
  const name = document.getElementById('nl-name').value.trim();
  if (!name) { alert('Company name required.'); return; }
  addLead({
    name,
    industry: document.getElementById('nl-industry').value.trim(),
    stage: document.getElementById('nl-stage').value,
    contact: document.getElementById('nl-contact').value.trim(),
    revenue: document.getElementById('nl-revenue').value.trim(),
    emp: document.getElementById('nl-emp').value.trim(),
    notes: document.getElementById('nl-notes').value.trim(),
  });
  ['nl-name', 'nl-industry', 'nl-contact', 'nl-revenue', 'nl-emp', 'nl-notes'].forEach(id => document.getElementById(id).value = '');
  closeModal();
  renderPipeline();
}

// ═══ HELPERS ═══════════════════════════════════════════════════════
function stageCls(s) {
  if (s === 'In Analysis') return 'analysis';
  if (s === 'Deal') return 'deal';
  return '';
}
