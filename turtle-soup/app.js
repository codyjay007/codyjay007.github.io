const config = window.TURTLE_CONFIG || {};

const state = {
  puzzles: [],
  current: null,
  history: [],
  filter: "all",
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

init();

async function init() {
  bindEvents();

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

  els.questionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = els.questionInput.value.trim();
    if (!question || !state.current) return;
    els.questionInput.value = "";
    addBubble("user", question);
    setBusy(true);

    try {
      const result = await askHost({ question });
      applyHostResult(result, question);
    } catch (error) {
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
    setBusy(true);

    try {
      const result = await askHost({ finalGuess });
      applyHostResult(result, finalGuess);
    } catch (error) {
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

function selectPuzzle(puzzle) {
  state.current = puzzle;
  state.history = [];
  state.progress = 0;
  els.title.textContent = puzzle.title;
  els.difficulty.textContent = `${difficultyLabel[puzzle.difficulty]} · ${(puzzle.tags || []).join(" / ")}`;
  els.surfaceText.textContent = puzzle.surface;
  els.progress.textContent = "0%";
  els.log.innerHTML = "";
  els.guessInput.value = "";
  addBubble("system", "新汤面已上桌。你可以开始提问。");
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

  if (result.shouldReveal) revealSolution(result.solution);
}

function aiNotReadyResult(error) {
  const isMissingKey = String(error?.message || "").includes("OPENAI_API_KEY");
  return {
    answer: "后台未就绪",
    hint: isMissingKey
      ? "题库已上线，AI API Key 还没配置。"
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

function addBubble(type, content, asHtml = false) {
  const item = document.createElement("div");
  item.className = `bubble ${type}`;
  if (asHtml) {
    item.innerHTML = content;
  } else {
    item.textContent = content;
  }
  els.log.appendChild(item);
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

function setBusy(isBusy) {
  els.questionInput.disabled = isBusy;
  els.guessInput.disabled = isBusy;
  els.questionForm.querySelector("button").disabled = isBusy;
  els.guessForm.querySelector("button").disabled = isBusy;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
