/* ---------- Рыночный цикл (каждые 2.5 с) ---------- */
function tick() {
  stocks.forEach(s => {
    s.last = s.p;
    const drift = s.imp ? s.imp.dir * s.v * 1.5 : 0;
    if (s.imp && --s.imp.left <= 0) s.imp = null;
    s.p = Math.max(1, s.p * (1 + rnd(-s.v, s.v) + drift));
    s.hist.push(s.p); s.hist.shift();
    s.hi = Math.max(s.hi, s.p); s.lo = Math.min(s.lo, s.p);
    s.vol *= 1 + rnd(.0002, .001) * (s.imp ? 4 : 1);
  });
  indices.forEach(i => { i.last = i.p; i.p *= 1 + rnd(-i.v, i.v); });
  checkPending(); renderAll(); updateChart(); pushTape();
}
