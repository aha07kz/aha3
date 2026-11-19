/* ---------- Исполнение ордеров ---------- */
function execute(side, s, qty, price) {
  const cost = qty * price, fee = cost * FEE;
  if (side === 'buy') {
    if (cost + fee > S.cash + 1e-9) return toast('Недостаточно средств: нужно ' + usd(cost + fee) + ' с учётом комиссии', false), false;
    const p = S.pos[s.t] || {qty:0, avg:0};
    p.avg = (p.avg * p.qty + cost) / (p.qty + qty); p.qty += qty; S.pos[s.t] = p; S.cash -= cost + fee;
  } else {
    const p = S.pos[s.t];
    if (!p || p.qty < qty) return toast('Недостаточно акций ' + s.t + ' для продажи', false), false;
    p.qty -= qty; S.cash += cost - fee; if (!p.qty) delete S.pos[s.t];
  }
  S.hist.unshift({time:new Date().toLocaleTimeString('ru-RU'), side, t:s.t, qty, price, fee});
  toast((side === 'buy' ? 'Куплено ' : 'Продано ') + qty + ' × ' + s.t + ' по ' + usd(price) + ' · комиссия ' + usd(fee));
  return true;
}

function submitOrder() {
  const s = cur(), qty = parseInt($('qty').value);
  if (!qty || qty < 1) return toast('Введите количество — целое число от 1', false);
  if (S.type === 'market') execute(S.side, s, qty, s.p);
  else {
    const lp = parseFloat($('lim').value);
    if (!lp || lp <= 0) return toast('Введите лимитную цену', false);
    if (S.side === 'buy' && qty * lp * (1 + FEE) > S.cash) return toast('Недостаточно средств для лимитного ордера', false);
    if (S.side === 'sell' && (S.pos[s.t]?.qty || 0) < qty) return toast('Недостаточно акций ' + s.t, false);
    S.pending.push({id:Date.now(), side:S.side, t:s.t, qty, price:lp});
    toast('Лимитный ордер размещён: ' + (S.side === 'buy' ? 'покупка ' : 'продажа ') + qty + ' × ' + s.t + ' @ ' + usd(lp));
  }
  renderAll();
}

function checkPending() {
  S.pending = S.pending.filter(o => {
    const s = stocks.find(x => x.t === o.t);
    const hit = o.side === 'buy' ? s.p <= o.price : s.p >= o.price;
    return hit ? !execute(o.side, s, o.qty, s.p) && false : true;
  });
}
