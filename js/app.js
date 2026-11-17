import { BLOCKS, PLAN90, DELIVERY_CHECKS, ALL_MODULES, moduleById, blockById } from "./data.js";
import { Store, Sync, today, weekMinutes, streak, addMinutes, lessonsOf, moduleProgress, exportBackup, exportNotesMarkdown } from "./store.js";
import { parseYouTube, loadYT, fetchTitle, playlistVideos, fmtTime } from "./youtube.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const S = () => Store.get();
const uid = () => Math.random().toString(36).slice(2, 10);
const hrs = min => (min / 60).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// ---------- ícones (traço, 24px) ----------
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  path: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  cloud: '<path d="M17.5 19H7a5 5 0 1 1 1.4-9.8A6 6 0 0 1 20 11.5a3.8 3.8 0 0 1-2.5 7.5z"/>',
  flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  pin: '<path d="M12 17v5M5 17h14l-2-4V4H7v9z"/>',
  fire: '<path d="M12 22c4.4 0 7-3 7-7 0-5-5-7-5-12-3 2-6 6-6 9-1-1-1.5-2.5-1.5-3.5C4.5 10.5 5 13 5 15c0 4 2.6 7 7 7z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  ul: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
};
const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

// ---------- tema ----------
const THEME_KEY = "mater-academy:theme";
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $("#themeBtn").innerHTML = ic(dark ? "sun" : "moon");
  $("#themeBtn").title = dark ? "Modo claro" : "Modo escuro";
}
function toggleTheme() {
  const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = cur === "dark" ? "light" : "dark";
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  applyTheme(next);
}

// ---------- toast / modal ----------
function toast(msg, kind = "") {
  const t = document.createElement("div");
  t.className = "toast " + kind; t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.classList.add("out"), 2600);
  setTimeout(() => t.remove(), 3000);
}
function modal(html, onMount, { sticky = false } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "modal-wrap";
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  // "sticky": só fecha pelos botões, para não perder o que foi escrito
  wrap.addEventListener("click", e => { if ((e.target === wrap && !sticky) || e.target.closest("[data-close]")) close(); });
  onMount?.(wrap, close);
  return close;
}

// ---------- timer de estudo ----------
const TIMER_KEY = "mater-academy:timer";
const Timer = {
  st: null,
  load() {
    try { this.st = JSON.parse(localStorage.getItem(TIMER_KEY) || "null"); } catch {}
    if (!this.st) this.reset(false);
  },
  save() { try { localStorage.setItem(TIMER_KEY, JSON.stringify(this.st)); } catch {} },
  len(mode) { return (mode === "focus" ? S().settings.focusMin : S().settings.breakMin) * 60; },
  reset(save = true) { const mode = this.st?.mode || "focus"; this.st = { mode, running: false, left: this.len(mode), endsAt: 0, credited: 0 }; if (save) this.save(); this.paint(); },
  left() { return this.st.running ? Math.max(0, Math.round((this.st.endsAt - Date.now()) / 1000)) : this.st.left; },
  start() { this.st.running = true; this.st.endsAt = Date.now() + this.st.left * 1000; this.save(); this.paint(); },
  pause() { this.creditNow(); this.st.left = this.left(); this.st.running = false; this.save(); this.paint(); },
  switchMode(mode) { this.creditNow(); this.st = { mode, running: false, left: this.len(mode), endsAt: 0, credited: 0 }; this.save(); this.paint(); },
  // soma minutos de foco já cumpridos e ainda não contados
  creditNow() {
    if (this.st.mode !== "focus") return;
    const elapsed = this.len("focus") - this.left();
    const mins = Math.floor(elapsed / 60) - this.st.credited;
    if (mins > 0) { this.st.credited += mins; addMinutes(mins); }
  },
  tick() {
    if (!this.st.running) return;
    this.creditNow();
    if (this.left() <= 0) {
      const wasFocus = this.st.mode === "focus";
      beep();
      toast(wasFocus ? "Foco concluído. Hora da pausa." : "Pausa encerrada. Bora voltar.", "ok");
      this.switchMode(wasFocus ? "break" : "focus");
    }
    this.save(); this.paint();
  },
  paint() {
    const b = $("#timerBtn"); if (!b || !this.st) return;
    b.classList.toggle("on", this.st.running);
    b.classList.toggle("brk", this.st.mode === "break");
    b.innerHTML = `${ic(this.st.running ? "pause" : "timer")}<span>${fmtTime(this.left())}</span>`;
    b.title = (this.st.mode === "focus" ? "Foco" : "Pausa") + (this.st.running ? " — clique para pausar" : " — clique para começar");
  },
};
function beep() {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25].forEach(t => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.15, a.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t + 0.2);
      o.connect(g).connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.22);
    });
  } catch {}
}
function timerPanel() {
  modal(`
    <h3>Timer de estudo</h3>
    <p class="muted">Foco de ${S().settings.focusMin} min e pausa de ${S().settings.breakMin} min. Só o tempo de foco conta para a meta da semana.</p>
    <div class="seg" id="tMode">
      <button data-m="focus" class="${Timer.st.mode === "focus" ? "act" : ""}">Foco</button>
      <button data-m="break" class="${Timer.st.mode === "break" ? "act" : ""}">Pausa</button>
    </div>
    <div class="big-time" id="tBig">${fmtTime(Timer.left())}</div>
    <div class="row center">
      <button class="btn primary" id="tGo">${Timer.st.running ? ic("pause") + "Pausar" : ic("play") + "Começar"}</button>
      <button class="btn" id="tReset">${ic("reset")}Zerar</button>
      <button class="btn ghost" data-close>Fechar</button>
    </div>`, (w, close) => {
    const iv = setInterval(() => { const el = $("#tBig", w); if (!el) return clearInterval(iv); el.textContent = fmtTime(Timer.left()); }, 500);
    $("#tGo", w).onclick = () => { Timer.st.running ? Timer.pause() : Timer.start(); close(); };
    $("#tReset", w).onclick = () => { Timer.creditNow(); Timer.reset(); close(); };
    $$("#tMode button", w).forEach(b => b.onclick = () => { Timer.switchMode(b.dataset.m); close(); timerPanel(); });
  });
}

