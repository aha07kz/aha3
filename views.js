/* ---------- Экраны, каталог, личный кабинет ---------- */
Object.assign(S, {view:'terminal', cf:'all', q:'', watch:new Set(['AAPL', 'TSLA', 'MSFT', 'NVDA', 'KO', 'CAT', 'AMZN', 'JPM'])});

function show(v) {
  S.view = v;
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('hidden', e.id !== 'v-' + v));
  document.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  renderAll(); if (v === 'terminal') updateChart();
  window.scrollTo(0, 0);
}

function renderCatalog() {
  const q = S.q.trim().toLowerCase();
  const list = stocks.filter(s => (S.cf === 'all' || s.type === S.cf) && (!q || s.t.toLowerCase().includes(q) || s.n.toLowerCase().includes(q)));
  $('cGrid').innerHTML = list.map(s => {
    const ch = (s.p / s.open - 1) * 100, up = ch >= 0;
    return `<div data-i="${s.t}" class="card row cursor-pointer p-4">
      <div class="flex justify-between gap-2"><div><div class="font-bold">${s.t}</div><div class="text-xs text-slate-400">${s.n}</div></div><span class="text-xs text-slate-400">${TYPES[s.type]}</span></div>
      <div class="flex items-end justify-between mt-2 num"><div class="font-semibold">${usd(s.p)}</div><div class="text-xs ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${fmt(Math.abs(ch))}%</div></div>${spark(s.hist, up)}</div>`;
  }).join('') || '<div class="col-span-full py-10 text-center text-slate-400">Ничего не найдено. Измените запрос или выберите другой тип.</div>';
  document.querySelectorAll('[data-i]').forEach(e => e.onclick = () => openModal(e.dataset.i));
}

function openModal(t) {
  const s = stocks.find(x => x.t === t), ch = (s.p / s.open - 1) * 100, up = ch >= 0;
  const m = (l, v) => `<div><div class="text-xs text-slate-400">${l}</div><div class="font-semibold num">${v}</div></div>`;
  $('mBody').innerHTML = `
    <div class="flex justify-between items-start gap-3"><div><div class="text-xl font-bold">${s.n}</div><div class="text-xs text-slate-400">${s.t} · ${TYPES[s.type]} · ${EX[s.type]}</div></div>
      <button id="mClose" aria-label="Закрыть" class="text-slate-400 text-2xl leading-none">×</button></div>
    <div class="flex items-end justify-between my-3"><div class="text-3xl font-extrabold num">${usd(s.p)}</div><div class="num text-sm ${up ? 'up' : 'down'}">${up ? '+' : ''}${fmt(ch)}% за день</div></div>
    ${spark(s.hist, up)}
    <p class="text-sm my-4">${s.desc}</p>
    <div class="grid grid-cols-3 gap-3 mb-5 text-sm">${m('Market Cap', capStr(s))}${m(s.type === 'bond' ? 'Доходность' : 'Dividend Yield', s.div != null ? fmt(s.div) + '%' : '—')}${m('P/E', s.pe ? fmt(s.pe, 1) : '—')}</div>
    <div class="grid grid-cols-2 gap-2">
      <button data-go="buy" class="py-3 rounded-lg font-bold bg-emerald-500 text-slate-900 hover:bg-emerald-400">Купить</button>
      <button data-go="sell" class="py-3 rounded-lg font-bold bg-red-500 text-white hover:bg-red-400">Продать</button></div>`;
  $('mClose').onclick = closeModal;
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => openTrade(t, b.dataset.go));
  $('modal').classList.remove('hidden');
}
const closeModal = () => $('modal').classList.add('hidden');

function openTrade(t, side) {
  S.sel = t; S.side = side; S.watch.add(t); closeModal();
  $('lim').value = cur().p.toFixed(2); show('terminal');
}

const pie = new Chart($('pie'), {
  type:'doughnut',
  data:{labels:[], datasets:[{data:[], borderWidth:2, borderColor:'#1e293b'}]},
  options:{cutout:'68%', maintainAspectRatio:false, plugins:{legend:{display:false}}}
});
const PIE = [['stock', 'Акции', '#10b981'], ['bond', 'Облигации', '#38bdf8'], ['etf', 'ETF', '#a78bfa'], ['fx', 'Валюта', '#f59e0b']];

function renderAccount(pv, pl) {
  const by = {stock:0, bond:0, etf:0, fx:0};
  Object.entries(S.pos).forEach(([t, p]) => { const s = stocks.find(x => x.t === t); by[s.type] += p.qty * s.p; });
  const vals = [...PIE.map(x => by[x[0]]), S.cash], names = [...PIE.map(x => x[1]), 'Кэш'], cols = [...PIE.map(x => x[2]), '#64748b'];
  const tot = vals.reduce((a, b) => a + b, 0);
  Object.assign(pie.data.datasets[0], {data:vals, backgroundColor:cols}); pie.data.labels = names; pie.update('none');
  $('alloc').innerHTML = names.map((n, i) => `<div class="flex justify-between items-center"><span class="flex items-center gap-2"><i class="inline-block w-2.5 h-2.5 rounded-full" style="background:${cols[i]}"></i>${n}</span><span class="num">${fmt(vals[i] / tot * 100)}%</span></div>`).join('');
  $('kEq').textContent = usd(S.cash + pv); $('kCash').textContent = usd(S.cash); $('kPV').textContent = usd(pv);
  $('kPL').textContent = (pl >= 0 ? '+' : '') + usd(pl); $('kPL').className = 'text-2xl font-extrabold num ' + (pl >= 0 ? 'up' : 'down');
}

document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => show(b.dataset.v));
document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
  S.cf = b.dataset.f; document.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); renderCatalog();
});
$('cSearch').oninput = e => { S.q = e.target.value; renderCatalog(); };
$('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };
document.onkeydown = e => { if (e.key === 'Escape') closeModal(); };
