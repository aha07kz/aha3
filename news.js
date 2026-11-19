/* ---------- Новости ---------- */
const SRC = ['Reuters', 'Bloomberg', 'CNBC', 'Financial Times'];
const RT = {AAPL:'AAPL.OQ', TSLA:'TSLA.OQ', MSFT:'MSFT.OQ', NVDA:'NVDA.OQ', KO:'KO.N', CAT:'CAT.N', AMZN:'AMZN.OQ', JPM:'JPM.N'};
const LINK = {
  'Reuters': t => 'https://www.reuters.com/markets/companies/' + RT[t] + '/',
  'Bloomberg': t => 'https://www.bloomberg.com/quote/' + t + ':US',
  'CNBC': t => 'https://www.cnbc.com/quotes/' + t,
  'Financial Times': () => 'https://www.ft.com/markets',
};
const HEAD = {
  up: ['{n} повышает прогноз на год на фоне устойчивого спроса', 'Аналитики повысили целевую цену {t} перед публикацией отчётности', '{n} объявляет о программе обратного выкупа акций', 'Институциональные инвесторы наращивают позиции в {t}, следует из отчётов'],
  dn: ['{n} под проверкой регулятора: акции снижаются', 'Брокер понизил рекомендацию по {t} из-за высокой оценки', '{n} предупредила о давлении на маржу из-за роста затрат', 'Перебои в цепочках поставок ухудшают прогноз {n}'],
};
S.news = [];
const pick = a => a[Math.floor(Math.random() * a.length)];

function addNews(agoMin = 0, live = true) {
  const s = pick(stocks.filter(x => x.type === 'stock')), dir = Math.random() > .5 ? 1 : -1, src = pick(SRC), pct = dir * rnd(.4, 1);
  const title = pick(HEAD[dir > 0 ? 'up' : 'dn']).replace('{n}', SHORT[s.t]).replace('{t}', s.t);
  if (live) { // мгновенный скачок цены и затухающий дрейф в сторону новости
    s.p *= 1 + pct / 100; s.hist[s.hist.length - 1] = s.p;
    s.hi = Math.max(s.hi, s.p); s.lo = Math.min(s.lo, s.p); s.imp = {dir, left:6};
  }
  S.news.unshift({time:new Date(Date.now() - agoMin * 60000), src, t:s.t, title, dir, pct, born:live ? Date.now() : 0, url:LINK[src](s.t)});
  S.news = S.news.slice(0, 14);
  if (live) { renderAll(); updateChart(); renderNews(); setTimeout(renderNews, 46000); }
}

function renderNews() {
  $('news').innerHTML = S.news.map(n => {
    const c = n.dir > 0 ? 'up' : 'down', fresh = Date.now() - n.born < 45000;
    const badge = fresh ? `<span class="imp ${c}"><i></i>Влияние: ${n.t} ${n.dir > 0 ? '+' : '−'}</span>` : `<span class="${c} text-xs num">${n.t} ${n.pct > 0 ? '+' : ''}${fmt(n.pct)}%</span>`;
    return `<a href="${n.url}" target="_blank" rel="noopener noreferrer" class="row flex items-start gap-3 px-2 py-2 border-t border-slate-700">
      <span class="num text-xs text-slate-400 w-12 shrink-0 pt-0.5">${n.time.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}</span>
      <div class="min-w-0 flex-1"><div class="text-xs text-slate-400">${n.src}</div><div class="font-medium">${n.title}</div></div>
      <div class="shrink-0">${badge}</div></a>`;
  }).join('');
}
