// Atravessem a Trilha (versão corredor) - servidor (Node 18+, sem dependências)
const http = require('http'), fs = require('fs'), path = require('path');
const PIN = process.env.PIN || 'prof', PORT = process.env.PORT || 3000;
const RUN_MS = +process.env.RUN_MS || 60000;    // duração da corrida com truques
const CAP_MS = +process.env.CAP_MS || 240000;   // limite da corrida final
const COUNT_MS = +process.env.COUNT_MS || 3500; // contagem 3-2-1
const AV = Array.from({ length: 15 }, (_, i) => 'c' + i);
// truques: 0 presente, 1 anúncio, 2 bicho gigante, 3 amigo, 4 linha que foge (cada regra boa tem o mesmo número do truque)
const GOOD = [0, 1, 2, 3, 4], BAD = [10, 11, 12, 13, 14, 15];
const sh = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const num = (v, lo, hi) => Math.min(hi, Math.max(lo, +v || 0));
const clients = new Map();
let S, timer, dirty = false;

function fresh() {
  clearTimeout(timer);
  S = { phase: 'lobby', round: 0, kind: null, runId: 0, startAt: 0, dur: 0, players: {}, order: [],
        alive: [...GOOD], adopted: [], skipped: false, cards: [], votes: {}, counts: [], res: null, freed: 0, allFin: false };
}
fresh();

function pub(tok, host) {
  const P = S.order.map(t => S.players[t]), me = S.players[tok];
  const r3 = x => Math.round(x * 1000) / 1000;
  const o = { phase: S.phase, round: S.round, kind: S.kind, runId: S.runId, startAt: S.startAt, dur: S.dur, now: Date.now(),
    alive: S.alive, adopted: S.adopted, skipped: S.skipped, cards: S.cards, nv: Object.keys(S.votes).length, n: P.length,
    nr: P.filter(p => p.ready).length, res: S.res, freed: S.freed, allFin: S.allFin,
    team: P.map(p => ({ av: p.av, p: r3(p.p), c: p.c, f: p.f })) };
  if (S.phase === 'result') o.counts = S.counts;
  if (host) {
    o.team = P.map(p => ({ av: p.av, p: r3(p.p), c: p.c, ct: p.ct, cn: p.cn, f: p.f, r: p.ready, trick: p.trick }));
    o.counts = S.cards.map((_, i) => Object.values(S.votes).filter(v => v === i).length);
  }
  if (me) o.me = { av: me.av, trick: me.trick, c: me.c, ct: me.ct, cn: me.cn, ready: me.ready, f: me.f, vote: S.cards.length && S.votes[tok] !== undefined ? S.votes[tok] : -1 };
  return JSON.stringify(o);
}
const bc = () => { dirty = false; for (const [r, c] of clients) r.write('data: ' + pub(c.tok, c.host) + '\n\n'); };

function assign() { // cada aluno recebe um truque que ainda existe, preferindo um que ainda não enfrentou
  const R = S.alive, ps = sh(S.order), cap = Math.ceil(ps.length / R.length), cnt = {};
  R.forEach(r => cnt[r] = 0);
  for (const t of ps) {
    const p = S.players[t];
    let opts = R.filter(r => cnt[r] < cap);
    const alt = opts.filter(r => r !== p.trick);
    if (alt.length) opts = alt;
    const min = Math.min(...opts.map(r => p.hist[r]));
    const r = sh(opts.filter(r => p.hist[r] === min))[0];
    p.prev = p.trick; p.trick = r; p.hist[r]++; cnt[r]++;
  }
}
function startRun(kind) {
  clearTimeout(timer);
  S.kind = kind; S.round++; S.runId++; S.phase = 'run'; S.res = null; S.allFin = false;
  S.startAt = Date.now() + COUNT_MS; S.dur = kind === 'final' ? CAP_MS : RUN_MS;
  for (const t of S.order) {
    const p = S.players[t];
    p.ready = false; p.p = 0; p.c = 0; p.ct = 0; p.cn = 0; p.f = false;
    if (kind === 'final') { p.prev = p.trick; p.trick = null; }
  }
  if (kind === 'trick') assign();
  timer = setTimeout(endRun, COUNT_MS + S.dur + 300);
  bc();
}
function endRun() {
  if (S.phase !== 'run') return;
  clearTimeout(timer);
  if (S.kind === 'final') { S.allFin = S.order.length > 0 && S.order.every(t => S.players[t].f); S.phase = 'end'; }
  else S.phase = 'report';
  bc();
}
function openVote() {
  const g = sh(S.alive).slice(0, 3), b = sh(BAD).slice(0, 5 - g.length);
  S.cards = sh([...g, ...b]); S.votes = {}; S.phase = 'vote'; bc();
}
function closeVote() {
  const c = S.cards.map((_, i) => Object.values(S.votes).filter(v => v === i).length), m = Math.max(...c);
  const id = S.cards[sh(c.map((n, i) => n === m ? i : -1).filter(i => i >= 0))[0]];
  S.counts = c; S.res = id; S.freed = 0;
  if (id < 10) { S.freed = S.order.filter(t => S.players[t].trick === id).length; S.alive = S.alive.filter(x => x !== id); S.adopted.push(id); }
  S.phase = 'result'; bc();
}
const nextRun = () => startRun(S.alive.length ? 'trick' : 'final');

