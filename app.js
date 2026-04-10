/* ===========================
   FINANCEFLOW — APP.JS (CORRIGIDO)
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
let chartStatus = null;
let viewMode = localStorage.getItem('ff_view') || 'grafico';

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
function renderAll() { renderDashboard(); renderContas(); }

// ─── UTILS ────────────────────────────────────────────────
function getContasMes() {
  return contas.filter(c => c.mes === mesAtual && c.ano === anoAtual);
}
function fmtMoeda(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function saveTo() { localStorage.setItem('ff_contas', JSON.stringify(contas)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

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

// ─── TOGGLE VISUAL ────────────────────────────────────────
function toggleView() {
  viewMode = viewMode === 'grafico' ? 'lista' : 'grafico';
  localStorage.setItem('ff_view', viewMode);
  const btn = document.getElementById('toggle-view-btn');
  if (btn) btn.textContent = viewMode === 'grafico' ? '📋 Ver como Lista' : '🍩 Ver Gráfico';
  renderDashboard();
}

// ─── DASHBOARD ────────────────────────────────────────────
function renderDashboard() {
  const items   = getContasMes();
  const paid    = items.filter(c => c.status === 'pago');
  const pending = items.filter(c => c.status === 'pendente');
  const paidVal = paid.reduce((s, c) => s + c.valor, 0);
  const pendVal = pending.reduce((s, c) => s + c.valor, 0);

  // ✅ Total = Pago - A Pagar
  const total = paidVal - pendVal;

  setText('card-total',         fmtMoeda(total));
  setText('card-count',         items.length + ' conta' + (items.length !== 1 ? 's' : ''));
  setText('card-paid',          fmtMoeda(paidVal));
  setText('card-paid-count',    paid.length + ' paga' + (paid.length !== 1 ? 's' : ''));
  setText('card-pending',       fmtMoeda(pendVal));
  setText('card-pending-count', pending.length + ' a pagar');

  // Atualizar label do botão
  const btn = document.getElementById('toggle-view-btn');
  if (btn) btn.textContent = viewMode === 'grafico' ? '📋 Ver como Lista' : '🍩 Ver Gráfico';

  const canvas = document.getElementById('grafico-status');
  const lista  = document.getElementById('resumo-lista');
  const sumEl  = document.getElementById('status-summary');

  if (!items.length) {
    if (canvas) canvas.style.display = 'none';
    if (lista) lista.style.display = 'none';
    if (sumEl) sumEl.innerHTML = '<div class="empty-state-mini">Nenhuma conta neste período</div>';
    return;
  }

  const totalReal = paidVal + pendVal;

  if (viewMode === 'grafico') {
    if (canvas) canvas.style.display = 'block';
    if (lista) lista.style.display = 'none';
    if (sumEl) sumEl.style.display = 'none';

    if (chartStatus) chartStatus.destroy();

    chartStatus = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['✅ Pago', '🔴 A Pagar'],
        datasets: [{
          data: [paidVal, pendVal],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 0,
          borderRadius: 6
        }]
      },
      options: {
        cutout: '68%',
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#aaa',
              padding: 16,
              font: { size: 13 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ' ' + fmtMoeda(ctx.raw)
            }
          }
        }
      }
    });

  } else {
    if (canvas) canvas.style.display = 'none';
    if (sumEl) sumEl.style.display = 'none';
    if (lista) {
      lista.style.display = 'block';
      const paidPct = totalReal ? Math.round((paidVal / totalReal) * 100) : 0;
      const pendPct = totalReal ? Math.round((pendVal / totalReal) * 100) : 0;
      const saldo = paidVal - pendVal;
      const saldoColor = saldo >= 0 ? '#22c55e' : '#ef4444';
      const saldoIcon  = saldo >= 0 ? '✅' : '⚠️';

      lista.innerHTML = `
        <div class="resumo-lista-grid">
          <div class="resumo-item resumo-pago">
            <div class="resumo-icon">💰</div>
            <div class="resumo-info">
              <span class="resumo-label">Pago</span>
              <span class="resumo-valor">${fmtMoeda(paidVal)}</span>
              <div class="resumo-bar-track">
                <div class="resumo-bar-fill" style="width:${paidPct}%;background:#22c55e"></div>
              </div>
              <span class="resumo-pct">${paidPct}% do total</span>
            </div>
          </div>
          <div class="resumo-item resumo-pendente">
            <div class="resumo-icon">🔴</div>
            <div class="resumo-info">
              <span class="resumo-label">A Pagar</span>
              <span class="resumo-valor">${fmtMoeda(pendVal)}</span>
              <div class="resumo-bar-track">
                <div class="resumo-bar-fill" style="width:${pendPct}%;background:#ef4444"></div>
              </div>
              <span class="resumo-pct">${pendPct}% do total</span>
            </div>
          </div>
          <div class="resumo-item resumo-saldo" style="border-color:${saldoColor}33">
            <div class="resumo-icon">${saldoIcon}</div>
            <div class="resumo-info">
              <span class="resumo-label">Saldo (Pago − A Pagar)</span>
              <span class="resumo-valor" style="color:${saldoColor}">${fmtMoeda(saldo)}</span>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// ─── CONTAS ───────────────────────────────────────────────
function renderContas() {
  const listEl = document.getElementById('contas-list');
  if (!listEl) return;
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  const stFilt = document.getElementById('filter-status')?.value || '';

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
    '<button class="btn-icon" onclick="editConta(\'' + c.id + '\')" title="Editar">✏️</button>' +
    '<button class="btn-icon danger" onclick="deleteConta(\'' + c.id + '\')" title="Excluir">🗑️</button>' +
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
    '<div class="form-group"><label>Status</label><select id="mf-status"><option value="pendente"' + (c.status==='pendente'?' selected':'') + '>🔴 A Pagar</option><option value="pago"' + (c.status==='pago'?' selected':'') + '>✅ Pago</option></select></div>' +
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
  if (stBars) {
    const statusData = [
      { label: '✅ Pago',    val: paidVal, color: 'var(--green)' },
      { label: '🔴 A Pagar', val: pendVal, color: 'var(--red)' },
    ];
    stBars.innerHTML = statusData.map(s => {
      const pct = total ? Math.round((s.val / total) * 100) : 0;
      return '<div class="status-bar-item"><div class="status-bar-header"><span class="status-bar-label">' + s.label + '</span><span class="status-bar-val">' + fmtMoeda(s.val) + '</span></div><div class="status-bar-track"><div class="status-bar-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div></div>';
    }).join('');
  }

  const allEl = document.getElementById('rel-all-list');
  if (!allEl) return;
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
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  editingId = null;
}

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
