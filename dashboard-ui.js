"use strict";

let demoMode = false;
let dashboardTimer = null;
let latestDashboard = {jobs: [], snapshots: []};
const byId = id => document.getElementById(id);

function output(id, value) {
  byId(id).hidden = false;
  byId(id).textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

async function dashboardRequest(payload) {
  if (WEB_PREVIEW) { localOnlyMessage(); return null; }
  const response = await fetch('./api/action', {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-WiFiAudit-Token': token},
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Operazione non riuscita');
  }
  if (response.headers.get('content-type')?.includes('application/pdf')) return response.blob();
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Operazione non riuscita');
  return data;
}

function addText(parent, tag, text, className = '') {
  const node = document.createElement(tag); node.textContent = text; node.className = className; parent.append(node); return node;
}

function renderDashboard(data) {
  latestDashboard = data;
  const list = byId('jobList'); list.replaceChildren();
  if (!data.jobs.length) addText(list, 'p', WEB_PREVIEW ? 'Modalità web: prova gli snapshot dimostrativi qui sotto.' : 'Nessuna attività registrata. Avvia un controllo oppure attiva Simula.');
  data.jobs.forEach(job => {
    const row = document.createElement('article'); row.className = 'job-row';
    const elapsed = Math.max(0, Math.floor(((job.status === 'IN_CORSO' ? Date.now() / 1000 : job.updated) - job.created)));
    addText(row, 'strong', job.title);
    addText(row, 'span', job.status, 'job-state ' + (job.status === 'FALLITA' ? 'failed' : ''));
    addText(row, 'span', `${elapsed}s · ${new Date(job.created * 1000).toLocaleString('it-IT')} · uscita ${job.code ?? '—'}`);
    list.append(row);
  });
  for (const id of ['snapshotBefore', 'snapshotAfter']) {
    const select = byId(id), previous = select.value;
    select.replaceChildren();
    data.snapshots.forEach(item => {
      const option = document.createElement('option'); option.value = item.id;
      option.textContent = `${item.label} · ${item.networks} AP · ${item.source}`; select.append(option);
    });
    if (data.snapshots.some(x => x.id === previous)) select.value = previous;
  }
  if (data.snapshots.length > 1 && byId('snapshotBefore').value === byId('snapshotAfter').value) byId('snapshotBefore').selectedIndex = 1;
}

async function loadDashboard() {
  clearTimeout(dashboardTimer);
  if (demoMode) return;
  if (WEB_PREVIEW) { renderDashboard({jobs: [], snapshots: []}); return; }
  try {
    const response = await fetch('./api/dashboard', {headers: {'X-WiFiAudit-Token': token}, cache: 'no-store'});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Dashboard non disponibile');
    renderDashboard(data);
    if (data.jobs.some(job => ['IN_CORSO', 'IN_ATTESA'].includes(job.status))) dashboardTimer = setTimeout(loadDashboard, 2500);
  } catch (err) { message(err.message, true); }
}

function bind(id, callback) {
  byId(id).addEventListener('click', async event => {
    const button = event.currentTarget; button.disabled = true;
    try { await callback(); } catch (err) { message(err.message || 'Operazione non riuscita', true); }
    finally { button.disabled = false; }
  });
}

bind('dashboardRefresh', async () => { demoMode = false; await loadDashboard(); });
bind('importScan', async () => {
  const data = await dashboardRequest({action: 'import_scan', path: byId('scanPath').value});
  if (data) { demoMode = false; await loadDashboard(); message(`Importate ${data.networks} reti.`); }
});
bind('loadSessions', async () => {
  const data = await dashboardRequest({action: 'sessions', path: byId('resultsRoot').value});
  if (!data) return;
  const list = byId('sessionList'); list.replaceChildren();
  if (!data.sessions.length) addText(list, 'p', 'Nessuna sessione in questa cartella.');
  data.sessions.forEach(session => {
    const row = document.createElement('article'); row.className = 'job-row';
    addText(row, 'strong', session.name); addText(row, 'span', `${session.status} · ${session.files} file`);
    const button = addText(row, 'button', 'Seleziona', 'button secondary');
    button.addEventListener('click', () => { byId('sessionPath').value = session.path; byId('scanPath').value = session.scans[0] || ''; message('Percorsi copiati nei campi Sessione e CSV.'); });
    list.append(row);
  });
});

const demoSnapshots = [
  {id: 'demo-after', label: 'DEMO — seconda osservazione', networks: 2, source: 'SINTETICO', data: [
    {bssid: '02:00:00:00:00:01', essid: 'Laboratorio', channel: '6', security: 'WPA2', cipher: 'CCMP', auth: 'PSK', signal: '-45'},
    {bssid: '02:00:00:00:00:03', essid: 'Ospiti', channel: '11', security: 'OPN', cipher: '', auth: '', signal: '-70'}]},
  {id: 'demo-before', label: 'DEMO — prima osservazione', networks: 2, source: 'SINTETICO', data: [
    {bssid: '02:00:00:00:00:01', essid: 'Laboratorio', channel: '1', security: 'WPA2', cipher: 'CCMP', auth: 'PSK', signal: '-55'},
    {bssid: '02:00:00:00:00:02', essid: 'Vecchio AP', channel: '6', security: 'WEP', cipher: '', auth: '', signal: '-80'}]}
];

bind('demoScans', async () => {
  clearTimeout(dashboardTimer); demoMode = true; renderDashboard({jobs: [], snapshots: demoSnapshots});
  message('DEMO: dati sintetici in memoria. Premi Aggiorna attività per tornare ai dati locali.');
});
bind('compareScans', async () => {
  const before = byId('snapshotBefore').value, after = byId('snapshotAfter').value;
  if (!before || !after || before === after) throw new Error('Seleziona due osservazioni diverse.');
  if (demoMode) {
    const a = demoSnapshots.find(x => x.id === before).data, b = demoSnapshots.find(x => x.id === after).data;
    const old = new Map(a.map(x => [x.bssid, x])), newer = new Map(b.map(x => [x.bssid, x]));
    output('diffOutput', {demo: true, added: b.filter(x => !old.has(x.bssid)), not_observed: a.filter(x => !newer.has(x.bssid)), changed: b.filter(x => old.has(x.bssid) && JSON.stringify(old.get(x.bssid)) !== JSON.stringify(x)).map(x => ({before: old.get(x.bssid), after: x})), note: 'Non osservato non significa rimosso.'});
    return;
  }
  const data = await dashboardRequest({action: 'diff', before, after}); if (data) output('diffOutput', data.diff);
});
bind('pdfReport', async () => {
  if (demoMode) { window.open('./Rapporto_esempio_DEMO.pdf', '_blank', 'noopener'); message('Apertura del PDF con dati sintetici.'); return; }
  const id = byId('snapshotAfter').value;
  if (!id) throw new Error('Importa o seleziona una scansione.');
  const blob = await dashboardRequest({action: 'pdf_report', id});
  if (blob) {
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `WiFiAudit_${id}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); message('Rapporto PDF generato.');
  }
});
bind('importKismet', async () => {
  const key = byId('kismetKey').value; byId('kismetKey').value = '';
  const data = await dashboardRequest({action: 'kismet_import', key, port: byId('kismetPort').value});
  if (data) { demoMode = false; await loadDashboard(); message(`Inventario Kismet: ${data.networks} AP importati.`); }
});
bind('hardwareCheck', async () => { const data = await dashboardRequest({action: 'hardware'}); if (data) output('hardwareOutput', data); });
window.addEventListener('wifiaudit-job', () => { demoMode = false; loadDashboard(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !demoMode) loadDashboard(); });
loadDashboard();
