let target = 'PLANT';
let row = 0, col = 0, current = '', finished = false, score = 0, streak = 0;
const board = document.querySelector('#board');
const message = document.querySelector('#message');
const keys = {};
const rows = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];

function makeBoard(){
  board.innerHTML = '';
  for(let r=0;r<6;r++) for(let c=0;c<5;c++){
    const cell=document.createElement('div'); cell.className='cell'; cell.id=`cell-${r}-${c}`; board.append(cell);
  }
}
function makeKeyboard(){
  const wrap=document.querySelector('#keyboard'); wrap.innerHTML='';
  rows.forEach((letters,index)=>{const rowEl=document.createElement('div');rowEl.className='key-row'; if(index===2){rowEl.append(makeKey('ENTER',true));} [...letters].forEach(l=>rowEl.append(makeKey(l))); if(index===2)rowEl.append(makeKey('⌫',true));wrap.append(rowEl);});
}
function makeKey(letter,wide=false){const b=document.createElement('button'); b.className=`key${wide?' wide':''}`; b.textContent=letter; b.onclick=()=>input(letter); if(letter.length===1)keys[letter]=b; return b;}
function input(letter){
  if(finished)return;
  if(letter==='⌫'){current=current.slice(0,-1);col=Math.max(0,col-1);const c=document.querySelector(`#cell-${row}-${col}`);c.textContent='';c.classList.remove('filled');return;}
  if(letter==='ENTER'){submit();return;}
  if(col<5){const c=document.querySelector(`#cell-${row}-${col}`);c.textContent=letter;c.classList.add('filled');current+=letter;col++;}
}
function submit(){
  if(current.length!==5){say('Enter a five-letter word.');return;}
  const usage=[...target];const results=[];
  [...current].forEach((letter,i)=>{if(letter===target[i]){results[i]='correct';usage[i]=null;}});
  [...current].forEach((letter,i)=>{if(!results[i]){const at=usage.indexOf(letter);results[i]=at>-1?'present':'absent';if(at>-1)usage[at]=null;}});
  [...current].forEach((letter,i)=>{const cell=document.querySelector(`#cell-${row}-${i}`);cell.classList.add(results[i]);const key=keys[letter];if(key && (!key.classList.contains('correct') || results[i]==='correct')){key.classList.remove('present','absent');key.classList.add(results[i]);}});
  if(current===target){finished=true;score+=Math.max(120,600-row*80);streak++;document.querySelector('#score').textContent=score;document.querySelector('#streak').textContent=`${streak} 🔥`;say(`Brilliant! ${target} found in ${row+1}.`,'win');return;}
  row++;col=0;current='';if(row===6){finished=true;say(`The word was ${target}. Come back for the next round.`);}
}
function say(text,type=''){message.textContent=text;message.className=`message ${type}`;}
function startCustomGame(word, title){
  target = word.toUpperCase();
  row = 0; col = 0; current = ''; finished = false;
  makeBoard();
  Object.values(keys).forEach(key => key.className = 'key');
  document.querySelector('.wordle-stage h2').textContent = title;
  document.querySelector('.game-subtitle').textContent = `Find the hidden ${target.length}-letter word.`;
  say('Your custom round is ready.');
  show('play');
}
function inviteLink(word, title){
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ word, title }))));
  return `${window.location.href.split('?')[0]}?game=${encodeURIComponent(payload)}`;
}
function copyInvite(link, button){
  if (!navigator.clipboard) {
    window.prompt('Copy this invite link:', link);
    return;
  }
  navigator.clipboard.writeText(link).then(() => {
    button.textContent = 'Copied!';
    setTimeout(() => button.textContent = 'Copy invite link', 1800);
  }).catch(() => window.prompt('Copy this invite link:', link));
}
document.addEventListener('keydown',e=>{if(e.key==='Enter')input('ENTER');else if(e.key==='Backspace')input('⌫');else if(/^[a-zA-Z]$/.test(e.key))input(e.key.toUpperCase());});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.view)));
function show(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelector(`#${name}-view`).classList.add('active');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));document.querySelector('#page-title').textContent=name==='home'?'Good evening, Anvita.':name==='play'?'Tournament room.':name==='builder'?'Game studio.':'Meet the Guild.';window.scrollTo({top:0,behavior:'smooth'});}
document.querySelector('#rules-button').onclick=()=>document.querySelector('#modal').hidden=false;
document.querySelector('#close-modal').onclick=()=>document.querySelector('#modal').hidden=true;
document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')e.currentTarget.hidden=true;};
const titleInput=document.querySelector('#game-title'),wordInput=document.querySelector('#secret-word'),noteInput=document.querySelector('#game-note');
titleInput.oninput=()=>document.querySelector('#preview-title').textContent=titleInput.value||'Your new game';
noteInput.oninput=()=>document.querySelector('#preview-note').textContent=noteInput.value||'A Wordle round by Anvita K.';
wordInput.oninput=()=>{wordInput.value=wordInput.value.replace(/[^a-z]/gi,'').toUpperCase();const slots=document.querySelectorAll('.preview-tiles i');[...wordInput.value.padEnd(5,' ')].slice(0,5).forEach((l,i)=>slots[i].textContent=l||'·');};
document.querySelector('#creator-form').onsubmit=e=>{e.preventDefault();const title=titleInput.value.trim(),word=wordInput.value.trim();if(word.length<3){wordInput.focus();return;}const item=document.createElement('article');item.className='created-game';item.innerHTML=`<span class="mini-logo">W</span><div><h3></h3><p></p></div><span class="status">PUBLISHED</span>`;item.querySelector('h3').textContent=title;item.querySelector('p').textContent=`Wordle · ${word.length} letters · ${document.querySelector('#public-game').checked?'Guild':'Private'}`;const list=document.querySelector('#published-list');list.innerHTML='';list.append(item);e.target.reset();document.querySelector('#preview-title').textContent='Your new game';document.querySelector('#preview-note').textContent='A Wordle round by Anvita K.';document.querySelectorAll('.preview-tiles i').forEach((el,i)=>el.textContent='ARTSY'[i]);say('');};
document.addEventListener('submit', event => {
  if (event.target.id !== 'creator-form') return;
  const word = wordInput.value.trim().toUpperCase();
  const title = titleInput.value.trim();
  if (word.length !== 5) return;
  setTimeout(() => {
    const item = document.querySelector('#published-list .created-game');
    if (!item) return;
    const playButton = document.createElement('button');
    playButton.className = 'card-action';
    playButton.textContent = 'Play this word →';
    playButton.onclick = () => startCustomGame(word, title);
    item.append(playButton);
    const link = inviteLink(word, title);
    const copyButton = document.createElement('button');
    copyButton.className = 'invite-button';
    copyButton.textContent = 'Copy invite link';
    copyButton.onclick = () => copyInvite(link, copyButton);
    item.append(copyButton);
  });
}, true);
makeBoard();makeKeyboard();
const invite = new URLSearchParams(window.location.search).get('game');
if (invite) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(invite))));
    if (/^[A-Za-z]{5}$/.test(data.word) && data.title) startCustomGame(data.word, data.title);
  } catch { /* Ignore malformed invite links. */ }
}