// ---------- sync status ----------
const SYNC_LABEL = { local: "Só neste aparelho", conectando: "Conectando…", sincronizado: "Sincronizado", enviando: "Salvando…", erro: "Erro de sincronização", "sem-login": "Entre para sincronizar" };
function paintSync() {
  const b = $("#syncBtn"); if (!b) return;
  b.dataset.s = Sync.status;
  b.title = SYNC_LABEL[Sync.status] + (Sync.msg ? ": " + Sync.msg : "");
  $(".lbl", b).textContent = SYNC_LABEL[Sync.status];
}

// ---------- roteador ----------
const routes = [
  [/^#?\/?$/, viewHome, "home"],
  [/^#\/trilha$/, viewTrack, "trilha"],
  [/^#\/modulo\/(\w+)$/, viewModule, "trilha"],
  [/^#\/aula\/(\w+)\/(\w+)$/, viewLesson, "trilha"],
  [/^#\/caderno$/, viewNotebook, "caderno"],
  [/^#\/plano$/, viewPlan, "plano"],
  [/^#\/ajustes$/, viewSettings, "ajustes"],
];
let cleanup = null;
function route() {
  cleanup?.(); cleanup = null;
  const h = location.hash || "#/";
  for (const [re, fn, nav] of routes) {
    const m = h.match(re);
    if (m) {
      $$(".nav a").forEach(a => a.classList.toggle("act", a.dataset.nav === nav));
      const main = $("#main");
      main.innerHTML = "";
      const r = fn(main, ...m.slice(1));
      cleanup = typeof r === "function" ? r : null;
      main.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      return;
    }
  }
  location.hash = "#/";
}

// ---------- helpers de visual ----------
const bar = (pct, cls = "") => `<div class="bar ${cls}"><i style="width:${Math.round(pct * 100)}%"></i></div>`;
function blockProgress(b) {
  let total = 0, done = 0, deliv = 0;
  for (const m of b.modules) { const p = moduleProgress(m.id); total += p.total; done += p.done; if (p.delivered) deliv++; }
  return { total, done, deliv, mods: b.modules.length, pct: b.modules.length ? deliv / b.modules.length : 0 };
}
function nextLesson() {
  const last = S().last;
  if (last) {
    const ls = lessonsOf(last.moduleId);
    const i = ls.findIndex(l => l.id === last.lessonId);
    if (i >= 0 && !S().done[ls[i].id]) return { m: moduleById(last.moduleId), l: ls[i] };
    const after = ls.slice(i + 1).find(l => !S().done[l.id]);
    if (after) return { m: moduleById(last.moduleId), l: after };
  }
  for (const m of ALL_MODULES) {
    const l = lessonsOf(m.id).find(l => !S().done[l.id]);
    if (l) return { m, l };
  }
  return null;
}
function currentModule() {
  return ALL_MODULES.find(m => !moduleProgress(m.id).delivered) || ALL_MODULES[0];
}
function planDay() {
  const sd = S().settings.startDate; if (!sd) return null;
  const d0 = new Date(sd + "T00:00:00");
  return Math.floor((Date.now() - d0) / 86400000) + 1;
}
function planPhase(day) {
  if (!day) return null;
  const i = Math.min(5, Math.max(0, Math.floor((day - 1) / 15)));
  return { i, ...PLAN90[i] };
}

// ================= VIEWS =================

function viewHome(el) {
  const st = S();
  const wk = weekMinutes(), goal = st.settings.weeklyGoalMin;
  const nx = nextLesson();
  const cm = currentModule();
  const doneCount = Object.keys(st.done).length;
  const delivCount = Object.values(st.delivery).filter(d => d.doneAt).length;
  const day = planDay(), ph = planPhase(day);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  el.innerHTML = `
  <header class="page-head">
    <p class="eyebrow">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
    <h1>${hello}${st.settings.name ? ", " + esc(st.settings.name) : ""}.</h1>
    <p class="lead">Aprender para construir. Uma aula, uma nota, uma entrega de cada vez.</p>
  </header>

  <section class="hero card">
    ${nx ? `
      <div class="hero-txt">
        <p class="eyebrow">Continuar de onde parou</p>
        <h2>${esc(nx.l.title)}</h2>
        <p class="muted">Módulo ${nx.m.code} · ${esc(nx.m.t)}</p>
      </div>
      <a class="btn primary lg" href="#/aula/${nx.m.id}/${nx.l.id}">${ic("play")}Assistir agora</a>`
    : `
      <div class="hero-txt">
        <p class="eyebrow">Próximo passo</p>
        <h2>Módulo ${cm.code} · ${esc(cm.t)}</h2>
        <p class="muted">Este módulo ainda não tem aulas. Abra-o e cole o link de um vídeo ou playlist do YouTube.</p>
      </div>
      <a class="btn primary lg" href="#/modulo/${cm.id}">${ic("plus")}Adicionar aulas</a>`}
  </section>

  <section class="stats">
    <div class="stat card">
      <p class="eyebrow">Meta da semana</p>
      <p class="num">${hrs(wk)}<small> / ${hrs(goal)} h</small></p>
      ${bar(Math.min(1, wk / goal))}
    </div>
    <div class="stat card">
      <p class="eyebrow">Sequência</p>
      <p class="num">${streak()}<small> ${streak() === 1 ? "dia" : "dias"}</small></p>
      <p class="muted sm">${st.activity[today()] ? `Hoje: ${st.activity[today()]} min` : "Ainda não estudou hoje"}</p>
    </div>
    <div class="stat card">
      <p class="eyebrow">Aulas concluídas</p>
      <p class="num">${doneCount}</p>
      <p class="muted sm">${delivCount} ${delivCount === 1 ? "entrega feita" : "entregas feitas"}</p>
    </div>
  </section>

  <div class="two">
    <section class="card">
      <div class="card-head"><h3>Plano de 90 dias</h3><a href="#/plano" class="link">Ver plano ${ic("right")}</a></div>
      ${ph ? `
        <p class="eyebrow">Dia ${Math.min(day, 90)} de 90 · Dias ${ph.d}</p>
        <h4>${esc(ph.t)}</h4>
        <p>${esc(ph.what)}</p>
        <p class="muted sm">Critério: ${esc(ph.crit)}</p>
        ${bar(Math.min(1, day / 90))}`
      : `<p class="muted">O plano começa no dia em que você registrar o primeiro tempo de estudo, ou numa data que você definir.</p>
         <a class="btn" href="#/plano">${ic("cal")}Definir início</a>`}
    </section>
    <section class="card">
      <div class="card-head"><h3>Trilha</h3><a href="#/trilha" class="link">Abrir ${ic("right")}</a></div>
      <ul class="blist">
        ${BLOCKS.map(b => { const p = blockProgress(b); return `
          <li><a href="#/trilha#${b.id}">
            <span class="bn">${b.n}</span>
            <span class="bt">${esc(b.short)}${b.priority ? ' <em class="tag acc">prioridade</em>' : ""}${b.optional ? ' <em class="tag">opcional</em>' : ""}</span>
            <span class="bp">${p.deliv}/${p.mods}</span>
          </a>${bar(p.pct, "thin")}</li>`; }).join("")}
      </ul>
    </section>
  </div>`;
}

function viewTrack(el) {
  el.innerHTML = `
  <header class="page-head">
    <p class="eyebrow">Ordem de formação</p>
    <h1>Trilha</h1>
    <p class="lead">${ALL_MODULES.length} módulos em ${BLOCKS.length - 1} fases + opcionais. A ordem é uma sugestão: nada fica travado, mas cada módulo termina numa entrega.</p>
  </header>
  ${BLOCKS.map(b => { const p = blockProgress(b); return `
  <section class="block" id="${b.id}">
    <div class="block-head">
      <span class="block-n">${b.n}</span>
      <div>
        <h2>${esc(b.t)} ${b.priority ? '<em class="tag acc">prioridade</em>' : ""}${b.optional ? '<em class="tag">opcional</em>' : ""}</h2>
        <p class="muted">${esc(b.goal)} <b>Entrega da fase:</b> ${esc(b.deliverable)}.</p>
      </div>
      <span class="block-p">${p.deliv}/${p.mods}</span>
    </div>
    <ol class="mods">
      ${b.modules.map(m => { const mp = moduleProgress(m.id); return `
      <li class="${mp.delivered ? "ok" : ""}">
        <a href="#/modulo/${m.id}">
          <span class="mn">${mp.delivered ? ic("check") : m.code}</span>
          <span class="mt"><b>${esc(m.t)}</b><small>${esc(m.area)} · ${mp.total ? `${mp.done}/${mp.total} vídeos` : "sem vídeos ainda"}${m.aulas ? ` · roteiro pronto` : ""}</small></span>
          <span class="mbar">${bar(mp.pct, "thin")}</span>
          ${ic("right", "chev")}
        </a>
      </li>`; }).join("")}
    </ol>
  </section>`; }).join("")}`;
  const anchor = location.hash.split("#")[2];
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }), 50);
}

function viewModule(el, id) {
  const m = moduleById(id); if (!m) return (location.hash = "#/trilha");
  const b = blockById(m.block);
  const idx = ALL_MODULES.findIndex(x => x.id === id);
  const prev = ALL_MODULES[idx - 1], next = ALL_MODULES[idx + 1];

  const paint = () => {
    const st = S(), ls = lessonsOf(id), mp = moduleProgress(id);
    const dv = st.delivery[id] || { checks: {}, repo: "" };
    const checks = [m.entrega, ...DELIVERY_CHECKS];
    el.innerHTML = `
    <nav class="crumbs"><a href="#/trilha">Trilha</a> ${ic("right")} <a href="#/trilha#${b.id}">${b.n} · ${esc(b.short)}</a></nav>
    <header class="page-head">
      <p class="eyebrow">Módulo ${m.code} · ${esc(m.area)}</p>
      <h1>${esc(m.t)}</h1>
      <div class="chips">${m.topics.split(",").map(t => `<span class="chip">${esc(t.trim())}</span>`).join("")}</div>
    </header>

    <div class="mod-grid">
      <div class="col">
      ${m.aulas ? (() => { const rt = st.roteiro?.[id] || {}; const nOk = m.aulas.filter((_, i) => rt[i]).length; return `
      <section class="card roteiro">
        <div class="card-head">
          <h3>${ic("path")}O que aprender <small class="muted">${nOk}/${m.aulas.length}</small></h3>
          ${m.horas ? `<span class="tag">~${m.horas} h</span>` : ""}
        </div>
        <ol class="rt-list">
          ${m.aulas.map((a, i) => {
            const vids = ls.filter(l => l.ti === i);
            return `<li class="${rt[i] ? "ok" : ""}"><label><input type="checkbox" data-r="${i}" ${rt[i] ? "checked" : ""}><span class="rt-n">${i + 1}</span><span>${esc(a)}</span></label>
            ${vids.length ? `<div class="vids">${vids.map(l => `<a class="vchip ${st.done[l.id] ? "done" : ""} ${l.tipo ? "t-" + l.tipo : ""}" href="#/aula/${id}/${l.id}" title="${esc(l.title)}">${ic(st.done[l.id] ? "check" : "play")}<b>${esc(l.dur || "")}</b> ${esc(l.author || "")}${l.tipo === "a" ? ' <em>aprofundar</em>' : l.tipo === "en" ? ' <em>inglês</em>' : ""}</a>`).join("")}</div>` : ""}
            </li>`; }).join("")}
        </ol>
        ${m.pratica ? `<div class="rt-box"><p class="eyebrow">Prática</p><p>${esc(m.pratica)}</p></div>` : ""}
        ${m.crit ? `<div class="rt-box crit"><p class="eyebrow">Você aprendeu quando</p><p>${esc(m.crit)}</p></div>` : ""}
      </section>`; })() : `
      <section class="card roteiro pending-rt">
        <p class="muted sm">O roteiro detalhado deste módulo ainda vai ser montado. Por enquanto, os temas estão nas etiquetas acima.</p>
      </section>`}
      <section class="card">
        <div class="card-head">
          <h3>Aulas em vídeo <small class="muted">${mp.done}/${mp.total}</small></h3>
          ${ls.length ? `<button class="btn sm" id="editToggle">Organizar</button>` : ""}
        </div>
        ${ls.length ? `<ol class="lessons" id="lessons">
          ${ls.map((l, i) => `
          <li class="${st.done[l.id] ? "done" : ""}" data-id="${l.id}">
            <a href="#/aula/${id}/${l.id}">
              <span class="ln">${st.done[l.id] ? ic("check") : i + 1}</span>
              <span class="lt">${esc(l.title)}${st.notes[l.id]?.text ? ` <em class="tag">nota</em>` : ""}</span>
              ${ic("play", "lp")}
            </a>
            <span class="edit-tools">
              <button class="icon-btn" data-act="up" title="Subir">${ic("up")}</button>
              <button class="icon-btn" data-act="down" title="Descer">${ic("down")}</button>
              <button class="icon-btn danger" data-act="del" title="Remover">${ic("trash")}</button>
            </span>
          </li>`).join("")}
        </ol>` : `<div class="empty">
          <p><b>Nenhuma aula ainda.</b></p>
          <p class="muted">Cole abaixo o link de um vídeo ou de uma playlist do YouTube. Uma playlist entra inteira, na ordem dela.</p>
        </div>`}
        <form class="add" id="addForm">
          <label for="addUrl" class="sr">Link do YouTube</label>
          <input id="addUrl" type="text" inputmode="url" placeholder="Cole o link do vídeo ou da playlist do YouTube" autocomplete="off">
          <button class="btn primary" type="submit">${ic("plus")}Adicionar</button>
        </form>
        <p class="hint" id="addMsg"></p>
      </section>
      </div>

      <aside class="card deliver ${dv.doneAt ? "is-done" : ""}">
        <div class="card-head"><h3>${ic("flag")}Entrega</h3>${dv.doneAt ? `<em class="tag ok">entregue</em>` : ""}</div>
        <p class="deliv-main">${esc(m.entrega)}</p>
        <ul class="checks">
          ${checks.map((c, i) => `<li><label><input type="checkbox" data-i="${i}" ${dv.checks?.[i] ? "checked" : ""}><span>${esc(c)}</span></label></li>`).join("")}
        </ul>
        <label class="field"><span>Link do repositório ou demo</span>
          <input type="url" id="repo" placeholder="https://github.com/…" value="${esc(dv.repo || "")}"></label>
        ${dv.repo ? `<a class="link sm" href="${esc(dv.repo)}" target="_blank" rel="noopener">${ic("link")}Abrir link</a>` : ""}
        <button class="btn ${dv.doneAt ? "" : "primary"} full" id="deliverBtn">${dv.doneAt ? "Reabrir entrega" : ic("check") + "Marcar como entregue"}</button>
        <p class="muted sm">Referência: ${esc(m.ref)}</p>
      </aside>
    </div>

    <nav class="pager">
      ${prev ? `<a href="#/modulo/${prev.id}" class="btn ghost">${ic("left")}${prev.code}. ${esc(prev.t)}</a>` : "<span></span>"}
      ${next ? `<a href="#/modulo/${next.id}" class="btn ghost">${next.code}. ${esc(next.t)}${ic("right")}</a>` : ""}
    </nav>`;

    // roteiro do módulo
    $$(".rt-list input", el).forEach(cb => cb.addEventListener("change", () => {
      Store.update(s => { s.roteiro = s.roteiro || {}; s.roteiro[id] = s.roteiro[id] || {}; s.roteiro[id][cb.dataset.r] = cb.checked; });
      paint();
    }));

    // organizar aulas
    $("#editToggle", el)?.addEventListener("click", e => {
      $("#lessons", el).classList.toggle("editing");
      e.target.textContent = $("#lessons", el).classList.contains("editing") ? "Concluir" : "Organizar";
    });
    $$("#lessons [data-act]", el).forEach(btn => btn.addEventListener("click", e => {
      e.preventDefault();
      const lid = btn.closest("li").dataset.id, act = btn.dataset.act;
      Store.update(s => {
        const arr = s.lessons[id]; const i = arr.findIndex(l => l.id === lid);
        if (act === "del") { if (!confirm(`Remover "${arr[i].title}" deste módulo? A nota da aula também será apagada.`)) return; arr.splice(i, 1); delete s.done[lid]; delete s.notes[lid]; delete s.recall[lid]; }
        if (act === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        if (act === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      });
      paint(); $("#lessons", el)?.classList.add("editing"); const t = $("#editToggle", el); if (t) t.textContent = "Concluir";
    }));

    // adicionar aulas
    $("#addForm", el).addEventListener("submit", async e => {
      e.preventDefault();
      const input = $("#addUrl", el), msg = $("#addMsg", el), btn = $("button", e.target);
      const parsed = parseYouTube(input.value);
      if (!parsed) { msg.textContent = "Não reconheci esse link. Use um link de vídeo (youtube.com/watch?v=…) ou de playlist (…list=…)."; msg.className = "hint err"; return; }
      btn.disabled = true; msg.className = "hint"; msg.textContent = parsed.type === "playlist" ? "Lendo a playlist… pode levar uns 15 segundos." : "Buscando o vídeo…";
      try {
        let vids = parsed.type === "playlist" ? await playlistVideos(parsed.id) : [parsed.id];
        const existing = new Set(lessonsOf(id).map(l => l.vid));
        vids = vids.filter(v => !existing.has(v));
        if (!vids.length) { msg.textContent = "Essas aulas já estão no módulo."; return; }
        msg.textContent = `Buscando os títulos (${vids.length})…`;
        const titles = await Promise.all(vids.map(v => fetchTitle(v)));
        const base = lessonsOf(id).length;
        Store.update(s => {
          s.lessons[id] = s.lessons[id] || [];
          vids.forEach((v, i) => s.lessons[id].push({ id: uid(), vid: v, title: titles[i]?.title || `Aula ${base + i + 1}`, author: titles[i]?.author || "", addedAt: Date.now() }));
        });
        toast(vids.length === 1 ? "Aula adicionada" : `${vids.length} aulas adicionadas`, "ok");
        paint();
      } catch (err) {
        msg.textContent = err.message; msg.className = "hint err";
      } finally { btn.disabled = false; }
    });

    // entrega
    $$(".checks input", el).forEach(cb => cb.addEventListener("change", () => {
      Store.update(s => { s.delivery[id] = s.delivery[id] || { checks: {}, repo: "" }; s.delivery[id].checks[cb.dataset.i] = cb.checked; });
    }));
    $("#repo", el).addEventListener("change", e => {
      Store.update(s => { s.delivery[id] = s.delivery[id] || { checks: {}, repo: "" }; s.delivery[id].repo = e.target.value.trim(); });
      paint();
    });
    $("#deliverBtn", el).addEventListener("click", () => {
      const d = S().delivery[id] || { checks: {} };
      if (!d.doneAt) {
        const missing = checks.filter((_, i) => !d.checks?.[i]).length;
        if (missing && !confirm(`Faltam ${missing} ${missing === 1 ? "item" : "itens"} do checklist. Marcar como entregue mesmo assim?`)) return;
      }
      Store.update(s => { s.delivery[id] = s.delivery[id] || { checks: {}, repo: "" }; s.delivery[id].doneAt = s.delivery[id].doneAt ? null : Date.now(); });
      if (S().delivery[id].doneAt) toast("Entrega registrada. Bom trabalho!", "ok");
      paint();
    });
  };
  paint();
}

function viewLesson(el, mid, lid) {
  const m = moduleById(mid); const ls = lessonsOf(mid);
  const i = ls.findIndex(l => l.id === lid);
  if (!m || i < 0) return (location.hash = m ? `#/modulo/${mid}` : "#/trilha");
  const l = ls[i], prev = ls[i - 1], next = ls[i + 1];
  Store.update(s => { s.last = { moduleId: mid, lessonId: lid, at: Date.now() }; });
  const isDone = () => !!S().done[lid];

  el.innerHTML = `
  <nav class="crumbs"><a href="#/trilha">Trilha</a> ${ic("right")} <a href="#/modulo/${mid}">${m.code} · ${esc(m.t)}</a> ${ic("right")} <span>Aula ${i + 1} de ${ls.length}</span></nav>
  <div class="class-grid">
    <section class="player-col">
      <div class="player"><div id="yt"></div></div>
      <div class="lesson-bar">
        <div>
          <h1 class="lesson-title">${esc(l.title)}</h1>
          ${l.author ? `<p class="muted sm">${esc(l.author)}${l.dur ? " · " + esc(l.dur) : ""}${l.tipo === "a" ? ' · <em class="tag">aprofundar</em>' : l.tipo === "en" ? ' · <em class="tag">inglês · ative a legenda</em>' : ""}</p>` : ""}
          ${m.aulas && l.ti != null ? `<p class="sm topic-of">Tópico ${l.ti + 1}: ${esc(m.aulas[l.ti])}</p>` : ""}
        </div>
        <div class="row">
          ${prev ? `<a class="btn ghost" href="#/aula/${mid}/${prev.id}" title="Aula anterior">${ic("left")}<span class="hide-sm">Anterior</span></a>` : ""}
          <button class="btn ${isDone() ? "" : "primary"}" id="doneBtn">${isDone() ? ic("check") + "Concluída" : ic("check") + "Concluir aula"}</button>
          ${next ? `<a class="btn ghost" href="#/aula/${mid}/${next.id}" title="Próxima aula"><span class="hide-sm">Próxima</span>${ic("right")}</a>` : ""}
        </div>
      </div>
      ${S().recall[lid] ? `<div class="recall card"><p class="eyebrow">O que aprendi, em 3 frases</p><p>${esc(S().recall[lid])}</p></div>` : ""}
    </section>

    <aside class="notes card">
      <div class="card-head">
        <h3>${ic("book")}Bloco de notas</h3>
        <span class="muted sm" id="saved">salvo</span>
      </div>
      <textarea id="note" placeholder="Escreva com suas palavras o que entendeu. Use o botão abaixo para marcar o minuto do vídeo.">${esc(S().notes[lid]?.text || "")}</textarea>
      <div class="row">
        <button class="btn sm" id="stampBtn" title="Insere o minuto atual do vídeo">${ic("pin")}Marcar minuto</button>
        <span class="muted sm grow">As marcações viram atalhos para o vídeo.</span>
      </div>
      <div class="stamps" id="stamps"></div>
    </aside>
  </div>`;

  // player
  let player = null;
  loadYT().then(YT => {
    if (!$("#yt", el)) return;
    player = new YT.Player("yt", {
      host: "https://www.youtube-nocookie.com",
      videoId: l.vid,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: () => {
          // título real do vídeo, se ainda for o provisório
          const t = player.getVideoData?.().title;
          if (t && /^Aula \d+$/.test(l.title)) { Store.update(s => { const x = s.lessons[mid].find(y => y.id === lid); if (x) x.title = t; }); $(".lesson-title", el).textContent = t; }
        },
        onStateChange: e => { if (e.data === 0 && !isDone()) askRecall(); },
      },
    });
  }).catch(err => { $(".player", el).innerHTML = `<div class="empty"><p>${esc(err.message)}</p><p><a class="link" href="https://youtu.be/${l.vid}" target="_blank" rel="noopener">Abrir no YouTube</a></p></div>`; });

  // notas
  const ta = $("#note", el), saved = $("#saved", el);
  let tmo;
  const save = () => { Store.update(s => { s.notes[lid] = { text: ta.value, updatedAt: Date.now() }; if (!ta.value.trim()) delete s.notes[lid]; }); saved.textContent = "salvo"; paintStamps(); };
  ta.addEventListener("input", () => { saved.textContent = "salvando…"; clearTimeout(tmo); tmo = setTimeout(save, 600); });
  const paintStamps = () => {
    const found = [...ta.value.matchAll(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^\n]*)/g)];
    $("#stamps", el).innerHTML = found.map(f => `<button class="stamp" data-t="${f[1]}">${ic("play")}<b>${f[1]}</b> ${esc(f[2].slice(0, 60))}</button>`).join("");
    $$(".stamp", el).forEach(b => b.onclick = () => {
      const sec = b.dataset.t.split(":").reverse().reduce((a, v, k) => a + (+v) * 60 ** k, 0);
      player?.seekTo?.(sec, true); player?.playVideo?.();
    });
  };
  paintStamps();
  $("#stampBtn", el).onclick = () => {
    const t = player?.getCurrentTime ? fmtTime(player.getCurrentTime()) : "0:00";
    const pos = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, pos), after = ta.value.slice(pos);
    const ins = (before && !before.endsWith("\n") ? "\n" : "") + `[${t}] `;
    ta.value = before + ins + after; ta.focus();
    ta.selectionStart = ta.selectionEnd = pos + ins.length;
    save();
  };

  // concluir
  function askRecall() {
    modal(`
      <div class="card-head"><h3>Antes de concluir</h3><button class="btn ghost sm" data-close>Voltar à aula</button></div>
      <p class="muted">Sem olhar o vídeo: explique em até 3 frases o que você aprendeu. Recordar com as próprias palavras é o que fixa o conteúdo.</p>
      <textarea id="rc" rows="5" placeholder="1. … 2. … 3. …">${esc(S().recall[lid] || "")}</textarea>
      <div class="row end">
        <button class="btn ghost" id="skip">Pular</button>
        <button class="btn primary" id="ok">${ic("check")}Concluir${next ? " e ir para a próxima" : ""}</button>
      </div>`, (w, close) => {
      $("#rc", w).focus();
      const finish = withRecall => {
        Store.update(s => { s.done[lid] = Date.now(); if (withRecall && $("#rc", w).value.trim()) s.recall[lid] = $("#rc", w).value.trim(); });
        close(); toast("Aula concluída", "ok");
        location.hash = next ? `#/aula/${mid}/${next.id}` : `#/modulo/${mid}`;
      };
      $("#ok", w).onclick = () => finish(true);
      $("#skip", w).onclick = () => finish(false);
    }, { sticky: true });
  }
  $("#doneBtn", el).onclick = () => {
    if (isDone()) { Store.update(s => { delete s.done[lid]; }); route(); }
    else askRecall();
  };

  return () => { clearTimeout(tmo); if (ta.value !== (S().notes[lid]?.text || "")) save(); try { player?.destroy(); } catch {} };
}

function viewNotebook(el) {
  const paint = q => {
    const st = S(), qq = (q || "").toLowerCase();
    const groups = ALL_MODULES.map(m => ({ m, ls: lessonsOf(m.id).filter(l => {
      const n = st.notes[l.id]?.text || "", r = st.recall[l.id] || "";
      if (!n && !r) return false;
      return !qq || (n + r + l.title + m.t).toLowerCase().includes(qq);
    }) })).filter(g => g.ls.length);
    $("#nbList", el).innerHTML = groups.length ? groups.map(g => `
      <section class="nb-group">
        <h3><a href="#/modulo/${g.m.id}">${g.m.code} · ${esc(g.m.t)}</a></h3>
        ${g.ls.map(l => `
        <a class="nb-item card" href="#/aula/${g.m.id}/${l.id}">
          <b>${esc(l.title)}</b>
          ${st.recall[l.id] ? `<p class="nb-recall">${esc(st.recall[l.id])}</p>` : ""}
          ${st.notes[l.id]?.text ? `<p class="nb-text">${esc(st.notes[l.id].text.slice(0, 280))}${st.notes[l.id].text.length > 280 ? "…" : ""}</p>` : ""}
          <small class="muted">${st.notes[l.id]?.updatedAt ? "Editada em " + new Date(st.notes[l.id].updatedAt).toLocaleDateString("pt-BR") : ""}</small>
        </a>`).join("")}
      </section>`).join("")
      : `<div class="empty card"><p><b>${qq ? "Nada encontrado." : "Seu caderno está vazio."}</b></p><p class="muted">${qq ? "Tente outra palavra." : "As notas que você escreve nas aulas aparecem aqui, organizadas por módulo."}</p></div>`;
  };
  el.innerHTML = `
  <header class="page-head">
    <p class="eyebrow">Tudo que você escreveu</p>
    <h1>Caderno</h1>
  </header>
  <div class="row toolbar">
    <input type="search" id="nbSearch" class="grow" placeholder="Buscar nas notas…">
    <button class="btn" id="nbExport">${ic("dl")}Exportar para o Obsidian (.md)</button>
  </div>
  <div id="nbList"></div>`;
  $("#nbSearch", el).addEventListener("input", e => paint(e.target.value));
  $("#nbExport", el).onclick = () => exportNotesMarkdown(ALL_MODULES);
  paint("");
}

function viewPlan(el) {
  const paint = () => {
    const st = S(), day = planDay(), ph = planPhase(day);
    el.innerHTML = `
    <header class="page-head">
      <p class="eyebrow">Primeiro ciclo de aprendizagem</p>
      <h1>Plano de 90 dias</h1>
      <p class="lead">Seis quinzenas, cada uma termina em algo que funciona. Não é a formação inteira: é a largada.</p>
    </header>
    <div class="card row toolbar">
      <label class="field inline"><span>Início do plano</span>
        <input type="date" id="sd" value="${st.settings.startDate || ""}"></label>
      <span class="muted sm grow">${day ? `Hoje é o dia <b>${day}</b>${day > 90 ? " — ciclo de 90 dias encerrado" : ""}.` : "Sem data definida: começa no primeiro minuto de estudo registrado."}</span>
    </div>
    <ol class="timeline">
      ${PLAN90.map((p, i) => {
        const state = !ph ? "" : i < ph.i ? "past" : i === ph.i ? "now" : "";
        return `
        <li class="${state}">
          <span class="dot">${state === "past" ? ic("check") : i + 1}</span>
          <div class="card">
            <p class="eyebrow">Dias ${p.d}${state === "now" ? ' · <em class="tag acc">agora</em>' : ""}</p>
            <h3>${esc(p.t)}</h3>
            <p>${esc(p.what)}</p>
            <p class="muted sm"><b>Critério:</b> ${esc(p.crit)}</p>
            <div class="chips">${p.mods.map(id => { const m = moduleById(id), mp = moduleProgress(id); return `<a class="chip ${mp.delivered ? "ok" : ""}" href="#/modulo/${id}">${mp.delivered ? ic("check") : ""}${m.code} · ${esc(m.t)}</a>`; }).join("")}</div>
          </div>
        </li>`; }).join("")}
    </ol>`;
    $("#sd", el).addEventListener("change", e => { Store.update(s => { s.settings.startDate = e.target.value || null; }); paint(); });
  };
  paint();
}

function viewSettings(el) {
  const SQL = `create table if not exists public.mater_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.mater_state enable row level security;
revoke all on public.mater_state from anon;
grant select, insert, update on public.mater_state to authenticated;
create policy "cada um le o seu" on public.mater_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cada um grava o seu" on public.mater_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cada um atualiza o seu" on public.mater_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);`;

  const paint = () => {
    const st = S(), c = Sync.cfg() || {};
    el.innerHTML = `
    <header class="page-head"><p class="eyebrow">Preferências</p><h1>Ajustes</h1></header>

    <section class="card set">
      <h3>Estudo</h3>
      <div class="grid3">
        <label class="field"><span>Seu nome</span><input id="sName" value="${esc(st.settings.name || "")}" placeholder="Como quer ser chamado"></label>
        <label class="field"><span>Meta semanal (horas)</span><input id="sGoal" type="number" min="1" max="80" step="0.5" value="${st.settings.weeklyGoalMin / 60}"></label>
        <label class="field"><span>Foco / pausa (min)</span>
          <span class="row"><input id="sFocus" type="number" min="5" max="120" value="${st.settings.focusMin}"><input id="sBreak" type="number" min="1" max="60" value="${st.settings.breakMin}"></span></label>
      </div>
    </section>

    <section class="card set">
      <div class="card-head"><h3>${ic("cloud")}Sincronização entre PC e celular</h3><span class="pill" data-s="${Sync.status}">${SYNC_LABEL[Sync.status]}</span></div>
      ${Sync.msg ? `<p class="hint err">${esc(Sync.msg)}</p>` : ""}
      ${Sync.client && Sync.user ? `
        <p>Conectado como <b>${esc(Sync.user.email)}</b>. Tudo que você faz aqui aparece no outro aparelho.</p>
        <div class="row"><button class="btn" id="pullBtn">${ic("reset")}Sincronizar agora</button><button class="btn ghost" id="outBtn">Sair</button></div>`
      : Sync.client ? `
        <p>Entre com seu e-mail. Vai chegar um link de acesso, sem senha.</p>
        <form class="row" id="loginForm"><input type="email" id="email" class="grow" required placeholder="seu@email.com"><button class="btn primary">Enviar link</button></form>`
      : `
        <p class="muted">Hoje seu progresso fica só neste aparelho. Para usar no PC e no celular, conecte um projeto gratuito do Supabase:</p>
        <ol class="steps">
          <li>Crie a conta e um projeto em <b>supabase.com</b>.</li>
          <li>Em <b>SQL Editor</b>, rode o código abaixo (cria a tabela protegida).</li>
          <li>Em <b>Authentication → URL Configuration</b>, coloque o endereço deste site em <i>Site URL</i>.</li>
          <li>Em <b>Project Settings → API</b>, copie a <i>Project URL</i> e a chave <i>anon public</i> e cole aqui.</li>
        </ol>
        <details><summary>Código SQL</summary><pre class="code" id="sql">${esc(SQL)}</pre><button class="btn sm" id="copySql">Copiar SQL</button></details>
        <form class="sync-form" id="cfgForm">
          <label class="field"><span>Project URL</span><input id="cUrl" required placeholder="https://xxxx.supabase.co" value="${esc(c.url || "")}"></label>
          <label class="field"><span>Chave anon public</span><input id="cKey" required placeholder="eyJ…" value="${esc(c.key || "")}"></label>
          <button class="btn primary">Conectar</button>
        </form>`}
      ${Sync.client && localStorage.getItem("mater-academy:sync") ? `<p class="muted sm"><button class="link-btn" id="unCfg">Desconectar este Supabase</button></p>` : ""}
    </section>

    <section class="card set">
      <h3>Backup</h3>
      <p class="muted">Guarde uma cópia de tudo (aulas, notas, entregas e horas) num arquivo.</p>
      <div class="row wrap">
        <button class="btn" id="bkExp">${ic("dl")}Baixar backup</button>
        <label class="btn">${ic("ul")}Restaurar backup<input type="file" id="bkImp" accept=".json,application/json" hidden></label>
        <button class="btn" id="mdExp">${ic("book")}Exportar caderno (.md)</button>
      </div>
    </section>

    <section class="card set danger-zone">
      <h3>Zerar tudo</h3>
      <p class="muted">Apaga aulas, notas, entregas e horas deste aparelho${Sync.user ? " e da nuvem" : ""}. Baixe um backup antes.</p>
      <button class="btn danger" id="wipe">${ic("trash")}Zerar meus dados</button>
    </section>`;

    const num = (v, d) => (isFinite(+v) && +v > 0 ? +v : d);
    $("#sName", el).onchange = e => Store.update(s => { s.settings.name = e.target.value.trim(); });
    $("#sGoal", el).onchange = e => Store.update(s => { s.settings.weeklyGoalMin = Math.round(num(e.target.value, 10) * 60); });
    $("#sFocus", el).onchange = e => { Store.update(s => { s.settings.focusMin = num(e.target.value, 50); }); if (!Timer.st.running) Timer.reset(); };
    $("#sBreak", el).onchange = e => { Store.update(s => { s.settings.breakMin = num(e.target.value, 10); }); if (!Timer.st.running) Timer.reset(); };

    $("#copySql", el)?.addEventListener("click", () => navigator.clipboard?.writeText(SQL).then(() => toast("SQL copiado", "ok")));
    $("#cfgForm", el)?.addEventListener("submit", async e => {
      e.preventDefault();
      Sync.saveCfg({ url: $("#cUrl", el).value.trim().replace(/\/$/, ""), key: $("#cKey", el).value.trim() });
      await Sync.init(); paint();
    });
    $("#loginForm", el)?.addEventListener("submit", async e => {
      e.preventDefault();
      try { await Sync.login($("#email", el).value.trim()); toast("Link enviado. Abra seu e-mail neste aparelho.", "ok"); }
      catch (err) { toast(err.message, "err"); }
    });
    $("#pullBtn", el)?.addEventListener("click", async () => { await Sync.pull(); paint(); });
    $("#outBtn", el)?.addEventListener("click", async () => { await Sync.logout(); paint(); });
    $("#unCfg", el)?.addEventListener("click", () => { if (!confirm("Desconectar? Seus dados continuam neste aparelho e na nuvem.")) return; Sync.saveCfg(null); Sync.client = null; Sync.user = null; Sync.set("local"); paint(); });

    $("#bkExp", el).onclick = exportBackup;
    $("#mdExp", el).onclick = () => exportNotesMarkdown(ALL_MODULES);
    $("#bkImp", el).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || typeof data !== "object" || !("lessons" in data)) throw new Error("Arquivo não parece um backup da Mater Academy.");
        if (!confirm("Substituir os dados atuais por este backup?")) return;
        Store.replace(data, true); toast("Backup restaurado", "ok"); paint();
      } catch (err) { toast(err.message, "err"); }
    };
    $("#wipe", el).onclick = () => {
      if (!confirm("Apagar TODOS os seus dados de estudo? Isso não pode ser desfeito.")) return;
      Store.reset(); toast("Dados zerados"); paint();
    };
  };
  paint();
  const off = () => Sync.listeners.delete(paint);
  Sync.listeners.add(paint);
  return off;
}

