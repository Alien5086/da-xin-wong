import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Timer, Target, Volume2, VolumeX, 
  LogOut, Star, Users as UsersIcon, Clock,
  Briefcase, X, ZoomIn, ZoomOut, Menu
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// =========================================================
// 1. 全域常數與純函數
// =========================================================
var BASE_MONEY = 17200; 
var BASE_TRUST = 10; 
var MAP_SIZE = 1900; 

function cloneObj(obj) {
  if (!obj) return obj;
  var res = {};
  for (var k in obj) { res[k] = obj[k]; }
  return res;
}

function clonePlayers(playersArr) {
  if (!playersArr) return [];
  var res = [];
  for (var i = 0; i < playersArr.length; i++) {
    res.push(cloneObj(playersArr[i]));
  }
  return res;
}

function getPlayerById(playersArr, id) {
  if (!playersArr) return null;
  for (var i = 0; i < playersArr.length; i++) {
    if (playersArr[i].id === id) return playersArr[i];
  }
  return null;
}

var INACTIVE_OFFSETS = [
  { x: -35, y: -35 }, { x: 35, y: 35 }, { x: -35, y: 35 }, 
  { x: 35, y: -35 }, { x: 0, y: -45 }, { x: 0, y: 45 }     
];

var CHILD_AVATARS = ['👦', '👧', '👶', '👼', '👲', '👸', '🤴', '🤓', '🤠', '😎', '👻', '👽', '🤖', '👾', '測試', '🐼'];

var GOOD_CARDS = JSON.parse(`[{"desc":"扶老奶奶過馬路","effectM":200,"effectT":3},{"desc":"考試考一百分","effectM":500,"effectT":2},{"desc":"拾金不昧","effectM":300,"effectT":5},{"desc":"當選模範生","effectM":1000,"effectT":5},{"desc":"主動打掃教室","effectM":100,"effectT":2}]`);
var BAD_CARDS = JSON.parse(`[{"desc":"遺失錢包","effectM":-300,"effectT":-2},{"desc":"隨地亂丟垃圾","effectM":-200,"effectT":-3},{"desc":"打破鄰居玻璃","effectM":-400,"effectT":-2},{"desc":"上課遲到","effectM":-100,"effectT":-2},{"desc":"對同學說謊被抓到","effectM":0,"effectT":-5},{"desc":"做壞事進反省泡泡","effectM":0,"effectT":0,"goToJail":true}]`);
var BOARD_SQUARES = JSON.parse(`[{"id":0,"name":"起點","type":"START","desc":"經過得$500"},{"id":1,"name":"冰店","type":"PROPERTY","price":400,"reqTrust":0,"color":"bg-sky-300"},{"id":2,"name":"虛卡","type":"CHANCE_BAD","color":"bg-rose-200"},{"id":3,"name":"飲料店","type":"PROPERTY","price":500,"reqTrust":0,"color":"bg-sky-300"},{"id":4,"name":"班費","type":"TAX","amount":200,"color":"bg-slate-200"},{"id":5,"name":"火車站","type":"PROPERTY","price":1800,"reqTrust":15,"color":"bg-slate-300"},{"id":6,"name":"小吃店","type":"PROPERTY","price":400,"reqTrust":0,"color":"bg-orange-300"},{"id":7,"name":"實卡","type":"CHANCE_GOOD","color":"bg-emerald-200"},{"id":8,"name":"麵包店","type":"PROPERTY","price":500,"reqTrust":0,"color":"bg-orange-300"},{"id":9,"name":"便利商店","type":"PROPERTY","price":600,"reqTrust":0,"color":"bg-orange-300"},{"id":10,"name":"靜心房","type":"JAIL","desc":"反省懺悔","color":"bg-fuchsia-200"},{"id":11,"name":"服飾店","type":"PROPERTY","price":700,"reqTrust":10,"color":"bg-pink-300"},{"id":12,"name":"超級市場","type":"PROPERTY","price":700,"reqTrust":0,"color":"bg-pink-300"},{"id":13,"name":"虛卡","type":"CHANCE_BAD","color":"bg-rose-200"},{"id":14,"name":"鞋店","type":"PROPERTY","price":700,"reqTrust":10,"color":"bg-pink-300"},{"id":15,"name":"書局","type":"PROPERTY","price":800,"reqTrust":10,"color":"bg-yellow-300"},{"id":16,"name":"補習班","type":"PROPERTY","price":900,"reqTrust":10,"color":"bg-yellow-300"},{"id":17,"name":"實卡","type":"CHANCE_GOOD","color":"bg-emerald-200"},{"id":18,"name":"才藝班","type":"PROPERTY","price":900,"reqTrust":10,"color":"bg-yellow-300"},{"id":19,"name":"網咖","type":"PROPERTY","price":1600,"reqTrust":10,"color":"bg-purple-300"},{"id":20,"name":"道育班","type":"FREE_PARKING","desc":"平安無事","color":"bg-teal-200"},{"id":21,"name":"遊樂場","type":"PROPERTY","price":1100,"reqTrust":12,"color":"bg-teal-300"},{"id":22,"name":"博物館","type":"PROPERTY","price":1600,"reqTrust":12,"color":"bg-teal-300"},{"id":23,"name":"公園","type":"PROPERTY","price":1000,"reqTrust":12,"color":"bg-teal-300"},{"id":24,"name":"虛卡","type":"CHANCE_BAD","color":"bg-rose-200"},{"id":25,"name":"美髮店","type":"PROPERTY","price":600,"reqTrust":10,"color":"bg-indigo-300"},{"id":26,"name":"實卡","type":"CHANCE_GOOD","color":"bg-emerald-200"},{"id":27,"name":"電力公司","type":"PROPERTY","price":2000,"reqTrust":15,"color":"bg-slate-300"},{"id":28,"name":"玩具店","type":"PROPERTY","price":700,"reqTrust":10,"color":"bg-indigo-300"},{"id":29,"name":"圖書館","type":"PROPERTY","price":1500,"reqTrust":12,"color":"bg-indigo-300"},{"id":30,"name":"進入靜心房","type":"GO_TO_JAIL","desc":"直接入獄","color":"bg-fuchsia-300"},{"id":31,"name":"虛卡","type":"CHANCE_BAD","color":"bg-rose-200"},{"id":32,"name":"學校","type":"PROPERTY","price":1800,"reqTrust":15,"color":"bg-emerald-300"},{"id":33,"name":"植物園","type":"PROPERTY","price":1400,"reqTrust":12,"color":"bg-emerald-300"},{"id":34,"name":"美術館","type":"PROPERTY","price":1500,"reqTrust":12,"color":"bg-emerald-300"},{"id":35,"name":"科博館","type":"PROPERTY","price":1600,"reqTrust":12,"color":"bg-emerald-300"},{"id":36,"name":"實卡","type":"CHANCE_GOOD","color":"bg-emerald-200"},{"id":37,"name":"孔廟","type":"PROPERTY","price":1900,"reqTrust":15,"color":"bg-rose-300"},{"id":38,"name":"學費","type":"TAX","amount":500,"color":"bg-gray-300"},{"id":39,"name":"自來水廠","type":"PROPERTY","price":2000,"reqTrust":15,"color":"bg-slate-300"}]`);

function createGridOrder() {
  var order = [];
  for (var i = 0; i < 40; i++) order.push(null);
  for (var i = 0; i <= 10; i++) order[i] = { row: 11, col: 11 - i };
  for (var i = 11; i <= 19; i++) order[i] = { row: 11 - (i - 10), col: 1 };
  for (var i = 20; i <= 30; i++) order[i] = { row: 1, col: 1 + (i - 20) };
  for (var i = 31; i <= 39; i++) order[i] = { row: 1 + (i - 30), col: 11 };
  return order;
}
var GRID_ORDER = createGridOrder();

function formatTime(seconds) {
  if (seconds === -1) return "不限時";
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ':' + s.toString().padStart(2, '0');
}

function checkBankruptcy(players) {
  var changed = false;
  var newPlayers = [];
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    if (!p.isBankrupt && (p.money < 0 || p.trust <= 0)) {
      changed = true;
      var bp = cloneObj(p);
      bp.isBankrupt = true;
      newPlayers.push(bp);
    } else {
      newPlayers.push(cloneObj(p));
    }
  }
  return { changed: changed, newPlayers: newPlayers };
}

function clearBankruptProperties(props, bankruptPlayerIds) {
  var newProps = {};
  for (var sqId in props) {
    var found = false;
    for (var i = 0; i < bankruptPlayerIds.length; i++) {
      if (bankruptPlayerIds[i] === props[sqId]) {
        found = true;
        break;
      }
    }
    if (!found) {
      newProps[sqId] = props[sqId];
    }
  }
  return newProps;
}

function getOwnerBodyClass(colorClass) {
  if (colorClass === 'bg-sky-300') return 'bg-sky-100';
  if (colorClass === 'bg-rose-300') return 'bg-rose-100';
  if (colorClass === 'bg-emerald-300') return 'bg-emerald-100';
  if (colorClass === 'bg-purple-300') return 'bg-purple-100';
  if (colorClass === 'bg-orange-300') return 'bg-orange-100';
  if (colorClass === 'bg-pink-300') return 'bg-pink-100';
  return 'bg-slate-100';
}

function getOwnerBorderClass(colorClass) {
  if (colorClass === 'bg-sky-300') return 'border-sky-300';
  if (colorClass === 'bg-rose-300') return 'border-rose-300';
  if (colorClass === 'bg-emerald-300') return 'border-emerald-300';
  if (colorClass === 'bg-purple-300') return 'border-purple-300';
  if (colorClass === 'bg-orange-300') return 'border-orange-300';
  if (colorClass === 'bg-pink-300') return 'border-pink-300';
  return 'border-slate-300';
}

// =========================================================
// 2. Firebase 初始化
// =========================================================
function getFirebaseConfig() {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.warn("使用預設金鑰");
  }
  return {
    apiKey: "AIzaSyBNN-5xswc1tq_Y5ymWMVGFldZRfpvsVZM",
    authDomain: "da-xin-wong.firebaseapp.com",
    projectId: "da-xin-wong",
    storageBucket: "da-xin-wong.appspot.com",
    messagingSenderId: "72871979370",
    appId: "1:72871979370:web:97caab1074d5f1e8f9dd13"
  };
}

var firebaseConfig = getFirebaseConfig();
var app = initializeApp(firebaseConfig);
var db = getFirestore(app);
var auth = getAuth(app);
var appId = typeof __app_id !== 'undefined' ? __app_id : 'da-xin-wong-v1';

// 🌟 Web Audio API 音效
var audioCtx = null;
function playSound(type, isMuted) {
  if (isMuted || typeof window === 'undefined') return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  var now = audioCtx.currentTime;
  var osc = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); 
  } else if (type === 'move') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); 
  } else if (type === 'coin') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.setValueAtTime(1600, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); 
  } else if (type === 'bad') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.4); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); 
  } else if (type === 'win') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); 
  } else if (type === 'bwa') {
      osc.type = 'square'; osc.frequency.setValueAtTime(150, now); gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05); 
  } else if (type === 'roll') {
      for(var i=0; i<6; i++) { 
          var o = audioCtx.createOscillator(); var g = audioCtx.createGain(); 
          o.connect(g); g.connect(audioCtx.destination); o.type = 'triangle'; 
          o.frequency.setValueAtTime(300 + Math.random()*300, now + i*0.08); 
          g.gain.setValueAtTime(0.1, now + i*0.08); g.gain.exponentialRampToValueAtTime(0.01, now + i*0.08 + 0.05); 
          o.start(now + i*0.08); o.stop(now + i*0.08 + 0.05); 
      } 
  }
}

// =========================================================
// 3. UI 顯示純組件
// =========================================================
function DiceIcon(props) {
  var val = props.value || 1;
  var cw = props.strokeWidth || 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={cw} strokeLinecap="round" strokeLinejoin="round" className={props.className} style={props.style}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      {val === 1 ? <circle cx="12" cy="12" r="2" fill="currentColor" /> : null}
      {val === 2 ? <><circle cx="8" cy="8" r="2" fill="currentColor" /><circle cx="16" cy="16" r="2" fill="currentColor" /></> : null}
      {val === 3 ? <><circle cx="8" cy="8" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="16" cy="16" r="2" fill="currentColor" /></> : null}
      {val === 4 ? <><circle cx="8" cy="8" r="2" fill="currentColor" /><circle cx="16" cy="8" r="2" fill="currentColor" /><circle cx="8" cy="16" r="2" fill="currentColor" /><circle cx="16" cy="16" r="2" fill="currentColor" /></> : null}
      {val === 5 ? <><circle cx="8" cy="8" r="2" fill="currentColor" /><circle cx="16" cy="8" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="8" cy="16" r="2" fill="currentColor" /><circle cx="16" cy="16" r="2" fill="currentColor" /></> : null}
      {val === 6 ? <><circle cx="8" cy="8" r="2" fill="currentColor" /><circle cx="16" cy="8" r="2" fill="currentColor" /><circle cx="8" cy="12" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="8" cy="16" r="2" fill="currentColor" /><circle cx="16" cy="16" r="2" fill="currentColor" /></> : null}
    </svg>
  );
}

