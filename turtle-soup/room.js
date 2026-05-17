import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const config = window.TURTLE_CONFIG || {};
const roomNameKey = "turtleSoupRoomName:v1";
const roomRememberKey = "turtleSoupLastRoom:v1";
const clientId = crypto.randomUUID();
const supabase = config.supabaseUrl && config.supabaseAnonKey
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const room = {
  active: false,
  code: "",
  name: localStorage.getItem(roomNameKey) || "",
  channel: null,
  seen: new Set(),
  messages: [],
  history: [],
  progress: 0,
  busy: false,
  applyingRemotePuzzle: false,
  synced: false,
  puzzleId: "",
};

const els = {
  panel: document.querySelector("#roomPanel"),
  status: document.querySelector("#roomStatus"),
  name: document.querySelector("#playerNameInput"),
  code: document.querySelector("#roomCodeInput"),
  create: document.querySelector("#createRoomBtn"),
  join: document.querySelector("#joinRoomBtn"),
  copy: document.querySelector("#copyRoomBtn"),
  leave: document.querySelector("#leaveRoomBtn"),
  questionForm: document.querySelector("#questionForm"),
  questionInput: document.querySelector("#questionInput"),
  guessForm: document.querySelector("#guessForm"),
  guessInput: document.querySelector("#guessInput"),
  log: document.querySelector("#log"),
  title: document.querySelector("#title"),
  surface: document.querySelector("#surfaceText"),
  progress: document.querySelector("#progress"),
};

let puzzles = [];
let puzzleObserverTimer = 0;

boot();

async function boot() {
  if (!els.panel || !supabase) {
    setStatus("房间不可用");
    return;
  }

  injectRoomStyles();
  els.name.value = room.name;
  els.code.value = getRoomFromUrl() || localStorage.getItem(roomRememberKey) || "";
  bindRoomEvents();
  puzzles = await loadPuzzles();
  watchPuzzleChanges();

  const urlRoom = getRoomFromUrl();
  if (urlRoom) joinRoom(urlRoom);
}

function bindRoomEvents() {
  els.create.addEventListener("click", () => joinRoom(makeRoomCode()));
  els.join.addEventListener("click", () => joinRoom(els.code.value));
  els.copy.addEventListener("click", copyRoomLink);
  els.leave.addEventListener("click", leaveRoom);
  els.name.addEventListener("change", () => {
    room.name = cleanName(els.name.value);
    els.name.value = room.name;
    localStorage.setItem(roomNameKey, room.name);
  });

  els.questionForm.addEventListener("submit", (event) => {
    if (!room.active) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const question = els.questionInput.value.trim();
    if (!question) return;
    els.questionInput.value = "";
    submitRoomTurn({ question });
  }, true);

  els.guessForm.addEventListener("submit", (event) => {
    if (!room.active) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const finalGuess = els.guessInput.value.trim();
    if (!finalGuess) return;
    submitRoomTurn({ finalGuess });
  }, true);
}

async function joinRoom(rawCode) {
  const code = cleanRoomCode(rawCode);
  if (!code || !supabase) return;

  if (room.channel) await supabase.removeChannel(room.channel);

  room.active = true;
  room.code = code;
  room.name = cleanName(els.name.value) || room.name || `玩家${Math.floor(Math.random() * 90 + 10)}`;
  room.channel = supabase.channel(`turtle-soup-room:${code}`, {
    config: { broadcast: { self: false } },
  });
  room.seen = new Set();
  room.messages = [];
  room.history = [];
  room.progress = 0;
  room.busy = false;
  room.synced = false;
  room.puzzleId = getCurrentPuzzle()?.id || "";

  localStorage.setItem(roomNameKey, room.name);
  localStorage.setItem(roomRememberKey, code);
  els.name.value = room.name;
  els.code.value = code;
  setUrlRoom(code);

  room.channel
    .on("broadcast", { event: "room_event" }, ({ payload }) => handleRoomEvent(payload))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setStatus(`房间 ${code}`);
        setRoomControls(true);
        pushSystem(`${room.name} 已进入房间。`);
        broadcast({ type: "join", name: room.name });
        broadcast({ type: "sync_request", name: room.name });
        broadcastPuzzle();
      } else {
        setStatus("连接中");
      }
    });
}

