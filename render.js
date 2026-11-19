/* ---------- Рендер ---------- */
function spark(h, up) {
  const mn = Math.min(...h), mx = Math.max(...h), r = mx - mn || 1;
  const pts = h.map((v, i) => (i / (h.length - 1) * 100).toFixed(1) + ',' + (24 - (v - mn) / r * 22).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 100 26" class="w-full h-7" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${up ? '#10b981' : '#ef4444'}" stroke-width="1.5"/></svg>`;
}

function renderWatch() {
  $('watch').innerHTML = stocks.filter(s => S.watch.has(s.t)).map(s => {
    const ch = (s.p / s.open - 1) * 100, up = ch >= 0, fl = s.p > s.last ? 'fu' : s.p < s.last ? 'fd' : '';
    return `<div data-t="${s.t}" class="card row cursor-pointer p-3 shrink-0 w-44 lg:w-auto ${s.t === S.sel ? 'ring-1 ring-emerald-500' : ''}">
      <div class="flex justify-between items-center"><div><div class="font-bold">${s.t}</div><div class="text-xs text-slate-400">${s.n}</div></div>
      <div class="text-right num rounded px-1 ${fl}"><div class="font-semibold">${usd(s.p)}</div><div class="text-xs ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${fmt(Math.abs(ch))}%</div></div></div>
      ${spark(s.hist, up)}</div>`;
  }).join('');
  document.querySelectorAll('#watch [data-t]').forEach(e => e.onclick = () => { S.sel = e.dataset.t; $('lim').value = cur().p.toFixed(2); renderAll(); updateChart(); });
}

function updateChart() {
  const s = cur(), up = s.p >= s.open, c = up ? '#10b981' : '#ef4444';
  const ds = chart.data.datasets[0];
  ds.data = [...s.hist]; ds.borderColor = c; ds.backgroundColor = up ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)';
  chart.update();
}

function renderSel() {
  const s = cur(), d = s.p - s.open, up = d >= 0;
  $('selName').textContent = s.n; $('selTicker').textContent = EX[s.type] + ' · ' + s.t;
  $('selPrice').textContent = usd(s.p);
  $('sCap').textContent = capStr(s); $('sVol').textContent = cf.format(s.vol);
  $('sHi').textContent = usd(s.hi); $('sLo').textContent = usd(s.lo);
  $('selChg').className = 'num text-sm ' + (up ? 'up' : 'down');
  $('selChg').textContent = (up ? '+' : '') + fmt(d) + ' (' + (up ? '+' : '') + fmt(d / s.open * 100) + '%)';
}

function renderBook() {
  const s = cur(), sp = s.p * 0.0004, fl = s.p > s.last ? 'fu' : s.p < s.last ? 'fd' : '';
  const row = (px, cls) => `<div class="flex justify-between px-1 row"><span class="${cls}">${fmt(px)}</span><span>${Math.floor(rnd(20, 900))}</span></div>`;
  $('asks').innerHTML = Array.from({length:7}, (_, i) => row(s.p + sp * (7 - i), 'down')).join('');
  $('bids').innerHTML = Array.from({length:7}, (_, i) => row(s.p - sp * (i + 1), 'up')).join('');
  $('spread').innerHTML = `<span class="px-2 rounded ${fl}">${usd(s.p)}</span> · спред ${fmt(sp * 2)}`;
}

function pushTape() {
  const s = cur(), buy = Math.random() > .5;
  S.tape.unshift({time:new Date().toLocaleTimeString('ru-RU'), p:s.p + rnd(-1, 1) * s.p * .0003, q:Math.floor(rnd(1, 250)), buy});
  S.tape = S.tape.slice(0, 14);
  $('tape').innerHTML = S.tape.map(x => `<div class="flex justify-between row px-1"><span class="text-slate-400">${x.time}</span><span class="${x.buy ? 'up' : 'down'}">${fmt(x.p)}</span><span>${x.q}</span></div>`).join('');
}

function renderPortfolio() {
  let pv = 0, cost = 0;
  const rows = Object.entries(S.pos).map(([t, p]) => {
    const s = stocks.find(x => x.t === t), val = p.qty * s.p, pl = val - p.qty * p.avg, pc = pl / (p.qty * p.avg) * 100;
    pv += val; cost += p.qty * p.avg; const c = pl >= 0 ? 'up' : 'down';
    return `<tr class="border-t border-slate-700 row"><td class="text-left py-2 font-bold">${t}</td><td>${p.qty}</td><td>${usd(p.avg)}</td><td>${usd(val)}</td>
      <td class="${c}">${pl >= 0 ? '+' : ''}${fmt(pl)}</td><td class="${c}">${pl >= 0 ? '+' : ''}${fmt(pc)}%</td>
      <td><button data-sell="${t}" class="px-3 py-1 text-xs rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30">${pl >= 0 ? 'Зафиксировать прибыль' : 'Закрыть позицию'}</button></td></tr>`;
  });
  $('port').innerHTML = rows.join('') || '<tr><td colspan="7" class="py-6 text-center text-slate-400">Портфель пуст. Выберите акцию и разместите первый ордер.</td></tr>';
  document.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const t = b.dataset.sell; execute('sell', stocks.find(x => x.t === t), S.pos[t].qty, stocks.find(x => x.t === t).p); renderAll(); });
  const pl = pv - cost; renderAccount(pv, pl);
  $('cash').textContent = usd(S.cash); $('pv').textContent = usd(pv);
  $('pl').textContent = (pl >= 0 ? '+' : '') + usd(pl); $('pl').className = 'num font-semibold ' + (pl >= 0 ? 'up' : 'down');
}

function renderLists() {
  $('hist').innerHTML = S.hist.map(x => {
    const b = x.side === 'buy', sum = x.qty * x.price + (b ? x.fee : -x.fee);
    return `<tr class="border-t border-slate-700 row"><td class="text-left py-2 text-slate-400">${x.time}</td><td class="text-left ${b ? 'up' : 'down'}">${b ? 'Покупка' : 'Продажа'}</td><td class="text-left font-bold">${x.t}</td><td>${x.qty}</td><td>${usd(x.price)}</td><td>${usd(x.fee)}</td><td>${usd(sum)}</td></tr>`;
  }).join('') || '<tr><td colspan="7" class="py-6 text-center text-slate-400">Операций пока нет. Совершите первую сделку в терминале.</td></tr>';
  $('pending').innerHTML = S.pending.map(o => `<div class="flex justify-between items-center"><span>${o.side === 'buy' ? 'Покупка' : 'Продажа'} ${o.qty} ${o.t} @ ${usd(o.price)}</span><button data-c="${o.id}" class="text-red-400 text-xs hover:underline">Отменить</button></div>`).join('') || '<div class="text-slate-400">Нет активных ордеров</div>';
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { S.pending = S.pending.filter(o => o.id != b.dataset.c); toast('Ордер отменён'); renderLists(); });
}

function renderForm() {
  const buy = S.side === 'buy', s = cur(), qty = parseInt($('qty').value) || 0;
  const on = 'bg-emerald-500 text-slate-900', offc = 'text-slate-300';
  $('bBuy').className = 'py-2 rounded-md transition ' + (buy ? on : offc);
  $('bSell').className = 'py-2 rounded-md transition ' + (!buy ? 'bg-red-500 text-white' : offc);
  $('tMkt').className = 'py-1.5 rounded-md border transition ' + (S.type === 'market' ? 'border-emerald-500 text-emerald-400' : 'border-slate-600');
  $('tLim').className = 'py-1.5 rounded-md border transition ' + (S.type === 'limit' ? 'border-emerald-500 text-emerald-400' : 'border-slate-600');
  $('limWrap').classList.toggle('hidden', S.type === 'market');
  const px = S.type === 'market' ? s.p : (parseFloat($('lim').value) || s.p);
  const sub = qty * px, fee = sub * FEE;
  $('sub').textContent = usd(sub); $('fee').textContent = usd(fee);
  $('totLbl').textContent = buy ? 'К списанию' : 'К зачислению';
  $('total').textContent = usd(buy ? sub + fee : sub - fee);
  $('submit').textContent = (buy ? 'Купить ' : 'Продать ') + s.t;
  $('submit').className = 'w-full py-3 rounded-lg font-bold transition active:scale-95 ' + (buy ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400' : 'bg-red-500 text-white hover:bg-red-400');
}

function renderHeader() {
  $('mcap').textContent = '$' + fmt(stocks.filter(s => s.sh).reduce((a, s) => a + s.p * s.sh, 0) / 1000, 2) + ' трлн';
  const item = i => { const ch = (i.p / i.open - 1) * 100, up = ch >= 0; return `<span class="num"><b>${i.n}</b> ${fmt(i.p)} <span class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${fmt(Math.abs(ch))}%</span></span>`; };
  const h = indices.map(item).join(''); $('indices').innerHTML = h + h; // дублируем для бесшовной прокрутки
}

function renderAll() { renderWatch(); renderSel(); renderBook(); renderPortfolio(); renderLists(); renderForm(); renderHeader(); if (S.view === 'catalog') renderCatalog(); }