function BweiBlock(props) {
  var c = props.className || "";
  if (props.isFlat) {
      return (
        <div className={"relative " + c}>
          <div className="w-[32px] h-[75px] bg-[#fb7185] border-[2px] border-[#e11d48] rounded-r-[40px] rounded-l-[6px] shadow-inner drop-shadow-md relative overflow-hidden">
             <div className="absolute top-1 bottom-1 left-1 right-2 bg-[#fda4af] rounded-r-[30px] rounded-l-[4px] opacity-90"></div>
          </div>
        </div>
      );
  } else {
      return (
        <div className={"relative " + c}>
          <div className="w-[32px] h-[75px] bg-[#be123c] border-[2px] border-[#881337] rounded-r-[40px] rounded-l-[6px] shadow-[inset_-6px_0_10px_rgba(0,0,0,0.5)] drop-shadow-xl relative overflow-hidden">
             <div className="absolute top-2 bottom-2 right-1.5 w-[6px] bg-white/40 rounded-full blur-[2px]"></div>
             <div className="absolute top-4 bottom-4 right-2.5 w-[2px] bg-white/60 rounded-full blur-[0.5px]"></div>
          </div>
        </div>
      );
  }
}

// =========================================================
// 4. 拆分的獨立子元件
// =========================================================
function LandingScreen(props) {
  var pArr = [];
  for(var i=0; i<props.setupPlayerCount; i++) pArr.push(i);

  function handleSetLocal() { props.setSetupMode('LOCAL'); }
  function handleSetCreate() { props.setSetupMode('CREATE'); }
  function handleSetJoin() { props.setSetupMode('JOIN'); }
  function handleSetInit() { props.setSetupMode('INIT'); }
  function handleRoomChange(e) { props.setRoomId(e.target.value.toUpperCase()); }
  function handleNameChange(e) { props.setSetupName(e.target.value.substring(0, 6)); }

  var countOpts = [2, 3, 4, 5, 6];
  var countElems = [];
  for (var j = 0; j < countOpts.length; j++) {
      var num = countOpts[j];
      var isActive = props.setupPlayerCount === num;
      var bgClass = isActive ? 'bg-amber-400 text-amber-900 scale-110 shadow-[0_4px_0_0_#d97706]' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm';
      countElems.push(
          <button key={num} onClick={(function(n) { return function() { props.setSetupPlayerCount(n); }; })(num)} className={`w-12 h-12 md:w-14 md:h-14 rounded-full text-xl md:text-2xl transition-all border-4 border-white ${bgClass}`}>
              {num}
          </button>
      );
  }

  var timeOpts = [ { l: '5 分', v: 300 }, { l: '10 分', v: 600 }, { l: '20 分', v: 1200 }, { l: '不限時', v: -1 } ];
  var timeElems = [];
  for (var k = 0; k < timeOpts.length; k++) {
      var t = timeOpts[k];
      var isTActive = props.setupTimeLimit === t.v;
      var tBgClass = isTActive ? 'bg-pink-400 text-pink-900 shadow-[0_4px_0_0_#db2777]' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm';
      timeElems.push(
          <button key={t.v} onClick={(function(val) { return function() { props.setSetupTimeLimit(val); }; })(t.v)} className={`px-4 py-2 md:px-5 md:py-3 rounded-[1.5rem] transition-all border-4 border-white text-sm md:text-base ${tBgClass}`}>
              {t.l}
          </button>
      );
  }

  var localPlayersElems = [];
  for (var m = 0; m < props.setupPlayerCount; m++) {
      var isPActive = props.editingLocalPlayer === m;
      var pBgClass = isPActive ? 'border-amber-400 scale-125 shadow-lg z-10 relative' : 'border-sky-200 opacity-70 hover:opacity-100 hover:scale-110';
      localPlayersElems.push(
          <div key={m} className="flex flex-col items-center gap-1 md:gap-2">
              <button onClick={(function(idx) { return function() { props.setEditingLocalPlayer(idx); }; })(m)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-2xl md:text-3xl flex items-center justify-center bg-white transition-all border-4 ${pBgClass}`}>
                  {props.localAvatars[m]}
              </button>
              <span className="text-[10px] md:text-xs text-sky-600 bg-white px-2 py-0.5 rounded-full border-2 border-sky-100 max-w-[60px] truncate">{props.localNames[m]}</span>
          </div>
      );
  }

  var targetIdx = props.editingLocalPlayer < props.setupPlayerCount ? props.editingLocalPlayer : 0;
  var avatarElems = [];
  for (var n = 0; n < CHILD_AVATARS.length; n++) {
      var avatar = CHILD_AVATARS[n];
      var isAActive = props.localAvatars[targetIdx] === avatar;
      var aBgClass = isAActive ? 'bg-amber-100 border-4 border-amber-400 scale-110' : 'bg-slate-50 border-2 border-transparent hover:bg-sky-100';
      avatarElems.push(
          <button key={avatar} onClick={(function(av) { 
              return function() { 
                  var newAvatars = clonePlayers(props.localAvatars); 
                  newAvatars[targetIdx] = av; 
                  props.setLocalAvatars(newAvatars); 
              }; 
          })(avatar)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-2xl md:text-3xl flex items-center justify-center transition-all ${aBgClass}`}>
              {avatar}
          </button>
      );
  }

  var joinAvatarElems = [];
  for (var o = 0; o < CHILD_AVATARS.length; o++) {
      var jAvatar = CHILD_AVATARS[o];
      var isJActive = props.setupAvatar === jAvatar;
      var jBgClass = isJActive ? 'border-4 border-amber-400 scale-110 shadow-md' : 'border-2 border-sky-100 hover:bg-sky-100';
      joinAvatarElems.push(
          <button key={jAvatar} onClick={(function(av) { return function() { props.setSetupAvatar(av); }; })(jAvatar)} className={`w-12 h-12 md:w-16 md:h-16 rounded-full text-3xl md:text-4xl flex items-center justify-center bg-white transition-all ${jBgClass}`}>
              {jAvatar}
          </button>
      );
  }

  function handleTypeToggle() { 
      var nt = clonePlayers(props.localPlayerTypes); 
      nt[props.editingLocalPlayer] = nt[props.editingLocalPlayer] === 'HUMAN' ? 'AI' : 'HUMAN'; 
      props.setLocalPlayerTypes(nt); 
  }

  function handleLocalNameChange(e) { 
      var nn = clonePlayers(props.localNames); 
      nn[props.editingLocalPlayer] = e.target.value.substring(0, 6); 
      props.setLocalNames(nn); 
  }

  return (
    <div className="min-h-screen w-screen bg-[#e0f2fe] flex flex-col items-center justify-center p-4 md:p-6 text-[#4a3424] overflow-x-hidden absolute inset-0 font-black">
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}</style>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/40 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl animate-pulse delay-700"></div>

      <h1 className="text-5xl md:text-[4.5rem] font-black mb-4 md:mb-6 text-sky-500 tracking-widest drop-shadow-[0_6px_0_rgba(2,132,199,0.2)] text-center leading-tight">
        大信翁<span className="block text-xl md:text-2xl text-rose-400 mt-1 tracking-normal">Candy Bubble Edition 🍬</span>
      </h1>
      
      {props.errorMsg ? <div className="mb-4 bg-rose-100 text-rose-700 p-3 rounded-2xl border-4 border-rose-300 shadow-sm">{String(props.errorMsg)}</div> : null}
      
      <div className={`bg-white/90 backdrop-blur-md border-[6px] border-sky-200 p-6 md:p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full transition-all duration-300 relative z-10 ${props.setupMode === 'INIT' ? 'max-w-md flex flex-col items-center gap-5' : 'max-w-4xl flex flex-col'}`}>
        {props.setupMode === 'INIT' ? (
          <div className="flex flex-col gap-4 w-full">
            <button onClick={handleSetLocal} className="py-4 md:py-5 rounded-[2rem] text-2xl md:text-3xl bg-amber-400 text-amber-900 border-[6px] border-white shadow-[0_6px_0_0_#d97706,0_10px_15px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:bg-amber-300 active:border-b-[0px] active:translate-y-[6px] active:shadow-none transition-all relative overflow-hidden group">
              單機同樂 🎪 <span className="text-sm block font-bold text-amber-800/70 mt-1">大家一起圍著螢幕玩</span>
            </button>
            <div className="flex items-center gap-4 my-1 opacity-40"><div className="flex-1 h-1.5 bg-sky-200 rounded-full"></div><span className="font-black text-sky-800 text-sm tracking-widest">線上模式</span><div className="flex-1 h-1.5 bg-sky-200 rounded-full"></div></div>
            <button disabled={!props.user} onClick={handleSetCreate} className={`py-4 rounded-[2rem] text-xl md:text-2xl border-[5px] border-white shadow-[0_5px_0_0_#0ea5e9,0_8px_10px_rgba(0,0,0,0.1)] hover:-translate-y-1 active:border-b-[0px] active:translate-y-[5px] active:shadow-none transition-all ${!props.user ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_0_#cbd5e1]' : 'bg-sky-400 text-sky-900 hover:bg-sky-300'}`}>
              {props.user ? "創建連線房間 🏠" : "雲端連線中..."}
            </button>
            <button disabled={!props.user} onClick={handleSetJoin} className={`py-4 rounded-[2rem] text-xl md:text-2xl border-[5px] border-white shadow-[0_5px_0_0_#10b981,0_8px_10px_rgba(0,0,0,0.1)] hover:-translate-y-1 active:border-b-[0px] active:translate-y-[5px] active:shadow-none transition-all ${!props.user ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_0_#cbd5e1]' : 'bg-emerald-400 text-emerald-900 hover:bg-emerald-300'}`}>
              加入好友房間 🚀
            </button>
          </div>
        ) : null}

        {(props.setupMode === 'LOCAL' || props.setupMode === 'CREATE') ? (
          <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row w-full gap-6">
              <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="w-full">
                  <div className="text-center text-sky-700 mb-2 md:mb-3 flex items-center justify-center gap-2 text-lg"><UsersIcon size={20} /> 幾個人一起玩呢？</div>
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3">{countElems}</div>
                </div>
                <div className="w-full border-t-[3px] border-dashed border-sky-100"></div>
                <div className="w-full">
                  <div className="text-center text-sky-700 mb-2 md:mb-3 flex items-center justify-center gap-2 text-lg"><Clock size={20} /> 玩多久呢？</div>
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3">{timeElems}</div>
                </div>
              </div>

              <div className="flex-[1.2] flex flex-col">
                {props.setupMode === 'LOCAL' ? (
                  <div className="w-full bg-sky-50 rounded-[2rem] p-4 md:p-5 border-4 border-white shadow-sm h-full flex flex-col">
                    <div className="text-center text-sky-800 mb-2 md:mb-3 text-base md:text-lg">幫角色取名字＆換頭像吧！👇</div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-3 md:mb-4">{localPlayersElems}</div>
                    <div className="flex justify-center mt-2 mb-3">
                      <button onClick={handleTypeToggle} className={`px-4 py-1.5 rounded-full border-[3px] text-sm md:text-base font-black transition-all shadow-sm flex items-center gap-1 ${props.localPlayerTypes[props.editingLocalPlayer] === 'AI' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-emerald-100 border-emerald-300 text-emerald-700'}`}>
                        {props.localPlayerTypes[props.editingLocalPlayer] === 'AI' ? '🤖 電腦控制' : '🧑 玩家控制'}
                      </button>
                    </div>
                    <div className="mb-3 w-full max-w-[200px] mx-auto">
                      <input type="text" value={props.localNames[props.editingLocalPlayer]} onChange={handleLocalNameChange} placeholder={`玩家 ${props.editingLocalPlayer + 1} 名字`} className="w-full bg-white px-3 py-2 rounded-xl text-center text-sm md:text-base font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-h-24 md:max-h-32 overflow-y-auto p-2 bg-white rounded-[1.5rem] border-2 border-sky-100 custom-scrollbar mt-auto">
                      {avatarElems}
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-sky-50 rounded-[2rem] p-5 md:p-6 border-4 border-white shadow-sm h-full flex flex-col justify-center">
                    <div className="text-center text-sky-800 mb-2 md:mb-3 text-lg md:text-xl">你的專屬角色與名字！</div>
                    <div className="mb-4 w-full max-w-[200px] mx-auto">
                      <input type="text" value={props.setupName} onChange={handleNameChange} placeholder="輸入你的名字" className="w-full bg-white px-4 py-2.5 rounded-2xl text-center text-lg md:text-xl font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-h-36 md:max-h-48 overflow-y-auto p-2 custom-scrollbar">
                      {joinAvatarElems}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full gap-3 md:gap-4 mt-2 max-w-lg mx-auto">
              <button onClick={handleSetInit} className="flex-1 py-3 md:py-4 text-slate-500 bg-white border-4 border-slate-200 rounded-[2rem] hover:bg-slate-50 transition text-lg md:text-xl shadow-sm">返回</button>
              <button onClick={props.setupMode === 'LOCAL' ? props.handleStartLocalGame : props.handleCreateRoom} className="flex-[2] py-3 md:py-4 text-white bg-emerald-400 rounded-[2rem] shadow-[0_5px_0_0_#10b981] hover:-translate-y-1 active:translate-y-[5px] active:shadow-none active:border-b-0 transition-all text-xl md:text-2xl border-[4px] border-white">出發囉！✨</button>
            </div>
          </div>
        ) : null}

        {props.setupMode === 'JOIN' ? (
          <div className="w-full flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row w-full gap-6">
              <div className="flex-1 flex flex-col justify-center gap-5">
                <div className="w-full">
                  <div className="text-center text-sky-700 mb-3 text-lg md:text-xl">請輸入房間密碼 🔑</div>
                  <input type="text" placeholder="A1B2C3" value={props.roomId} onChange={handleRoomChange} className="w-full bg-white p-4 md:p-5 rounded-[2rem] text-center text-3xl md:text-4xl font-black border-[4px] border-sky-200 focus:border-amber-400 outline-none uppercase tracking-widest text-[#4a3424] shadow-inner" />
                </div>
              </div>
              <div className="flex-[1.2] flex flex-col">
                <div className="w-full bg-sky-50 rounded-[2rem] p-5 border-4 border-white shadow-sm h-full flex flex-col justify-center">
                  <div className="text-center text-sky-800 mb-2 md:mb-3 text-lg md:text-xl">你的專屬角色與名字！</div>
                  <div className="mb-4 w-full max-w-[200px] mx-auto">
                    <input type="text" value={props.setupName} onChange={handleNameChange} placeholder="輸入你的名字" className="w-full bg-white px-4 py-2.5 rounded-2xl text-center text-lg md:text-xl font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-h-36 overflow-y-auto p-2 custom-scrollbar">
                    {joinAvatarElems}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full gap-3 md:gap-4 mt-2 max-w-lg mx-auto">
              <button onClick={handleSetInit} className="flex-1 py-3 md:py-4 text-slate-500 bg-white border-4 border-slate-200 rounded-[2rem] hover:bg-slate-50 transition text-lg md:text-xl shadow-sm">返回</button>
              <button disabled={props.roomId.length < 4} onClick={props.handleJoinRoom} className={`flex-[2] py-3 md:py-4 text-white rounded-[2rem] transition-all text-xl md:text-2xl border-[4px] border-white ${props.roomId.length < 4 ? 'bg-slate-300 border-slate-200' : 'bg-sky-400 shadow-[0_5px_0_0_#0ea5e9] hover:-translate-y-1 active:translate-y-[5px] active:shadow-none active:border-b-0'}`}>加入房間 🚀</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// =========================================================
// 5. 主程式 App 元件
// =========================================================
export default function App() {
  var [appPhase, setAppPhase] = useState('LANDING'); 
  var [setupMode, setSetupMode] = useState('INIT'); 
  var [setupPlayerCount, setSetupPlayerCount] = useState(4);
  var [setupTimeLimit, setSetupTimeLimit] = useState(600);
  var [setupAvatar, setSetupAvatar] = useState(CHILD_AVATARS[0]);
  var [setupName, setSetupName] = useState('玩家 1');
  var [localNames, setLocalNames] = useState(['玩家 1', '電腦 1', '電腦 2', '電腦 3', '電腦 4', '電腦 5']);
  var [localPlayerTypes, setLocalPlayerTypes] = useState(['HUMAN', 'AI', 'AI', 'AI', 'AI', 'AI']);
  var [localAvatars, setLocalAvatars] = useState(CHILD_AVATARS.slice(0, 6));
  var [editingLocalPlayer, setEditingLocalPlayer] = useState(0);

  var [user, setUser] = useState(null);
  var [roomId, setRoomId] = useState("");
  var [isHost, setIsHost] = useState(false);
  var [myPlayerIndex, setMyPlayerIndex] = useState(null);
  var [errorMsg, setErrorMsg] = useState(null);

  var [isOfflineMode, setIsOfflineMode] = useState(false);
  var [isMuted, setIsMuted] = useState(false);
  var [showExitConfirm, setShowExitConfirm] = useState(false);
  var [isMenuOpen, setIsMenuOpen] = useState(false);
  
  var bgmRef = useRef(null);
  var [bgmStarted, setBgmStarted] = useState(false);

  var [selectedSquareInfo, setSelectedSquareInfo] = useState(null);

  var [gameData, setGameData] = useState({
    players: [], currentPlayerIdx: 0, properties: {},
    gameState: 'IDLE', timeLeft: 0, diceVals: [1, 1], actionMessage: '',
    remainingSteps: 0, bwaBweiResults: [], pendingTrade: null 
  });

  var [displayDice, setDisplayDice] = useState([1, 1]);
  var [showAssetManager, setShowAssetManager] = useState(false); 
  var [sellProcess, setSellProcess] = useState(null); 
  var [localTimeLeft, setLocalTimeLeft] = useState(0); 

  var [zoom, setZoom] = useState(0.85);
  var [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  var [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  var [viewportSize, setViewportSize] = useState({ w: 800, h: 600 });
  var [isFullMapMode, setIsFullMapMode] = useState(false);

  var dragStatus = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0, moved: false });
  var mapRef = useRef(null);

  var activePlayerIndex = isOfflineMode ? gameData.currentPlayerIdx : (myPlayerIndex !== null ? myPlayerIndex : 0);
  var myPlayer = getPlayerById(gameData.players, activePlayerIndex);
  
  var currentSquare = null;
  if (myPlayer && myPlayer.pos !== undefined && BOARD_SQUARES[myPlayer.pos]) {
      currentSquare = BOARD_SQUARES[myPlayer.pos];
  }
  
  var myMoney = myPlayer && myPlayer.money ? Number(myPlayer.money) : 0;
  var myTrust = myPlayer && myPlayer.trust ? Number(myPlayer.trust) : 0;
  var reqMoney = currentSquare && currentSquare.price ? Number(currentSquare.price) : 0;
  var reqTrust = currentSquare && currentSquare.reqTrust ? Number(currentSquare.reqTrust) : 0;
  
  var wRatio = viewportSize.w / MAP_SIZE;
  var hRatio = viewportSize.h / MAP_SIZE;
  var minRatio = wRatio < hRatio ? wRatio : hRatio;
  var displayZoom = isFullMapMode ? (minRatio * 0.9) : zoom;
  var inverseZoom = 1 / displayZoom; 
  
  var canBuy = Boolean(currentSquare && myMoney >= reqMoney && myTrust >= reqTrust);
  
  var myProperties = [];
  if (myPlayer && gameData.properties) {
      for (var key in gameData.properties) {
          if (gameData.properties[key] === activePlayerIndex) {
              myProperties.push(Number(key));
          }
      }
  }

  var safeDice = displayDice || [1, 1];

  var pendingBuyerId = -1;
  if (gameData.pendingTrade && gameData.pendingTrade.buyerIdx !== undefined) {
      pendingBuyerId = gameData.pendingTrade.buyerIdx;
  }
  var isTradeActive = Boolean(gameData.pendingTrade !== null && (isOfflineMode || pendingBuyerId === activePlayerIndex));
  var tradeBuyer = getPlayerById(gameData.players, pendingBuyerId);
  var tradeBuyerMoney = tradeBuyer && tradeBuyer.money ? Number(tradeBuyer.money) : 0;

  var syncGameData = useCallback(async function(updates) {
    if (isOfflineMode) {
        setGameData(function(prev) {
            var nextState = cloneObj(prev);
            for (var k in updates) { nextState[k] = updates[k]; }
            return nextState;
        });
    } else {
        if (!auth.currentUser) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), updates);
        } catch (e) { console.error(e); }
    }
  }, [isOfflineMode, roomId]);

  useEffect(function() {
    bgmRef.current = new Audio("https://dn721809.ca.archive.org/0/items/md_music_toy_story/13%20-%20Level%209%20-%20Food%20and%20Drink%20-%20Andy%20Blythe%2C%20Marten%20Joustra.mp3");
    bgmRef.current.loop = true;  
    bgmRef.current.volume = 0.1; 
    return function() {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.src = "";
      }
    };
  }, []);

  useEffect(function() {
    if (!bgmRef.current) return;
    if (isMuted) {
      bgmRef.current.pause();
    } else if (bgmStarted) {
      var p = bgmRef.current.play();
      if (p !== undefined) { p.catch(function() {}); }
    }
  }, [isMuted, bgmStarted]);

  useEffect(function() {
    function handleInteraction() {
      if (!bgmStarted) setBgmStarted(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    }
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    return function() {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [bgmStarted]);

  useEffect(function() {
    var el = mapRef.current;
    if (!el) return;

    function onStart(e) {
      dragStatus.current.isDragging = true;
      dragStatus.current.moved = false; 
      dragStatus.current.initX = e.clientX;
      dragStatus.current.initY = e.clientY;
      dragStatus.current.startX = e.clientX - manualOffset.x;
      dragStatus.current.startY = e.clientY - manualOffset.y;
    }
    function onMove(e) {
      if (!dragStatus.current.isDragging) return;
      if (Math.abs(e.clientX - dragStatus.current.initX) > 5 || Math.abs(e.clientY - dragStatus.current.initY) > 5) {
         dragStatus.current.moved = true;
      }
      setManualOffset({ 
        x: e.clientX - dragStatus.current.startX, 
        y: e.clientY - dragStatus.current.startY 
      });
    }
    function onEnd() { dragStatus.current.isDragging = false; }

    el.addEventListener('pointerdown', onStart);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    return function() {
      el.removeEventListener('pointerdown', onStart);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };
  }, [manualOffset]);

  useEffect(function() {
    if (typeof window !== 'undefined') {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
      function handleResize() { setViewportSize({ w: window.innerWidth, h: window.innerHeight }); }
      window.addEventListener('resize', handleResize);
      return function() { window.removeEventListener('resize', handleResize); };
    }
  }, []);

  useEffect(function() {
    async function initAuth() {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setErrorMsg(null);
      } catch (e) {
        setErrorMsg("網路連線失敗，請檢查金鑰。");
      }
    }
    initAuth();
    var unsubscribe = onAuthStateChanged(auth, setUser);
    return function() { unsubscribe(); };
  }, []);

  useEffect(function() {
    if (isOfflineMode || !user || !roomId || appPhase !== 'GAME') return;
    var roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    var unsubscribe = onSnapshot(roomRef, function(docSnap) {
      if (docSnap.exists()) {
        var data = docSnap.data();
        setGameData(data);
        if (data.timeLeft !== -1 && localTimeLeft === 0) {
            setLocalTimeLeft(data.timeLeft);
        }
      }
    });
    return function() { unsubscribe(); };
  }, [user, roomId, appPhase, isOfflineMode, localTimeLeft]);

  useEffect(function() {
    if (appPhase !== 'GAME' || gameData.timeLeft === -1 || gameData.gameState === 'GAME_OVER') return;
    var timer = setInterval(function() {
        setLocalTimeLeft(function(prev) {
            if (prev <= 1) return 0;
            return prev - 1;
        });
    }, 1000);
    return function() { clearInterval(timer); };
  }, [appPhase, gameData.timeLeft, gameData.gameState]);

  useEffect(function() {
    if (appPhase === 'GAME' && localTimeLeft === 0 && gameData.timeLeft !== -1 && gameData.gameState !== 'GAME_OVER') {
        if (isHost || isOfflineMode) {
            syncGameData({ gameState: 'GAME_OVER' });
        }
    }
  }, [localTimeLeft, appPhase, gameData.timeLeft, gameData.gameState, isHost, isOfflineMode, syncGameData]);

  var focusOnCurrentPlayer = useCallback(function() {
    setIsFullMapMode(false);
    var currP = getPlayerById(gameData.players, gameData.currentPlayerIdx);
    if (!currP) return;

    var gOrder = GRID_ORDER[currP.pos];
    var CELL_SIZE = MAP_SIZE / 11;
    
    setCameraOffset({ 
      x: viewportSize.w / 2 - ((gOrder.col - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom, 
      y: viewportSize.h * 0.65 - ((gOrder.row - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom 
    });
    setManualOffset({ x: 0, y: 0 }); 
  }, [gameData.players, gameData.currentPlayerIdx, viewportSize, displayZoom]);

  useEffect(function() {
    if (appPhase !== 'GAME' || isFullMapMode) {
      if (isFullMapMode) {
        setCameraOffset({ 
          x: viewportSize.w / 2 - (MAP_SIZE / 2) * displayZoom, 
          y: viewportSize.h / 2 - (MAP_SIZE / 2) * displayZoom 
        });
        setManualOffset({ x: 0, y: 0 });
      }
      return;
    }
    focusOnCurrentPlayer();
  }, [gameData.currentPlayerIdx, gameData.players, isFullMapMode, displayZoom, viewportSize, appPhase, focusOnCurrentPlayer]);

  var handleStartLocalGame = async function() {
    playSound('win', isMuted); 
    setIsOfflineMode(true);
    
    var initialPlayers = [];
    for (var i = 0; i < setupPlayerCount; i++) {
      var pName = localNames[i] || '';
      pName = pName.trim() || ('玩家 ' + (i + 1));
      var pColor = ['bg-sky-300', 'bg-rose-300', 'bg-emerald-300', 'bg-purple-300', 'bg-orange-300', 'bg-pink-300'][i % 6];
      initialPlayers.push({
        id: i, 
        name: pName,
        icon: localAvatars[i], 
        color: pColor,
        pos: 0, money: BASE_MONEY, trust: BASE_TRUST, 
        inJail: false, jailRoundsLeft: 0, isBankrupt: false,
        uid: 'local_player_' + i, isAI: localPlayerTypes[i] === 'AI'
      });
    }
    
    setGameData({
      players: initialPlayers, 
      currentPlayerIdx: 0, 
      gameState: 'IDLE', 
      roomId: 'LOCAL', 
      timeLeft: setupTimeLimit, 
      properties: {}, 
      actionMessage: '', 
      remainingSteps: 0, 
      diceVals: [1, 1], 
      bwaBweiResults: [], 
      pendingTrade: null
    });
    setRoomId('單機同樂');
    setAppPhase('GAME'); 
    setLocalTimeLeft(setupTimeLimit);
  };

  var handleCreateRoom = async function() {
    if (!user) return;
    playSound('win', isMuted); 
    setIsOfflineMode(false);
    var rStr = Math.random().toString(36);
    var id = rStr.substring(2, 8).toUpperCase();
    
    var initialPlayers = [];
    for (var i = 0; i < setupPlayerCount; i++) {
      var pName = '';
      if (i === 0) {
          pName = setupName || '';
          pName = pName.trim() || '房主';
      } else {
          pName = '玩家 ' + (i + 1);
      }
      var pColor = ['bg-sky-300', 'bg-rose-300', 'bg-emerald-300', 'bg-purple-300', 'bg-orange-300', 'bg-pink-300'][i % 6];
      initialPlayers.push({
        id: i, 
        name: pName,
        icon: i === 0 ? setupAvatar : '⏳', 
        color: pColor,
        pos: 0, money: BASE_MONEY, trust: BASE_TRUST, 
        inJail: false, jailRoundsLeft: 0, isBankrupt: false,
        uid: i === 0 ? user.uid : null 
      });
    }
    
    try {
      var roomDoc = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id);
      await setDoc(roomDoc, {
        players: initialPlayers, 
        currentPlayerIdx: 0, 
        gameState: 'IDLE', 
        roomId: id, 
        timeLeft: setupTimeLimit, 
        properties: {}, 
        actionMessage: '', 
        remainingSteps: 0, 
        diceVals: [1, 1], 
        bwaBweiResults: [], 
        pendingTrade: null
      });
      setRoomId(id); setIsHost(true); setMyPlayerIndex(0); setAppPhase('GAME'); setLocalTimeLeft(setupTimeLimit);
    } catch (e) { setErrorMsg("建立失敗，請確認 Firebase 設定。"); }
  };

  var handleJoinRoom = async function() {
    if (!user || roomId.length < 4) return;
    playSound('win', isMuted); 
    setIsOfflineMode(false);
    try {
      var roomDoc = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
      var snap = await getDoc(roomDoc);
      if (!snap.exists()) { setErrorMsg("找不到房號！"); return; }
      var data = snap.data();
      
      var existingSlot = -1;
      var emptySlot = -1;
      for (var i = 0; i < data.players.length; i++) {
          if (data.players[i].uid === user.uid) existingSlot = i;
          if (data.players[i].uid === null && emptySlot === -1) emptySlot = i;
      }

      if (existingSlot !== -1) {
        setMyPlayerIndex(existingSlot);
        setAppPhase('GAME');
        if (data.timeLeft !== -1) setLocalTimeLeft(data.timeLeft);
        return;
      }

      if (emptySlot === -1) { setErrorMsg("房間已滿！"); return; }
      
      var nextPlayers = clonePlayers(data.players);
      nextPlayers[emptySlot].uid = user.uid;
      nextPlayers[emptySlot].icon = setupAvatar;
      var trimmedName = setupName || '';
      trimmedName = trimmedName.trim();
      nextPlayers[emptySlot].name = trimmedName || ('玩家 ' + (emptySlot + 1));
      nextPlayers[emptySlot].inJail = false;
      
      await updateDoc(roomDoc, { players: nextPlayers });
      setMyPlayerIndex(emptySlot); setAppPhase('GAME');
      if (data.timeLeft !== -1) setLocalTimeLeft(data.timeLeft);
    } catch (e) { setErrorMsg("加入失敗。"); }
  };

  var handleRollDice = async function() {
    if (gameData.currentPlayerIdx !== activePlayerIndex) return;
    playSound('roll', isMuted); 
    var d1 = Math.floor(Math.random() * 6) + 1;
    var d2 = Math.floor(Math.random() * 6) + 1;
    await syncGameData({
      diceVals: [d1, d2],
      remainingSteps: d1 + d2,
      gameState: 'ROLLING', 
      actionMessage: ''
    });
  };

  useEffect(function() {
    if (gameData.gameState === 'ROLLING') {
      var interval = setInterval(function() {
        var v1 = Math.floor(Math.random() * 6) + 1;
        var v2 = Math.floor(Math.random() * 6) + 1;
        setDisplayDice([v1, v2]);
      }, 100);
      return function() { clearInterval(interval); };
    } else {
      var dVals = [1, 1];
      if (gameData.diceVals) dVals = gameData.diceVals;
      setDisplayDice(dVals);
    }
  }, [gameData.gameState, gameData.diceVals]);

  useEffect(function() {
    if (appPhase !== 'GAME') return;
    if (gameData.gameState === 'ROLLING' && gameData.currentPlayerIdx === activePlayerIndex) {
      var timer = setTimeout(async function() {
        await syncGameData({ gameState: 'MOVING' });
      }, 600); 
      return function() { clearTimeout(timer); };
    }
  }, [gameData.gameState, gameData.currentPlayerIdx, activePlayerIndex, roomId, isOfflineMode, syncGameData, appPhase]);

  var handleLandOnSquare = async function() {
    var player = getPlayerById(gameData.players, activePlayerIndex);
    if (!player) return;
    var sq = BOARD_SQUARES[player.pos];
    var nextState = 'ACTION';
    var msg = gameData.actionMessage || '';
    
    var nextPlayers = clonePlayers(gameData.players);
    var currP = nextPlayers[activePlayerIndex];

    var pool;
    var card;
    var mStr;
    var tStr;
    var ownerId;
    var owner;
    var rent;
    var statusStr;

    if (sq.type === 'START') {
      playSound('coin', isMuted); 
      msg += '經過起點領零用錢囉！✨'; 
      nextState = 'END_TURN';
    } else if (sq.type === 'TAX') {
      playSound('bad', isMuted); 
      currP.money -= sq.amount; 
      msg += '💸 繳納 ' + sq.name + ' $' + sq.amount + '！'; 
      nextState = 'END_TURN';
    } else if (sq.type === 'CHANCE_GOOD' || sq.type === 'CHANCE_BAD') {
      pool = sq.type === 'CHANCE_GOOD' ? GOOD_CARDS : BAD_CARDS;
      card = pool[Math.floor(Math.random() * pool.length)];
      msg += '【 ' + card.desc + ' 】\n\n';
      if (card.goToJail) {
         playSound('bad', isMuted); 
         currP.pos = 10; 
         currP.inJail = true; 
         currP.jailRoundsLeft = -1; 
         msg += '好好的懺悔反省 🙏\n請誠心擲杯問神明。'; 
         nextState = 'JAIL_BWA_BWEI'; 
      } else {
         if (card.effectM > 0 || card.effectT > 0) playSound('win', isMuted); else playSound('bad', isMuted); 
         currP.money += card.effectM; 
         currP.trust += card.effectT;
         mStr = card.effectM > 0 ? ('+' + card.effectM) : card.effectM;
         tStr = card.effectT > 0 ? ('+' + card.effectT) : card.effectT;
         msg += '資金 ' + mStr + '\n信用 ' + tStr;
         nextState = 'END_TURN';
      }
    } else if (sq.type === 'GO_TO_JAIL' || sq.id === 30 || sq.id === 10) {
      playSound('bad', isMuted); 
      currP.pos = 10; 
      currP.inJail = true; 
      currP.jailRoundsLeft = -1; 
      msg += '好好的懺悔反省 🙏\n請誠心擲杯問神明。'; 
      nextState = 'JAIL_BWA_BWEI'; 
    } else if (sq.type === 'PROPERTY') {
      ownerId = gameData.properties ? gameData.properties[sq.id] : undefined;
      if (ownerId !== undefined && ownerId !== activePlayerIndex) {
        owner = nextPlayers[ownerId];
        if (!owner.inJail && !owner.isBankrupt) { 
           playSound('bad', isMuted); 
           rent = Math.floor(sq.price * 0.4); 
           currP.money -= rent; 
           nextPlayers[ownerId] = Object.assign({}, owner, { money: owner.money + rent });
           msg += '踩到 ' + owner.name + ' 的地盤，\n付過路費 $' + rent + ' 給他吧！'; 
        } else {
           playSound('win', isMuted); 
           statusStr = owner.inJail ? '正在反省' : '已出局';
           msg += '幸運！ ' + owner.name + ' ' + statusStr + '，免付過路費！ 🎉'; 
        }
        nextState = 'END_TURN';
      } else if (ownerId === undefined) {
        playSound('click', isMuted); 
        msg += '來到空地：' + sq.name + ' 🏕️'; 
      } else {
        playSound('click', isMuted); 
        msg += '來到自己的 ' + sq.name + '，\n巡視一下產業！ 😎'; 
        nextState = 'END_TURN';
      }
    } else if (sq.type === 'FREE_PARKING') {
      playSound('click', isMuted); 
      msg += '平靜的一回合，\n培養品德心性的好地方 🍵'; 
      nextState = 'END_TURN';
    } else {
      playSound('click', isMuted); 
      msg += '在 ' + sq.name + ' 休息一天 💤'; 
      nextState = 'END_TURN';
    }

    nextPlayers[activePlayerIndex] = currP;
    var bkResult = checkBankruptcy(nextPlayers);
    var bankruptPlayers = bkResult.newPlayers;

    if (bkResult.changed && bankruptPlayers[activePlayerIndex].isBankrupt) {
       playSound('bad', isMuted); 
       msg += '\n\n🚨 哎呀！資金或信用歸零，你出局了！';
       nextState = 'END_TURN';
    }

    var nextProps = Object.assign({}, gameData.properties);
    if (bkResult.changed) {
        var bankruptIds = [];
        for (var j = 0; j < bankruptPlayers.length; j++) {
            if (bankruptPlayers[j].isBankrupt) bankruptIds.push(bankruptPlayers[j].id);
        }
        nextProps = clearBankruptProperties(gameData.properties, bankruptIds);
    }

    await syncGameData({
      players: bankruptPlayers,
      properties: nextProps,
      gameState: nextState,
      actionMessage: msg,
      bwaBweiResults: [] 
    });
  };

  // =============== FIX: 將這 6 個 handler 綁定到 useRef 中，隔絕 useEffect 重構觸發 ===============
  var handlersRef = useRef({});
  handlersRef.current = {
      handleRollDice: handleRollDice,
      handleLandOnSquare: handleLandOnSquare,
      handleThrowBwaBwei: async function() {
        if (gameData.currentPlayerIdx !== activePlayerIndex) return;
        playSound('bwa', isMuted); 
        await syncGameData({ gameState: 'BWA_BWEI_ROLLING' });
      },
      handleFinishBwaBwei: async function() {
        var nextPlayers = clonePlayers(gameData.players);
        var currP = nextPlayers[activePlayerIndex];
        var holyCount = 0;
        var results = gameData.bwaBweiResults || [];
        for (var i = 0; i < results.length; i++) {
            if (results[i] === 'HOLY') holyCount++;
        }
        var msg = '總共擲出【 ' + holyCount + ' 次聖杯 】\n';
        if (holyCount === 3) {
          playSound('win', isMuted); 
          currP.jailRoundsLeft = 0; currP.money -= 500; currP.inJail = false;
          msg += '✨ 神明原諒你了！(繳交罰款 $500)\n你重獲自由，下回合可正常玩囉！';
        } else {
          playSound('bad', isMuted); 
          var waitRounds = 3 - holyCount; currP.jailRoundsLeft = waitRounds;
          msg += '神明要你繼續反省...\n需在泡泡裡等待 ' + waitRounds + ' 輪。';
        }
        await syncGameData({ players: nextPlayers, gameState: 'END_TURN', actionMessage: msg, bwaBweiResults: [] });
      },
      handleBuyProperty: async function() {
        try {
          var player = getPlayerById(gameData.players, activePlayerIndex);
          if (!player) return;
          var sq = BOARD_SQUARES[player.pos];
          if (myMoney >= reqMoney && myTrust >= reqTrust) {
            playSound('coin', isMuted); 
            var nextPlayers = clonePlayers(gameData.players);
            nextPlayers[activePlayerIndex].money -= reqMoney;
            var nextProps = cloneObj(gameData.properties);
            nextProps[sq.id] = player.id;
            await syncGameData({ players: nextPlayers, properties: nextProps, gameState: 'END_TURN', actionMessage: '🎉 成功買下 ' + sq.name + ' 囉！' });
          }
        } catch(e) { }
      },
      handleEndTurn: async function() {
        try {
          playSound('click', isMuted); 
          var nextPlayers = clonePlayers(gameData.players);
          var nextIdx = gameData.currentPlayerIdx;
          var attempts = 0;
          do {
              nextIdx = (nextIdx + 1) % nextPlayers.length;
              attempts++;
          } while (nextPlayers[nextIdx].isBankrupt && attempts < 10);

          var nextPlayerClone = nextPlayers[nextIdx];
          var nextState = 'IDLE';
          var msg = '';

          if (nextPlayerClone.inJail && nextPlayerClone.jailRoundsLeft > 0) {
              nextPlayerClone.jailRoundsLeft -= 1;
              if (nextPlayerClone.jailRoundsLeft === 0) {
                  nextPlayerClone.money -= 500; nextPlayerClone.inJail = false;
                  msg = '🌟 ' + nextPlayerClone.name + ' 反省期滿，扣除罰金 $500。\n離開反省泡泡，可正常行動囉！';
              } else {
                  nextState = 'END_TURN'; 
                  msg = '🔒 ' + nextPlayerClone.name + ' 仍在反省泡泡中...\n(還要等 ' + nextPlayerClone.jailRoundsLeft + ' 輪喔)';
              }
          }

          var bkResult = checkBankruptcy(nextPlayers);
          var bankruptPlayers = bkResult.newPlayers;

          if (bankruptPlayers[nextIdx].isBankrupt && nextPlayerClone.inJail === false) {
              msg += '\n🚨 資金或信用歸零，宣告破產！';
              nextState = 'END_TURN';
          }

          var activeCount = 0; var aliveCount = 0;
          for (var i = 0; i < bankruptPlayers.length; i++) {
              var bp = bankruptPlayers[i];
              if (isOfflineMode || bp.uid !== null) {
                  activeCount++;
                  if (!bp.isBankrupt) aliveCount++;
              }
          }
          if (activeCount > 1 && aliveCount <= 1) nextState = 'GAME_OVER';

          var nextProps = Object.assign({}, gameData.properties);
          if (bkResult.changed) {
              var bankruptIds = [];
              for (var j = 0; j < bankruptPlayers.length; j++) {
                  if (bankruptPlayers[j].isBankrupt) bankruptIds.push(bankruptPlayers[j].id);
              }
              nextProps = clearBankruptProperties(gameData.properties, bankruptIds);
          }

          await syncGameData({ players: bankruptPlayers, properties: nextProps, currentPlayerIdx: nextIdx, gameState: nextState, actionMessage: msg });
        } catch(e) { console.error(e); }
      },
      handleRespondTrade: async function(accept) {
        if (!gameData.pendingTrade) return;
        var trade = gameData.pendingTrade;
        if (accept) {
            playSound('coin', isMuted);
            var nextPlayers = clonePlayers(gameData.players);
            var sIdx = -1; var bIdx = -1;
            for (var i = 0; i < nextPlayers.length; i++) {
                if (nextPlayers[i].id === trade.sellerIdx) sIdx = i;
                if (nextPlayers[i].id === trade.buyerIdx) bIdx = i;
            }
            if (sIdx !== -1) nextPlayers[sIdx].money += trade.price;
            if (bIdx !== -1) nextPlayers[bIdx].money -= trade.price;
            
            var nextProps = cloneObj(gameData.properties);
            nextProps[trade.sqId] = trade.buyerIdx;
            await syncGameData({ players: nextPlayers, properties: nextProps, pendingTrade: null });
        } else {
            playSound('click', isMuted);
            await syncGameData({ pendingTrade: null });
        }
      }
  };

  var handleThrowBwaBwei = function() { return handlersRef.current.handleThrowBwaBwei(); };
  var handleFinishBwaBwei = function() { return handlersRef.current.handleFinishBwaBwei(); };
  var handleBuyProperty = function() { return handlersRef.current.handleBuyProperty(); };
  var handleEndTurn = function() { return handlersRef.current.handleEndTurn(); };
  var handleRespondTrade = function(accept) { return handlersRef.current.handleRespondTrade(accept); };

  // =========================================================
  // FIX: MOVING 與 AI 邏輯改為相依 handlersRef 避免被 1s 計時器打斷
  // =========================================================
  useEffect(function() {
    if (appPhase !== 'GAME' || gameData.gameState !== 'MOVING' || gameData.currentPlayerIdx !== activePlayerIndex) return;

    var moveTimer = setTimeout(async function() {
      try {
        var player = getPlayerById(gameData.players, activePlayerIndex);
        if (!player) return;
        
        if (gameData.remainingSteps > 0) {
          playSound('move', isMuted); 
          var newPos = (player.pos + 1) % 40;
          var newMoney = player.money;
          var msg = gameData.actionMessage || '';
          
          if (newPos === 0 && gameData.remainingSteps > 1) {
            newMoney += 500;
            msg = '✨ 經過起點，領取 $500 零用錢！\n';
          }
          
          var nextPlayers = clonePlayers(gameData.players);
          nextPlayers[activePlayerIndex] = Object.assign({}, player, { pos: newPos, money: newMoney });

          await syncGameData({
            players: nextPlayers,
            remainingSteps: gameData.remainingSteps - 1,
            actionMessage: msg
          });
        } else {
          await handlersRef.current.handleLandOnSquare();
        }
      } catch (e) {
        console.error(e);
      }
    }, 350);

    return function() { clearTimeout(moveTimer); };
  }, [gameData.gameState, gameData.remainingSteps, gameData.currentPlayerIdx, activePlayerIndex, isOfflineMode, appPhase, gameData.players, gameData.actionMessage, syncGameData, isMuted]);


  useEffect(function() {
    if (appPhase !== 'GAME' || !isOfflineMode) return;

    if (gameData.pendingTrade) {
        var buyer = getPlayerById(gameData.players, gameData.pendingTrade.buyerIdx);
        if (buyer && buyer.isAI) {
            var tIdTrade = setTimeout(function() { handlersRef.current.handleRespondTrade(buyer.money >= gameData.pendingTrade.price * 1.5); }, 2000);
            return function() { clearTimeout(tIdTrade); };
        }
        return; 
    }

    var currAI = getPlayerById(gameData.players, gameData.currentPlayerIdx);
    if (currAI && currAI.isAI) {
        var tId; 
        var gameState = gameData.gameState;
        if (!currAI.isBankrupt || gameState === 'END_TURN') {
            if (gameState === 'IDLE') { 
                tId = setTimeout(function() { 
                    if (currAI.jailRoundsLeft === -1) { syncGameData({ gameState: 'JAIL_BWA_BWEI', bwaBweiResults: [] }); } else { handlersRef.current.handleRollDice(); } 
                }, 1200); 
            }
            else if (gameState === 'JAIL_BWA_BWEI') { 
                tId = setTimeout(function() { 
                    var bwaLen = gameData.bwaBweiResults ? gameData.bwaBweiResults.length : 0;
                    if (bwaLen < 3) { handlersRef.current.handleThrowBwaBwei(); } else { handlersRef.current.handleFinishBwaBwei(); } 
                }, 1200); 
            }
            else if (gameState === 'ACTION') { 
                tId = setTimeout(function() {
                    var sq = BOARD_SQUARES[currAI.pos];
                    var hasOwner = gameData.properties && gameData.properties[sq.id] !== undefined;
                    var cB = sq.type === 'PROPERTY' && (!hasOwner) && currAI.money >= sq.price && currAI.trust >= sq.reqTrust;
                    if (cB && Math.random() > 0.2) { handlersRef.current.handleBuyProperty(); } else { handlersRef.current.handleEndTurn(); }
                }, 2000); 
            }
            else if (gameState === 'END_TURN') { 
                tId = setTimeout(function() { handlersRef.current.handleEndTurn(); }, 2000); 
            }
        }
        return function() { clearTimeout(tId); };
    }
  }, [gameData.gameState, gameData.currentPlayerIdx, gameData.bwaBweiResults, gameData.pendingTrade, isOfflineMode, appPhase, gameData.players, gameData.properties, syncGameData]);


  useEffect(function() {
    if (appPhase !== 'GAME') return;
    if (gameData.gameState === 'BWA_BWEI_ROLLING' && gameData.currentPlayerIdx === activePlayerIndex) {
      var timer = setTimeout(async function() {
        var rand = Math.random();
        var res = '';
        if (rand < 0.5) res = 'HOLY'; 
        else if (rand < 0.75) res = 'LAUGH'; 
        else res = 'YIN'; 

        var nextResults = [];
        if (gameData.bwaBweiResults) {
            for (var i = 0; i < gameData.bwaBweiResults.length; i++) {
                nextResults.push(gameData.bwaBweiResults[i]);
            }
        }
        nextResults.push(res);
        await syncGameData({ gameState: 'JAIL_BWA_BWEI', bwaBweiResults: nextResults });
      }, 1000);
      return function() { clearTimeout(timer); };
    }
  }, [gameData.gameState, gameData.currentPlayerIdx, activePlayerIndex, gameData.bwaBweiResults, isOfflineMode, roomId, syncGameData, appPhase]);

  var handleSellToBank = useCallback(async function(sqId, price) {
    playSound('coin', isMuted); 
    var nextPlayers = clonePlayers(gameData.players);
    nextPlayers[activePlayerIndex].money += price;
    
    var nextProps = cloneObj(gameData.properties);
    delete nextProps[sqId];

    await syncGameData({ players: nextPlayers, properties: nextProps });
    setSellProcess(null);
  }, [gameData.players, gameData.properties, activePlayerIndex, isMuted, syncGameData]);

  var initiatePlayerTrade = useCallback(async function(sqId, price, buyerIdx) {
    playSound('click', isMuted);
    await syncGameData({ pendingTrade: { sellerIdx: activePlayerIndex, buyerIdx: buyerIdx, sqId: sqId, price: price } });
    setSellProcess(null);
    setShowAssetManager(false);
  }, [activePlayerIndex, isMuted, syncGameData]);

  // -------------------------------------------------------------
  // UI 渲染區塊
  // -------------------------------------------------------------

  function handleMenuZoomIn() { setZoom(function(z) { return Math.min(z + 0.1, 1.5); }); setIsMenuOpen(false); }
  function handleMenuZoomOut() { setZoom(function(z) { return Math.max(z - 0.1, 0.4); }); setIsMenuOpen(false); }
  function handleMenuFindPlayer() { focusOnCurrentPlayer(); setIsMenuOpen(false); }
  function handleMenuToggleMap() { setIsFullMapMode(!isFullMapMode); setIsMenuOpen(false); }
  function handleMenuExit() { setShowExitConfirm(true); setIsMenuOpen(false); }
  function handleExitConfirmClose() { setShowExitConfirm(false); }
  function handleExitConfirmConfirm() { window.location.reload(); }
  function handleMenuToggle() { setIsMenuOpen(!isMenuOpen); }
  function handleMuteToggle() { setIsMuted(!isMuted); }

  if (appPhase === 'LANDING') {
    return (
      <LandingScreen 
        setupMode={setupMode} setSetupMode={setSetupMode}
        setupPlayerCount={setupPlayerCount} setSetupPlayerCount={setSetupPlayerCount}
        setupTimeLimit={setupTimeLimit} setSetupTimeLimit={setSetupTimeLimit}
        setupAvatar={setupAvatar} setSetupAvatar={setSetupAvatar}
        setupName={setupName} setSetupName={setSetupName}
        localNames={localNames} setLocalNames={setLocalNames}
        localPlayerTypes={localPlayerTypes} setLocalPlayerTypes={setLocalPlayerTypes}
        localAvatars={localAvatars} setLocalAvatars={setLocalAvatars}
        editingLocalPlayer={editingLocalPlayer} setEditingLocalPlayer={setEditingLocalPlayer}
        user={user} roomId={roomId} setRoomId={setRoomId} errorMsg={errorMsg}
        handleStartLocalGame={handleStartLocalGame} handleCreateRoom={handleCreateRoom} handleJoinRoom={handleJoinRoom}
      />
    );
  }

  if (gameData.gameState === 'GAME_OVER') {
      const ranked = [];
      for(var r=0; r<gameData.players.length; r++) { ranked.push(gameData.players[r]); }
      ranked.sort(function(a, b) { return b.trust !== a.trust ? b.trust - a.trust : b.money - a.money; });
      
      const rElems = [];
      for (var s = 0; s < ranked.length; s++) {
          const p = ranked[s];
          const bgClass = s === 0 ? 'bg-amber-50 border-amber-400 shadow-md scale-105 relative z-10' : 'bg-slate-50 border-slate-200';
          rElems.push(
              <div key={p.id} className={`flex items-center justify-between p-5 mb-4 rounded-[2rem] border-4 ${bgClass}`}>
                  {s === 0 ? <div className="absolute -top-4 -left-4 text-4xl animate-bounce">👑</div> : null}
                  <div className="flex items-center gap-5">
                      <span className={`font-black text-3xl ${s === 0 ? 'text-amber-500' : 'text-slate-400'}`}>#{s+1}</span>
                      <div className="text-5xl bg-white p-2 rounded-full shadow-sm border-2 border-slate-100">{p.icon}</div>
                      <span className="font-black text-2xl text-slate-700">{p.name} {p.isBankrupt ? <span className="text-sm text-red-400 ml-1">(出局)</span> : null}</span>
                  </div>
                  <div className="text-right">
                      <div className="text-amber-500 font-black text-2xl flex items-center justify-end gap-1"><Star size={24} fill="currentColor" /> {p.trust} 點</div>
                      <div className="text-emerald-500 font-black text-lg">💰 ${p.money}</div>
                  </div>
              </div>
          );
      }

      return (
        <div className="min-h-screen w-screen bg-[#fff8e7] flex flex-col items-center justify-center p-6 text-[#4a3424] overflow-x-hidden absolute inset-0 font-black">
            <div className="text-pink-400 mb-6 animate-bounce drop-shadow-md text-7xl">🎉</div>
            <h1 className="text-[5rem] font-black mb-10 text-amber-500 drop-shadow-[0_6px_0_rgba(217,119,6,0.2)]">遊戲結束囉！🎉</h1>
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-[8px] border-amber-200 relative">
                <h2 className="text-3xl font-black mb-8 text-amber-600 border-b-4 border-dashed border-amber-100 pb-6 text-center">🏆 大信翁排行榜 🏆</h2>
                {rElems}
            </div>
            <button onClick={handleExitConfirmConfirm} className="mt-10 px-10 py-5 bg-sky-400 text-sky-900 rounded-[2.5rem] font-black text-2xl shadow-[0_8px_0_0_#0ea5e9] border-[6px] border-white hover:-translate-y-1 active:translate-y-[8px] active:shadow-none transition-all">再玩一次！</button>
        </div>
      );
  }

  const tbpElems = [];
  for (var i = 0; i < gameData.players.length; i++) {
      const p = gameData.players[i];
      const isCurrent = gameData.currentPlayerIdx === p.id;
      const bgClass = isCurrent ? 'border-amber-400 bg-amber-50 scale-110 z-10 shadow-[0_5px_15px_rgba(217,119,6,0.2)]' : 'border-white bg-white/80 opacity-90';
      const grayClass = p.isBankrupt ? 'grayscale opacity-50' : '';
      
      let statusNode = null;
      if (p.uid !== null && !p.isBankrupt) {
          const mClass = p.money < 0 ? 'text-rose-500' : 'text-emerald-500';
          const tClass = p.trust <= 0 ? 'text-rose-500' : 'text-amber-500';
          statusNode = (
            <div className="flex gap-2 items-end leading-none">
                <span className={`text-[1.1rem] ${mClass}`}>${p.money}</span>
                <span className={`text-[13px] flex items-center gap-0.5 ${tClass}`}><Star size={12} fill="currentColor" />{p.trust}</span>
            </div>
          );
      } else {
          statusNode = <span className="text-sm text-slate-400 italic mt-1">{p.isBankrupt ? '出局 🥺' : '等待中...'}</span>;
      }

      tbpElems.push(
          <div key={p.id} className={`flex items-center gap-3 px-5 py-2.5 rounded-[2.5rem] border-4 shadow-sm h-[75px] shrink-0 transition-all duration-300 ${bgClass} ${grayClass}`}>
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-4xl shadow-sm bg-white border-4 border-slate-100 relative">
                  {p.icon}
                  {p.inJail && !p.isBankrupt ? <div className="absolute -top-2 -right-2 text-base animate-bounce drop-shadow-md">🙏</div> : null}
              </div>
              <div className="flex flex-col justify-center min-w-[85px]">
                  <div className="text-[14px] text-slate-500 flex justify-between items-center leading-none mb-1.5"><span className={isCurrent ? "text-amber-700" : "text-slate-600"}>{p.name}</span></div>
                  {statusNode}
              </div>
          </div>
      );
  }

  const bwaElems = [];
  for (var w = 0; w < 3; w++) {
      const res = gameData.bwaBweiResults ? gameData.bwaBweiResults[w] : null;
      const bgClass = res === 'HOLY' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200';
      bwaElems.push(
        <div key={w} className={`w-24 h-28 rounded-2xl flex flex-col items-center justify-center border-4 shadow-sm ${bgClass}`}>
           <div className="flex scale-75 mb-2">
              {res === 'HOLY' ? <><BweiBlock isFlat={true} className="rotate-12" /><BweiBlock isFlat={false} className="-rotate-12 scale-x-[-1] ml-[-8px]" /></> : null}
              {res === 'LAUGH' ? <><BweiBlock isFlat={true} className="rotate-12" /><BweiBlock isFlat={true} className="-rotate-12 scale-x-[-1] ml-[-8px]" /></> : null}
              {res === 'YIN' ? <><BweiBlock isFlat={false} className="rotate-12" /><BweiBlock isFlat={false} className="-rotate-12 scale-x-[-1] ml-[-8px]" /></> : null}
           </div>
           <span className="font-black text-sm">{res === 'HOLY' ? '聖杯' : res ? '無杯' : ''}</span>
         </div>
      );
  }

  const bsElems = [];
  for (var idx = 0; idx < BOARD_SQUARES.length; idx++) {
      const sq = BOARD_SQUARES[idx];
      const gridObj = GRID_ORDER[idx];
      const row = gridObj.row;
      const col = gridObj.col;
      
      let ownerId = undefined;
      if (gameData.properties && gameData.properties[idx] !== undefined) ownerId = gameData.properties[idx];
      let owner = ownerId !== undefined ? getPlayerById(gameData.players, ownerId) : null;
      
      const activePlayersHere = [];
      for (var u = 0; u < gameData.players.length; u++) {
          if (gameData.players[u].pos === idx && gameData.players[u].uid !== null && !gameData.players[u].isBankrupt) {
              activePlayersHere.push(gameData.players[u]);
          }
      }
      
      const bodyBg = owner ? getOwnerBodyClass(owner.color) : 'bg-white';
      const borderClass = owner ? getOwnerBorderClass(owner.color) : 'border-white';
      const contentClass = `flex-1 flex flex-col items-center justify-center p-2 relative w-full h-full ${bodyBg} z-10`;

      let activePlayerIndexInHere = -1;
      for (var v = 0; v < activePlayersHere.length; v++) {
          if (activePlayersHere[v].id === gameData.currentPlayerIdx) { activePlayerIndexInHere = v; break; }
      }
      const isMyTurnOnThisCell = activePlayerIndexInHere !== -1 && gameData.currentPlayerIdx === activePlayerIndex;

      const playerElements = [];

      for (var pIdx = 0; pIdx < activePlayersHere.length; pIdx++) {
          const p = activePlayersHere[pIdx];
          const isActive = gameData.currentPlayerIdx === p.id;
          let tX = 0; let tY = 0;
          if (!isActive) {
              let myInactiveIdx = pIdx;
              if (activePlayerIndexInHere !== -1 && pIdx > activePlayerIndexInHere) { myInactiveIdx = pIdx - 1; }
              const pos = INACTIVE_OFFSETS[myInactiveIdx % INACTIVE_OFFSETS.length];
              tX = pos.x; tY = pos.y;
          }

          let movingBubble = null;
          if (gameData.gameState === 'MOVING' && gameData.currentPlayerIdx === p.id && gameData.remainingSteps > 0) {
              movingBubble = (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[150] w-24 flex justify-center">
                  <div className="bg-sky-400 border-[6px] border-white text-white font-black rounded-full w-24 h-24 flex items-center justify-center text-[3rem] shadow-[0_10px_20px_rgba(0,0,0,0.15)] animate-bounce">
                    {gameData.remainingSteps}
                  </div>
                </div>
              );
          }

          let actionBubble = null;
          if (isMyTurnOnThisCell && p.id === activePlayerIndex && !(myPlayer && myPlayer.isBankrupt) && gameData.gameState === 'IDLE' && !(myPlayer && myPlayer.inJail) && !isTradeActive) {
              if (myPlayer && myPlayer.isAI) {
                  actionBubble = (
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-[200]">
                      <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-300" style={{ transform: `scale(${inverseZoom})`, transformOrigin: 'bottom center' }}>
                        <div className="whitespace-nowrap px-6 py-3 bg-slate-700 text-white rounded-[2rem] font-black text-xl shadow-lg flex items-center gap-2 animate-pulse border-[3px] border-slate-500">🤖 思考中...</div>
                      </div>
                    </div>
                  );
              } else {
                  actionBubble = (
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-[200]">
                      <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-300" style={{ transform: `scale(${inverseZoom})`, transformOrigin: 'bottom center' }}>
                        <button onClick={handleRollDice} className="whitespace-nowrap px-8 py-4 bg-sky-400 hover:bg-sky-300 text-white rounded-[2rem] font-black text-3xl shadow-[0_8px_0_0_#0284c7,0_10px_20px_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-[8px] active:border-b-0 transition-all flex items-center gap-3 border-[4px] border-white animate-bounce">
                          <DiceIcon value={1} strokeWidth={3} className="w-8 h-8" /> 擲骰子
                        </button>
                      </div>
                    </div>
                  );
              }
          }

          const curPointer = p.id === activePlayerIndex && (!myPlayer || !myPlayer.isAI);
          const curClass = curPointer ? 'cursor-pointer hover:ring-[6px] hover:ring-sky-300 hover:scale-[1.4] hover:grayscale-0 hover:opacity-100' : '';
          const bClasses = isActive ? 'border-amber-400 scale-125 z-40 relative' : 'border-slate-200 scale-[0.65] grayscale opacity-70 z-10';

          playerElements.push(
              <div key={p.id} className={`absolute transition-all duration-500 ease-out pointer-events-auto flex flex-col items-center ${isActive ? 'z-50' : 'z-10'}`} style={{ transform: `translate(${tX}px, ${tY}px)` }}>
                  {movingBubble}
                  {p.inJail ? <div className="absolute -top-6 -right-6 text-4xl animate-pulse drop-shadow-md z-40 bg-white p-1 rounded-full border-2 border-slate-100">🙏</div> : null}
                  <div onClick={(function(pId) { return function(e) { if (curPointer) { e.stopPropagation(); setShowAssetManager(true); } }; })(p.id)} className={`w-20 h-20 bg-white rounded-full border-[6px] flex items-center justify-center text-[3rem] shadow-[0_8px_15px_rgba(0,0,0,0.1)] transition-all duration-500 ${bClasses} ${curClass}`}>
                      {p.icon}
                      {curPointer && !p.isBankrupt ? (
                        <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 p-1.5 rounded-full shadow-md border-4 border-white z-50 animate-bounce">
                           <Briefcase size={18} strokeWidth={3} />
                        </div>
                      ) : null}
                  </div>
                  {actionBubble}
              </div>
          );
      }

      bsElems.push(
          <div key={idx} style={{ display: 'contents' }}>
              <div onClick={(function(i) { return function() { if (!dragStatus.current.moved) setSelectedSquareInfo(i); }; })(idx)} className={`rounded-[1.5rem] relative flex flex-col overflow-hidden shadow-sm z-10 border-4 border-b-[8px] cursor-pointer hover:scale-[1.03] transition-transform pointer-events-auto ${borderClass}`} style={{ gridRow: row, gridColumn: col }}>
                  {sq.type === 'PROPERTY' ? <div className={`h-[20%] min-h-[20%] w-full ${owner ? owner.color : sq.color} border-b-4 border-white/50 z-0 shrink-0`} /> : null}
                  <div className={contentClass}>
                      <span className="font-black text-slate-700 text-2xl leading-tight text-center mt-1 drop-shadow-sm">{sq.name}</span>
                      {sq.type === 'START' ? <span className="text-emerald-700 font-black text-lg leading-tight mt-1 bg-emerald-100 px-3 py-0.5 rounded-full border-2 border-emerald-300">領 $500</span> : null}
                      {sq.type === 'TAX' ? <span className="text-rose-700 font-black text-lg leading-tight mt-1 bg-rose-100 px-3 py-0.5 rounded-full border-2 border-rose-300">繳 ${sq.amount}</span> : null}
                      {sq.price ? <span className="text-sky-600 font-black text-xl leading-tight mt-1">${sq.price}</span> : null}
                      {sq.reqTrust > 0 ? (
                        <div className="mt-1 bg-amber-50 text-amber-600 text-xs font-black px-2 py-0.5 rounded-full border-2 border-amber-300 flex items-center justify-center gap-1 shadow-sm">
                          <Star size={14} fill="currentColor" /> {sq.reqTrust} 點
                        </div>
                      ) : null}
                  </div>
              </div>
              <div className={`flex items-center justify-center relative ${activePlayerIndexInHere !== -1 ? 'z-[100]' : 'z-20 pointer-events-none'}`} style={{ gridRow: row, gridColumn: col }}>
                  {playerElements}
              </div>
          </div>
      );
  }

  const stElems = [];
  for (var y = 0; y < gameData.players.length; y++) {
      const p = gameData.players[y];
      if (p.id === activePlayerIndex || p.isBankrupt || (!isOfflineMode && p.uid === null)) continue;
      stElems.push(
          <button key={p.id} onClick={(function(pId) { return function() { initiatePlayerTrade(sellProcess.sqId, sellProcess.price, pId); }; })(p.id)} className="w-full py-4 bg-white border-4 border-emerald-100 text-emerald-600 rounded-2xl shadow-sm flex items-center justify-between px-6 active:scale-95 transition-all font-black">
              <span>🤝 賣給 {p.name}</span><span className="text-4xl">{p.icon}</span>
          </button>
      );
  }

  let mpNode = null;
  if (myProperties.length === 0) {
      mpNode = <div className="text-center text-slate-300 text-lg py-8 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200">包包裡空空的 🥺</div>;
  } else {
      const mpElems = [];
      for (var z = 0; z < myProperties.length; z++) {
          const sqId = myProperties[z];
          const sq = BOARD_SQUARES[sqId];
          if (!sq) continue;
          const sellPrice = myPlayer && myPlayer.trust >= 10 ? sq.price : Math.floor(sq.price * 0.5);
          mpElems.push(
              <div key={sqId} className="flex justify-between items-center p-4 bg-sky-50 rounded-[1.5rem] border-4 border-white shadow-sm font-black">
                  <span className="font-black text-sky-800 text-xl">{sq.name}</span>
                  <button onClick={(function(id, p) { return function() { setSellProcess({ sqId: id, price: p }); }; })(sqId, sellPrice)} className="bg-rose-400 hover:bg-rose-300 text-white shadow-[0_4px_0_0_#e11d48] active:translate-y-[4px] active:shadow-none text-xl px-5 py-2 rounded-xl transition-all border-2 border-white font-black">變賣</button>
              </div>
          );
      }
      mpNode = <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">{mpElems}</div>;
  }

  const showBasicAction = gameData.currentPlayerIdx === activePlayerIndex && myPlayer && !myPlayer.isBankrupt && (gameData.gameState === 'JAIL_BWA_BWEI' || gameData.gameState === 'ACTION' || gameData.gameState === 'END_TURN') && !gameData.pendingTrade;

  return (
    <div className="h-screen w-screen bg-[#e0f2fe] overflow-hidden relative touch-none select-none font-black text-[#4a3424] flex flex-col">
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}</style>
      
      <div className="absolute top-6 left-6 right-24 z-[150] flex gap-4 overflow-x-auto pb-6 px-2 pointer-events-auto items-center custom-scrollbar">
        <div className="bg-white text-rose-500 rounded-[2rem] px-6 py-3 flex flex-col items-center justify-center shadow-md h-[75px] shrink-0 border-4 border-rose-200">
          <Timer size={20} className={localTimeLeft < 60 && localTimeLeft > 0 ? "animate-pulse" : ""} /> 
          <span className="text-xl font-black mt-1">{formatTime(localTimeLeft)}</span>
        </div>
        <div className={`bg-white rounded-[2rem] px-6 py-3 flex flex-col items-center justify-center font-black shadow-md h-[75px] shrink-0 border-4 tracking-wider ${isOfflineMode ? 'border-emerald-300 text-emerald-700' : 'border-sky-300 text-sky-700'}`}>
          <div className="text-xs opacity-70">{isOfflineMode ? '模式' : '房號'}</div>
          <div className="text-xl mt-1">{isOfflineMode ? '單機同樂 🎪' : roomId}</div>
        </div>
        <div className="w-1.5 h-10 bg-sky-200/50 mx-2 rounded-full shrink-0" />
        {tbpElems}
      </div>

      <div className="absolute right-4 bottom-8 md:right-6 md:bottom-10 flex flex-col items-end z-[150] pointer-events-auto">
        <div className={`flex flex-col items-end gap-3 transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] opacity-100 pb-3 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <button onClick={handleMenuZoomIn} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-sky-100 flex items-center gap-3 font-black text-sky-600 shadow-lg active:scale-95 transition-all">放大畫面 <ZoomIn size={24} /></button>
          <button onClick={handleMenuFindPlayer} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-sky-100 flex items-center gap-3 font-black text-sky-600 shadow-lg active:scale-95 transition-all">找回角色 <Target size={24} /></button>
          <button onClick={handleMenuZoomOut} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-sky-100 flex items-center gap-3 font-black text-sky-600 shadow-lg active:scale-95 transition-all">縮小畫面 <ZoomOut size={24} /></button>
          <button onClick={handleMenuToggleMap} className={`h-14 px-5 backdrop-blur-md rounded-full border-4 flex items-center gap-3 font-black shadow-lg active:scale-95 transition-all ${isFullMapMode ? 'bg-sky-400 text-white border-white' : 'bg-white/95 text-sky-600 border-sky-100'}`}>{isFullMapMode ? '關閉全覽' : '全覽地圖'}<Menu size={24} /></button>
          <button onClick={handleMuteToggle} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-amber-100 flex items-center gap-3 font-black text-amber-500 shadow-lg active:scale-95 transition-all">{isMuted ? '開啟音效' : '關閉音效'} {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
          <button onClick={handleMenuExit} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-rose-100 flex items-center gap-3 font-black text-rose-500 shadow-lg active:scale-95 transition-all">離開遊戲 <LogOut size={24} /></button>
        </div>
        <button onClick={handleMenuToggle} className={`w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center border-[5px] transition-all duration-300 transform ${isMenuOpen ? 'bg-sky-400 border-white rotate-90 scale-95 text-white' : 'bg-white/90 backdrop-blur-md border-sky-100 text-sky-500 hover:scale-105 active:scale-95'}`}>
          {isMenuOpen ? <X size={36} strokeWidth={3} /> : <Menu size={36} strokeWidth={3} />}
        </button>
      </div>

      {showExitConfirm ? (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-in zoom-in-95 spin-in-1 border-[8px] border-rose-100">
            <div className="text-rose-500 bg-rose-50 p-6 rounded-full border-4 border-white shadow-inner"><LogOut size={48} className="ml-1" strokeWidth={2.5} /></div>
            <h3 className="text-3xl font-black text-slate-700">要離開遊戲嗎？🥺</h3>
            <p className="text-slate-400 text-center text-lg">離開後目前的進度就不見囉！</p>
            <div className="flex gap-4 w-full mt-4">
              <button onClick={handleExitConfirmClose} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xl rounded-[2rem] transition-colors border-4 border-white shadow-sm">按錯了啦</button>
              <button onClick={handleExitConfirmConfirm} className="flex-1 py-4 bg-rose-400 hover:bg-rose-300 text-white text-xl rounded-[2rem] shadow-[0_5px_0_0_#e11d48] active:translate-y-[5px] active:shadow-none transition-all border-4 border-white">確定離開</button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedSquareInfo !== null ? (() => {
        const sq = BOARD_SQUARES[selectedSquareInfo];
        let owner = null;
        if (gameData.properties && gameData.properties[sq.id] !== undefined) {
            const oId = gameData.properties[sq.id];
            for (var i = 0; i < gameData.players.length; i++) {
                if (gameData.players[i].id === oId) { owner = gameData.players[i]; break; }
            }
        }
        const rentPrice = Math.floor(sq.price * 0.4);

        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto" onClick={handleCloseSquareInfo}>
            <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-sky-100 w-full max-w-sm animate-in zoom-in-95 spin-in-1 mx-4 flex flex-col relative" onClick={function(e){ e.stopPropagation(); }}>
              <button onClick={handleCloseSquareInfo} className="absolute -top-5 -right-5 text-white bg-rose-400 rounded-full p-3 border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"><X size={28} strokeWidth={3} /></button>
              
              <div className={`w-full h-20 rounded-[1.5rem] mb-5 ${sq.color || 'bg-slate-200'} border-4 border-white shadow-sm flex items-center justify-center text-4xl`}>
                {sq.type === 'START' ? '✨' : sq.type === 'TAX' ? '💸' : sq.type === 'JAIL' ? '🙏' : sq.type === 'CHANCE_GOOD' ? '🍀' : sq.type === 'CHANCE_BAD' ? '⛈️' : '🏠'}
              </div>
              <h2 className="text-3xl font-black text-slate-700 text-center mb-2 drop-shadow-sm">{sq.name}</h2>
              <div className="text-center text-slate-400 mb-6 text-lg">{sq.desc || (sq.type === 'PROPERTY' ? '一塊棒棒的地產 🌟' : '特殊泡泡 🫧')}</div>
              
              {sq.type === 'PROPERTY' ? (
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex justify-between items-center bg-sky-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm">
                    <span className="text-sky-800 text-lg">購買需要</span>
                    <span className="font-black text-sky-600 text-2xl">${sq.price}</span>
                  </div>
                  <div className="flex justify-between items-center bg-rose-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm">
                    <span className="text-rose-800 text-lg">過路費</span>
                    <span className="font-black text-rose-500 text-2xl">${rentPrice}</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm">
                    <span className="text-amber-800 text-lg">信用門檻</span>
                    <span className="font-black text-amber-500 text-2xl flex items-center gap-1"><Star size={24} fill="currentColor" /> {sq.reqTrust}</span>
                  </div>
                  
                  <div className="mt-4 p-5 rounded-[2rem] border-[4px] border-dashed border-slate-200 text-center bg-slate-50 relative overflow-hidden">
                    <div className="text-slate-400 mb-2 text-sm">這塊地的主人是誰呢？</div>
                    {owner ? (
                      <div className="font-black text-3xl flex items-center justify-center gap-3">
                        <span className="text-5xl drop-shadow-md">{owner.icon}</span> <span className="text-emerald-600">{owner.name}</span>
                      </div>
                    ) : (
                      <div className="font-black text-slate-300 text-2xl py-2">目前沒有主人喔 🥺</div>
                    )}
                  </div>
                </div>
              ) : null}

              {(sq.type === 'TAX' || sq.type === 'START') ? (
                <div className={`flex justify-between items-center p-6 rounded-[2rem] border-4 w-full mt-2 shadow-sm ${sq.type === 'TAX' ? 'bg-rose-100 border-white' : 'bg-emerald-100 border-white'}`}>
                  <span className={`text-2xl ${sq.type === 'TAX' ? 'text-rose-800' : 'text-emerald-800'}`}>{sq.type === 'TAX' ? '要繳交 💸' : '可領取 💰'}</span>
                  <span className={`font-black text-4xl ${sq.type === 'TAX' ? 'text-rose-500' : 'text-emerald-500'}`}>${sq.amount || 500}</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })() : null}

      {showAssetManager && myPlayer ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto" onClick={closeAssetManager}>
          <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-amber-100 w-[92vw] max-w-md relative pt-14 shadow-2xl animate-in zoom-in-95 font-black" onClick={function(e){ e.stopPropagation(); }}>
              <button onClick={closeAssetManager} className="absolute -top-5 -right-5 text-white bg-rose-400 rounded-full p-3 border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"><X size={28} strokeWidth={3} /></button>

              {!sellProcess ? (
                 <>
                  <div className="flex flex-col items-center border-b-4 border-dashed border-amber-100 pb-4 mb-4">
                      <div className="w-16 h-16 bg-amber-50 rounded-full border-4 border-amber-200 flex items-center justify-center text-4xl mb-2 shadow-inner">💼</div>
                      <h3 className="font-black text-2xl text-amber-700">小金庫與資產</h3>
                      {isOfflineMode ? <div className="text-amber-500 text-base mt-1">({myPlayer.name} 的包包)</div> : null}
                  </div>
                  
                  <div className="flex gap-3 mb-5">
                     <div className="flex-1 bg-emerald-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm flex flex-col items-center relative overflow-hidden">
                        <div className="absolute -right-2 -bottom-4 text-[4rem] opacity-10">💰</div>
                        <div className="text-emerald-800 font-bold text-sm mb-1 z-10">目前資金</div>
                        <div className="font-black text-2xl text-emerald-500 z-10">${myPlayer.money}</div>
                     </div>
                     <div className="flex-1 bg-amber-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm flex flex-col items-center relative overflow-hidden">
                        <div className="absolute -right-2 -bottom-4 text-[4rem] opacity-10">⭐</div>
                        <div className="text-amber-800 font-bold text-sm mb-1 z-10">目前信用</div>
                        <div className="font-black text-2xl text-amber-500 z-10 flex items-center gap-1"><Star size={20} fill="currentColor" />{myPlayer.trust}</div>
                     </div>
                  </div>

                  <div className="mb-5">
                      <div className="text-slate-400 mb-2 text-center text-sm font-bold">🌟 拿 1 點信用換零用錢</div>
                      <button onClick={handleMortgageTrust} disabled={myPlayer.trust <= 1} className={`w-full py-4 rounded-[1.5rem] text-xl shadow-[0_5px_0_0_rgba(0,0,0,0.1)] active:translate-y-[5px] active:shadow-none active:border-b-0 transition-all flex items-center justify-center gap-2 border-[4px] border-white ${myPlayer.trust > 1 ? 'bg-amber-400 text-amber-900 hover:bg-amber-300 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                         <Star size={24} fill="currentColor" /> {myPlayer.trust >= 10 ? '換取 $1000' : '換取 $500'}
                      </button>
                  </div>

                  <div>
                      <div className="text-slate-400 mb-3 text-center text-sm font-bold">🏠 變賣手上的地產？</div>
                      {mpNode}
                  </div>
                 </>
              ) : (
                 <div className="animate-in slide-in-from-right-4 pt-4 font-black">
                    <button onClick={function(){ setSellProcess(null); }} className="text-sky-500 mb-4 underline font-black">← 返回</button>
                    <h3 className="text-xl font-black text-slate-700 mb-4 text-center">變賣：{BOARD_SQUARES[sellProcess.sqId].name}</h3>
                    <div className="bg-amber-50 p-4 rounded-xl mb-6 text-center border-2 border-amber-200">
                        <div className="text-sm text-slate-500 mb-1">成交價</div>
                        <div className="text-3xl text-amber-600 font-black">${sellProcess.price}</div>
                    </div>
                    <div className="text-xs text-slate-400 mb-3 font-black uppercase tracking-widest">請選擇出售對象：</div>
                    <div className="flex flex-col gap-3">
                       <button onClick={function(){ handleSellToBank(sellProcess.sqId, sellProcess.price); }} className="w-full py-4 bg-indigo-500 text-white rounded-2xl border-4 border-white shadow-md active:scale-95 transition-all font-black">🏦 賣給銀行 (立即領錢)</button>
                       <div className="w-full h-0.5 bg-slate-100 my-1" />
                       {stElems}
                    </div>
                 </div>
              )}
          </div>
        </div>
      ) : null}

      {(isTradeActive || showBasicAction) ? (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[250] bg-white/98 backdrop-blur-md p-8 rounded-[3rem] border-[8px] border-sky-100 shadow-2xl w-[95vw] max-w-[560px] text-center pointer-events-auto flex flex-col items-center gap-6 animate-in zoom-in-95">
          {isTradeActive ? (
              tradeBuyer && tradeBuyer.isAI ? (
                 <div className="flex flex-col items-center gap-4 py-8">
                     <div className="text-6xl animate-bounce mb-4">🤖</div>
                     <h2 className="text-3xl font-black text-slate-700">{tradeBuyer.name} 思考收購中...</h2><p className="text-slate-500 text-lg">請稍候</p>
                 </div>
              ) : (
                 <>
                    <div className="bg-emerald-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-inner text-emerald-500 text-5xl">🤝</div>
                    <h2 className="text-3xl font-black text-slate-700">🤝 產權購買邀請</h2>
                    <p className="text-xl text-slate-500 leading-relaxed font-black">玩家 <span className="text-amber-600">{gameData.players[gameData.pendingTrade.sellerIdx].name}</span> <br/>想以 <span className="text-emerald-500 font-black">${gameData.pendingTrade.price}</span> 出售 <br/><span className="text-sky-600 font-black">{BOARD_SQUARES[gameData.pendingTrade.sqId].name}</span> 給 <span className="text-emerald-600">{tradeBuyer ? tradeBuyer.name : ''}</span>！</p>
                    <div className="flex gap-4 w-full">
                       <button onClick={function(){ handleRespondTrade(false); }} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl border-4 border-white shadow-md font-black text-xl active:scale-95 transition-all">婉拒</button>
                       <button disabled={tradeBuyerMoney < gameData.pendingTrade.price} onClick={function(){ handleRespondTrade(true); }} className={`flex-1 py-4 rounded-2xl border-4 border-white shadow-lg font-black text-xl active:translate-y-1 transition-all ${tradeBuyerMoney >= gameData.pendingTrade.price ? 'bg-emerald-400 text-white shadow-[0_6px_0_0_#10b981]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                         {tradeBuyerMoney < gameData.pendingTrade.price ? '資金不足' : '收購！'}
                       </button>
                    </div>
                 </>
              )
          ) : (
              myPlayer && myPlayer.isAI ? (
                 <div className="flex flex-col items-center gap-4 py-8">
                     <div className="text-6xl animate-bounce mb-4">🤖</div>
                     <h2 className="text-3xl font-black text-slate-700">{myPlayer.name} 行動中...</h2><p className="text-slate-500 text-lg whitespace-pre-line">{gameData.actionMessage || "請稍候"}</p>
                 </div>
              ) : (
                 <>
                   {gameData.gameState === 'JAIL_BWA_BWEI' ? (
                     <div className="flex flex-col items-center w-full px-1 md:px-2">
                       <div className="text-2xl font-black text-rose-500 mb-6 bg-rose-50 px-8 py-3 rounded-full border-4 border-white shadow-sm font-black">🚨 靜心房擲杯判定</div>
                       <div className="flex gap-4 mb-8">
                         {bwaElems}
                       </div>
                       {(gameData.bwaBweiResults || []).length < 3 ? <button onClick={handleThrowBwaBwei} className="w-full py-5 bg-rose-400 text-white rounded-[2rem] border-4 border-white shadow-lg text-2xl font-black">🙏 擲杯</button> : <button onClick={handleFinishBwaBwei} className="w-full py-5 bg-emerald-400 text-white rounded-[2rem] border-4 border-white shadow-lg text-2xl animate-bounce font-black">✨ 查看結果</button>}
                     </div>
                   ) : null}
                   {gameData.gameState !== 'JAIL_BWA_BWEI' ? <div className="text-3xl leading-relaxed whitespace-pre-line px-4 text-slate-700 font-black">{gameData.actionMessage}</div> : null}
                   <div className="flex flex-col gap-4 w-full mt-4 font-black">
                     {gameData.gameState === 'ACTION' && currentSquare && currentSquare.type === 'PROPERTY' && (!gameData.properties || gameData.properties[myPlayer.pos] === undefined) ? (
                       <button onClick={canBuy ? handleBuyProperty : undefined} disabled={!canBuy} className={`py-5 rounded-[2rem] border-4 border-white shadow-lg font-black text-2xl transition-all active:scale-95 ${canBuy ? 'bg-sky-400 text-white shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}>🎁 買下這裡！(${currentSquare.price || 0})</button>
                     ) : null}
                     {(gameData.gameState === 'ACTION' || gameData.gameState === 'END_TURN') ? <button onClick={handleEndTurn} className="py-5 bg-amber-400 text-amber-900 rounded-[2rem] border-4 border-white shadow-lg text-2xl font-black active:translate-y-1 transition-all">✅ 結束回合</button> : null}
                   </div>
                 </>
              )
          )}
        </div>
      ) : null}

      {gameData.gameState === 'ROLLING' ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="flex gap-10 bg-white/80 p-12 rounded-[4rem] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-sky-100 animate-in zoom-in spin-in-3">
            <DiceIcon value={safeDice[0]} className="w-36 h-36 text-sky-400 animate-bounce drop-shadow-md" style={{ animationDelay: '0s' }} strokeWidth={1.5} />
            <DiceIcon value={safeDice[1]} className="w-36 h-36 text-pink-400 animate-bounce drop-shadow-md" style={{ animationDelay: '0.1s' }} strokeWidth={1.5} />
          </div>
        </div>
      ) : null}

      {gameData.gameState === 'BWA_BWEI_ROLLING' ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-8 bg-white/90 p-12 rounded-[4rem] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-rose-100 animate-in zoom-in spin-in-3">
            <div className="text-rose-500 font-black text-4xl animate-pulse drop-shadow-sm">🙏 神明請指示...</div>
            <div className="flex gap-12 h-32 items-center justify-center">
              <div className="animate-[bounce_0.4s_infinite_alternate]"><div className="animate-[spin_0.3s_linear_infinite]"><BweiBlock isFlat={false} className="scale-[1.5]" /></div></div>
              <div className="animate-[bounce_0.5s_infinite_alternate-reverse]"><div className="animate-[spin_0.4s_linear_infinite_reverse]"><BweiBlock isFlat={true} className="scale-[1.5] scale-x-[-1]" /></div></div>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={mapRef} className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden z-10">
        <div 
          className="absolute top-0 left-0 origin-top-left transition-transform duration-700 ease-out pointer-events-none" 
          style={{ width: MAP_SIZE + 'px', height: MAP_SIZE + 'px', transform: 'translate(' + (cameraOffset.x + manualOffset.x) + 'px, ' + (cameraOffset.y + manualOffset.y) + 'px) scale(' + displayZoom + ')' }}
        >
          <div className="w-full h-full p-10 bg-[#fff8e7] rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border-[20px] border-[#fde047]" style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)', gap: '10px' }}>
            {bsElems}
          </div>
        </div>
      </div>
    </div>
  );
}