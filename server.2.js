// Atravessem a Trilha - servidor (Node 18+, sem dependências)
const http = require('http'), fs = require('fs'), path = require('path');
const PIN = process.env.PIN || 'prof', PORT = process.env.PORT || 3000;
const FIN = 16, MAXR = 12;
const K = +process.env.WAIT_SCALE || 1;      // escala das pausas (1 = normal)
const AUTO = +process.env.AUTO_MS || 15000;  // o dado rola sozinho se o aluno demorar
// casa -> tipo de armadilha (0 Caixa Misteriosa, 1 Casa Sem Fim, 2 Casa do Estranho)
const TP = { 3: 0, 6: 1, 9: 2, 12: 0, 14: 1 };
// quanto tempo (ms) cada resultado fica na tela antes de passar a vez
const PAUSE = { safe: 3200, protected: 6500, fall: 7500, fin: 4500 };
// problemas do Jogo (índices de "off"): 0 caixa, 1 casa sem fim, 2 casa do estranho, 3 dado viciado
// cada regra boa tem o mesmo número do problema que ela desarma
const AV = ['🦊','🐼','🐸','🦁','🐙','🦄','🐯','🐵','🐧','🦉','🐢','🐬','🦋','🐨','🐰'];
const sh = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const rnd = n => Math.floor(Math.random() * n);
const clients = new Set();
let S, timer, autoT;

function fresh() {
  S = { phase: 'lobby', round: 1, players: {}, order: [], turn: 0, off: [0, 0, 0, 0],
        pg: [0, 1, 2, 3], pb: [10, 11, 12, 13, 14], cards: [], votes: {}, last: null, res: null,
        adopted: [], wait: false, n: 0, fells: 0, fallBy: [0, 0, 0], hist: [0, 0, 0, 0, 0, 0], log: [] };
}
fresh();

const pub = () => JSON.stringify({
  phase: S.phase, round: S.round, max: MAXR, fin: FIN, tp: TP, off: S.off,
  fells: S.fells, fallBy: S.fallBy, hist: S.hist, log: S.log,
  cards: S.cards, last: S.last, res: S.res, adopted: S.adopted, wait: S.wait, nv: Object.keys(S.votes).length,
  players: S.order.map(t => S.players[t]),
  cur: S.order[S.turn] ? S.players[S.order[S.turn]].av : null,
  counts: S.cards.map((_, i) => Object.values(S.votes).filter(v => v === i).length)
});
const bc = () => { const m = 'data: ' + pub() + '\n\n'; for (const r of clients) r.write(m); };

