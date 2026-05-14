const config = window.TURTLE_CONFIG || {};
const storageKey = "turtleSoupSessions:v1";
const hostModeKey = "turtleSoupHostMode:v1";

const state = {
  puzzles: [],
  current: null,
  history: [],
  messages: [],
  sessions: loadStoredSessions(),
  filter: "all",
  hostMode: localStorage.getItem(hostModeKey) || "standard",
  progress: 0,
};

const els = {
  puzzleList: document.querySelector("#puzzleList"),
  title: document.querySelector("#title"),
  difficulty: document.querySelector("#difficulty"),
  surfaceText: document.querySelector("#surfaceText"),
  log: document.querySelector("#log"),
  progress: document.querySelector("#progress"),
  questionForm: document.querySelector("#questionForm"),
  questionInput: document.querySelector("#questionInput"),
  guessForm: document.querySelector("#guessForm"),
  guessInput: document.querySelector("#guessInput"),
  resetPuzzle: document.querySelector("#resetPuzzle"),
  revealDialog: document.querySelector("#revealDialog"),
  revealTitle: document.querySelector("#revealTitle"),
  revealText: document.querySelector("#revealText"),
  closeReveal: document.querySelector("#closeReveal"),
};

const difficultyLabel = {
  easy: "入门",
  normal: "标准",
  hard: "硬核",
};

const hostModeLabel = {
  relaxed: "宽松",
  standard: "标准",
  strict: "硬核",
};

init();

async function init() {
  bindEvents();
  renderHostMode();

  try {
    state.puzzles = await loadPuzzles();
    renderPuzzleList();
    if (state.puzzles.length) {
      selectPuzzle(state.puzzles[0]);
    } else {
      showEmpty("题库暂时为空。请先在 Supabase 里发布题目。");
    }
  } catch (error) {
    showEmpty("题库加载失败，请稍后刷新。");
  }
}

async function loadPuzzles() {
  const endpoint = `${config.supabaseUrl}/rest/v1/turtle_puzzles?select=id,title,surface,difficulty,tags&is_published=eq.true&order=created_at.desc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });

  if (!response.ok) throw new Error("题库加载失败");
  return response.json();
}

function bindEvents() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderPuzzleList();
    });
  });

  document.querySelectorAll(".mode").forEach((button) => {
    button.addEventListener("click", () => {
      state.hostMode = button.dataset.hostMode || "standard";
      localStorage.setItem(hostModeKey, state.hostMode);
      renderHostMode();
      addBubble("system", `主持模式已切换为：${hostModeLabel[state.hostMode] || "标准"}`);
    });
  });

  els.resetPuzzle.addEventListener("click", () => {
    if (!state.current) return;
    delete state.sessions[state.current.id];
    localStorage.setItem(storageKey, JSON.stringify(state.sessions));
    selectPuzzle(state.current);
  });

  els.questionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = els.questionInput.value.trim();
    if (!question || !state.current) return;

    els.questionInput.value = "";
    addBubble("user", question);
    const loadingBubble = addLoadingBubble();
    setBusy(true, "提问中");

    try {
      const result = await askHost({ question });
      removeLoadingBubble(loadingBubble);
      applyHostResult(result, question);
    } catch (error) {
      removeLoadingBubble(loadingBubble);
      applyHostResult(aiNotReadyResult(error), question);
    } finally {
      setBusy(false);
    }
  });

  els.guessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const finalGuess = els.guessInput.value.trim();
    if (!finalGuess || !state.current) return;

    addBubble("user", `最终推理：${finalGuess}`);
    const loadingBubble = addLoadingBubble("主持人正在核对汤底...");
    setBusy(true, "判定中");

    try {
      const result = await askHost({ finalGuess });
      removeLoadingBubble(loadingBubble);
      applyHostResult(result, finalGuess);
    } catch (error) {
      removeLoadingBubble(loadingBubble);
      applyHostResult(aiNotReadyResult(error), finalGuess);
    } finally {
      setBusy(false);
    }
  });

  els.closeReveal.addEventListener("click", () => els.revealDialog.close());
}

function renderPuzzleList() {
  const puzzles = state.puzzles.filter((puzzle) => {
    return state.filter === "all" || puzzle.difficulty === state.filter;
  });

  els.puzzleList.innerHTML = "";
  puzzles.forEach((puzzle) => {
    const button = document.createElement("button");
    button.className = `puzzle-card${state.current?.id === puzzle.id ? " is-active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(puzzle.title)}</strong><span>${difficultyLabel[puzzle.difficulty]} · ${escapeHtml((puzzle.tags || []).join(" / "))}</span>`;
    button.addEventListener("click", () => selectPuzzle(puzzle));
    els.puzzleList.appendChild(button);
  });
}

