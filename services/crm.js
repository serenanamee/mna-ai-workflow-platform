/**
 * services/crm.js
 * Centralised state management for the CRM pipeline.
 */

const STAGES = ['Leads', 'Contacted', 'Qualified', 'In Analysis', 'Deal'];

const appState = {
  leads: [],
  currentLeadId: null,
  lastAnalysis: null,
  pipelineFilter: 'all',
  nextId: 100,
};

function initCRM() {
  appState.leads = JSON.parse(JSON.stringify(SAMPLE_LEADS));
  appState.nextId = appState.leads.length + 10;
}

function getLeads(filter) {
  if (!filter || filter === 'all') return appState.leads;
  return appState.leads.filter(l => l.stage === filter);
}

function getLeadById(id) {
  return appState.leads.find(l => l.id === id) || null;
}

function getCurrentLead() {
  return getLeadById(appState.currentLeadId);
}

function addLead(data) {
  const lead = {
    id: appState.nextId++,
    name: data.name,
    industry: data.industry || '—',
    stage: data.stage || 'Leads',
    contact: data.contact || '—',
    revenue: data.revenue || '—',
    emp: data.emp || '—',
    lastContact: new Date().toISOString().slice(0, 10),
    notes: data.notes ? [data.notes + ' — ' + new Date().toISOString().slice(0, 10)] : [],
    analysis: null,
  };
  appState.leads.unshift(lead);
  return lead;
}

function advanceLeadStage(id) {
  const lead = getLeadById(id);
  if (!lead) return null;
  const idx = STAGES.indexOf(lead.stage);
  if (idx < STAGES.length - 1) {
    lead.stage = STAGES[idx + 1];
    lead.notes.unshift(`Stage advanced to ${lead.stage} — ${new Date().toISOString().slice(0, 10)}`);
    lead.lastContact = new Date().toISOString().slice(0, 10);
  }
  return lead;
}

function addNoteToLead(id, note) {
  const lead = getLeadById(id);
  if (!lead || !note) return;
  lead.notes.unshift(note + ' — ' + new Date().toISOString().slice(0, 10));
  lead.lastContact = new Date().toISOString().slice(0, 10);
}

function saveAnalysisToLead(companyName, industry, analysis) {
  let lead = appState.leads.find(l => l.name === companyName);

  if (lead) {
    lead.analysis = analysis;
    if (['Leads', 'Contacted', 'Qualified'].includes(lead.stage)) {
      lead.stage = 'In Analysis';
    }
    lead.notes.unshift('AI analysis completed — ' + new Date().toISOString().slice(0, 10));
    lead.lastContact = new Date().toISOString().slice(0, 10);
  } else {
    lead = addLead({ name: companyName, industry, stage: 'In Analysis' });
    lead.analysis = analysis;
    lead.notes.unshift('Created from AI analysis — ' + new Date().toISOString().slice(0, 10));
  }

  appState.lastAnalysis = { company: companyName, industry, ...analysis };
  appState.currentLeadId = lead.id;
  return lead;
}

function getStageCounts() {
  const counts = { all: appState.leads.length };
  STAGES.forEach(s => { counts[s] = 0; });
  appState.leads.forEach(l => { if (counts[l.stage] !== undefined) counts[l.stage]++; });
  return counts;
}

function shouldSuggestAnalysis(lead) {
  return lead && lead.stage === 'Qualified' && !lead.analysis;
}