// ---------- aulas curadas (data.js) ----------
// Entram uma única vez em cada módulo; se você remover uma, ela não volta (fica marcada em "seeded").
function seedCurated() {
  const st = S(), missing = [];
  for (const m of ALL_MODULES) for (const v of m.videos || []) {
    const key = m.id + ":" + v[1];
    if (!st.seeded?.[key]) missing.push([m.id, key, v]);
  }
  if (!missing.length) return;
  Store.update(s => {
    s.seeded = s.seeded || {};
    for (const [mid, key, [ti, vid, dur, author, title, tipo]] of missing) {
      s.lessons[mid] = s.lessons[mid] || [];
      if (!s.lessons[mid].some(l => l.vid === vid))
        s.lessons[mid].push({ id: "c" + vid.replace(/\W/g, "_"), vid, title, author, dur, ti, tipo, addedAt: Date.now() });
      s.seeded[key] = Date.now();
    }
  });
}

// ---------- inicialização ----------
function boot() {
  let saved = null; try { saved = localStorage.getItem(THEME_KEY); } catch {}
  applyTheme(saved);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { let t = null; try { t = localStorage.getItem(THEME_KEY); } catch {} if (!t) applyTheme(null); });
  $("#themeBtn").onclick = toggleTheme;

  Timer.load(); Timer.paint();
  $("#timerBtn").onclick = timerPanel;
  setInterval(() => Timer.tick(), 1000);

  Sync.listeners.add(paintSync); paintSync();
  $("#syncBtn").onclick = () => (location.hash = "#/ajustes");
  // quando chegam dados da nuvem, redesenha (menos na sala de aula, para não atrapalhar a digitação)
  addEventListener("mater:remote", () => { seedCurated(); if (!location.hash.startsWith("#/aula") && !location.hash.startsWith("#/ajustes")) route(); Timer.paint(); });
  Sync.init();

  seedCurated();
  addEventListener("hashchange", route);
  route();
}
boot();
