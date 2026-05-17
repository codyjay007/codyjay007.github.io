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
  messages: [],
  dbRoom: null,
  progress: 0,
  busy: false,
  applyingRemotePuzzle: false,
  puzzleId: "",
  lastRenderKey: "",
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
let refreshTimer = 0;

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
  if (urlRoom) joinRoom(urlRoom, { createIfMissing: true });
}

function bindRoomEvents() {
  els.create.addEventListener("click", () => joinRoom(makeRoomCode(), { createIfMissing: true }));
  els.join.addEventListener("click", () => joinRoom(els.code.value, { createIfMissing: true }));
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
    els.guessInput.value = "";
    submitRoomTurn({ finalGuess });
  }, true);
}

async function joinRoom(rawCode, options = {}) {
  const code = cleanRoomCode(rawCode);
  if (!code || !supabase) return;

  setStatus("连接中");
  if (room.channel) await supabase.removeChannel(room.channel);

  room.active = true;
  room.code = code;
  room.name = cleanName(els.name.value) || room.name || `玩家${Math.floor(Math.random() * 90 + 10)}`;
  room.messages = [];
  room.dbRoom = null;
  room.puzzleId = getCurrentPuzzle()?.id || "";
  room.lastRenderKey = "";
  localStorage.setItem(roomNameKey, room.name);
  localStorage.setItem(roomRememberKey, code);
  els.name.value = room.name;
  els.code.value = code;
  setUrlRoom(code);
  setRoomControls(true);

  const currentPuzzle = getCurrentPuzzle();
  const dbRoom = await ensureRoom(code, currentPuzzle, options.createIfMissing);
  if (!dbRoom) {
    pushSystem("没有找到这个房间。可以点开房创建一个新的。");
    await leaveRoom({ quiet: true });
    return;
  }

  subscribeRoom(code);
  await fetchRoomState();
  await insertSystemMessage(`${room.name} 已进入房间。`);
  setStatus(`房间 ${code}`);
}

async function ensureRoom(code, puzzle, createIfMissing) {
  const { data: existing, error } = await supabase
    .from("turtle_rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    pushSystem("房间读取失败，请稍后重试。");
    return null;
  }
  if (existing) return existing;
  if (!createIfMissing) return null;

  const { data, error: insertError } = await supabase
    .from("turtle_rooms")
    .insert({
      code,
      puzzle_id: puzzle?.id || null,
      host_mode: getHostMode(),
      progress: 0,
    })
    .select("*")
    .single();

  if (insertError) {
    pushSystem("房间创建失败，请确认 Supabase 已执行房间表 SQL。");
    return null;
  }

  await insertSystemMessage("房间已创建。");
  return data;
}