async function leaveRoom() {
  if (!room.active) return;
  broadcast({ type: "leave", name: room.name });
  if (room.channel) await supabase.removeChannel(room.channel);
  room.active = false;
  room.channel = null;
  room.code = "";
  room.busy = false;
  localStorage.removeItem(roomRememberKey);
  setUrlRoom("");
  setRoomControls(false);
  setStatus("单人");
  setBusy(false);
  pushSystem("已离开房间，当前页面可以继续单人玩。");
}

async function submitRoomTurn(payload) {
  if (room.busy) {
    pushSystem("上一轮还在判定中，稍等一下。");
    return;
  }

  const puzzle = getCurrentPuzzle();
  if (!puzzle) {
    pushSystem("题目还没加载完成。");
    return;
  }

  room.puzzleId = puzzle.id;
  const playerText = payload.finalGuess ? `假说：${payload.finalGuess}` : payload.question;
  const userMessage = {
    type: "user",
    name: room.name,
    text: playerText,
    rawText: payload.finalGuess || payload.question,
    isGuess: Boolean(payload.finalGuess),
  };

  room.busy = true;
  room.messages.push(userMessage);
  renderRoomMessages();
  setBusy(true, payload.finalGuess ? "判定中" : "提问中");
  broadcast({ type: "user", puzzleId: puzzle.id, message: userMessage });

  try {
    const result = await askRoomHost(puzzle.id, payload);
    applyRoomHostResult(result, userMessage);
    broadcast({
      type: "host",
      puzzleId: puzzle.id,
      result,
      playerText: userMessage.rawText,
      isGuess: userMessage.isGuess,
      progress: room.progress,
      history: room.history,
      messages: room.messages,
    });
  } catch (error) {
    const result = aiErrorResult(error);
    applyRoomHostResult(result, userMessage);
    broadcast({ type: "host", puzzleId: puzzle.id, result, playerText: userMessage.rawText, isGuess: userMessage.isGuess });
  } finally {
    room.busy = false;
    setBusy(false);
  }
}

