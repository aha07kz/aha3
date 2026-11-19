/* ---------- События ---------- */
$('bBuy').onclick = () => { S.side = 'buy'; renderForm(); };
$('bSell').onclick = () => { S.side = 'sell'; renderForm(); };
$('tMkt').onclick = () => { S.type = 'market'; renderForm(); };
$('tLim').onclick = () => { S.type = 'limit'; $('lim').value = cur().p.toFixed(2); renderForm(); };
$('qty').oninput = $('lim').oninput = renderForm;
$('maxBtn').onclick = () => {
  const s = cur(), px = S.type === 'limit' ? (parseFloat($('lim').value) || s.p) : s.p;
  $('qty').value = Math.max(1, S.side === 'buy' ? Math.floor(S.cash / (px * (1 + FEE))) : (S.pos[s.t]?.qty || 1)); renderForm();
};
$('submit').onclick = submitOrder;
