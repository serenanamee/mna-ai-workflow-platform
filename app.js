/**
 * app.js
 * Main application logic — navigation, view rendering, event handlers.
 */

// ═══ 階段顯示名稱對應 ═══════════════════════════════════════════════
const STAGE_LABELS = {
  'Leads': '名單',
  'Contacted': '已接觸',
  'In Analysis': '分析中',
  'Deal': '成交',
};

// ═══ STATE ═════════════════════════════════════════════════════════
let hubPdfB64 = null;
let activeDetailTab = 'overview';

// ═══ INIT ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initCRM();
  document.getElementById('view-pipeline').style.display = 'block';
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
  document.getElementById('mode-label').textContent = isReal ? '即時模式' : '示範模式';
  document.getElementById('mode-label').style.color = isReal ? 'var(--green)' : 'var(--gold)';
}

function getApiKey() {
  return document.getElementById('apiKey').value.trim();
}

// ═══ NAVIGATION ════════════════════════════════════════════════════
function switchView(name, tabEl) {
  document.querySelectorAll('.view').forEach(v => {
    v.style.display = 'none';
    v.classList.remove('on');
  });
  document.getElementById('view-lead').style.display = 'none';

  if (name === 'pipeline') {
    const v = document.getElementById('view-pipeline');
    v.style.display = 'block';
    v.classList.add('on');
  } else {
    const v = document.getElementById('view-' + name);
    if (v) { v.style.display = 'block'; v.classList.add('on'); }
  }

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
      const label = STAGE_LABELS[stage] || stage;
      return `<div class="po-col">
        <div class="po-col-h ${isGold ? 'gold' : isGreen ? 'green' : ''}">${label} <span style="opacity:.65;font-size:.65rem">${col.length}</span></div>
        ${col.map(l => `<div class="po-card" onclick="openLead(${l.id})">
          <div class="po-company">${l.name}${l.analysis ? '<span class="ai-chip">AI</span>' : ''}</div>
          <div class="po-meta">${l.industry} · ${l.lastContact || '—'}</div>
        </div>`).join('')}
        ${col.length === 0 ? '<div class="po-empty">無案件</div>' : ''}
      </div>`;
    }).join('');
  } else {
    grid.className = 'po-list';
    grid.innerHTML = filtered.map(l => `
      <div class="po-row" onclick="openLead(${l.id})">
        <div><div class="po-company">${l.name}${l.analysis ? '<span class="ai-chip">AI</span>' : ''}</div>
        <div class="po-meta">${l.industry} · ${l.revenue} · ${l.contact}</div></div>
        <span class="stage-badge ${stageCls(l.stage)}">${STAGE_LABELS[l.stage] || l.stage}</span>
      </div>`).join('') || '<div style="color:var(--muted);font-size:.83rem;padding:1rem">此階段目前無案件。</div>';
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
    `${lead.industry} &nbsp;·&nbsp; ${lead.revenue} &nbsp;·&nbsp; ${lead.emp} 位員工 &nbsp;·&nbsp; <span class="stage-badge ${stageCls(lead.stage)}">${STAGE_LABELS[lead.stage] || lead.stage}</span>`;

  // 已評估提示 banner
  const banner = document.getElementById('qualified-banner');
  banner.style.display = shouldSuggestAnalysis(lead) ? 'flex' : 'none';

  // 概覽 tab
  document.getElementById('ld-details').innerHTML = [
    ['產業別', lead.industry],
    ['年營收', lead.revenue],
    ['員工人數', lead.emp],
    ['聯絡人', lead.contact],
    ['最後接觸', lead.lastContact || '—'],
    ['AI 分析', lead.analysis
      ? '<span style="color:var(--green)">已完成</span>'
      : '<span style="color:var(--muted)">尚未執行</span>'],
  ].map(([k, v]) => `<div class="detail-row"><span class="dk">${k}</span><span>${v}</span></div>`).join('');

  // 流程進度
  const idx = STAGES.indexOf(lead.stage);
  document.getElementById('ld-flow').innerHTML = STAGES.map((s, i) => `
    <div class="fs ${i === idx ? 'active-fs' : ''}">
      <div class="fs-n">0${i + 1}</div>
      <div class="fs-t">${STAGE_LABELS[s] || s}</div>
    </div>
    ${i < STAGES.length - 1 ? '<div class="fa">›</div>' : ''}`).join('');

  // AI 分析 tab
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

  // 互動記錄 tab
  document.getElementById('ld-notes').innerHTML = lead.notes.length
    ? lead.notes.map(n => `<div class="note-item">${n}</div>`).join('')
    : '<div style="color:var(--muted);font-size:.83rem;font-style:italic">尚無互動記錄。</div>';

  switchDetailTab('overview', document.querySelectorAll('.ldh-tab')[0]);
  renderSidebar();
}

function advStage() {
  if (!appState.currentLeadId) return;
  const lead = advanceLeadStage(appState.currentLeadId);
  if (lead) openLead(lead.id);
}

