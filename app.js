/* ===========================
   FINANCEFLOW — APP.JS
   =========================== */

// ─── THEME ────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('ff_theme', isLight ? 'light' : 'dark');
  document.getElementById('theme-label').textContent = isLight ? '☀️ Modo Claro' : '🌙 Modo Escuro';
}

// ─── STATE ────────────────────────────────────────────────
let contas = JSON.parse(localStorage.getItem('ff_contas') || '[]');
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let editingId = null;

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar tema salvo
  if (localStorage.getItem('ff_theme') === 'light') {
    document.body.classList.add('light');
    document.getElementById('theme-label').textContent = '☀️ Modo Claro';
  }
  initSelects();
  setMesSelecionado(mesAtual, anoAtual);
  renderAll();
});

function initSelects() {
  const anoSel = document.getElementById('ano-select');
  const baseYear = new Date().getFullYear();
  for (let y = baseYear - 2; y <= baseYear + 2; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === anoAtual) opt.selected = true;
    anoSel.appendChild(opt);
  }
  document.getElementById('mes-select').value = mesAtual;
}

function setMesSelecionado(m, a) {
  mesAtual = m; anoAtual = a;
  const label = MESES[m] + ' ' + a;
  const el = (id) => document.getElementById(id);
  if (el('dashboard-period-label')) el('dashboard-period-label').textContent = '— ' + label;
  if (el('contas-period-label'))    el('contas-period-label').textContent    = '— ' + label;
  if (el('relatorio-subtitle'))     el('relatorio-subtitle').textContent     = 'Resumo detalhado de ' + label;
  if (el('mobile-period-label'))    el('mobile-period-label').textContent    = label;
}

function onMesChange() {
  mesAtual = parseInt(document.getElementById('mes-select').value);
  anoAtual = parseInt(document.getElementById('ano-select').value);
  setMesSelecionado(mesAtual, anoAtual);
  renderAll();
}

// ─── NAVIGATION ───────────────────────────────────────────
function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) { btn.classList.add('active'); }
  else { const nb = document.querySelector('[data-section="' + name + '"]'); if (nb) nb.classList.add('active'); }
  closeSidebar();
  if (name === 'relatorio') renderRelatorio();
  if (name === 'contas')    renderContas();
  if (name === 'dashboard') renderDashboard();
}

// ─── SIDEBAR MOBILE ───────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
  document.getElementById('hamburger').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('hamburger').classList.remove('open');
}

// ─── RENDER ALL ───────────────────────────────────────────
function renderAll() { renderDashboard(); renderContas(); }

