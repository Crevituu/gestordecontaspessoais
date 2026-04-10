/* ===========================
   FINANCEFLOW — APP.JS
   =========================== */

// ─── STATE ────────────────────────────────────────────────
let contas = JSON.parse(localStorage.getItem('ff_contas') || '[]');
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

// 🎯 CONTROLE DE VISUAL
let chartStatus = null;
let viewMode = localStorage.getItem('ff_view') || 'grafico';

// ─── INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});

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

// ─── TOGGLE VISUAL ────────────────────────────────────────
function toggleView() {
  viewMode = viewMode === 'grafico' ? 'lista' : 'grafico';
  localStorage.setItem('ff_view', viewMode);
  renderDashboard();
}

// ─── DASHBOARD ────────────────────────────────────────────
function renderDashboard() {
  const items = getContasMes();

  const ganhos = items.filter(c => c.status === 'pago');
  const gastos = items.filter(c => c.status === 'pendente');

  const ganhosVal = ganhos.reduce((s, c) => s + c.valor, 0);
  const gastosVal = gastos.reduce((s, c) => s + c.valor, 0);

  const canvas = document.getElementById('grafico-status');
  const lista  = document.getElementById('resumo-lista');

  // 🔄 alterna visual
  if (viewMode === 'grafico') {
    canvas.style.display = 'block';
    lista.style.display = 'none';

    if (chartStatus) chartStatus.destroy();

    chartStatus = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Ganhos', 'Gastos'],
        datasets: [{
          data: [ganhosVal, gastosVal],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: {
            labels: { color: '#aaa' }
          }
        }
      }
    });

  } else {
    canvas.style.display = 'none';
    lista.style.display = 'block';

    lista.innerHTML = `
      <div style="display:grid;gap:12px;margin-top:10px;">
        
        <div style="padding:15px;border-radius:10px;background:#1f2937;">
          <strong>💰 Ganhos</strong><br>
          ${fmtMoeda(ganhosVal)}
        </div>

        <div style="padding:15px;border-radius:10px;background:#1f2937;">
          <strong>💸 Gastos</strong><br>
          ${fmtMoeda(gastosVal)}
        </div>

        <div style="padding:15px;border-radius:10px;background:#111827;">
          <strong>📊 Saldo</strong><br>
          ${fmtMoeda(ganhosVal - gastosVal)}
        </div>

      </div>
    `;
  }
}

// ─── RENDER ALL ───────────────────────────────────────────
function renderAll() {
  renderDashboard();
}

// ─── FORM SIMPLES ─────────────────────────────────────────
function addConta(descricao, valor, status) {
  contas.push({
    id: Date.now(),
    descricao,
    valor,
    status,
    mes: mesAtual,
    ano: anoAtual
  });
  saveTo();
  renderAll();
}
