const DAILY_WORDS = window.GUILDWORT_WORDS || ['PLANT'];
function dailyDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}
function getDailyGame() {
  const key = dailyDateKey();
  const index = [...key].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7) % DAILY_WORDS.length;
  return { id: `daily-${key}`, title: 'Daily Wordle', word: DAILY_WORDS[index], note: `A fresh word for ${key}.` };
}
const DAILY_GAME = getDailyGame();
const STORAGE_KEY = 'guildwort-games-v1';
const STATS_KEY = 'guildwort-stats-v1';
const board = document.querySelector('#board');
const message = document.querySelector('#message');
const keyboard = document.querySelector('#keyboard');
const titleInput = document.querySelector('#game-title');
const wordInput = document.querySelector('#secret-word');
const noteInput = document.querySelector('#game-note');
const gamesList = document.querySelector('#published-list');
const keyButtons = {};

let activeGame = DAILY_GAME;
let row = 0;
let current = '';
let finished = false;
let stats = loadStats();

function loadGames() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveGames(games) { localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); }

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || { score: 0, streak: 0 }; }
  catch { return { score: 0, streak: 0 }; }
}

function saveStats() { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }

function updateStats() {
  document.querySelector('#score').textContent = stats.score;
  document.querySelector('#streak').textContent = `${stats.streak} streak`;
}

function makeBoard() {
  board.innerHTML = '';
  for (let r = 0; r < 6; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      board.append(cell);
    }
  }
}

function makeKeyboard() {
  keyboard.innerHTML = '';
  Object.keys(keyButtons).forEach(key => delete keyButtons[key]);
  ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((letters, index) => {
    const rowElement = document.createElement('div');
    rowElement.className = 'key-row';
    if (index === 2) rowElement.append(makeKey('ENTER', true));
    [...letters].forEach(letter => rowElement.append(makeKey(letter)));
    if (index === 2) rowElement.append(makeKey('BACKSPACE', true));
    keyboard.append(rowElement);
  });
}

function makeKey(letter, wide = false) {
  const button = document.createElement('button');
  button.className = `key${wide ? ' wide' : ''}`;
  button.textContent = letter === 'BACKSPACE' ? 'DEL' : letter;
  button.addEventListener('click', () => input(letter));
  if (letter.length === 1) keyButtons[letter] = button;
  return button;
}

function resetRound() {
  row = 0;
  current = '';
  finished = false;
  makeBoard();
  makeKeyboard();
  say('');
}

function startGame(game) {
  activeGame = game;
  document.querySelector('.wordle-stage h2').textContent = game.title;
  document.querySelector('.game-subtitle').textContent = game.note || 'Find the hidden five-letter word.';
  resetRound();
  show('play');
}

function input(letter) {
  if (finished) return;
  if (letter === 'BACKSPACE') {
    if (!current) return;
    current = current.slice(0, -1);
    const cell = document.querySelector(`#cell-${row}-${current.length}`);
    cell.textContent = '';
    cell.classList.remove('filled');
    return;
  }
  if (letter === 'ENTER') { submit(); return; }
  if (current.length >= 5) return;
  current += letter;
  const cell = document.querySelector(`#cell-${row}-${current.length - 1}`);
  cell.textContent = letter;
  cell.classList.add('filled');
}

function submit() {
  if (current.length !== 5) { say('Enter a five-letter word.'); return; }
  const answer = activeGame.word.toUpperCase();
  const available = [...answer];
  const result = Array(5).fill('absent');

  [...current].forEach((letter, index) => {
    if (letter === answer[index]) { result[index] = 'correct'; available[index] = null; }
  });
  [...current].forEach((letter, index) => {
    if (result[index] !== 'correct') {
      const match = available.indexOf(letter);
      if (match >= 0) { result[index] = 'present'; available[match] = null; }
    }
  });
  result.forEach((state, index) => {
    document.querySelector(`#cell-${row}-${index}`).classList.add(state);
    const key = keyButtons[current[index]];
    if (!key) return;
    if (state === 'correct' || !key.classList.contains('correct')) {
      key.classList.remove('present', 'absent');
      key.classList.add(state);
    }
  });

  if (current === answer) {
    finished = true;
    const earned = Math.max(120, 600 - row * 80);
    stats.score += earned;
    stats.streak += 1;
    saveStats(); updateStats();
    say(`Solved in ${row + 1}! You earned ${earned} points.`, 'win');
    return;
  }
  row += 1;
  current = '';
  if (row === 6) {
    finished = true;
    stats.streak = 0;
    saveStats(); updateStats();
    say(`The word was ${answer}. Try another round.`, 'loss');
  }
}

