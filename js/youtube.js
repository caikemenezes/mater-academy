// YouTube: ler links, carregar o player oficial (IFrame API), importar playlists e buscar títulos.

export function parseYouTube(input) {
  const s = input.trim();
  if (!s) return null;
  let url;
  try { url = new URL(s.startsWith("http") ? s : "https://" + s); } catch { url = null; }
  if (!url) {
    if (/^PL[\w-]{10,}$/.test(s)) return { type: "playlist", id: s };
    if (/^[\w-]{11}$/.test(s)) return { type: "video", id: s };
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const list = url.searchParams.get("list");
  let vid = null;
  if (host === "youtu.be") vid = url.pathname.slice(1, 12);
  else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    vid = url.searchParams.get("v");
    const m = url.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
    if (!vid && m) vid = m[2];
  }
  if (list && (!vid || url.pathname === "/playlist")) return { type: "playlist", id: list };
  if (vid && /^[\w-]{11}$/.test(vid)) return { type: "video", id: vid, list };
  return null;
}

let apiPromise = null;
export function loadYT() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((res, rej) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); res(window.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { apiPromise = null; rej(new Error("Não consegui carregar o YouTube. Confira a internet.")); };
    document.head.appendChild(s);
  });
  return apiPromise;
}

// Título do vídeo pelo oEmbed público do YouTube (sem chave).
export async function fetchTitle(vid) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + vid)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return { title: j.title, author: j.author_name };
  } catch { return null; }
}

// Descobre os IDs dos vídeos de uma playlist com um player escondido.
export async function playlistVideos(listId) {
  const YT = await loadYT();
  return new Promise((resolve, reject) => {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:180px;";
    const inner = document.createElement("div");
    host.appendChild(inner); document.body.appendChild(host);
    let tries = 0, player;
    const done = (fn, v) => { try { player?.destroy(); } catch {} host.remove(); fn(v); };
    const poll = () => {
      const ids = player?.getPlaylist?.();
      if (ids?.length) return done(resolve, ids);
      if (++tries > 120) return done(reject, new Error("Playlist não encontrada ou privada."));
      setTimeout(poll, 250);
    };
    player = new YT.Player(inner, {
      host: "https://www.youtube-nocookie.com",
      playerVars: { listType: "playlist", list: listId, autoplay: 0 },
      events: { onReady: poll, onError: () => done(reject, new Error("O YouTube recusou essa playlist.")) },
    });
  });
}

export const fmtTime = s => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const z = n => String(n).padStart(2, "0");
  return h ? `${h}:${z(m)}:${z(x)}` : `${m}:${z(x)}`;
};
