/* ---------- Тосты ---------- */
function toast(msg, ok = true) {
  const d = document.createElement('div');
  d.className = 'toast card px-4 py-3 text-sm shadow-xl border-l-4 ' + (ok ? 'border-l-emerald-500' : 'border-l-red-500');
  d.textContent = msg; $('toasts').appendChild(d);
  setTimeout(() => { d.style.transition = 'opacity .4s'; d.style.opacity = 0; setTimeout(() => d.remove(), 400); }, 3200);
}

/* ---------- График (Chart.js) ---------- */
const chart = new Chart($('chart'), {
  type:'line',
  data:{labels:Array(60).fill(''), datasets:[{data:[], borderColor:'#10b981', borderWidth:2, pointRadius:0, tension:.3, fill:true, backgroundColor:'rgba(16,185,129,.12)'}]},
  options:{responsive:true, maintainAspectRatio:false, animation:{duration:500}, plugins:{legend:{display:false}, tooltip:{intersect:false, mode:'index'}},
    scales:{x:{display:false}, y:{position:'right', grid:{color:'#334155'}, ticks:{color:'#94a3b8'}}}}
});