function startTurns() {
  clearTimeout(timer); clearTimeout(autoT);
  S.fells = 0; S.fallBy = [0, 0, 0]; S.hist = [0, 0, 0, 0, 0, 0]; S.log = [];
  S.phase = 'turns'; S.turn = -1; S.last = null; S.wait = false;
  advance();
}
function advance() { // passa para o próximo jogador que ainda não chegou ao final
  S.turn++;
  while (S.turn < S.order.length && S.players[S.order[S.turn]].fin) S.turn++;
  if (S.turn >= S.order.length) return endRound();
  S.last = null; S.wait = false; bc(); armAuto();
}
function armAuto() {
  clearTimeout(autoT);
  autoT = setTimeout(() => {
    const t = S.order[S.turn];
    if (S.phase === 'turns' && t && !S.wait) roll(t, true);
  }, AUTO);
}
function endRound() {
  clearTimeout(autoT); S.last = null; S.wait = false;
  if (S.order.every(t => S.players[t].fin)) { S.phase = 'win'; return bc(); }
  if (S.round >= MAXR) { S.phase = 'lose'; return bc(); }
  if (S.off.every(Boolean)) { S.round++; return startTurns(); }
  S.phase = 'discuss'; bc();
}
function roll(t, auto) {
  clearTimeout(autoT);
  const p = S.players[t], from = p.pos;
  let v = 1 + rnd(6), rig = false;
  if (!S.off[3] && Math.random() < 0.8) { // dado viciado: puxa para a armadilha mais próxima ou só dá números baixos
    const near = Object.keys(TP).map(Number).filter(q => !S.off[TP[q]] && q > p.pos && q <= p.pos + 6).sort((a, b) => a - b)[0];
    v = near ? near - p.pos : 1 + rnd(2); rig = true;
  }
  const np = p.pos + v; let kind = 'safe', trap = null;
  if (np >= FIN) { p.pos = FIN; p.fin = true; kind = 'fin'; }
  else if (TP[np] !== undefined) {
    trap = TP[np];
    if (S.off[trap]) { kind = 'protected'; p.pos = np; }
    else { kind = 'fall'; p.pos = 0; S.fells++; S.fallBy[trap]++; }
  } else p.pos = np;
  S.hist[v - 1]++; S.n++;
  S.last = { n: S.n, av: p.av, v, rig, kind, trap, at: Math.min(np, FIN), from, auto: !!auto };
  S.log.unshift({ av: p.av, v, kind, trap });
  S.wait = true; bc();
  timer = setTimeout(advance, PAUSE[kind] * K);
}
function closeVote() {
  const c = S.cards.map((_, i) => Object.values(S.votes).filter(v => v === i).length), m = Math.max(...c);
  const id = S.cards[sh(c.map((n, i) => n === m ? i : -1).filter(i => i >= 0))[0]];
  if (id < 10) { S.off[id] = 1; S.pg = S.pg.filter(x => x !== id); S.adopted.push(id); }
  else S.pb = S.pb.filter(x => x !== id);
  S.res = id; S.phase = 'result'; bc();
}
function act(u, j) {
  if (u === '/join') {
    if (typeof j.t !== 'string' || j.t.length > 40) return 400;
    if (S.players[j.t]) return 200;
    if (!AV.includes(j.av) || Object.values(S.players).some(p => p.av === j.av)) return 409;
    S.players[j.t] = { av: j.av, pos: 0, fin: false }; S.order.push(j.t); bc(); return 200;
  }
  if (u === '/roll') {
    if (S.phase !== 'turns' || S.wait || S.order[S.turn] !== j.t) return 403;
    roll(j.t, false); return 200;
  }
  if (u === '/vote') {
    if (S.phase !== 'vote' || !S.players[j.t] || !(j.c >= 0 && j.c < S.cards.length)) return 403;
    S.votes[j.t] = j.c; bc(); return 200;
  }
  if (u === '/host') {
    if (j.pin !== PIN) return 401;
    const a = j.a;
    if (a === 'start' && S.phase === 'lobby' && S.order.length) startTurns();
    else if (a === 'skip' && S.phase === 'turns' && S.order[S.turn]) { clearTimeout(timer); advance(); }
    else if (a === 'vote' && S.phase === 'discuss') {
      const g = sh(S.pg).slice(0, 3);
      S.cards = sh([...g, ...sh(S.pb).slice(0, 5 - g.length)]); S.votes = {}; S.phase = 'vote'; bc();
    }
    else if (a === 'close' && S.phase === 'vote' && Object.keys(S.votes).length) closeVote();
    else if (a === 'next' && S.phase === 'result') { S.round++; startTurns(); }
    else if (a === 'again' && S.phase === 'lose') {
      S.order.forEach(t => { S.players[t].pos = 0; S.players[t].fin = false; }); S.round = 1; startTurns();
    }
    else if (a === 'reset') { clearTimeout(timer); clearTimeout(autoT); fresh(); bc(); }
    return 200;
  }
  return 404;
}

http.createServer((q, r) => {
  if (q.url === '/events') {
    r.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    r.write('data: ' + pub() + '\n\n'); clients.add(r); q.on('close', () => clients.delete(r)); return;
  }
  if (q.method === 'POST') {
    let b = ''; q.on('data', d => { if (b.length < 2000) b += d; });
    q.on('end', () => { let j = {}; try { j = JSON.parse(b); } catch {} r.writeHead(act(q.url, j)); r.end(); });
    return;
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  r.end(fs.readFileSync(path.join(__dirname, 'index.html')));
}).listen(PORT, () => console.log('Trilha no ar na porta ' + PORT));
setInterval(() => { for (const r of clients) r.write(': ping\n\n'); }, 20000);