async function askRoomHost(puzzleId, payload) {
  const endpoint = `${config.supabaseUrl}/functions/v1/${config.askFunction || "ask-turtle"}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
    body: JSON.stringify({
      puzzleId,
      history: room.history,
      hostMode: getHostMode(),
      ...payload,
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.json()).error || "";
    } catch (_) {}
    throw new Error(detail || "AI 裁判请求失败");
  }
  return response.json();
}

function handleRoomEvent(event) {
  if (!event || event.senderId === clientId || room.seen.has(event.id)) return;
  room.seen.add(event.id);

  if (event.type === "join") {
    pushSystem(`${event.name || "有人"} 进入了房间。`);
    sendSyncState();
    return;
  }
  if (event.type === "leave") {
    pushSystem(`${event.name || "有人"} 离开了房间。`);
    return;
  }
  if (event.type === "sync_request") {
    sendSyncState();
    return;
  }
  if (event.type === "sync_state") {
    if (!room.synced && Array.isArray(event.messages)) applySyncState(event);
    return;
  }
  if (event.type === "puzzle" && event.puzzleId) {
    applyRemotePuzzle(event.puzzleId);
    return;
  }
  if (event.type === "user" && event.message) {
    room.busy = true;
    if (event.puzzleId) applyRemotePuzzle(event.puzzleId);
    room.messages.push(event.message);
    renderRoomMessages();
    setBusy(true, "等待中");
    return;
  }
  if (event.type === "host" && event.result) {
    room.busy = false;
    if (event.puzzleId) applyRemotePuzzle(event.puzzleId);
    applyRoomHostResult(event.result, {
      rawText: event.playerText,
      isGuess: Boolean(event.isGuess),
    });
    setBusy(false);
  }
}

function applyRoomHostResult(result, userMessage) {
  const answer = result.answer || "无法判断";
  const hint = result.hint ? ` ${result.hint}` : "";
  room.messages.push({ type: "host", html: `<span class="tag">${escapeHtml(answer)}</span>${escapeHtml(hint)}` });
  room.history.push({
    answer,
    hint: result.hint || "",
    question: userMessage.rawText || "",
  });

  if (Number.isFinite(result.progress)) {
    room.progress = Math.max(room.progress, Math.min(100, Math.round(result.progress)));
    els.progress.textContent = `${room.progress}%`;
  }

  renderRoomMessages();
  if (result.shouldReveal) revealRoomSolution(result.solution);
}

function renderRoomMessages() {
  els.log.innerHTML = "";
  room.messages.forEach((message) => appendRoomBubble(message));
  els.log.parentElement.scrollTop = els.log.parentElement.scrollHeight;
}

function appendRoomBubble(message) {
  const item = document.createElement("div");
  item.className = `bubble ${message.type}`;

  if (message.type === "user") {
    item.textContent = `${message.name || "玩家"}：${message.text || ""}`;
  } else if (message.html) {
    item.innerHTML = message.html;
  } else {
    item.textContent = message.text || "";
  }
  els.log.appendChild(item);
}

function pushSystem(text) {
  if (!els.log) return;
  const item = document.createElement("div");
  item.className = "bubble system";
  item.textContent = text;
  els.log.appendChild(item);
  els.log.parentElement.scrollTop = els.log.parentElement.scrollHeight;
}

function sendSyncState() {
  if (!room.active || !room.channel) return;
  broadcast({
    type: "sync_state",
    puzzleId: getCurrentPuzzle()?.id || room.puzzleId,
    messages: room.messages,
    history: room.history,
    progress: room.progress,
  });
}

function applySyncState(event) {
  room.synced = true;
  if (event.puzzleId) applyRemotePuzzle(event.puzzleId);
  room.messages = event.messages || [];
  room.history = event.history || [];
  room.progress = Number(event.progress || 0);
  els.progress.textContent = `${room.progress}%`;
  renderRoomMessages();
  pushSystem("已同步房间进度。");
}

function broadcastPuzzle() {
  const puzzle = getCurrentPuzzle();
  if (!room.active || !puzzle || room.applyingRemotePuzzle) return;
  room.puzzleId = puzzle.id;
  room.messages = [];
  room.history = [];
  room.progress = 0;
  broadcast({ type: "puzzle", puzzleId: puzzle.id, title: puzzle.title });
}

function applyRemotePuzzle(puzzleId) {
  if (!puzzleId || getCurrentPuzzle()?.id === puzzleId) return;
  const puzzle = puzzles.find((item) => item.id === puzzleId);
  if (!puzzle) return;

  room.applyingRemotePuzzle = true;
  const card = [...document.querySelectorAll(".puzzle-card")].find((item) => {
    return item.querySelector("strong")?.textContent === puzzle.title;
  });
  card?.click();
  room.puzzleId = puzzleId;
  room.applyingRemotePuzzle = false;
}

function watchPuzzleChanges() {
  const title = document.querySelector("#title");
  if (!title) return;
  new MutationObserver(() => {
    if (!room.active || room.applyingRemotePuzzle) return;
    window.clearTimeout(puzzleObserverTimer);
    puzzleObserverTimer = window.setTimeout(broadcastPuzzle, 120);
  }).observe(title, { childList: true, characterData: true, subtree: true });
}

async function loadPuzzles() {
  const endpoint = `${config.supabaseUrl}/rest/v1/turtle_puzzles?select=id,title,surface,difficulty,tags&is_published=eq.true&order=created_at.desc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });
  if (!response.ok) return [];
  return response.json();
}

function getCurrentPuzzle() {
  const title = els.title?.textContent || "";
  const surface = els.surface?.textContent || "";
  return puzzles.find((puzzle) => puzzle.title === title && puzzle.surface === surface)
    || puzzles.find((puzzle) => puzzle.title === title);
}

