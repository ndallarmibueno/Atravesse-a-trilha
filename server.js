// Atravessem a Trilha - servidor (Node 18+, sem dependências)
const http = require('http'), fs = require('fs'), path = require('path');
const PIN = process.env.PIN || 'prof', PORT = process.env.PORT || 3000;
const FIN = 18, MAXR = 12, WAITMS = +process.env.WAIT_MS || 3200;
const TP = { 3: 0, 6: 1, 9: 2, 12: 3, 14: 0, 16: 2 }; // casa -> tipo de armadilha
const AV = ['🦊','🐼','🐸','🦁','🐙','🦄','🐯','🐵','🐧','🦉','🐢','🐬','🦋','🐨','🐰'];
const sh = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const clients = new Set();
let S, timer;

function fresh() {
  S = { phase: 'lobby', round: 1, players: {}, order: [], turn: 0, off: [0, 0, 0, 0],
        pg: [0, 1, 2, 3], pb: [10, 11, 12, 13, 14], cards: [], votes: {}, last: null, res: null, adopted: [], wait: false, fells: 0 };
}
fresh();

const pub = () => JSON.stringify({
  phase: S.phase, round: S.round, max: MAXR, fin: FIN, tp: TP, fells: S.fells, off: S.off, cards: S.cards, last: S.last, res: S.res,
  adopted: S.adopted, wait: S.wait, nv: Object.keys(S.votes).length,
  players: S.order.map(t => S.players[t]),
  cur: S.order[S.turn] ? S.players[S.order[S.turn]].av : null,
  counts: S.cards.map((_, i) => Object.values(S.votes).filter(v => v === i).length)
});
const bc = () => { const m = 'data: ' + pub() + '\n\n'; for (const r of clients) r.write(m); };

function startTurns() {
  S.phase = 'turns'; S.turn = 0; S.last = null; S.wait = false; S.fells = 0;
  while (S.turn < S.order.length && S.players[S.order[S.turn]].fin) S.turn++;
  if (S.turn >= S.order.length) return endRound();
  bc();
}
function nextTurn() {
  S.turn++;
  while (S.turn < S.order.length && S.players[S.order[S.turn]].fin) S.turn++;
  if (S.turn >= S.order.length) return endRound();
  S.last = null; bc();
}
function endRound() {
  if (S.order.every(t => S.players[t].fin)) { S.phase = 'win'; return bc(); }
  if (S.round >= MAXR) { S.phase = 'lose'; return bc(); }
  if (S.off.every(Boolean)) { S.round++; return startTurns(); }
  S.phase = 'discuss'; bc();
}
function roll(t) {
  const p = S.players[t], act = [0, 1, 2, 3].filter(i => !S.off[i]), from = p.pos;
  let v = 1 + Math.floor(Math.random() * 6), rig = false;
  if (Math.random() < act.length / 4) { // dado viciado: some conforme as regras desarmam o Jogo
    const near = Object.keys(TP).map(Number).filter(q => act.includes(TP[q]) && q > p.pos && q <= p.pos + 6).sort((a, b) => a - b)[0];
    if (near) { v = near - p.pos; rig = true; }
  }
  const np = p.pos + v; let fell = false, trap = null;
  if (np >= FIN) { p.pos = FIN; p.fin = true; }
  else if (TP[np] !== undefined && !S.off[TP[np]]) { fell = true; trap = TP[np]; p.pos = 0; S.fells++; }
  else p.pos = np;
  S.last = { av: p.av, v, rig, fell, trap, fin: !!p.fin, at: Math.min(np, FIN), from };
  S.wait = true; bc();
  timer = setTimeout(() => { S.wait = false; nextTurn(); }, WAITMS);
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
    roll(j.t); return 200;
  }
  if (u === '/vote') {
    if (S.phase !== 'vote' || !S.players[j.t] || !(j.c >= 0 && j.c < S.cards.length)) return 403;
    S.votes[j.t] = j.c; bc(); return 200;
  }
  if (u === '/host') {
    if (j.pin !== PIN) return 401;
    const a = j.a;
    if (a === 'start' && S.phase === 'lobby' && S.order.length) startTurns();
    else if (a === 'skip' && S.phase === 'turns' && S.order[S.turn]) { clearTimeout(timer); S.wait = false; nextTurn(); }
    else if (a === 'vote' && S.phase === 'discuss') {
      const g = sh(S.pg).slice(0, 3);
      S.cards = sh([...g, ...sh(S.pb).slice(0, 5 - g.length)]); S.votes = {}; S.phase = 'vote'; bc();
    }
    else if (a === 'close' && S.phase === 'vote' && Object.keys(S.votes).length) closeVote();
    else if (a === 'next' && S.phase === 'result') { S.round++; startTurns(); }
    else if (a === 'again' && S.phase === 'lose') {
      S.order.forEach(t => { S.players[t].pos = 0; S.players[t].fin = false; }); S.round = 1; startTurns();
    }
    else if (a === 'reset') { clearTimeout(timer); fresh(); bc(); }
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
