/* ══════════════════════════════════════════════════
   LOCALSTORAGE — keys
══════════════════════════════════════════════════ */
var KEY_SCORES    = "aot_baot_scores";
var KEY_COINS     = "aot_baot_coins";       // { playerName: balance }
var KEY_PURCHASES = "aot_baot_purchases";   // { playerName: [itemId, ...] }
var KEY_INVENTORY = "aot_baot_inventory";   // { playerName: { itemId: count } }
var KEY_THEME     = "aot_baot_theme";       // { playerName: themeId }
var THEME_IDS     = ["theme_space", "theme_jungle", "theme_unicorn"];

/* ── Scores ── */
function getScores() {
  try { return JSON.parse(localStorage.getItem(KEY_SCORES)) || []; } catch (e) { return []; }
}
function saveScore(name, score, level) {
  var scores = getScores();
  scores.push({ name: name, score: score, level: level, ts: Date.now() });
  if (scores.length > 200) scores.splice(0, scores.length - 200);
  localStorage.setItem(KEY_SCORES, JSON.stringify(scores));
}
function topScores() {
  var best = {};
  getScores().forEach(function (e) {
    if (!best[e.name] || e.score > best[e.name].score) best[e.name] = e;
  });
  return Object.values(best).sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
}

/* ── Coins ── */
function getAllCoins() {
  try { return JSON.parse(localStorage.getItem(KEY_COINS)) || {}; } catch (e) { return {}; }
}
function getCoins(name) { return getAllCoins()[name] || 0; }
function addCoins(name, amount) {
  var all = getAllCoins();
  all[name] = (all[name] || 0) + amount;
  localStorage.setItem(KEY_COINS, JSON.stringify(all));
}
function spendCoins(name, amount) {
  var all = getAllCoins();
  if ((all[name] || 0) < amount) return false;
  all[name] -= amount;
  localStorage.setItem(KEY_COINS, JSON.stringify(all));
  return true;
}

/* ── Purchases ── */
function getAllPurchases() {
  try { return JSON.parse(localStorage.getItem(KEY_PURCHASES)) || {}; } catch (e) { return {}; }
}
function getPurchases(name) { return getAllPurchases()[name] || []; }
function hasItem(name, itemId) { return getPurchases(name).indexOf(itemId) !== -1; }
function addPurchase(name, itemId) {
  var all = getAllPurchases();
  if (!all[name]) all[name] = [];
  if (all[name].indexOf(itemId) === -1) all[name].push(itemId);
  localStorage.setItem(KEY_PURCHASES, JSON.stringify(all));
}

/* ── Inventory ── */
function getInventoryAll() {
  try { return JSON.parse(localStorage.getItem(KEY_INVENTORY)) || {}; } catch (e) { return {}; }
}
function getInventory(name) { return getInventoryAll()[name] || {}; }
function getItemCount(name, itemId) { return getInventory(name)[itemId] || 0; }
function addToInventory(name, itemId, qty) {
  if (qty === undefined) qty = 1;
  var all = getInventoryAll();
  if (!all[name]) all[name] = {};
  all[name][itemId] = (all[name][itemId] || 0) + qty;
  localStorage.setItem(KEY_INVENTORY, JSON.stringify(all));
}
function useFromInventory(name, itemId) {
  var all = getInventoryAll();
  if (!all[name] || !all[name][itemId] || all[name][itemId] <= 0) return false;
  all[name][itemId]--;
  localStorage.setItem(KEY_INVENTORY, JSON.stringify(all));
  return true;
}

/* ── Themes ── */
function getAllThemes() {
  try { return JSON.parse(localStorage.getItem(KEY_THEME)) || {}; } catch (e) { return {}; }
}
function getActiveTheme(name) { return getAllThemes()[name] || null; }
function setActiveTheme(name, themeId) {
  var all = getAllThemes();
  all[name] = themeId;
  localStorage.setItem(KEY_THEME, JSON.stringify(all));
}

function applyTheme(themeId) {
  if (themeId && THEME_IDS.indexOf(themeId) !== -1) {
    document.body.setAttribute("data-theme", themeId);
  } else {
    document.body.removeAttribute("data-theme");
  }
}

function loadTheme(name) {
  applyTheme(name ? getActiveTheme(name) : null);
}