function broadcast(payload) {
  if (!room.channel) return;
  const event = {
    id: crypto.randomUUID(),
    senderId: clientId,
    sentAt: Date.now(),
    ...payload,
  };
  room.channel.send({
    type: "broadcast",
    event: "room_event",
    payload: event,
  });
}

function copyRoomLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", room.code);
  navigator.clipboard?.writeText(url.toString());
  setStatus("链接已复制");
  window.setTimeout(() => setStatus(`房间 ${room.code}`), 1200);
}

function setRoomControls(active) {
  els.create.disabled = active;
  els.join.disabled = active;
  els.code.disabled = active;
  els.copy.disabled = !active;
  els.leave.disabled = !active;
  els.panel.classList.toggle("is-room-active", active);
}

function setBusy(isBusy, label) {
  room.busy = isBusy;
  const questionButton = els.questionForm.querySelector("button");
  const guessButton = els.guessForm.querySelector("button");
  els.questionInput.disabled = isBusy;
  els.guessInput.disabled = isBusy;
  questionButton.disabled = isBusy;
  guessButton.disabled = isBusy;
  questionButton.textContent = isBusy ? label || "等待中" : "提问";
  guessButton.textContent = isBusy ? label || "等待中" : "提交假说";
}

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function getHostMode() {
  return document.querySelector(".mode.is-active")?.dataset.hostMode || "standard";
}

function aiErrorResult(error) {
  const message = String(error?.message || "").toLowerCase();
  let hint = "AI 裁判暂时不可用，请稍后再试。";
  if (message.includes("rate") || message.includes("429") || message.includes("quota")) {
    hint = "当前模型触发频率限制，等一会儿再问。";
  } else if (message.includes("model") || message.includes("invalid_argument")) {
    hint = "模型配置可能不对，需要检查 Supabase 的 AI_MODEL。";
  }
  return { answer: "暂时失败", hint, progress: room.progress, shouldReveal: false };
}

function revealRoomSolution(solution) {
  document.querySelector("#revealText").textContent = solution || "已还原真相。";
  document.querySelector("#revealTitle").textContent = els.title.textContent || "汤底";
  document.querySelector("#revealDialog").showModal();
}

function setUrlRoom(code) {
  const url = new URL(window.location.href);
  if (code) {
    url.searchParams.set("room", code);
  } else {
    url.searchParams.delete("room");
  }
  history.replaceState(null, "", url);
}

function getRoomFromUrl() {
  return cleanRoomCode(new URL(window.location.href).searchParams.get("room") || "");
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function cleanRoomCode(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}

function cleanName(value) {
  return String(value || "").trim().slice(0, 12);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function injectRoomStyles() {
  if (document.querySelector("#roomStyles")) return;
  const style = document.createElement("style");
  style.id = "roomStyles";
  style.textContent = `
    .sidebar { grid-template-rows: auto auto auto minmax(0, 1fr); }
    .room-panel { margin-bottom: 18px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,255,255,.035); display: grid; gap: 9px; }
    .room-head, .room-code-row, .room-actions { display: flex; align-items: center; gap: 7px; }
    .room-head { justify-content: space-between; }
    .room-head strong { font-size: 14px; }
    .room-head span { color: var(--accent-2); font-size: 12px; }
    .room-panel input { min-height: 34px; padding: 0 10px; font-size: 13px; }
    .room-code-row input { min-width: 0; text-transform: uppercase; }
    .room-panel button { min-height: 34px; padding: 0 10px; border-radius: 7px; background: var(--panel); color: var(--muted); font-size: 13px; }
    .room-panel button:not(:disabled):hover, .room-panel.is-room-active #copyRoomBtn { background: rgba(127,208,195,.16); color: var(--accent-2); }
    .room-actions { display: grid; grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 860px) { .sidebar { grid-template-rows: auto auto auto auto; } }
  `;
  document.head.appendChild(style);
}