function subscribeRoom(code) {
  room.channel = supabase
    .channel(`turtle-soup-db-room:${code}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "turtle_rooms",
      filter: `code=eq.${code}`,
    }, scheduleRoomRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "turtle_room_messages",
      filter: `room_code=eq.${code}`,
    }, scheduleRoomRefresh)
    .subscribe((status) => {
      if (status === "SUBSCRIBED") setStatus(`房间 ${code}`);
    });
}

function scheduleRoomRefresh() {
  if (!room.active) return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(fetchRoomState, 80);
}

async function leaveRoom(options = {}) {
  if (!room.active && !room.channel) return;
  if (!options.quiet) await insertSystemMessage(`${room.name || "有人"} 离开了房间。`);
  if (room.channel) await supabase.removeChannel(room.channel);
  room.active = false;
  room.channel = null;
  room.code = "";
  room.busy = false;
  room.dbRoom = null;
  localStorage.removeItem(roomRememberKey);
  setUrlRoom("");
  setRoomControls(false);
  setStatus("单人");
  setBusy(false);
  if (!options.quiet) pushSystem("已离开房间，当前页面可以继续单人玩。");
}

async function fetchRoomState() {
  if (!room.active || !room.code) return;

  const [{ data: dbRoom, error: roomError }, { data: messages, error: messageError }] = await Promise.all([
    supabase.from("turtle_rooms").select("*").eq("code", room.code).single(),
    supabase
      .from("turtle_room_messages")
      .select("*")
      .eq("room_code", room.code)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (roomError || messageError) {
    pushSystem("房间同步失败，请刷新重试。");
    return;
  }

  room.dbRoom = dbRoom;
  room.messages = messages || [];
  room.progress = Number(dbRoom.progress || 0);
  room.puzzleId = dbRoom.puzzle_id || "";
  room.busy = room.messages.some((message) => message.kind === "loading");

  if (dbRoom.puzzle_id) applyRemotePuzzle(dbRoom.puzzle_id);
  els.progress.textContent = `${room.progress}%`;
  renderRoomMessages();
  setBusy(room.busy, room.busy ? "等待中" : "");
  if (dbRoom.is_revealed) revealRoomSolution(dbRoom.solution);
}

async function submitRoomTurn(payload) {
  if (room.busy) {
    pushSystem("上一轮还在判定中，稍等一下。");
    return;
  }

  const puzzle = getCurrentPuzzle();
  if (!puzzle || !room.dbRoom) {
    pushSystem("题目还没加载完成。");
    return;
  }

  room.busy = true;
  setBusy(true, payload.finalGuess ? "判定中" : "提问中");
  const playerText = payload.finalGuess ? `假说：${payload.finalGuess}` : payload.question;
  const userMessage = await insertRoomMessage({
    kind: "user",
    player_name: room.name,
    body: playerText,
    is_guess: Boolean(payload.finalGuess),
    client_message_id: `${clientId}:${Date.now()}`,
  });
  await pushRoomLoading(payload.finalGuess ? "主持人正在核对汤底..." : "主持人正在思考...");
  await fetchRoomState();

  try {
    const result = await askRoomHost(puzzle.id, {
      history: buildHistory(room.messages.filter((message) => message.id !== userMessage?.id)),
      ...payload,
    });
    await clearRoomLoading();
    await insertRoomMessage({
      kind: "host",
      body: result.hint || "",
      answer: result.answer || "无法判断",
      hint: result.hint || "",
      progress: Number.isFinite(result.progress) ? Math.round(result.progress) : room.progress,
      should_reveal: Boolean(result.shouldReveal),
    });
    await updateRoomProgress(result);
  } catch (error) {
    await clearRoomLoading();
    const result = aiErrorResult(error);
    await insertRoomMessage({
      kind: "host",
      body: result.hint,
      answer: result.answer,
      hint: result.hint,
      progress: room.progress,
      should_reveal: false,
    });
  } finally {
    room.busy = false;
    setBusy(false);
    await fetchRoomState();
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

async function insertSystemMessage(body) {
  if (!room.active || !room.code) return null;
  return insertRoomMessage({ kind: "system", body });
}

async function insertRoomMessage(message) {
  if (!room.code) return null;
  const { data, error } = await supabase
    .from("turtle_room_messages")
    .insert({ room_code: room.code, ...message })
    .select("*")
    .single();
  if (error) {
    pushSystem("消息写入失败，请检查房间表权限。");
    return null;
  }
  return data;
}

async function pushRoomLoading(text) {
  await clearRoomLoading();
  return insertRoomMessage({
    kind: "loading",
    body: text,
  });
}

async function clearRoomLoading() {
  if (!room.code) return;
  await supabase
    .from("turtle_room_messages")
    .delete()
    .eq("room_code", room.code)
    .eq("kind", "loading");
}

async function updateRoomProgress(result) {
  const progress = Number.isFinite(result.progress)
    ? Math.max(room.progress, Math.min(100, Math.round(result.progress)))
    : room.progress;
  const patch = {
    progress,
    updated_at: new Date().toISOString(),
  };
  if (result.shouldReveal) {
    patch.is_revealed = true;
    patch.solution = result.solution || "";
  }

  await supabase
    .from("turtle_rooms")
    .update(patch)
    .eq("code", room.code);
}

function renderRoomMessages() {
  const renderKey = `${room.messages.length}:${room.messages.at(-1)?.id || ""}:${room.progress}`;
  if (renderKey === room.lastRenderKey) return;
  room.lastRenderKey = renderKey;
  els.log.innerHTML = "";
  room.messages.forEach((message) => appendRoomBubble(message));
  els.log.parentElement.scrollTop = els.log.parentElement.scrollHeight;
}

function appendRoomBubble(message) {
  const item = document.createElement("div");
  const type = message.kind === "loading" ? "host" : message.kind;
  item.className = `bubble ${type}${message.kind === "loading" ? " loading" : ""}`;

  if (message.kind === "user") {
    item.textContent = `${message.player_name || "玩家"}：${message.body || ""}`;
  } else if (message.kind === "host") {
    const answer = message.answer || "无法判断";
    const hint = message.hint ? ` ${message.hint}` : "";
    item.innerHTML = `<span class="tag">${escapeHtml(answer)}</span>${escapeHtml(hint)}`;
  } else if (message.kind === "loading") {
    item.innerHTML = `<span class="tag">稍等</span>${escapeHtml(message.body || "主持人正在思考...")}`;
  } else {
    item.textContent = message.body || "";
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

async function broadcastPuzzle() {
  const puzzle = getCurrentPuzzle();
  if (!room.active || !puzzle || room.applyingRemotePuzzle || room.puzzleId === puzzle.id) return;
  room.puzzleId = puzzle.id;
  room.progress = 0;
  await supabase.from("turtle_room_messages").delete().eq("room_code", room.code);
  await supabase
    .from("turtle_rooms")
    .update({
      puzzle_id: puzzle.id,
      progress: 0,
      is_revealed: false,
      solution: "",
      host_mode: getHostMode(),
      updated_at: new Date().toISOString(),
    })
    .eq("code", room.code);
  await insertSystemMessage(`题目切换为：${puzzle.title}`);
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

function buildHistory(messages) {
  const history = [];
  let pendingQuestion = "";
  messages.forEach((message) => {
    if (message.kind === "user") {
      pendingQuestion = message.body || "";
    }
    if (message.kind === "host" && pendingQuestion) {
      history.push({
        question: pendingQuestion,
        answer: message.answer || "",
        hint: message.hint || "",
      });
      pendingQuestion = "";
    }
  });
  return history.slice(-12);
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
  } else if (message.includes("json") || message.includes("truncated")) {
    hint = "模型回复被截断或格式异常，请重试一次。";
  } else if (message.includes("model") || message.includes("invalid_argument")) {
    hint = "模型配置可能不对，需要检查 Supabase 的 AI_MODEL。";
  }
  return { answer: "暂时失败", hint, progress: room.progress, shouldReveal: false };
}

function revealRoomSolution(solution) {
  if (!solution) return;
  const dialog = document.querySelector("#revealDialog");
  if (dialog?.open) return;
  document.querySelector("#revealText").textContent = solution || "已还原真相。";
  document.querySelector("#revealTitle").textContent = els.title.textContent || "汤底";
  dialog.showModal();
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