// ─── UTILS ────────────────────────────────────────────────
function getContasMes() {
  return contas.filter(c => c.mes === mesAtual && c.ano === anoAtual);
}
function fmtMoeda(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function saveTo() { localStorage.setItem('ff_contas', JSON.stringify(contas)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ─── FORM ─────────────────────────────────────────────────
function formatValor(el) {
  let v = el.value.replace(/\D/g, '');
  if (!v) { el.value = ''; return; }
  v = (parseInt(v) / 100).toFixed(2);
  el.value = parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
function parseValor(str) { return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0; }
function limparForm() { document.getElementById('form-conta').reset(); editingId = null; }

function submitConta(e) {
  e.preventDefault();
  const descricao = document.getElementById('f-descricao').value.trim();
  const valorStr  = document.getElementById('f-valor').value;
  const status    = document.getElementById('f-status').value;
  const obs       = document.getElementById('f-obs').value.trim();

  if (!descricao || !valorStr) { showToast('Preencha todos os campos obrigatórios.', 'error'); return; }
  const valor = parseValor(valorStr);
  if (!valor || valor <= 0) { showToast('Informe um valor válido.', 'error'); return; }

  if (editingId) {
    const idx = contas.findIndex(c => c.id === editingId);
    if (idx > -1) contas[idx] = { ...contas[idx], descricao, valor, status, obs };
    editingId = null;
    showToast('Conta atualizada!', 'success');
  } else {
    contas.push({ id: genId(), descricao, valor, status, obs, mes: mesAtual, ano: anoAtual, criadoEm: new Date().toISOString() });
    showToast('Conta adicionada com sucesso!', 'success');
  }
  saveTo(); limparForm(); renderAll(); showSection('contas', null);
}

// ─── DASHBOARD ────────────────────────────────────────────
function renderDashboard() {
  const items   = getContasMes();
  const total   = items.reduce((s, c) => s + c.valor, 0);
  const paid    = items.filter(c => c.status === 'pago');
  const pending = items.filter(c => c.status === 'pendente');
  const paidVal = paid.reduce((s, c) => s + c.valor, 0);
  const pendVal = pending.reduce((s, c) => s + c.valor, 0);

  setText('card-total',         fmtMoeda(total));
  setText('card-count',         items.length + ' conta' + (items.length !== 1 ? 's' : ''));
  setText('card-paid',          fmtMoeda(paidVal));
  setText('card-paid-count',    paid.length + ' paga' + (paid.length !== 1 ? 's' : ''));
  setText('card-pending',       fmtMoeda(pendVal));
  setText('card-pending-count', pending.length + ' a pagar');

  const el = document.getElementById('status-summary');
  if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty-state-mini">Nenhuma conta neste período</div>'; return; }

  const paidPct = total ? Math.round((paidVal / total) * 100) : 0;
  const pendPct = total ? Math.round((pendVal / total) * 100) : 0;
  el.innerHTML =
    '<div class="summary-bar-wrap"><div class="summary-bar-labels"><span>✅ Pago — ' + fmtMoeda(paidVal) + '</span><span>' + paidPct + '%</span></div><div class="summary-track"><div class="summary-fill" style="width:' + paidPct + '%;background:var(--green)"></div></div></div>' +
    '<div class="summary-bar-wrap"><div class="summary-bar-labels"><span>🔴 A Pagar — ' + fmtMoeda(pendVal) + '</span><span>' + pendPct + '%</span></div><div class="summary-track"><div class="summary-fill" style="width:' + pendPct + '%;background:var(--red)"></div></div></div>';
}

// ─── CONTAS ───────────────────────────────────────────────
function renderContas() {
  const listEl = document.getElementById('contas-list');
  const search = (document.getElementById('search-input') ? document.getElementById('search-input').value : '').toLowerCase();
  const stFilt = document.getElementById('filter-status') ? document.getElementById('filter-status').value : '';

  let items = getContasMes();
  if (search) items = items.filter(c => c.descricao.toLowerCase().includes(search));
  if (stFilt) items = items.filter(c => c.status === stFilt);

  if (!items.length) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>' +
      (getContasMes().length ? 'Nenhuma conta com esse filtro.' : 'Nenhuma conta neste período.') +
      '</p><button class="btn-primary" onclick="showSection(\'nova-conta\', null)">Adicionar Conta</button></div>';
    return;
  }

  listEl.innerHTML = items.map(c =>
    '<div class="conta-item">' +
    '<div class="conta-info"><div class="conta-desc">' + escHtml(c.descricao) + '</div>' +
    (c.obs ? '<div class="conta-obs">' + escHtml(c.obs) + '</div>' : '') +
    '</div>' +
    '<div class="conta-valor">' + fmtMoeda(c.valor) + '</div>' +
    '<div class="status-badge ' + c.status + '">' + statusLabel(c.status) + '</div>' +
    '<div class="conta-actions">' +
    '<button class="btn-icon" onclick="editConta(\'' + c.id + '\')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
    '<button class="btn-icon danger" onclick="deleteConta(\'' + c.id + '\')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>' +
    '</div></div>'
  ).join('');
}

function statusLabel(s) { return s === 'pago' ? '✅ Pago' : '🔴 A Pagar'; }

function deleteConta(id) {
  if (!confirm('Excluir esta conta?')) return;
  contas = contas.filter(c => c.id !== id);
  saveTo(); renderAll();
  showToast('Conta excluída.', 'success');
}

function editConta(id) {
  const c = contas.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  openModal('Editar Conta',
    '<form id="modal-form" onsubmit="submitModal(event)">' +
    '<div class="form-grid">' +
    '<div class="form-group full"><label>Descrição</label><input type="text" id="mf-desc" value="' + escHtml(c.descricao) + '" required /></div>' +
    '<div class="form-group"><label>Valor</label><input type="text" id="mf-valor" value="' + c.valor.toLocaleString('pt-BR', {minimumFractionDigits:2}) + '" oninput="formatValor(this)" required /></div>' +
    '<div class="form-group"><label>Status</label><select id="mf-status"><option value="pendente"' + (c.status==='pendente'?' selected':'') + '>⏳ Pendente</option><option value="pago"' + (c.status==='pago'?' selected':'') + '>✅ Pago</option></select></div>' +
    '<div class="form-group full"><label>Observações</label><textarea id="mf-obs" rows="2">' + escHtml(c.obs||'') + '</textarea></div>' +
    '</div><div class="form-actions"><button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-primary">Salvar</button></div></form>'
  );
}

function submitModal(e) {
  e.preventDefault();
  const c = contas.find(x => x.id === editingId);
  if (!c) return;
  c.descricao = document.getElementById('mf-desc').value.trim();
  c.valor     = parseValor(document.getElementById('mf-valor').value);
  c.status    = document.getElementById('mf-status').value;
  c.obs       = document.getElementById('mf-obs').value.trim();
  saveTo(); renderAll(); closeModal();
  showToast('Conta atualizada!', 'success');
  editingId = null;
}

// ─── RELATÓRIO ────────────────────────────────────────────
function renderRelatorio() {
  const items   = getContasMes();
  const total   = items.reduce((s, c) => s + c.valor, 0);
  const paidVal = items.filter(c => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const pendVal = items.filter(c => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);

  setText('rel-total', fmtMoeda(total));
  setText('rel-qtd', items.length);
  const maior = items.reduce((m, c) => c.valor > (m ? m.valor : 0) ? c : m, null);
  setText('rel-maior', maior ? fmtMoeda(maior.valor) : '—');
  setText('rel-media', items.length ? fmtMoeda(total / items.length) : 'R$ 0,00');

  const stBars = document.getElementById('status-bars');
  const statusData = [
    { label: '✅ Pago',    val: paidVal, color: 'var(--green)' },
    { label: '🔴 A Pagar', val: pendVal, color: 'var(--red)' },
  ];
  stBars.innerHTML = statusData.map(s => {
    const pct = total ? Math.round((s.val / total) * 100) : 0;
    return '<div class="status-bar-item"><div class="status-bar-header"><span class="status-bar-label">' + s.label + '</span><span class="status-bar-val">' + fmtMoeda(s.val) + '</span></div><div class="status-bar-track"><div class="status-bar-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div></div>';
  }).join('');

  const allEl = document.getElementById('rel-all-list');
  if (!items.length) { allEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3)">Nenhuma conta neste período</div>'; return; }
  allEl.innerHTML = '<div class="contas-list" style="margin-top:0">' +
    items.map(c =>
      '<div class="conta-item"><div class="conta-info"><div class="conta-desc">' + escHtml(c.descricao) + '</div>' +
      (c.obs ? '<div class="conta-obs">' + escHtml(c.obs) + '</div>' : '') +
      '</div><div class="conta-valor">' + fmtMoeda(c.valor) + '</div><div class="status-badge ' + c.status + '">' + statusLabel(c.status) + '</div></div>'
    ).join('') + '</div>';
}

// ─── MODAL ────────────────────────────────────────────────
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); editingId = null; }

// ─── TOAST ────────────────────────────────────────────────
let toastTimeout;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type||'') + ' show';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── HELPERS ──────────────────────────────────────────────
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