function say(text, kind = '') { message.textContent = text; message.className = `message ${kind}`; }

function encodeGame(game) {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ title: game.title, word: game.word, note: game.note }))));
}

function decodeGame(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

function inviteLink(game) {
  return `${window.location.href.split('?')[0]}?game=${encodeURIComponent(encodeGame(game))}`;
}

function copyText(value, button) {
  const done = () => {
    button.textContent = 'Copied!';
    setTimeout(() => { button.textContent = 'Copy invite link'; }, 1600);
  };
  if (!navigator.clipboard) { window.prompt('Copy this invite link:', value); return; }
  navigator.clipboard.writeText(value).then(done).catch(() => window.prompt('Copy this invite link:', value));
}

function renderGames() {
  const games = loadGames();
  gamesList.innerHTML = '';
  if (!games.length) {
    gamesList.innerHTML = '<p class="empty-state">No custom games yet. Your first one is waiting.</p>';
    return;
  }
  games.forEach(game => {
    const item = document.createElement('article');
    item.className = 'created-game';
    const logo = document.createElement('span'); logo.className = 'mini-logo'; logo.textContent = 'W';
    const details = document.createElement('div');
    const heading = document.createElement('h3'); heading.textContent = game.title;
    const description = document.createElement('p'); description.textContent = `${game.note || 'Custom Wordle'} · 5 letters`;
    const play = document.createElement('button'); play.className = 'card-action'; play.textContent = 'Play'; play.onclick = () => startGame(game);
    const copy = document.createElement('button'); copy.className = 'invite-button'; copy.textContent = 'Copy invite link'; copy.onclick = () => copyText(inviteLink(game), copy);
    details.append(heading, description); item.append(logo, details, play, copy); gamesList.append(item);
  });
}

function show(name) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.querySelector(`#${name}-view`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  const titles = { home: 'Good evening, Anvita.', play: 'Tournament room.', builder: 'Game studio.', players: 'Meet the Guild.' };
  document.querySelector('#page-title').textContent = titles[name];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
document.querySelector('#rules-button').onclick = () => { document.querySelector('#modal').hidden = false; };
document.querySelector('#close-modal').onclick = () => { document.querySelector('#modal').hidden = true; };
document.querySelector('#modal').onclick = event => { if (event.target.id === 'modal') event.currentTarget.hidden = true; };
document.addEventListener('keydown', event => {
  if (event.key === 'Enter') input('ENTER');
  else if (event.key === 'Backspace') input('BACKSPACE');
  else if (/^[a-zA-Z]$/.test(event.key)) input(event.key.toUpperCase());
});

titleInput.oninput = () => { document.querySelector('#preview-title').textContent = titleInput.value || 'Your new game'; };
noteInput.oninput = () => { document.querySelector('#preview-note').textContent = noteInput.value || 'A Wordle round by Anvita K.'; };
wordInput.oninput = () => {
  wordInput.value = wordInput.value.replace(/[^a-z]/gi, '').toUpperCase();
  document.querySelectorAll('.preview-tiles i').forEach((tile, index) => { tile.textContent = wordInput.value[index] || '·'; });
};
document.querySelector('#creator-form').onsubmit = event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const word = wordInput.value.trim().toUpperCase();
  if (!/^[A-Z]{5}$/.test(word)) { say('Your secret word must have exactly five letters.'); return; }
  const game = { id: `${Date.now()}`, title, word, note: noteInput.value.trim(), createdAt: Date.now() };
  const games = loadGames();
  games.unshift(game); saveGames(games); renderGames();
  event.target.reset();
  document.querySelector('#preview-title').textContent = 'Your new game';
  document.querySelector('#preview-note').textContent = 'A Wordle round by Anvita K.';
  document.querySelectorAll('.preview-tiles i').forEach((tile, index) => { tile.textContent = 'ARTSY'[index]; });
  startGame(game);
};

makeBoard();
makeKeyboard();
updateStats();
renderGames();
const invite = new URLSearchParams(window.location.search).get('game');
if (invite) {
  try {
    const game = decodeGame(invite);
    if (/^[A-Za-z]{5}$/.test(game.word) && game.title) startGame({ ...game, word: game.word.toUpperCase() });
  } catch { /* Invalid or incomplete invite links are ignored. */ }
}