const HOST = {
  ping() {},
  start() { if (S.phase === 'lobby' && S.order.length) nextRun(); },
  endrun() { endRun(); },
  force() { if (S.phase === 'report') { S.phase = 'discuss'; bc(); } },
  vote() { if (S.phase === 'discuss') openVote(); },
  close() { if (S.phase === 'vote' && Object.keys(S.votes).length) closeVote(); },
  next() { if (S.phase === 'result') nextRun(); },
  again() { if (S.phase === 'end' && !S.allFin) startRun('final'); },
  finalnow() { if (['report', 'discuss', 'vote', 'result'].includes(S.phase)) { S.alive = []; S.skipped = true; startRun('final'); } },
  reset() { fresh(); bc(); }
};

function act(u, j) {
  if (u === '/join') {
    if (typeof j.t !== 'string' || !j.t || j.t.length > 40) return 400;
    if (S.players[j.t]) return 200;
    if (!AV.includes(j.av) || Object.values(S.players).some(p => p.av === j.av)) return 409;
    S.players[j.t] = { av: j.av, trick: null, prev: null, hist: [0, 0, 0, 0, 0], ready: false, p: 0, c: 0, ct: 0, cn: 0, f: false };
    S.order.push(j.t); bc(); return 200;
  }
  const p = S.players[j.t];
  if (u === '/prog') {
    if (!p || S.phase !== 'run' || j.runId !== S.runId) return 200;
    p.p = num(j.p, 0, 1); p.c = num(j.c, 0, 999); p.ct = num(j.ct, 0, 999); p.cn = num(j.cn, 0, 999);
    if (j.f === true) p.f = true;
    dirty = true;
    if (S.kind === 'final' && S.order.every(t => S.players[t].f)) { clearTimeout(timer); timer = setTimeout(endRun, 2000); }
    return 200;
  }
  if (u === '/ready') {
    if (!p || S.phase !== 'report') return 200;
    p.ready = true;
    if (S.order.every(t => S.players[t].ready)) S.phase = 'discuss';
    bc(); return 200;
  }
  if (u === '/vote') {
    if (!p || S.phase !== 'vote' || !(j.c >= 0 && j.c < S.cards.length)) return 403;
    S.votes[j.t] = j.c; bc(); return 200;
  }
  if (u === '/host') {
    if (j.pin !== PIN) return 401;
    if (HOST[j.a]) HOST[j.a]();
    return 200;
  }
  return 404;
}

http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/events') {
    const host = u.searchParams.has('pin');
    if (host && u.searchParams.get('pin') !== PIN) { r.writeHead(401); return r.end(); }
    const tok = u.searchParams.get('t') || '';
    r.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    clients.set(r, { tok, host }); r.write('data: ' + pub(tok, host) + '\n\n');
    q.on('close', () => clients.delete(r)); return;
  }
  if (q.method === 'POST') {
    let b = ''; q.on('data', d => { if (b.length < 4000) b += d; });
    q.on('end', () => { let j = {}; try { j = JSON.parse(b); } catch {} r.writeHead(act(u.pathname, j)); r.end(); });
    return;
  }
  if (u.pathname !== '/') { r.writeHead(204); return r.end(); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  r.end(fs.readFileSync(path.join(__dirname, 'index.html')));
}).listen(PORT, () => console.log('Trilha (corredor) no ar na porta ' + PORT));
setInterval(() => { if (dirty) bc(); for (const r of clients.keys()) r.write(': ping\n\n'); }, 600);
