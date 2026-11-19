/* ---------- Состояние ---------- */
const $ = id => document.getElementById(id);
const fmt = (n, d = 2) => n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
const usd = n => '$' + fmt(n);
const cf = new Intl.NumberFormat('en-US', {notation:'compact', maximumFractionDigits:2});
const FEE = 0.001; // комиссия брокера 0,1%
const rnd = (a, b) => a + Math.random() * (b - a);

// Каталог активов: цена, волатильность, количество акций (для капитализации, млрд)
const stocks = [
  {t:'AAPL', n:'Apple Inc.',            p:228.5, v:.0016, sh:15.2},
  {t:'TSLA', n:'Tesla, Inc.',           p:342.1, v:.0035, sh:3.2},
  {t:'MSFT', n:'Microsoft Corp.',       p:421.7, v:.0014, sh:7.4},
  {t:'NVDA', n:'NVIDIA Corp.',          p:139.8, v:.0030, sh:24.5},
  {t:'KO',   n:'The Coca-Cola Co.',     p:62.4,  v:.0009, sh:4.3},
  {t:'CAT',  n:'Caterpillar Inc.',      p:389.2, v:.0013, sh:.48},
  {t:'AMZN', n:'Amazon.com, Inc.',      p:201.3, v:.0018, sh:10.6},
  {t:'JPM',  n:'JPMorgan Chase & Co.',  p:241.9, v:.0012, sh:2.8},
];
stocks.push(
  {t:'UST10Y', n:'US Treasury 10Y', p:96.4, v:.0004, cap:28e12},
  {t:'OFZ', n:'ОФЗ 26243', p:91.8, v:.0006, cap:1.2e12},
  {t:'SPY', n:'SPDR S&P 500 ETF', p:601.3, v:.0007, cap:600e9},
  {t:'QQQ', n:'Invesco QQQ Trust', p:518.2, v:.0009, cap:320e9},
  {t:'GLD', n:'SPDR Gold Shares', p:243.6, v:.0008, cap:75e9},
  {t:'EURUSD', n:'EUR/USD (лот 1 000 €)', p:1085.4, v:.0005},
  {t:'KZT', n:'USD/KZT (лот 100 000 ₸)', p:192.2, v:.0004});
const META = {
  AAPL:{type:'stock', div:.45, pe:36.2, desc:'Разрабатывает iPhone, Mac и сервисы App Store, iCloud, Apple Music. Основная выручка — продажи устройств и подписки.'},
  TSLA:{type:'stock', div:0, pe:112, desc:'Электромобили, накопители энергии и солнечные панели; развивает автономное вождение и робототехнику.'},
  MSFT:{type:'stock', div:.72, pe:35.8, desc:'Программное обеспечение и облако: Windows, Office, Azure, LinkedIn; крупный инвестор в ИИ.'},
  NVDA:{type:'stock', div:.03, pe:54.1, desc:'Графические процессоры и ускорители для центров обработки данных и ИИ.'},
  KO:{type:'stock', div:3, pe:25.4, desc:'Крупнейший производитель безалкогольных напитков: Coca-Cola, Sprite, Fanta, Costa.'},
  CAT:{type:'stock', div:1.5, pe:17.9, desc:'Строительная и горнодобывающая техника, двигатели и турбины.'},
  AMZN:{type:'stock', div:0, pe:41.7, desc:'Электронная коммерция, облако AWS, реклама и подписка Prime.'},
  JPM:{type:'stock', div:2, pe:13.2, desc:'Крупнейший банк США: розничный и инвестиционный банкинг, управление активами.'},
  UST10Y:{type:'bond', div:4.4, desc:'Десятилетние казначейские облигации США — ориентир безрисковой ставки. Цена указана за 100 $ номинала, показатель — доходность к погашению.'},
  OFZ:{type:'bond', div:15.2, desc:'Облигации федерального займа РФ с фиксированным купоном. Цена — в долларовом эквиваленте за 100 номинала.'},
  SPY:{type:'etf', div:1.2, pe:25.1, desc:'Фонд, повторяющий индекс S&P 500: 500 крупнейших компаний США.'},
  QQQ:{type:'etf', div:.6, pe:31.4, desc:'Фонд на индекс Nasdaq-100 с упором на технологический сектор.'},
  GLD:{type:'etf', div:0, desc:'Фонд, обеспеченный физическим золотом; следует за ценой металла.'},
  EURUSD:{type:'fx', desc:'Курс евро к доллару. Один лот — 1 000 евро, цена лота указана в долларах.'},
  KZT:{type:'fx', desc:'Курс доллара к казахстанскому тенге (около 520 ₸ за $). Один лот — 100 000 ₸, цена лота указана в долларах.'},
};
stocks.forEach(s => Object.assign(s, META[s.t]));
const TYPES = {stock:'Акции', bond:'Облигации', etf:'ETF', fx:'Валюта'};
const EX = {stock:'NASDAQ', bond:'OTC', etf:'NYSE Arca', fx:'FX'};
const capStr = s => { const c = s.sh ? s.p * s.sh * 1e9 : s.cap; return c ? '$' + cf.format(c) : '—'; };
const VOL = {AAPL:48, TSLA:92, MSFT:21, NVDA:210, KO:14, CAT:3, AMZN:38, JPM:9}; // средний дневной объём, млн акций
const SHORT = {AAPL:'Apple', TSLA:'Tesla', MSFT:'Microsoft', NVDA:'NVIDIA', KO:'Coca-Cola', CAT:'Caterpillar', AMZN:'Amazon', JPM:'JPMorgan'};
stocks.forEach(s => {
  s.hist = Array.from({length:60}, () => s.p *= 1 + rnd(-s.v, s.v));
  s.p = s.last = s.hist[59]; s.open = s.hist[0];
  s.hi = Math.max(...s.hist); s.lo = Math.min(...s.hist);
  s.vol = (VOL[s.t] || 5) * 1e6 * rnd(.8, 1.1); s.imp = null;
});

const indices = [
  {n:'S&P 500', p:5987.4, v:.0006}, {n:'NASDAQ', p:19120.8, v:.0009},
  {n:'FTSE 100', p:8210.3, v:.0005}, {n:'Nikkei 225', p:38650.2, v:.0008},
  {n:'DAX', p:19430.6, v:.0007}, {n:'Dow Jones', p:43870.1, v:.0005},
].map(i => ({...i, open:i.p, last:i.p}));

const S = {cash:10000, pos:{}, hist:[], pending:[], sel:'AAPL', side:'buy', type:'market', tape:[]};
const cur = () => stocks.find(s => s.t === S.sel);
