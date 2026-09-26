/* ══════════════════════════════════════════════════
   GAME STATE
══════════════════════════════════════════════════ */
var state = {
  playerName: "",
  level: "",
  wordList: [],
  wordIndex: 0,
  currentWord: "",
  currentEmoji: "",
  letters: [],
  placed: [],
  tileEls: [],
  hints: CONFIG.hintsPerWord,
  score: 0,
  wordsCompleted: 0,
  isBonus: false,
  bonusInterval: null,
  bonusTimeLeft: CONFIG.bonusSeconds,
  streak: 0,
  questionType: "spell",
  lives: CONFIG.lives,
  _doubleCoins: false,
};

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function shuffleDistinct(arr) {
  if (arr.length <= 1) return arr.slice();
  var orig = arr.join("");
  var result, attempts = 0;
  do { result = shuffle(arr); attempts++; }
  while (result.join("") === orig && attempts < 20);
  return result;
}

function getPreviousNames() {
  var names = [];
  getScores().forEach(function (e) {
    if (names.indexOf(e.name) === -1) names.push(e.name);
  });
  Object.keys(getAllCoins()).forEach(function (n) {
    if (names.indexOf(n) === -1) names.push(n);
  });
  return names;
}

function renderNameChips() {
  var container = document.getElementById("prev-names");
  var names = getPreviousNames();
  container.querySelectorAll(".name-chip").forEach(function (c) { c.remove(); });
  if (names.length === 0) {
    container.classList.remove("visible");
    return;
  }
  var bestScore = {};
  getScores().forEach(function (e) {
    if (!bestScore[e.name] || e.score > bestScore[e.name]) bestScore[e.name] = e.score;
  });
  container.classList.add("visible");
  names.forEach(function (name) {
    var btn = document.createElement("button");
    btn.className = "name-chip";
    var nameSpan = document.createElement("span");
    nameSpan.textContent = name;
    var statsSpan = document.createElement("span");
    statsSpan.className = "name-chip-stats";
    statsSpan.textContent = "⭐ " + (bestScore[name] || 0) + "  🪙 " + getCoins(name);
    btn.appendChild(nameSpan);
    btn.appendChild(statsSpan);
    btn.addEventListener("click", function () {
      document.getElementById("player-name").value = name;
      document.getElementById("name-error").textContent = "";
      updatePlayerInfoBar(name);
    });
    container.appendChild(btn);
  });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
  document.getElementById(id).classList.add("active");
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function showToast(msg) {
  document.querySelectorAll(".toast").forEach(function (t) { t.remove(); });
  var t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  t.addEventListener("animationend", function (e) {
    if (e.animationName === "toastOut") t.remove();
  });
}

function freshWordList(level) {
  return shuffle(WORDS[level].slice()).slice(0, CONFIG.wordsPerRun);
}

/* ══════════════════════════════════════════════════
   NAME VALIDATION
══════════════════════════════════════════════════ */
function validateName() {
  var input = document.getElementById("player-name");
  var errEl = document.getElementById("name-error");
  var name  = input.value.trim();
  if (!name) {
    errEl.textContent = "⚠️ אנא הכנס את שמך לפני שמתחילים!";
    input.classList.add("error");
    input.addEventListener("animationend", function () { input.classList.remove("error"); }, { once: true });
    input.focus();
    return false;
  }
  errEl.textContent = "";
  return name;
}

/* ══════════════════════════════════════════════════
   START / LOAD WORD
══════════════════════════════════════════════════ */
function startLevel(level) {
  var name = validateName();
  if (!name) return;

  state.playerName     = name;
  state.level          = level;
  state.wordList       = freshWordList(level);
  state.wordIndex      = 0;
  state.score          = 0;
  state.hints          = CONFIG.hintsPerWord;
  state.wordsCompleted = 0;
  state.isBonus        = false;
  state.streak         = 0;
  state.lives          = CONFIG.lives;
  state._doubleCoins   = false;
  state.questionType   = "spell";
  clearBonusTimer();
  document.getElementById("screen-game").classList.remove("choice-mode");

  var labels = { easy:"🌱 קל", mid:"⭐ בינוני", hard:"🔥 קשה" };
  document.getElementById("level-badge").textContent    = labels[level];
  document.getElementById("player-name-badge").textContent = "👤 " + name;

  loadWord();
  showScreen("screen-game");
}

function loadWord() {
  var obj = state.wordList[state.wordIndex % state.wordList.length];
  state.currentWord  = obj.word;
  state.currentEmoji = obj.emoji;
  state.letters      = obj.word.split("");
  state.placed       = [];

  document.getElementById("word-emoji").textContent    = obj.emoji;
  document.getElementById("score-text").textContent    = state.score;
  document.getElementById("coins-text").textContent    = getCoins(state.playerName);
  document.getElementById("hints-left").textContent    = state.hints;
  document.getElementById("hint-btn").disabled         = (state.hints <= 0);
  updateStreakUI();
  updateLivesUI();
  document.getElementById("progress-text").textContent =
    "מילה " + (state.wordIndex + 1) + " מתוך " + state.wordList.length;

  var gameEl = document.getElementById("screen-game");
  if (state.isBonus) {
    document.getElementById("bonus-banner").classList.add("active");
    document.getElementById("timer-row").classList.add("active");
    gameEl.classList.add("bonus-mode");
    startBonusTimer();
  } else {
    clearBonusTimer();
  }

  state.questionType = (!state.isBonus && Math.random() < 0.5) ? "choice" : "spell";
  if (state.questionType === "choice") {
    gameEl.classList.add("choice-mode");
    renderChoiceOptions();
  } else {
    gameEl.classList.remove("choice-mode");
    renderBlanks();
    renderTiles();
  }

  renderGameItemsRow();
}

function renderBlanks() {
  var row = document.getElementById("blanks-row");
  row.innerHTML = "";
  row.style.setProperty("--word-len", String(state.letters.length));
  for (var i = 0; i < state.letters.length; i++) {
    var box = document.createElement("div");
    box.className = "blank-box";
    box.id = "blank-" + i;
    row.appendChild(box);
  }
}

function renderTiles() {
  var row = document.getElementById("tiles-row");
  row.innerHTML = "";
  state.tileEls = [];
  shuffleDistinct(state.letters.slice()).forEach(function (letter, idx) {
    var btn = document.createElement("button");
    btn.className        = "letter-tile";
    btn.textContent      = letter;
    btn.style.background = TILE_COLORS[idx % TILE_COLORS.length];
    btn.addEventListener("click", function () { placeLetter(btn); });
    row.appendChild(btn);
    state.tileEls.push(btn);
  });
}

/* ══════════════════════════════════════════════════
   GAME ACTIONS
══════════════════════════════════════════════════ */
function placeLetter(tile) {
  if (tile.disabled) return;
  var idx = state.placed.length;
  if (idx >= state.letters.length) return;

  tile.disabled = true;
  state.placed.push(tile.textContent);

  var box = document.getElementById("blank-" + idx);
  box.textContent = tile.textContent;
  box.classList.remove("err");
  box.classList.add("filled", "pop");
  box.addEventListener("animationend", function () { box.classList.remove("pop"); }, { once: true });

  if (state.placed.length === state.letters.length) setTimeout(checkWord, 380);
}

function deleteLast() {
  if (state.placed.length === 0) return;
  var lastIdx = state.placed.length - 1;
  var box = document.getElementById("blank-" + lastIdx);
  if (box.classList.contains("hint-filled")) return;

  var removed = state.placed.pop();
  box.textContent = "";
  box.classList.remove("filled");

  for (var i = state.tileEls.length - 1; i >= 0; i--) {
    var t = state.tileEls[i];
    if (t.disabled && !t.dataset.hint && t.textContent === removed) {
      t.disabled = false; break;
    }
  }
}

function useHint() {
  if (state.hints <= 0) return;
  var idx = state.placed.length;
  if (idx >= state.letters.length) return;

  var correct = state.letters[idx];
  for (var i = 0; i < state.tileEls.length; i++) {
    var t = state.tileEls[i];
    if (!t.disabled && t.textContent === correct) {
      t.disabled = true; t.dataset.hint = "1"; break;
    }
  }

  state.placed.push(correct);
  state.hints--;
  document.getElementById("hints-left").textContent = state.hints;
  document.getElementById("hint-btn").disabled = (state.hints <= 0);

  var box = document.getElementById("blank-" + idx);
  box.textContent = correct;
  box.classList.add("filled", "hint-filled", "pop");
  box.addEventListener("animationend", function () { box.classList.remove("pop"); }, { once: true });

  if (state.placed.length === state.letters.length) setTimeout(checkWord, 380);
}

function handleCorrectAnswer() {
  var base   = state.isBonus ? CONFIG.coinsBonus : CONFIG.coinsCorrect;
  var reward = state._doubleCoins ? base * 2 : base;
  state.score += reward;
  addCoins(state.playerName, reward);
  saveScore(state.playerName, state.score, state.level);
  state.wordsCompleted++;

  if (state.isBonus) clearBonusTimer();

  state.streak++;
  var streakBonus = 0;
  if (state.streak >= CONFIG.streakEvery) {
    streakBonus = CONFIG.streakBonus;
    addCoins(state.playerName, streakBonus);
    state.streak = 0;
  }
  updateStreakUI();

  launchConfetti();
  setTimeout(function () {
    document.getElementById("win-emoji").textContent      = state.currentEmoji;
    document.getElementById("win-word").textContent       = state.currentWord;
    document.getElementById("win-score-text").textContent = state.score;
    document.getElementById("win-coins-text").textContent = getCoins(state.playerName);
    var bonusTag = document.getElementById("win-bonus-tag");
    if (state.isBonus || state._doubleCoins) {
      var parts = [];
      if (state.isBonus)      parts.push("⚡ בונוס");
      if (state._doubleCoins) parts.push("💰 מטבעות כפולים");
      bonusTag.textContent = parts.join(" · ") + " — 🪙 " + reward;
      bonusTag.style.display = "block";
    } else {
      bonusTag.style.display = "none";
    }
    var streakTag = document.getElementById("win-streak-tag");
    if (streakBonus > 0) {
      streakTag.textContent = "🔥 רצף של " + CONFIG.streakEvery + "! בונוס — 🪙 " + streakBonus;
      streakTag.style.display = "block";
    } else {
      streakTag.style.display = "none";
    }
    renderLeaderboardInto("leaderboard-body");
    showScreen("screen-win");
  }, 600);
}

function checkWord() {
  if (state.placed.join("") === state.currentWord) {
    handleCorrectAnswer();
  } else {
    state.streak = 0;
    updateStreakUI();
    state.lives--;
    updateLivesUI();
    document.querySelectorAll(".blank-box").forEach(function (b) {
      b.classList.remove("pop");
      b.classList.add("err");
      b.addEventListener("animationend", function () { b.classList.remove("err"); }, { once: true });
    });
    if (state.lives <= 0) {
      setTimeout(function () { triggerGameOver(); }, 800);
    } else {
      setTimeout(function () {
        state.placed = [];
        state.tileEls.forEach(function (t) { if (!t.dataset.hint) t.disabled = false; });
        for (var i = 0; i < state.letters.length; i++) {
          var box = document.getElementById("blank-" + i);
          if (!box.classList.contains("hint-filled")) {
            box.textContent = ""; box.classList.remove("filled");
          } else {
            state.placed.push(state.letters[i]);
          }
        }
      }, 650);
    }
  }
}

/* ══════════════════════════════════════════════════
   CHOICE MODE
══════════════════════════════════════════════════ */
function renderChoiceOptions() {
  var container = document.getElementById("choice-options");
  container.innerHTML = '<div class="choice-prompt">❓ מה זה?</div>';
  var pool  = WORDS[state.level].filter(function (w) { return w.word !== state.currentWord; });
  var wrong = shuffle(pool).slice(0, 2).map(function (w) { return w.word; });
  shuffle([state.currentWord].concat(wrong)).forEach(function (word) {
    var btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = word;
    btn.addEventListener("click", function () { handleChoiceAnswer(btn, word); });
    container.appendChild(btn);
  });
}

function handleChoiceAnswer(btn, word) {
  if (btn.disabled) return;
  if (word === state.currentWord) {
    btn.classList.add("correct");
    handleCorrectAnswer();
  } else {
    state.streak = 0;
    updateStreakUI();
    state.lives--;
    updateLivesUI();
    btn.classList.add("wrong");
    btn.disabled = true;
    btn.addEventListener("animationend", function () { btn.classList.remove("wrong"); }, { once: true });
    if (state.lives <= 0) {
      setTimeout(function () { triggerGameOver(); }, 700);
    }
  }
}

/* ══════════════════════════════════════════════════
   LEADERBOARD
══════════════════════════════════════════════════ */
function renderLeaderboardInto(containerId) {
  var top  = topScores();
  var body = document.getElementById(containerId);
  if (top.length === 0) {
    body.innerHTML = '<div class="no-scores">אין ניקודים עדיין — היו הראשונים! 🌟</div>';
    return;
  }
  var levelLabel = { easy:"קל", mid:"בינוני", hard:"קשה" };
  var rankIcon   = ["🥇","🥈","🥉"];
  var html = '<table class="score-table">' +
    "<thead><tr><th>#</th><th>שם</th><th>ניקוד</th><th>רמה</th></tr></thead><tbody>";
  top.forEach(function (entry, i) {
    var isMe = entry.name === state.playerName && entry.score === state.score;
    var rank = i < 3 ? '<span class="rank-' + (i + 1) + '">' + rankIcon[i] + "</span>" : String(i + 1);
    var lvl  = entry.level || "easy";
    var pill = '<span class="level-pill ' + lvl + '">' + (levelLabel[lvl] || lvl) + "</span>";
    html += '<tr class="' + (isMe ? "highlight" : "") + '">' +
      "<td>" + rank + "</td><td>" + escHtml(entry.name) + "</td>" +
      "<td>" + entry.score + " ⭐</td><td>" + pill + "</td></tr>";
  });
  html += "</tbody></table>";
  body.innerHTML = html;
}

function showLeaderboard() {
  renderLeaderboardInto("leaderboard-full-body");
  showScreen("screen-leaderboard");
}

function clearScores() {
  if (!confirm("למחוק את כל השיאים?")) return;
  localStorage.removeItem(KEY_SCORES);
  renderLeaderboardInto("leaderboard-full-body");
  renderNameChips();
}

/* ══════════════════════════════════════════════════
   SHOP
══════════════════════════════════════════════════ */
function showShop() {
  var name = validateName();
  if (!name) return;
  state.playerName = name;
  document.getElementById("shop-balance").textContent = "🪙 " + getCoins(name);
  renderShopGrid("tools");
  renderShopGrid("cosmetics");
  renderShopGrid("coming");
  renderInventoryGrid();
  showScreen("screen-shop");
}

function renderShopGrid(category) {
  var name  = state.playerName;
  var items = SHOP_ITEMS.filter(function (it) { return it.category === category; });
  var grid  = document.getElementById("shop-grid-" + category);
  grid.innerHTML = "";

  items.forEach(function (item) {
    var owned         = hasItem(name, item.id);
    var locked        = item.category === "coming";
    var canAfford     = getCoins(name) >= item.cost;
    var isActiveTheme = item.type === "theme" && getActiveTheme(name) === item.id;

    var card = document.createElement("div");
    card.className = "shop-item" + (owned ? " owned" : "") + (locked ? " locked" : "") + (isActiveTheme ? " theme-active" : "");

    var actionHtml = "";
    if (locked) {
      actionHtml = '<span class="coming-soon-badge">🔒 בקרוב</span>';
    } else if (owned && item.type === "theme") {
      if (isActiveTheme) {
        actionHtml = '<span class="owned-badge">✨ פעיל</span>';
      } else {
        actionHtml = '<span class="owned-badge">✅ נרכש</span>' +
          '<button class="buy-btn" onclick="activateTheme(\'' + item.id + '\')">הפעל</button>';
      }
    } else if (owned && !item.consumable) {
      actionHtml = '<span class="owned-badge">✅ נרכש</span>';
    } else {
      actionHtml =
        '<div class="shop-item-cost">🪙 ' + item.cost + "</div>" +
        '<button class="buy-btn" ' + ((!canAfford && !owned) ? "disabled" : "") +
        ' onclick="buyItem(\'' + item.id + '\')">' +
        (owned && item.consumable ? "קנה שוב" : "קנה") +
        "</button>";
    }

    card.innerHTML =
      '<div class="shop-item-emoji">' + item.emoji + "</div>" +
      '<div class="shop-item-name">' + item.name + "</div>" +
      '<div class="shop-item-desc">' + item.desc + "</div>" +
      actionHtml;
    grid.appendChild(card);
  });

  if (category === "cosmetics") {
    var resetBtn = document.getElementById("reset-theme-btn");
    if (resetBtn) resetBtn.style.display = getActiveTheme(name) ? "block" : "none";
  }
}

function buyItem(itemId) {
  var name = state.playerName;
  if (!name) { showToast("⚠️ יש להכנס לשם לפני הקנייה"); return; }

  var item = SHOP_ITEMS.filter(function (it) { return it.id === itemId; })[0];
  if (!item) return;

  if (!spendCoins(name, item.cost)) {
    showToast("❌ אין מספיק מטבעות (דרוש: 🪙 " + item.cost + ")");
    return;
  }

  if (item.consumable) {
    addToInventory(name, item.id);
    showToast("✅ " + item.name + " נוסף לתיק!");
  } else {
    addPurchase(name, item.id);
    if (item.type === "theme") {
      setActiveTheme(name, item.id);
      applyTheme(item.id);
      showToast("🎨 " + item.name + " פעיל עכשיו!");
    } else {
      showToast("✅ " + item.name + " נרכש!");
    }
  }

  document.getElementById("shop-balance").textContent = "🪙 " + getCoins(name);
  renderShopGrid(item.category);
  renderInventoryGrid();
}

function activateTheme(themeId) {
  var name = state.playerName;
  if (!name) return;
  setActiveTheme(name, themeId);
  applyTheme(themeId);
  var item = SHOP_ITEMS.filter(function (it) { return it.id === themeId; })[0];
  showToast("🎨 " + (item ? item.name : themeId) + " פעיל עכשיו!");
  renderShopGrid("cosmetics");
}

function resetTheme() {
  var name = state.playerName;
  if (!name) return;
  setActiveTheme(name, null);
  applyTheme(null);
  showToast("↩️ חזרת לעיצוב ברירת המחדל");
  renderShopGrid("cosmetics");
}

/* ══════════════════════════════════════════════════
   GAME OVER
══════════════════════════════════════════════════ */
function triggerGameOver() {
  clearBonusTimer();
  var balance = getCoins(state.playerName);
  document.getElementById("gameover-word-text").textContent = state.currentWord;
  document.getElementById("gameover-score").textContent     = state.score;
  document.getElementById("gameover-words").textContent     = state.wordsCompleted;
  document.getElementById("gameover-balance").textContent   = balance;
  document.getElementById("buy-life-btn").disabled          = (balance < CONFIG.lifeCost);
  renderLeaderboardInto("gameover-leaderboard-body");
  showScreen("screen-gameover");
}

function buyExtraLife() {
  if (!spendCoins(state.playerName, CONFIG.lifeCost)) {
    showToast("❌ אין מספיק מטבעות (דרוש: 🪙 " + CONFIG.lifeCost + ")");
    return;
  }
  state.lives = 1;
  updateLivesUI();
  document.getElementById("gameover-balance").textContent = getCoins(state.playerName);
  document.getElementById("buy-life-btn").disabled = true;
  showScreen("screen-game");
  loadWord();
}

/* ══════════════════════════════════════════════════
   INVENTORY UI + ITEM USE
══════════════════════════════════════════════════ */
function renderInventoryInto(containerId, name) {
  var grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = "";
  var consumables = SHOP_ITEMS.filter(function (it) { return it.consumable; });
  var hasAny = false;
  consumables.forEach(function (item) {
    var count = getItemCount(name, item.id);
    if (count === 0) return;
    hasAny = true;
    var div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML =
      '<div class="inv-emoji">' + item.emoji + "</div>" +
      '<div class="inv-details">' +
        '<div class="inv-name">' + item.name + "</div>" +
        '<div class="inv-sub">' + item.desc + " · לשימוש במשחק</div>" +
      "</div>" +
      '<div class="inv-count">×' + count + "</div>";
    grid.appendChild(div);
  });
  if (!hasAny) {
    grid.innerHTML = '<div class="no-inventory">אין פריטים בתיק עדיין 🎒<br>קנה פריטים מהחנות!</div>';
  }
}

function renderInventoryGrid() {
  renderInventoryInto("inv-grid", state.playerName);
}

function showPlayerInventory() {
  var name = document.getElementById("player-name").value.trim() || state.playerName;
  if (!name) return;
  document.getElementById("inv-screen-title").textContent = "🎒 הציוד של " + name;
  document.getElementById("inv-screen-coins").textContent = "🪙 " + getCoins(name) + " מטבעות";
  renderInventoryInto("inv-screen-grid", name);
  showScreen("screen-inventory");
}

function updatePlayerInfoBar(name) {
  var bar = document.getElementById("player-info-bar");
  var coinsEl = document.getElementById("start-coins");
  if (!bar || !coinsEl) return;
  if (!name) { bar.classList.remove("visible"); return; }
  state.playerName = name;
  coinsEl.textContent = "🪙 " + getCoins(name);
  bar.classList.add("visible");
  loadTheme(name);
}

function renderGameItemsRow() {
  var row = document.getElementById("game-items-row");
  if (!row) return;
  var name = state.playerName;
  var consumables = SHOP_ITEMS.filter(function (it) { return it.consumable; });
  var available = consumables.filter(function (it) { return getItemCount(name, it.id) > 0; });
  row.innerHTML = "";
  if (available.length === 0) {
    row.classList.remove("has-items");
    return;
  }
  row.classList.add("has-items");
  available.forEach(function (item) {
    var count = getItemCount(name, item.id);
    var isActive = item.effect === "double_coins" && state._doubleCoins;
    var btn = document.createElement("button");
    btn.className = "game-item-btn" + (isActive ? " item-active" : "");
    btn.disabled = isActive;
    btn.innerHTML = isActive
      ? item.emoji + " " + item.name + ' <span class="game-item-badge">פעיל ✓</span>'
      : item.emoji + " " + item.name + ' <span class="game-item-badge">×' + count + "</span>";
    btn.addEventListener("click", function () { useItemInGame(item.id); });
    row.appendChild(btn);
  });
}

var ITEM_EFFECTS = {
  extra_hints: function () {
    state.hints += CONFIG.hintsPerWord;
    document.getElementById("hints-left").textContent = state.hints;
    document.getElementById("hint-btn").disabled = false;
    showToast("💡 +" + CONFIG.hintsPerWord + " רמזים נוספו!");
  },
  skip_word: function () {
    showToast("⏭️ דילגנו על המילה!");
    clearBonusTimer();
    state.isBonus = false;
    state.streak = 0;
    updateStreakUI();
    state.wordIndex++;
    if (state.wordIndex >= state.wordList.length) {
      state.wordList  = freshWordList(state.level);
      state.wordIndex = 0;
    }
    state.hints = CONFIG.hintsPerWord;
    loadWord();
    return "reloaded";
  },
  double_coins: function () {
    state._doubleCoins = true;
    showToast("💰 מטבעות כפולים פעיל עד סוף הסיבוב!");
  },
};

function useItemInGame(itemId) {
  var name = state.playerName;
  var item = SHOP_ITEMS.filter(function (it) { return it.id === itemId; })[0];
  var effectKey = item && item.effect ? item.effect : itemId;
  var handler = ITEM_EFFECTS[effectKey];
  if (!handler) return;

  if (effectKey === "double_coins" && state._doubleCoins) {
    showToast("💰 מטבעות כפולים כבר פעיל!");
    return;
  }
  if (!useFromInventory(name, itemId)) return;

  var result = handler();
  if (result === "reloaded") return;
  renderGameItemsRow();
}

/* ══════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════ */
function nextWord() {
  state.wordIndex++;
  if (state.wordIndex >= state.wordList.length) {
    state.wordList  = freshWordList(state.level);
    state.wordIndex = 0;
  }
  state.hints = CONFIG.hintsPerWord;
  state._doubleCoins = false;
  state.isBonus = state.wordsCompleted > 0 && state.wordsCompleted % CONFIG.bonusEveryN === 0;

  showScreen("screen-game");
  loadWord();
}

function goHome() {
  clearBonusTimer();
  document.getElementById("player-name").value      = state.playerName;
  document.getElementById("name-error").textContent = "";
  renderNameChips();
  updatePlayerInfoBar(state.playerName);
  showScreen("screen-start");
}

/* ══════════════════════════════════════════════════
   BONUS TIMER
══════════════════════════════════════════════════ */
function startBonusTimer() {
  clearBonusTimer();
  document.getElementById("bonus-banner").classList.add("active");
  document.getElementById("timer-row").classList.add("active");
  document.getElementById("screen-game").classList.add("bonus-mode");

  state.bonusTimeLeft = CONFIG.bonusSeconds;
  updateTimerUI(CONFIG.bonusSeconds);

  state.bonusInterval = setInterval(function () {
    state.bonusTimeLeft--;
    updateTimerUI(state.bonusTimeLeft);

    if (state.bonusTimeLeft <= 0) {
      clearBonusTimer();
      handleBonusTimeout();
    }
  }, 1000);
}

function clearBonusTimer() {
  if (state.bonusInterval) {
    clearInterval(state.bonusInterval);
    state.bonusInterval = null;
  }
  document.getElementById("bonus-banner").classList.remove("active");
  document.getElementById("timer-row").classList.remove("active");
  document.getElementById("screen-game").classList.remove("bonus-mode");
}

function updateStreakUI() {
  var el = document.getElementById("streak-display");
  if (!el) return;
  var s = state.streak;
  el.textContent = "🔥 " + s + "/" + CONFIG.streakEvery;
  el.classList.toggle("streak-hot", s >= CONFIG.streakEvery - 1);
  el.classList.toggle("streak-active", s >= 1);
}

function updateLivesUI() {
  var el = document.getElementById("lives-display");
  if (!el) return;
  var hearts = [];
  for (var i = 0; i < CONFIG.lives; i++) hearts.push(i < state.lives ? "❤️" : "🖤");
  el.textContent = hearts.join("");
  el.classList.toggle("danger", state.lives === 1);
}

function updateTimerUI(seconds) {
  var numEl  = document.getElementById("timer-number");
  var fillEl = document.getElementById("timer-fill");
  numEl.textContent = seconds;
  numEl.classList.toggle("urgent", seconds <= 5);
  var pct = (seconds / CONFIG.bonusSeconds) * 100;
  fillEl.style.width = pct + "%";
  fillEl.style.backgroundPosition = pct + "% center";
}

function handleBonusTimeout() {
  var overlay = document.getElementById("timeout-overlay");
  overlay.classList.add("active");
  setTimeout(function () {
    overlay.classList.remove("active");
    state.wordsCompleted++;
    state.isBonus = false;
    state.streak = 0;
    updateStreakUI();
    nextWord();
  }, 1500);
}

/* ══════════════════════════════════════════════════
   CONFETTI
══════════════════════════════════════════════════ */
function launchConfetti() {
  var colors = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#A29BFE","#FD79A8","#FF9F43"];
  for (var i = 0; i < 70; i++) {
    setTimeout(function () {
      var el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.left              = Math.random() * 100 + "vw";
      el.style.width             = Math.random() * 10 + 5 + "px";
      el.style.height            = Math.random() * 10 + 5 + "px";
      el.style.background        = colors[Math.floor(Math.random() * colors.length)];
      el.style.borderRadius      = Math.random() > 0.5 ? "50%" : "3px";
      el.style.animationDuration = Math.random() * 2 + 1.2 + "s";
      document.body.appendChild(el);
      el.addEventListener("animationend", function () { el.remove(); });
    }, i * 25);
  }
}

function applyConfigCopy() {
  var notice = document.getElementById("shop-notice");
  if (notice) {
    notice.innerHTML =
      "💡 רעיונות לחנות מגיעים בקרוב!<br>" +
      "כל מילה נכונה = 🪙 " + CONFIG.coinsCorrect + " מטבעות · " +
      "סיבוב בונוס = 🪙 " + CONFIG.coinsBonus + " · " +
      "מטבעות כפולים מכפילים את הפרס";
  }
  var bonusSub = document.getElementById("bonus-sublabel");
  if (bonusSub) {
    bonusSub.textContent = "פתור תוך " + CONFIG.bonusSeconds + " שניות וקבל פי 2 מטבעות!";
  }
  var buyLife = document.getElementById("buy-life-btn");
  if (buyLife) {
    buyLife.textContent = "❤️ קנה חיים — 🪙 " + CONFIG.lifeCost;
  }
  var hintsLeft = document.getElementById("hints-left");
  if (hintsLeft) hintsLeft.textContent = String(CONFIG.hintsPerWord);
  var timerNum = document.getElementById("timer-number");
  if (timerNum) timerNum.textContent = String(CONFIG.bonusSeconds);
  updateStreakUI();
  updateLivesUI();
}

applyConfigCopy();
renderNameChips();