function renderHostMode() {
  document.querySelectorAll(".mode").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.hostMode === state.hostMode);
  });
}

function selectPuzzle(puzzle) {
  saveActiveSession();

  state.current = puzzle;
  const session = state.sessions[puzzle.id] || { history: [], messages: [], progress: 0 };
  state.history = [...(session.history || [])];
  state.messages = [...(session.messages || [])];
  state.progress = Number(session.progress || 0);

  els.title.textContent = puzzle.title;
  els.difficulty.textContent = `${difficultyLabel[puzzle.difficulty]} · ${(puzzle.tags || []).join(" / ")}`;
  els.surfaceText.textContent = puzzle.surface;
  els.progress.textContent = `${state.progress}%`;
  els.guessInput.value = "";
  els.log.innerHTML = "";

  if (state.messages.length) {
    renderMessages();
  } else {
    addBubble("system", "新汤面已上桌。你可以开始提问。");
  }

  renderPuzzleList();
}

async function askHost(payload) {
  const endpoint = `${config.supabaseUrl}/functions/v1/${config.askFunction || "ask-turtle"}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
    body: JSON.stringify({
      puzzleId: state.current.id,
      history: state.history,
      hostMode: state.hostMode,
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

function applyHostResult(result, playerText) {
  const answer = result.answer || "无法判断";
  const hint = result.hint ? ` ${result.hint}` : "";
  addBubble("host", `<span class="tag">${escapeHtml(answer)}</span>${escapeHtml(hint)}`, true);

  state.history.push({
    answer,
    hint: result.hint || "",
    question: playerText,
  });

  if (Number.isFinite(result.progress)) {
    state.progress = Math.max(state.progress, Math.min(100, Math.round(result.progress)));
    els.progress.textContent = `${state.progress}%`;
  }

  saveActiveSession();

  if (result.shouldReveal) revealSolution(result.solution);
}

function aiNotReadyResult(error) {
  const message = String(error?.message || "");
  return {
    answer: "后台未就绪",
    hint: message.includes("rate") || message.includes("429")
      ? "当前模型触发频率限制，等一会儿再问。"
      : "AI 裁判暂时不可用，请稍后再试。",
    progress: state.progress,
    shouldReveal: false,
  };
}

function revealSolution(solution) {
  els.revealTitle.textContent = state.current.title;
  els.revealText.textContent = solution || "已还原真相，汤底由后台保管。";
  els.revealDialog.showModal();
}

function addBubble(type, content, asHtml = false, options = {}) {
  const item = document.createElement("div");
  item.className = `bubble ${type}${options.loading ? " loading" : ""}`;
  if (asHtml) {
    item.innerHTML = content;
  } else {
    item.textContent = content;
  }
  els.log.appendChild(item);
  els.log.parentElement.scrollTop = els.log.parentElement.scrollHeight;

  if (!options.temporary) {
    state.messages.push({ type, content, asHtml });
    saveActiveSession();
  }

  return item;
}

function addLoadingBubble(text = "主持人正在思考...") {
  return addBubble("host", `<span class="tag">稍等</span>${escapeHtml(text)}`, true, {
    loading: true,
    temporary: true,
  });
}

function removeLoadingBubble(item) {
  if (item?.parentElement) item.parentElement.removeChild(item);
}

function renderMessages() {
  state.messages.forEach((message) => {
    const item = document.createElement("div");
    item.className = `bubble ${message.type}`;
    if (message.asHtml) {
      item.innerHTML = message.content;
    } else {
      item.textContent = message.content;
    }
    els.log.appendChild(item);
  });
  els.log.parentElement.scrollTop = els.log.parentElement.scrollHeight;
}

function showEmpty(message) {
  els.title.textContent = "海龟汤";
  els.difficulty.textContent = "等待题库";
  els.surfaceText.textContent = message;
  els.puzzleList.innerHTML = "";
  els.log.innerHTML = "";
  addBubble("system", message);
}

function setBusy(isBusy, label) {
  els.questionInput.disabled = isBusy;
  els.guessInput.disabled = isBusy;
  const questionButton = els.questionForm.querySelector("button");
  const guessButton = els.guessForm.querySelector("button");
  questionButton.disabled = isBusy;
  guessButton.disabled = isBusy;
  questionButton.textContent = isBusy ? label || "等待中" : "提问";
  guessButton.textContent = isBusy ? label || "等待中" : "提交推理";
}

function saveActiveSession() {
  if (!state.current) return;
  state.sessions[state.current.id] = {
    history: state.history,
    messages: state.messages,
    progress: state.progress,
  };
  localStorage.setItem(storageKey, JSON.stringify(state.sessions));
}

function loadStoredSessions() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch (_) {
    return {};
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
