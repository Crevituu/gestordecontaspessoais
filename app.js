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
  if (btn) btn.classList.add('active');
  else {
    const nb = document.querySelector('[data-section="' + name + '"]');
    if (nb) nb.classList.add('active');
  }
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
function renderAll() {
  renderDashboard();
  renderContas();
}

// ─── UTILS ────────────────────────────────────────────────
function getContasMes() {
  return contas.filter(c => c.mes === mesAtual && c.ano === anoAtual);
}
function fmtMoeda(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function saveTo() {
  localStorage.setItem('ff_contas', JSON.stringify(contas));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── FORM ─────────────────────────────────────────────────
function formatValor(el) {
  let v = el.value.replace(/\D/g, '');
  if (!v) { el.value = ''; return; }
  v = (parseInt(v) / 100).toFixed(2);
  el.value = parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
function parseValor(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}
function limparForm() {
  document.getElementById('form-conta').reset();
  editingId = null;
}

function submitConta(e) {
  e.preventDefault();
  const descricao = document.getElementById('f-descricao').value.trim();
  const valorStr  = document.getElementById('f-valor').value;
  const status    = document.getElementById('f-status').value;
  const obs       = document.getElementById('f-obs').value.trim();

  if (!descricao || !valorStr) return showToast('Preencha todos os campos.', 'error');

  const valor = parseValor(valorStr);
  if (!valor || valor <= 0) return showToast('Valor inválido.', 'error');

  if (editingId) {
    const idx = contas.findIndex(c => c.id === editingId);
    if (idx > -1) contas[idx] = { ...contas[idx], descricao, valor, status, obs };
    editingId = null;
  } else {
    contas.push({
      id: genId(),
      descricao,
      valor,
      status,
      obs,
      mes: mesAtual,
      ano: anoAtual,
      criadoEm: new Date().toISOString()
    });
  }

  saveTo();
  limparForm();
  renderAll();
  showSection('contas');
  showToast('Salvo com sucesso!', 'success');
}

// ─── DASHBOARD (CORRIGIDO) ────────────────────────────────
function renderDashboard() {
  const items = getContasMes();

  const paid = items.filter(c => c.status === 'pago');
  const pending = items.filter(c => c.status === 'pendente');

  const paidVal = paid.reduce((s, c) => s + c.valor, 0);
  const pendVal = pending.reduce((s, c) => s + c.valor, 0);

  // ✅ NOVO TOTAL
  const total = paidVal - pendVal;

  setText('card-total', fmtMoeda(total));
  setText('card-count', items.length + ' conta' + (items.length !== 1 ? 's' : ''));
  setText('card-paid', fmtMoeda(paidVal));
  setText('card-pending', fmtMoeda(pendVal));

  const el = document.getElementById('status-summary');
  if (!items.length) {
    el.innerHTML = '<div class="empty-state-mini">Nenhuma conta</div>';
    return;
  }

  const totalReal = paidVal + pendVal;
  const paidPct = totalReal ? Math.round((paidVal / totalReal) * 100) : 0;
  const pendPct = totalReal ? Math.round((pendVal / totalReal) * 100) : 0;

  el.innerHTML =
    `<div>Pago ${paidPct}%</div>
     <div>Pendente ${pendPct}%</div>`;
}

// ─── CONTAS ───────────────────────────────────────────────
function renderContas() {
  const listEl = document.getElementById('contas-list');
  const items = getContasMes();

  if (!items.length) {
    listEl.innerHTML = '<p>Nenhuma conta.</p>';
    return;
  }

  listEl.innerHTML = items.map(c =>
    `<div>${c.descricao} - ${fmtMoeda(c.valor)}</div>`
  ).join('');
}

// ─── TOAST ────────────────────────────────────────────────
let toastTimeout;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── HELPERS ──────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
