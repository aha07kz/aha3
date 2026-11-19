/* ---------- Старт ---------- */
$('lim').value = cur().p.toFixed(2);
const clock = () => $('clock').textContent = 'ET ' + new Date().toLocaleTimeString('en-GB', {timeZone:'America/New_York'});
clock(); setInterval(clock, 1000);
[52, 34, 18, 9, 3].forEach(m => addNews(m, false)); renderNews();
setInterval(addNews, 15000);
renderAll(); updateChart(); for (let i = 0; i < 10; i++) pushTape();
setInterval(tick, 2500);
