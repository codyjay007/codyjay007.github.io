(function () {
  const storageKey = 'turtleSoupAssist:v1';
  const clueNodes = [
    { key: 'people', label: '人物关系', words: ['人', '他', '她', '父', '母', '朋友', '陌生', '关系'] },
    { key: 'time', label: '时间顺序', words: ['时间', '之前', '之后', '晚上', '白天', '后来', '已经'] },
    { key: 'object', label: '关键物/地点', words: ['东西', '物', '房间', '车', '门', '电话', '地点', '现场'] },
    { key: 'motive', label: '动机', words: ['为什么', '原因', '为了', '想', '害怕', '故意'] },
    { key: 'twist', label: '反转机制', words: ['误会', '其实', '不是', '身份', '死', '活', '真相'] },
  ];
  const rank = { locked: 0, warm: 1, found: 2 };
  const els = {};
  let store = readStore();
  let currentKey = '';
  let lastHostCount = 0;

  injectStyles();
  bootWhenReady();

  function bootWhenReady() {
    const controlRow = document.querySelector('.control-row');
    if (!controlRow) {
      window.setTimeout(bootWhenReady, 80);
      return;
    }
    injectPanel(controlRow);
    tuneHypothesisCopy();
    bindObservers();
    syncPuzzle();
  }

  function injectPanel(controlRow) {
    const existing = document.querySelector('#assistPanel') || document.querySelector('.assist-panel');
    if (existing) {
      existing.id = 'assistPanel';
      els.panel = existing;
      els.clueBoard = existing.querySelector('#clueBoard');
      els.stuckPanel = existing.querySelector('#stuckPanel');
      els.stuckText = existing.querySelector('#stuckText');
      els.recapList = existing.querySelector('#recapList');
      return;
    }

    const panel = document.createElement('section');
    panel.id = 'assistPanel';
    panel.className = 'assist-panel';
    panel.setAttribute('aria-label', '推理辅助');
    panel.innerHTML = `
      <div>
        <p class='assist-title'>线索板</p>
        <div id='clueBoard' class='clue-board'></div>
      </div>
      <div id='stuckPanel' class='stuck-panel' hidden>
        <strong>可能卡住了</strong>
        <p id='stuckText'></p>
      </div>
      <div class='recap-panel'>
        <p class='assist-title'>阶段复盘</p>
        <ul id='recapList'></ul>
      </div>
    `;
    controlRow.insertAdjacentElement('afterend', panel);
    els.panel = panel;
    els.clueBoard = panel.querySelector('#clueBoard');
    els.stuckPanel = panel.querySelector('#stuckPanel');
    els.stuckText = panel.querySelector('#stuckText');
    els.recapList = panel.querySelector('#recapList');
  }

  function tuneHypothesisCopy() {
    const guessInput = document.querySelector('#guessInput');
    const guessButton = document.querySelector('#guessForm button');
    if (guessInput) guessInput.placeholder = '写下你的假说；接近汤底时主持人会自动揭晓';
    if (guessButton) guessButton.textContent = '提交假说';
  }

  function bindObservers() {
    const title = document.querySelector('#title');
    const log = document.querySelector('#log');
    const progress = document.querySelector('#progress');
    if (title) new MutationObserver(syncPuzzle).observe(title, { childList: true, characterData: true, subtree: true });
    if (log) new MutationObserver(handleLogChange).observe(log, { childList: true, subtree: true });
    if (progress) new MutationObserver(render).observe(progress, { childList: true, characterData: true, subtree: true });
  }

  function syncPuzzle() {
    const key = getPuzzleKey();
    if (!key) return;
    if (key !== currentKey) {
      currentKey = key;
      lastHostCount = getHostBubbles().length;
      ensureSession(key);
    }
    render();
  }

  function handleLogChange() {
    syncPuzzle();
    const hosts = getHostBubbles();
    if (!currentKey || hosts.length === lastHostCount) return;
    hosts.slice(lastHostCount).forEach(analyzeHostBubble);
    lastHostCount = hosts.length;
    saveStore();
    render();
  }

  function analyzeHostBubble(hostBubble) {
    const session = ensureSession(currentKey);
    const text = hostBubble.textContent || '';
    const answer = normalizeAnswer(text);
    const progress = getProgress();
    const lastUser = getLastUserText();
    session.turns.push({ answer, progress, user: lastUser });
    session.turns = session.turns.slice(-12);
    updateClues(session, `${lastUser} ${text}`, answer, progress);
    maybeRecap(session, answer, progress, lastUser);
  }

  function updateClues(session, text, answer, progress) {
    const normalized = text.toLowerCase();
    clueNodes.forEach((node) => {
      if (node.words.some((word) => normalized.includes(word.toLowerCase()))) {
        mergeStatus(session, node.key, answerToStatus(answer));
      }
    });
    if (progress >= 35) mergeStatus(session, 'people', 'warm');
    if (progress >= 55) mergeStatus(session, 'object', 'warm');
    if (progress >= 75) mergeStatus(session, 'twist', 'warm');
    if (progress >= 90) mergeStatus(session, 'twist', 'found');
  }

  function maybeRecap(session, answer, progress, userText) {
    const turnCount = session.turns.length;
    const milestone =
      (progress >= 35 && !session.milestones.includes(35)) ||
      (progress >= 65 && !session.milestones.includes(65)) ||
      (progress >= 90 && !session.milestones.includes(90));
    if (progress >= 35 && !session.milestones.includes(35)) session.milestones.push(35);
    if (progress >= 65 && !session.milestones.includes(65)) session.milestones.push(65);
    if (progress >= 90 && !session.milestones.includes(90)) session.milestones.push(90);
    if (!milestone && turnCount % 4 !== 0) return;
    const active = session.clues.filter((node) => node.status !== 'locked').map((node) => node.label).slice(0, 3);
    const recap = active.length
      ? `第 ${turnCount} 轮：${answer}。目前重点在：${active.join('、')}。`
      : `第 ${turnCount} 轮：${answer}。刚问到的是：${userText.slice(0, 24)}。`;
    if (session.recaps[session.recaps.length - 1] !== recap) session.recaps.push(recap);
    session.recaps = session.recaps.slice(-5);
  }

  function render() {
    const session = ensureSession(currentKey || getPuzzleKey());
    renderClues(session);
    renderStuck(session);
    renderRecaps(session);
  }

  function renderClues(session) {
    els.clueBoard.innerHTML = '';
    session.clues.forEach((node) => {
      const chip = document.createElement('span');
      chip.className = `clue-chip ${node.status}`;
      chip.textContent = `${node.label} · ${statusText(node.status)}`;
      els.clueBoard.appendChild(chip);
    });
  }

  function renderStuck(session) {
    const streak = getNoProgressStreak(session);
    if (streak < 3) {
      els.stuckPanel.hidden = true;
      return;
    }
    els.stuckPanel.hidden = false;
    const mode = document.querySelector('.mode.is-active')?.dataset.hostMode || 'standard';
    if (mode === 'strict') {
      els.stuckText.textContent = '连续几轮没有推进。硬核模式不会给具体方向，先把已确认和被否定的条件各整理一遍。';
      return;
    }
    const focus = session.clues.filter((node) => node.status !== 'found').slice(0, 2).map((node) => node.label).join('、');
    els.stuckText.textContent = `连续几轮推进很少。先换一个维度检查：${focus || '人物、时间或关键物'}。`;
  }

  function renderRecaps(session) {
    els.recapList.innerHTML = '';
    const recaps = session.recaps.slice(-3);
    if (!recaps.length) {
      const item = document.createElement('li');
      item.textContent = '提问几轮后，这里会沉淀阶段性判断。';
      els.recapList.appendChild(item);
      return;
    }
    recaps.forEach((recap) => {
      const item = document.createElement('li');
      item.textContent = recap;
      els.recapList.appendChild(item);
    });
  }

  function ensureSession(key) {
    const safeKey = key || 'pending';
    if (!store[safeKey]) {
      store[safeKey] = {
        clues: clueNodes.map((node) => ({ key: node.key, label: node.label, status: 'locked' })),
        turns: [],
        recaps: [],
        milestones: [],
      };
    }
    return store[safeKey];
  }

  function mergeStatus(session, key, status) {
    session.clues = session.clues.map((node) => {
      if (node.key !== key) return node;
      return rank[status] > rank[node.status] ? { ...node, status } : node;
    });
  }

  function getNoProgressStreak(session) {
    let streak = 0;
    for (let index = session.turns.length - 1; index >= 0; index -= 1) {
      if (['是', '部分正确', '基本正确'].includes(session.turns[index].answer)) break;
      streak += 1;
    }
    return streak;
  }

  function normalizeAnswer(text) {
    const candidates = ['基本正确', '部分正确', '无法判断', '还差一些', '暂时失败', '无关', '是', '否'];
    return candidates.find((item) => text.includes(item)) || '无法判断';
  }

  function answerToStatus(answer) {
    if (['是', '部分正确', '基本正确'].includes(answer)) return 'found';
    if (['无法判断', '还差一些'].includes(answer)) return 'warm';
    return 'locked';
  }

  function statusText(status) {
    if (status === 'found') return '已确认';
    if (status === 'warm') return '接近';
    return '未触及';
  }

  function getPuzzleKey() {
    const title = document.querySelector('#title')?.textContent?.trim() || '';
    const surface = document.querySelector('#surfaceText')?.textContent?.trim() || '';
    return title ? `${title}::${surface.slice(0, 24)}` : '';
  }

  function getProgress() {
    const text = document.querySelector('#progress')?.textContent || '0';
    return Math.max(0, Math.min(100, Number.parseInt(text, 10) || 0));
  }

  function getHostBubbles() {
    return Array.from(document.querySelectorAll('#log .bubble.host:not(.loading)'));
  }

  function getLastUserText() {
    const users = Array.from(document.querySelectorAll('#log .bubble.user'));
    return users[users.length - 1]?.textContent || '';
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveStore() {
    localStorage.setItem(storageKey, JSON.stringify(store));
  }

  function injectStyles() {
    if (document.querySelector('#assistStyles')) return;
    const style = document.createElement('style');
    style.id = 'assistStyles';
    style.textContent = `
      .board { grid-template-rows: auto auto auto auto minmax(0, 1fr) auto; }
      .assist-panel { min-height: 0; display: grid; grid-template-columns: 1.1fr .9fr 1.15fr; gap: 10px; }
      .assist-panel > div { min-width: 0; padding: 12px; border: 1px solid rgba(255,255,255,.07); border-radius: 8px; background: rgba(255,255,255,.035); }
      .assist-title, .stuck-panel strong { margin: 0 0 8px; color: var(--muted); font-size: 12px; font-weight: 800; }
      .clue-board { display: flex; flex-wrap: wrap; gap: 6px; }
      .clue-chip { min-height: 28px; display: inline-flex; align-items: center; padding: 0 9px; border: 1px solid var(--line); border-radius: 7px; color: var(--muted); font-size: 12px; white-space: nowrap; }
      .clue-chip.warm { border-color: rgba(214,169,95,.42); color: var(--accent); background: rgba(214,169,95,.09); }
      .clue-chip.found { border-color: rgba(127,208,195,.46); color: var(--accent-2); background: rgba(127,208,195,.1); }
      .stuck-panel[hidden] { display: none; }
      .stuck-panel p, .recap-panel li { margin: 0; color: var(--text); font-size: 13px; line-height: 1.45; }
      .recap-panel ul { max-height: 76px; margin: 0; padding-left: 18px; overflow: auto; }
      .recap-panel li + li { margin-top: 6px; }
      @media (max-width: 860px) {
        .board { grid-template-rows: auto auto auto auto minmax(300px, 1fr) auto; }
        .assist-panel { grid-template-columns: 1fr; }
        .assist-panel > div { padding: 10px; }
        .recap-panel ul { max-height: none; }
      }
    `;
    document.head.appendChild(style);
  }
})();