function addNote() {
  const n = prompt('新增互動備註：');
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
  const typeMap = { full_acquisition: '完全收購', partial: '部分股權', merger: '合併', partnership: '策略合作' };
  const type = typeMap[document.getElementById('h-type').value];

  if (!company && !text && !hubPdfB64) { alert('請輸入公司名稱或財務數據。'); return; }

  document.getElementById('h-btn').disabled = true;
  document.getElementById('h-results').style.display = 'none';

  // Step 2: Manus 資料補充
  setFlowStep(2);
  document.getElementById('h-loading').style.display = 'block';
  document.getElementById('h-loading').innerHTML = `<div class="loading-row"><div class="spinner"></div>透過 Manus 補充公開資料中…</div>
    <div id="manus-result" style="display:none;margin-top:.75rem"></div>`;

  const manusData = await runManusEnrichment(company);
  document.getElementById('manus-result').style.display = 'block';
  document.getElementById('manus-result').innerHTML = `
    <div class="enrich-box">
      <div class="enrich-title">Manus 公開資料補充</div>
      <div class="enrich-row"><span class="ek">官方網站</span><span>${manusData.website}</span></div>
      <div class="enrich-row"><span class="ek">新聞動態</span><span>${manusData.news}</span></div>
      <div class="enrich-row"><span class="ek">工商登記</span><span>${manusData.registry}</span></div>
      <div class="enrich-row"><span class="ek">同業比較</span><span>${manusData.industry}</span></div>
    </div>`;

  // Step 3: Claude 分析
  await new Promise(r => setTimeout(r, 600));
  setFlowStep(3);
  document.getElementById('h-loading').insertAdjacentHTML('beforeend',
    `<div class="loading-row" style="margin-top:.5rem"><div class="spinner"></div>Claude 分析中，正在處理財務資料並生成結構化報告…</div>`);

  const prompt = `M&A analysis.\nCompany: ${company || 'Unknown'}\nIndustry: ${industry || '—'}\nTransaction: ${type}\nFocus: ${focus || 'General'}\nPublic enrichment data: ${JSON.stringify(manusData)}\n${text ? 'Financial data:\n' + text : ''}
Return ONLY valid JSON: { "overview": "...", "risks": "...", "valuation": "...", "buyers": "...", "dd": "..." }
Use bullet points with • for lists. Respond in Traditional Chinese.`;

  let messages;
  if (hubPdfB64) {
    messages = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: hubPdfB64 } }, { type: 'text', text: prompt }] }];
  } else {
    messages = [{ role: 'user', content: prompt }];
  }

  try {
    const raw = await callClaude(messages, '你是資深併購顧問。只回傳純 JSON，不要加 ```json 或任何其他文字。格式：{"overview":"...","risks":"...","valuation":"...","buyers":"...","dd":"..."}', getApiKey());
    const j = safeParseAnalysis(raw);

    document.getElementById('hr-overview').textContent = j.overview || '—';
    document.getElementById('hr-risks').textContent = j.risks || '—';
    document.getElementById('hr-valuation').textContent = j.valuation || '—';
    document.getElementById('hr-buyers').textContent = j.buyers || '—';
    document.getElementById('hr-dd').textContent = j.dd || '—';
    document.getElementById('h-res-name').textContent = company || '公司';
    document.getElementById('h-results').style.display = 'block';

    appState.lastAnalysis = { company, industry, ...j };
    setFlowStep(4);
  } catch (e) {
    alert('分析失敗：' + e.message);
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
    a.overview ? '公司概況：\n' + a.overview : '',
    a.risks ? '\n主要風險：\n' + a.risks : '',
    a.valuation ? '\n估值參考：\n' + a.valuation : '',
    a.buyers ? '\n建議買方：\n' + a.buyers : '',
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
      a.overview ? '公司概況：\n' + a.overview : '',
      a.risks ? '\n主要風險：\n' + a.risks : '',
      a.valuation ? '\n估值參考：\n' + a.valuation : '',
      a.buyers ? '\n建議買方：\n' + a.buyers : '',
    ].filter(Boolean).join('\n');
  }
}

async function runMemo() {
  const company = document.getElementById('m-company').value.trim();
  const data = document.getElementById('m-data').value.trim();
  if (!data) { alert('請輸入公司資料。'); return; }

  const typeMap = {
    investment_memo: '投資備忘錄',
    seller_teaser: '賣方摘要',
    buyer_brief: '買方簡報',
    dd_report: '盡職調查報告'
  };
  const type = typeMap[document.getElementById('m-type').value];
  const audienceMap = {
    strategic_buyer: '策略買方',
    pe_fund: '私募基金 / 投資機構',
    management_team: '管理團隊',
    board: '董事會 / 企業主'
  };
  const audience = audienceMap[document.getElementById('m-audience').value];
  const lang = document.getElementById('m-lang').value === 'zh' ? 'Traditional Chinese（繁體中文）' : 'English';

  document.getElementById('m-btn').disabled = true;
  document.getElementById('m-loading').style.display = 'block';
  document.getElementById('m-output').style.display = 'none';

  const prompt = `請為${company || '此公司'}撰寫一份專業的${type}。\n目標對象：${audience}\n語言：${lang}\n資料：\n${data}\n\n請撰寫完整、結構清晰的文件，使用明確的段落標題，以專業的併購顧問語氣呈現，不要使用佔位符號文字。`;

  try {
    const text = await callClaudeMemo([{ role: 'user', content: prompt }], getApiKey());
    document.getElementById('m-text').textContent = text;
    document.getElementById('m-output-label').textContent = type + (company ? ' — ' + company : '');
    document.getElementById('m-output').style.display = 'block';
  } catch (e) {
    alert('生成失敗：' + e.message);
  } finally {
    document.getElementById('m-loading').style.display = 'none';
    document.getElementById('m-btn').disabled = false;
  }
}

function copyMemo() {
  navigator.clipboard.writeText(document.getElementById('m-text').textContent)
    .then(() => alert('已複製至剪貼簿。'));
}

// ═══ ADD LEAD MODAL ═════════════════════════════════════════════════
function openAddLeadModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }

function submitAddLead() {
  const name = document.getElementById('nl-name').value.trim();
  if (!name) { alert('請輸入公司名稱。'); return; }
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
