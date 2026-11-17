// Estado do usuário: salvo no aparelho (localStorage) e, se configurado, sincronizado no Supabase.
const KEY = "mater-academy:v1";
const CFG_KEY = "mater-academy:sync";

const blank = () => ({
  v: 1,
  updatedAt: 0,
  settings: { weeklyGoalMin: 600, focusMin: 50, breakMin: 10, startDate: null },
  lessons: {},      // moduleId -> [{ id, vid, title, addedAt }]
  done: {},         // lessonId -> ts
  notes: {},        // lessonId -> { text, updatedAt }
  recall: {},       // lessonId -> texto "explique em 3 frases"
  roteiro: {},      // moduleId -> { i: true } tópicos do roteiro estudados
  delivery: {},     // moduleId -> { checks: {i: true}, repo: "", doneAt }
  activity: {},     // "YYYY-MM-DD" -> minutos estudados
  last: null,       // { moduleId, lessonId, at }
});

let state = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch (e) { /* armazenamento indisponível */ }
  return blank();
}

function persist(touch = true) {
  if (touch) state.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  subs.forEach(fn => fn(state));
  if (touch) Sync.schedulePush();
}

export const Store = {
  get: () => state,
  on: fn => (subs.add(fn), () => subs.delete(fn)),
  update(fn) { fn(state); persist(); },
  replace(next, touch = false) { state = { ...blank(), ...next }; persist(touch); },
  reset() { state = blank(); persist(); },
};

// ---------- utilidades de data ----------
export const today = (d = new Date()) => {
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export function weekMinutes() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // segunda = 0
  let total = 0;
  for (let i = 0; i <= dow; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    total += state.activity[today(d)] || 0;
  }
  return total;
}

export function streak() {
  let n = 0;
  const d = new Date();
  if (!state.activity[today(d)]) d.setDate(d.getDate() - 1); // hoje ainda pode contar
  while (state.activity[today(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function addMinutes(min) {
  Store.update(s => {
    const k = today();
    s.activity[k] = (s.activity[k] || 0) + min;
    if (!s.settings.startDate) s.settings.startDate = k;
  });
}

// ---------- aulas ----------
export const lessonsOf = moduleId => state.lessons[moduleId] || [];

export function moduleProgress(moduleId) {
  const ls = lessonsOf(moduleId);
  const done = ls.filter(l => state.done[l.id]).length;
  const delivered = !!state.delivery[moduleId]?.doneAt;
  return { total: ls.length, done, delivered, pct: ls.length ? done / ls.length : 0 };
}

// ---------- sincronização (Supabase) ----------
// Tabela esperada: mater_state(user_id uuid PK, data jsonb, updated_at timestamptz) com RLS por usuário.
export const Sync = {
  client: null,
  user: null,
  status: "local", // local | conectando | sincronizado | enviando | erro | sem-login
  listeners: new Set(),
  timer: null,

  cfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY) || "null"); } catch { return null; } },
  saveCfg(c) { try { c ? localStorage.setItem(CFG_KEY, JSON.stringify(c)) : localStorage.removeItem(CFG_KEY); } catch {} },
  set(status, msg = "") { this.status = status; this.msg = msg; this.listeners.forEach(f => f(status, msg)); },

  async init() {
    const c = this.cfg();
    if (!c?.url || !c?.key) return this.set("local");
    this.set("conectando");
    try {
      if (!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
      this.client = window.supabase.createClient(c.url, c.key);
      const { data } = await this.client.auth.getSession();
      this.user = data.session?.user || null;
      this.client.auth.onAuthStateChange((_e, session) => {
        const was = this.user?.id;
        this.user = session?.user || null;
        if (this.user && this.user.id !== was) this.pull();
        if (!this.user) this.set("sem-login");
      });
      if (this.user) await this.pull(); else this.set("sem-login");
    } catch (e) {
      this.set("erro", e.message || String(e));
    }
  },

  async login(email) {
    if (!this.client) throw new Error("Supabase não configurado");
    const redirect = location.origin + location.pathname;
    const { error } = await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) throw error;
  },

  async logout() { await this.client?.auth.signOut(); this.user = null; this.set("sem-login"); },

  async pull() {
    if (!this.client || !this.user) return;
    this.set("conectando");
    const { data, error } = await this.client.from("mater_state").select("data, updated_at").eq("user_id", this.user.id).maybeSingle();
    if (error) return this.set("erro", error.message);
    const remote = data?.data;
    if (remote && (remote.updatedAt || 0) > (state.updatedAt || 0)) {
      Store.replace(remote, false);
      this.set("sincronizado");
      window.dispatchEvent(new Event("mater:remote"));
    } else {
      await this.push();
    }
  },

  schedulePush() {
    if (!this.client || !this.user) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), 1500);
  },

  async push() {
    if (!this.client || !this.user) return;
    this.set("enviando");
    const { error } = await this.client.from("mater_state").upsert({
      user_id: this.user.id, data: state, updated_at: new Date(state.updatedAt || Date.now()).toISOString(),
    });
    this.set(error ? "erro" : "sincronizado", error?.message || "");
  },
};

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("Falha ao carregar " + src));
    document.head.appendChild(s);
  });
}

// Sincroniza de novo quando o app volta a ficar visível (ex.: trocou do celular pro PC).
document.addEventListener("visibilitychange", () => { if (!document.hidden) Sync.pull(); });

// ---------- backup ----------
export function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  download(blob, `mater-academy-backup-${today()}.json`);
}

export function exportNotesMarkdown(ALL_MODULES) {
  let md = `# Mater Academy — Caderno\n\nExportado em ${today()}\n`;
  for (const m of ALL_MODULES) {
    const ls = lessonsOf(m.id).filter(l => state.notes[l.id]?.text || state.recall[l.id]);
    if (!ls.length) continue;
    md += `\n## ${m.code}. ${m.t}\n`;
    for (const l of ls) {
      md += `\n### ${l.title}\n\nVídeo: https://youtu.be/${l.vid}\n\n`;
      if (state.recall[l.id]) md += `> **Em 3 frases:** ${state.recall[l.id]}\n\n`;
      if (state.notes[l.id]?.text) md += state.notes[l.id].text + "\n";
    }
  }
  download(new Blob([md], { type: "text/markdown" }), `mater-academy-caderno-${today()}.md`);
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
