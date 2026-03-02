import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
  Timer, Target, Volume2, VolumeX, 
  LogOut, Star, Users as UsersIcon, Clock,
  Briefcase, X, PartyPopper,
  ZoomIn, ZoomOut, Menu,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- 1. 遊戲基礎資料與卡牌庫 ---
const BASE_MONEY = 17200; 
const BASE_TRUST = 10; 

const GOOD_CARDS = [
  { desc: '扶老奶奶過馬路', effectM: 200, effectT: 3 },
  { desc: '考試考一百分', effectM: 500, effectT: 2 },
  { desc: '拾金不昧', effectM: 300, effectT: 5 },
  { desc: '當選模範生', effectM: 1000, effectT: 5 },
  { desc: '主動打掃教室', effectM: 100, effectT: 2 }
];

const BAD_CARDS = [
  { desc: '遺失錢包', effectM: -300, effectT: -2 },
  { desc: '隨地亂丟垃圾', effectM: -200, effectT: -3 },
  { desc: '打破鄰居玻璃', effectM: -400, effectT: -2 },
  { desc: '上課遲到', effectM: -100, effectT: -2 },
  { desc: '對同學說謊被抓到', effectM: 0, effectT: -5 },
  { desc: '做壞事進反省泡泡', effectM: 0, effectT: 0, goToJail: true }
];

// 🎨 地產設定
const BOARD_SQUARES = [
  { id: 0, name: '起點', type: 'START', desc: '經過得$500' },
  { id: 1, name: '冰店', type: 'PROPERTY', price: 400, reqTrust: 0, color: 'bg-sky-300' },
  { id: 2, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 3, name: '飲料店', type: 'PROPERTY', price: 500, reqTrust: 0, color: 'bg-sky-300' },
  { id: 4, name: '班費', type: 'TAX', amount: 200, color: 'bg-slate-200' },
  { id: 5, name: '火車站', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-slate-300' },
  { id: 6, name: '小吃店', type: 'PROPERTY', price: 400, reqTrust: 0, color: 'bg-orange-300' },
  { id: 7, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 8, name: '麵包店', type: 'PROPERTY', price: 500, reqTrust: 0, color: 'bg-orange-300' },
  { id: 9, name: '便利商店', type: 'PROPERTY', price: 600, reqTrust: 0, color: 'bg-orange-300' },
  { id: 10, name: '靜心房', type: 'JAIL', desc: '反省懺悔', color: 'bg-fuchsia-200' },
  { id: 11, name: '服飾店', type: 'PROPERTY', price: 700, reqTrust: 10, color: 'bg-pink-300' },
  { id: 12, name: '超級市場', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-pink-300' },
  { id: 13, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 14, name: '鞋店', type: 'PROPERTY', price: 700, reqTrust: 10, color: 'bg-pink-300' },
  { id: 15, name: '書局', type: 'PROPERTY', price: 800, reqTrust: 10, color: 'bg-yellow-300' },
  { id: 16, name: '補習班', type: 'PROPERTY', price: 900, reqTrust: 10, color: 'bg-yellow-300' },
  { id: 17, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 18, name: '才藝班', type: 'PROPERTY', price: 900, reqTrust: 10, color: 'bg-yellow-300' },
  { id: 19, name: '網咖', type: 'PROPERTY', price: 1600, reqTrust: 10, color: 'bg-purple-300' },
  { id: 20, name: '道育班', type: 'FREE_PARKING', desc: '平安無事', color: 'bg-teal-200' },
  { id: 21, name: '遊樂場', type: 'PROPERTY', price: 1100, reqTrust: 12, color: 'bg-teal-300' },
  { id: 22, name: '博物館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-teal-300' },
  { id: 23, name: '公園', type: 'PROPERTY', price: 1000, reqTrust: 12, color: 'bg-teal-300' },
  { id: 24, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 25, name: '美髮店', type: 'PROPERTY', price: 600, reqTrust: 10, color: 'bg-indigo-300' },
  { id: 26, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 27, name: '電力公司', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-slate-300' },
  { id: 28, name: '玩具店', type: 'PROPERTY', price: 700, reqTrust: 10, color: 'bg-indigo-300' },
  { id: 29, name: '圖書館', type: 'PROPERTY', price: 1500, reqTrust: 12, color: 'bg-indigo-300' },
  { id: 30, name: '進入靜心房', type: 'GO_TO_JAIL', desc: '直接入獄', color: 'bg-fuchsia-300' },
  { id: 31, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 32, name: '學校', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-emerald-300' },
  { id: 33, name: '植物園', type: 'PROPERTY', price: 1400, reqTrust: 12, color: 'bg-emerald-300' },
  { id: 34, name: '美術館', type: 'PROPERTY', price: 1500, reqTrust: 12, color: 'bg-emerald-300' },
  { id: 35, name: '科博館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-emerald-300' },
  { id: 36, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 37, name: '孔廟', type: 'PROPERTY', price: 1900, reqTrust: 15, color: 'bg-rose-300' },
  { id: 38, name: '學費', type: 'TAX', amount: 500, color: 'bg-gray-300' },
  { id: 39, name: '自來水廠', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-slate-300' },
];

function createGridOrder() {
  const order = [];
  for (let i = 0; i < 40; i++) order.push(null);
  for (let i = 0; i <= 10; i++) order[i] = { row: 11, col: 11 - i };
  for (let i = 11; i <= 19; i++) order[i] = { row: 11 - (i - 10), col: 1 };
  for (let i = 20; i <= 30; i++) order[i] = { row: 1, col: 1 + (i - 20) };
  for (let i = 31; i <= 39; i++) order[i] = { row: 1 + (i - 30), col: 11 };
  return order;
}
const GRID_ORDER = createGridOrder();

const CHILD_AVATARS = ['👦', '👧', '👶', '👼', '👲', '👸', '🤴', '🤓', '🤠', '😎', '👻', '👽', '🤖', '👾', '🦊', '🐼'];

const INACTIVE_OFFSETS = [
  { x: -35, y: -35 }, { x: 35, y: 35 }, { x: -35, y: 35 }, 
  { x: 35, y: -35 }, { x: 0, y: -45 }, { x: 0, y: 45 }     
];

const formatTime = (seconds) => {
  if (seconds === -1) return "不限時";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + s.toString().padStart(2, '0');
};

const checkBankruptcy = (players) => {
  let hasBankruptcies = false;
  const nextPlayers = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p.isBankrupt && (p.money < 0 || p.trust <= 0)) {
      hasBankruptcies = true;
      nextPlayers.push(Object.assign({}, p, { isBankrupt: true }));
    } else {
      nextPlayers.push(p);
    }
  }
  return { changed: hasBankruptcies, newPlayers: nextPlayers };
};

const clearBankruptProperties = (props, bankruptPlayerIds) => {
  const nextProps = {};
  for (const sqId in props) {
    if (!bankruptPlayerIds.includes(props[sqId])) {
      nextProps[sqId] = props[sqId];
    }
  }
  return nextProps;
};

// =========================================================
// Firebase 初始化
// =========================================================
const getFirebaseConfig = () => {
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
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'da-xin-wong-v1';

// 🌟 Web Audio API 音效
let audioCtx = null;
const playSound = (type, isMuted) => {
  if (isMuted || typeof window === 'undefined') return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  switch(type) {
    case 'click':
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
    case 'move':
      osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
    case 'coin':
      osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.setValueAtTime(1600, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); break;
    case 'bad':
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.4); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
    case 'win':
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
    case 'bwa':
      osc.type = 'square'; osc.frequency.setValueAtTime(150, now); gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05); break;
    case 'roll':
      for(let i=0; i<6; i++) { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination); o.type = 'triangle'; o.frequency.setValueAtTime(300 + Math.random()*300, now + i*0.08); g.gain.setValueAtTime(0.1, now + i*0.08); g.gain.exponentialRampToValueAtTime(0.01, now + i*0.08 + 0.05); o.start(now + i*0.08); o.stop(now + i*0.08 + 0.05); } break;
    default: break;
  }
};

const getOwnerBodyClass = (colorClass) => {
  const map = {
    'bg-sky-300': 'bg-sky-100', 'bg-rose-300': 'bg-rose-100', 'bg-emerald-300': 'bg-emerald-100',
    'bg-purple-300': 'bg-purple-100', 'bg-orange-300': 'bg-orange-100', 'bg-pink-300': 'bg-pink-100',
  };
  return map[colorClass] || 'bg-slate-100';
};

const getOwnerBorderClass = (colorClass) => {
  const map = {
    'bg-sky-300': 'border-sky-300', 'bg-rose-300': 'border-rose-300', 'bg-emerald-300': 'border-emerald-300',
    'bg-purple-300': 'border-purple-300', 'bg-orange-300': 'border-orange-300', 'bg-pink-300': 'border-pink-300',
  };
  return map[colorClass] || 'border-slate-300';
};

const DiceIcon = ({ value, className, style, strokeWidth }) => {
  const val = value || 1;
  if (val === 1) return <Dice1 className={className} style={style} strokeWidth={strokeWidth} />;
  if (val === 2) return <Dice2 className={className} style={style} strokeWidth={strokeWidth} />;
  if (val === 3) return <Dice3 className={className} style={style} strokeWidth={strokeWidth} />;
  if (val === 4) return <Dice4 className={className} style={style} strokeWidth={strokeWidth} />;
  if (val === 5) return <Dice5 className={className} style={style} strokeWidth={strokeWidth} />;
  return <Dice6 className={className} style={style} strokeWidth={strokeWidth} />;
};

const BweiBlock = ({ isFlat, className }) => {
  if (isFlat) {
      return (
        <div className={`relative ${className || ""}`}>
          <div className="w-[32px] h-[75px] bg-[#fb7185] border-[2px] border-[#e11d48] rounded-r-[40px] rounded-l-[6px] shadow-inner drop-shadow-md relative overflow-hidden">
             <div className="absolute top-1 bottom-1 left-1 right-2 bg-[#fda4af] rounded-r-[30px] rounded-l-[4px] opacity-90" />
          </div>
        </div>
      );
  }
  return (
    <div className={`relative ${className || ""}`}>
      <div className="w-[32px] h-[75px] bg-[#be123c] border-[2px] border-[#881337] rounded-r-[40px] rounded-l-[6px] shadow-[inset_-6px_0_10px_rgba(0,0,0,0.5)] drop-shadow-xl relative overflow-hidden">
         <div className="absolute top-2 bottom-2 right-1.5 w-[6px] bg-white/40 rounded-full blur-[2px]" />
         <div className="absolute top-4 bottom-4 right-2.5 w-[2px] bg-white/60 rounded-full blur-[0.5px]" />
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 獨立元件區：大幅減少單一組件的 AST 節點深度
// -------------------------------------------------------------
const PlayerPiece = ({ p, isActive, tX, tY, isMyTurnOnThisCell, activePlayerIndex, myPlayer, gameData, inverseZoom, handleRollDice, setShowAssetManager, isTradeActive }) => {
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
                <div className="whitespace-nowrap px-6 py-3 bg-slate-700 text-white rounded-[2rem] font-black text-xl shadow-lg flex items-center gap-2 animate-pulse border-[3px] border-slate-500">
                  🤖 思考中...
                </div>
              </div>
            </div>
          );
      } else {
          actionBubble = (
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-[200]">
              <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-300" style={{ transform: `scale(${inverseZoom})`, transformOrigin: 'bottom center' }}>
                <button onClick={handleRollDice} className="whitespace-nowrap px-8 py-4 bg-sky-400 hover:bg-sky-300 text-white rounded-[2rem] font-black text-3xl shadow-[0_8px_0_0_#0284c7,0_10px_20px_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-[8px] active:border-b-0 transition-all flex items-center gap-3 border-[4px] border-white animate-bounce">
                  <Dice5 size={32} strokeWidth={3} /> 擲骰子
                </button>
              </div>
            </div>
          );
      }
  }

  let borderClasses = 'border-slate-200 scale-[0.65] grayscale opacity-70 z-10';
  if (isActive) borderClasses = 'border-amber-400 scale-125 z-40 relative';
  
  let cursorClass = '';
  if (p.id === activePlayerIndex && (!myPlayer || !myPlayer.isAI)) {
      cursorClass = 'cursor-pointer hover:ring-[6px] hover:ring-sky-300 hover:scale-[1.4] hover:grayscale-0 hover:opacity-100';
  }

  return (
      <div className={`absolute transition-all duration-500 ease-out pointer-events-auto flex flex-col items-center ${isActive ? 'z-50' : 'z-10'}`} style={{ transform: `translate(${tX}px, ${tY}px)` }}>
          {movingBubble}
          {p.inJail && <div className="absolute -top-6 -right-6 text-4xl animate-pulse drop-shadow-md z-40 bg-white p-1 rounded-full border-2 border-slate-100">🙏</div>}
          
          <div onClick={(e) => { if (p.id === activePlayerIndex && (!myPlayer || !myPlayer.isAI)) { e.stopPropagation(); setShowAssetManager(true); } }} className={`w-20 h-20 bg-white rounded-full border-[6px] flex items-center justify-center text-[3rem] shadow-[0_8px_15px_rgba(0,0,0,0.1)] transition-all duration-500 ${borderClasses} ${cursorClass}`}>
              {p.icon}
              {p.id === activePlayerIndex && !p.isBankrupt && (!myPlayer || !myPlayer.isAI) && (
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 p-1.5 rounded-full shadow-md border-4 border-white z-50 animate-bounce">
                   <Briefcase size={18} strokeWidth={3} />
                </div>
              )}
          </div>
          {actionBubble}
      </div>
  );
};

const BoardSquare = ({ sq, idx, owner, activePlayersHere, gameData, activePlayerIndex, myPlayer, inverseZoom, handleRollDice, setShowAssetManager, setSelectedSquareInfo, isTradeActive, dragStatus }) => {
  const { row, col } = GRID_ORDER[idx];
  const bodyBg = owner ? getOwnerBodyClass(owner.color) : 'bg-white';
  const borderClass = owner ? getOwnerBorderClass(owner.color) : 'border-white';
  const contentClass = `flex-1 flex flex-col items-center justify-center p-2 relative w-full h-full ${bodyBg} z-10`;

  let activePlayerIndexInHere = -1;
  for (let i = 0; i < activePlayersHere.length; i++) {
      if (activePlayersHere[i].id === gameData.currentPlayerIdx) {
          activePlayerIndexInHere = i;
          break;
      }
  }
  const isMyTurnOnThisCell = activePlayerIndexInHere !== -1 && gameData.currentPlayerIdx === activePlayerIndex;

  const playerElements = [];
  let inactiveCount = 0;

  for (let pArrayIdx = 0; pArrayIdx < activePlayersHere.length; pArrayIdx++) {
      const p = activePlayersHere[pArrayIdx];
      const isActive = gameData.currentPlayerIdx === p.id;
      let tX = 0; let tY = 0;
      if (!isActive) {
          let myInactiveIdx = pArrayIdx;
          if (activePlayerIndexInHere !== -1 && pArrayIdx > activePlayerIndexInHere) {
              myInactiveIdx = pArrayIdx - 1;
          }
          const pos = INACTIVE_OFFSETS[myInactiveIdx % INACTIVE_OFFSETS.length];
          tX = pos.x; tY = pos.y;
          inactiveCount++;
      }
      playerElements.push(
          <PlayerPiece key={p.id} p={p} isActive={isActive} tX={tX} tY={tY} isMyTurnOnThisCell={isMyTurnOnThisCell} activePlayerIndex={activePlayerIndex} myPlayer={myPlayer} gameData={gameData} inverseZoom={inverseZoom} handleRollDice={handleRollDice} setShowAssetManager={setShowAssetManager} isTradeActive={isTradeActive} />
      );
  }

  return (
      <div style={{ display: 'contents' }}>
          <div onClick={() => { if (!dragStatus.current.moved) setSelectedSquareInfo(idx); }} className={`rounded-[1.5rem] relative flex flex-col overflow-hidden shadow-sm z-10 border-4 border-b-[8px] cursor-pointer hover:scale-[1.03] transition-transform pointer-events-auto ${borderClass}`} style={{ gridRow: row, gridColumn: col }}>
              {sq.type === 'PROPERTY' && <div className={`h-[20%] min-h-[20%] w-full ${owner ? owner.color : sq.color} border-b-4 border-white/50 z-0 shrink-0`} />}
              <div className={contentClass}>
                  <span className="font-black text-slate-700 text-2xl leading-tight text-center mt-1 drop-shadow-sm">{sq.name}</span>
                  {sq.type === 'START' && <span className="text-emerald-700 font-black text-lg leading-tight mt-1 bg-emerald-100 px-3 py-0.5 rounded-full border-2 border-emerald-300">領 $500</span>}
                  {sq.type === 'TAX' && <span className="text-rose-700 font-black text-lg leading-tight mt-1 bg-rose-100 px-3 py-0.5 rounded-full border-2 border-rose-300">繳 ${sq.amount}</span>}
                  {sq.price && <span className="text-sky-600 font-black text-xl leading-tight mt-1">${sq.price}</span>}
                  {sq.reqTrust > 0 && (
                    <div className="mt-1 bg-amber-50 text-amber-600 text-xs font-black px-2 py-0.5 rounded-full border-2 border-amber-300 flex items-center justify-center gap-1 shadow-sm">
                      <Star size={14} fill="currentColor" /> {sq.reqTrust} 點
                    </div>
                  )}
              </div>
          </div>
          <div className={`flex items-center justify-center relative ${activePlayerIndexInHere !== -1 ? 'z-[100]' : 'z-20 pointer-events-none'}`} style={{ gridRow: row, gridColumn: col }}>
              {playerElements}
          </div>
      </div>
  );
};


// --- 主程式組件 Main ---
export default function App() {
  const [appPhase, setAppPhase] = useState('LANDING'); 
  const [setupMode, setSetupMode] = useState('INIT'); 
  const [setupPlayerCount, setSetupPlayerCount] = useState(4);
  const [setupTimeLimit, setSetupTimeLimit] = useState(600);
  const [setupAvatar, setSetupAvatar] = useState(CHILD_AVATARS[0]);
  const [setupName, setSetupName] = useState('玩家 1');
  const [localNames, setLocalNames] = useState(['玩家 1', '電腦 1', '電腦 2', '電腦 3', '電腦 4', '電腦 5']);
  const [localPlayerTypes, setLocalPlayerTypes] = useState(['HUMAN', 'AI', 'AI', 'AI', 'AI', 'AI']);
  const [localAvatars, setLocalAvatars] = useState([CHILD_AVATARS[0], CHILD_AVATARS[1], CHILD_AVATARS[2], CHILD_AVATARS[3], CHILD_AVATARS[4], CHILD_AVATARS[5]]);
  const [editingLocalPlayer, setEditingLocalPlayer] = useState(0);

  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTopBarOpen, setIsTopBarOpen] = useState(true);
  
  const bgmRef = useRef(null);
  const [bgmStarted, setBgmStarted] = useState(false);

  const [selectedSquareInfo, setSelectedSquareInfo] = useState(null);

  const [gameData, setGameData] = useState({
    players: [], currentPlayerIdx: 0, properties: {},
    gameState: 'IDLE', timeLeft: 0, diceVals: [1, 1], actionMessage: '',
    remainingSteps: 0, bwaBweiResults: [], pendingTrade: null 
  });

  const [displayDice, setDisplayDice] = useState([1, 1]);
  const [showAssetManager, setShowAssetManager] = useState(false); 
  const [sellProcess, setSellProcess] = useState(null); 
  const [localTimeLeft, setLocalTimeLeft] = useState(0); 

  const [zoom, setZoom] = useState(0.85);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 600 });
  const [isFullMapMode, setIsFullMapMode] = useState(false);

  const dragStatus = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0, moved: false });
  const mapRef = useRef(null);

  const MAP_SIZE = 1900; 

  const activePlayerIndex = isOfflineMode ? gameData.currentPlayerIdx : (myPlayerIndex !== null ? myPlayerIndex : 0);
  const myPlayer = gameData.players[activePlayerIndex] || null;
  const currentSquare = myPlayer && myPlayer.pos !== undefined ? BOARD_SQUARES[myPlayer.pos] : null;
  
  const myMoney = Number((myPlayer && myPlayer.money) || 0);
  const myTrust = Number((myPlayer && myPlayer.trust) || 0);
  const reqMoney = Number((currentSquare && currentSquare.price) || 0);
  const reqTrust = Number((currentSquare && currentSquare.reqTrust) || 0);
  
  const wRatio = viewportSize.w / MAP_SIZE;
  const hRatio = viewportSize.h / MAP_SIZE;
  const minRatio = wRatio < hRatio ? wRatio : hRatio;
  const displayZoom = isFullMapMode ? (minRatio * 0.9) : zoom;
  const inverseZoom = 1 / displayZoom; 
  
  const canBuy = Boolean(currentSquare && myMoney >= reqMoney && myTrust >= reqTrust);
  
  const propertiesObj = gameData.properties || {};
  const myProperties = [];
  for (const key in propertiesObj) {
      if (propertiesObj[key] === activePlayerIndex) {
          myProperties.push(Number(key));
      }
  }

  const safeDice = displayDice || [1, 1];
  const pendingBuyerId = gameData.pendingTrade ? gameData.pendingTrade.buyerIdx : -1;
  const isTradeActive = Boolean(gameData.pendingTrade && (isOfflineMode || pendingBuyerId === activePlayerIndex));
  const tradeBuyer = gameData.pendingTrade ? gameData.players[pendingBuyerId] : null;
  const tradeBuyerMoney = tradeBuyer ? Number(tradeBuyer.money || 0) : 0;

  const syncGameData = useCallback(async (updates) => {
    if (isOfflineMode) {
        setGameData(prev => Object.assign({}, prev, updates));
    } else {
        if (!auth.currentUser) return;
        try {
            const roomDoc = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
            await updateDoc(roomDoc, updates);
        } catch (e) { console.error("Sync error", e); }
    }
  }, [isOfflineMode, roomId]);

  useEffect(() => {
    bgmRef.current = new Audio("https://dn721809.ca.archive.org/0/items/md_music_toy_story/13%20-%20Level%209%20-%20Food%20and%20Drink%20-%20Andy%20Blythe%2C%20Marten%20Joustra.mp3");
    bgmRef.current.loop = true;  
    bgmRef.current.volume = 0.1; 
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!bgmRef.current) return;
    if (isMuted) {
      bgmRef.current.pause();
    } else if (bgmStarted) {
      const p = bgmRef.current.play();
      if (p !== undefined) p.catch(() => console.log("Waiting for user interaction"));
    }
  }, [isMuted, bgmStarted]);

  useEffect(() => {
    const handleInteraction = () => {
      if (!bgmStarted) setBgmStarted(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [bgmStarted]);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    const onStart = (e) => {
      dragStatus.current.isDragging = true;
      dragStatus.current.moved = false; 
      dragStatus.current.initX = e.clientX;
      dragStatus.current.initY = e.clientY;
      dragStatus.current.startX = e.clientX - manualOffset.x;
      dragStatus.current.startY = e.clientY - manualOffset.y;
    };
    const onMove = (e) => {
      if (!dragStatus.current.isDragging) return;
      if (Math.abs(e.clientX - dragStatus.current.initX) > 5 || Math.abs(e.clientY - dragStatus.current.initY) > 5) {
         dragStatus.current.moved = true;
      }
      setManualOffset({ 
        x: e.clientX - dragStatus.current.startX, 
        y: e.clientY - dragStatus.current.startY 
      });
    };
    const onEnd = () => { dragStatus.current.isDragging = false; };

    el.addEventListener('pointerdown', onStart);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    return () => {
      el.removeEventListener('pointerdown', onStart);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };
  }, [manualOffset]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setErrorMsg(null);
      } catch (e) {
        if (firebaseConfig.apiKey && (firebaseConfig.apiKey.includes("請貼上") || firebaseConfig.apiKey.includes("填入"))) {
          setErrorMsg("請確認 Firebase API_KEY！(單機模式可忽略)");
        } else {
          setErrorMsg("網路連線失敗，請檢查金鑰。");
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOfflineMode || !user || !roomId || appPhase !== 'GAME') return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameData(data);
        if (data.timeLeft !== -1 && localTimeLeft === 0) {
            setLocalTimeLeft(data.timeLeft);
        }
      }
    }, (error) => {
      console.error("Firestore snapshot error:", error);
    });
  }, [user, roomId, appPhase, isOfflineMode, localTimeLeft]);

  // 修改：將 syncGameData 抽離計時器 setState，並讓計時器更純粹
  useEffect(() => {
    if (appPhase !== 'GAME' || gameData.timeLeft === -1 || gameData.gameState === 'GAME_OVER') return;
    const timer = setInterval(() => {
        setLocalTimeLeft(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [appPhase, gameData.timeLeft, gameData.gameState]);

  useEffect(() => {
    if (appPhase === 'GAME' && localTimeLeft === 0 && gameData.timeLeft !== -1 && gameData.gameState !== 'GAME_OVER') {
        if (isHost || isOfflineMode) {
            syncGameData({ gameState: 'GAME_OVER' });
        }
    }
  }, [localTimeLeft, appPhase, gameData.timeLeft, gameData.gameState, isHost, isOfflineMode, syncGameData]);

  const focusOnCurrentPlayer = useCallback(() => {
    setIsFullMapMode(false);
    const currP = gameData.players[gameData.currentPlayerIdx];
    if (!currP) return;

    const gOrder = GRID_ORDER[currP.pos];
    const CELL_SIZE = MAP_SIZE / 11;
    
    setCameraOffset({ 
      x: viewportSize.w / 2 - ((gOrder.col - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom, 
      y: viewportSize.h * 0.65 - ((gOrder.row - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom 
    });
    setManualOffset({ x: 0, y: 0 }); 
  }, [gameData.players, gameData.currentPlayerIdx, viewportSize, displayZoom]);

  useEffect(() => {
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

  const handleStartLocalGame = async () => {
    playSound('win', isMuted); 
    setIsOfflineMode(true);
    
    const initialPlayers = [];
    for (let i = 0; i < setupPlayerCount; i++) {
      initialPlayers.push({
        id: i, 
        name: (localNames[i] || '').trim() || `玩家 ${i + 1}`,
        icon: localAvatars[i], 
        color: ['bg-sky-300', 'bg-rose-300', 'bg-emerald-300', 'bg-purple-300', 'bg-orange-300', 'bg-pink-300'][i % 6],
        pos: 0, money: BASE_MONEY, trust: BASE_TRUST, 
        inJail: false, jailRoundsLeft: 0, isBankrupt: false,
        uid: `local_player_${i}`, isAI: localPlayerTypes[i] === 'AI'
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

  const handleCreateRoom = async () => {
    if (!user) return;
    playSound('win', isMuted); 
    setIsOfflineMode(false);
    const rStr = Math.random().toString(36);
    const id = rStr.substring(2, 8).toUpperCase();
    
    const initialPlayers = [];
    for (let i = 0; i < setupPlayerCount; i++) {
      initialPlayers.push({
        id: i, 
        name: i === 0 ? ((setupName || '').trim() || '房主') : `玩家 ${i + 1}`,
        icon: i === 0 ? setupAvatar : '⏳', 
        color: ['bg-sky-300', 'bg-rose-300', 'bg-emerald-300', 'bg-purple-300', 'bg-orange-300', 'bg-pink-300'][i % 6],
        pos: 0, money: BASE_MONEY, trust: BASE_TRUST, 
        inJail: false, jailRoundsLeft: 0, isBankrupt: false,
        uid: i === 0 ? user.uid : null 
      });
    }
    
    try {
      const roomDoc = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id);
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

  const handleJoinRoom = async () => {
    if (!user || roomId.length < 4) return;
    playSound('win', isMuted); 
    setIsOfflineMode(false);
    try {
      const roomDoc = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
      const snap = await getDoc(roomDoc);
      if (!snap.exists()) { setErrorMsg("找不到房號！"); return; }
      const data = snap.data();
      
      const existingSlot = data.players.findIndex(p => p.uid === user.uid);
      if (existingSlot !== -1) {
        setMyPlayerIndex(existingSlot);
        setAppPhase('GAME');
        if (data.timeLeft !== -1) setLocalTimeLeft(data.timeLeft);
        return;
      }

      const emptySlot = data.players.findIndex(p => p.uid === null);
      if (emptySlot === -1) { setErrorMsg("房間已滿！"); return; }
      
      const nextPlayers = data.players.map(p => Object.assign({}, p));
      nextPlayers[emptySlot].uid = user.uid;
      nextPlayers[emptySlot].icon = setupAvatar;
      nextPlayers[emptySlot].name = setupName.trim() || `玩家 ${emptySlot + 1}`;
      nextPlayers[emptySlot].inJail = false;
      
      await updateDoc(roomDoc, { players: nextPlayers });
      setMyPlayerIndex(emptySlot); setAppPhase('GAME');
      if (data.timeLeft !== -1) setLocalTimeLeft(data.timeLeft);
    } catch (e) { setErrorMsg("加入失敗。"); }
  };

  const handleRollDice = async () => {
    if (gameData.currentPlayerIdx !== activePlayerIndex) return;
    playSound('roll', isMuted); 
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    await syncGameData({
      diceVals: [d1, d2],
      remainingSteps: d1 + d2,
      gameState: 'ROLLING', 
      actionMessage: ''
    });
  };

  useEffect(() => {
    if (gameData.gameState === 'ROLLING') {
      const interval = setInterval(() => {
        setDisplayDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDisplayDice(gameData.diceVals || [1, 1]);
    }
  }, [gameData.gameState, gameData.diceVals]);

  useEffect(() => {
    if (appPhase !== 'GAME') return;
    if (gameData.gameState === 'ROLLING' && gameData.currentPlayerIdx === activePlayerIndex) {
      const timer = setTimeout(async () => {
        await syncGameData({ gameState: 'MOVING' });
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [gameData.gameState, gameData.currentPlayerIdx, activePlayerIndex, roomId, isOfflineMode, syncGameData, appPhase]);

  useEffect(() => {
    if (appPhase !== 'GAME' || gameData.gameState !== 'MOVING' || gameData.currentPlayerIdx !== activePlayerIndex) return;

    const moveTimer = setTimeout(async () => {
      try {
        const player = gameData.players[activePlayerIndex];
        
        if (gameData.remainingSteps > 0) {
          playSound('move', isMuted); 
          const targetPos = player.pos + 1;
          let newPos = targetPos % 40;
          let newMoney = player.money;
          let msg = gameData.actionMessage || '';
          
          if (newPos === 0 && gameData.remainingSteps > 1) {
            newMoney += 500;
            msg = '✨ 經過起點，領取 $500 零用錢！\n';
          }
          
          const nextPlayers = gameData.players.map(p => Object.assign({}, p));
          nextPlayers[activePlayerIndex].pos = newPos;
          nextPlayers[activePlayerIndex].money = newMoney;

          await syncGameData({
            players: nextPlayers,
            remainingSteps: gameData.remainingSteps - 1,
            actionMessage: msg
          });
        } else {
          await handleLandOnSquare();
        }
      } catch (e) {
        console.error("Move step error", e);
      }
    }, 350);

    return () => clearTimeout(moveTimer);
  }, [gameData.gameState, gameData.remainingSteps, gameData.currentPlayerIdx, activePlayerIndex, isOfflineMode, appPhase, gameData.players, gameData.actionMessage, syncGameData]);

  const handleLandOnSquare = async () => {
    const player = gameData.players[activePlayerIndex];
    const sq = BOARD_SQUARES[player.pos];
    let nextState = 'ACTION';
    let msg = gameData.actionMessage || '';
    
    const nextPlayers = gameData.players.map(p => Object.assign({}, p));
    const currPlayerClone = nextPlayers[activePlayerIndex];

    if (sq.type === 'START') {
      playSound('coin', isMuted); 
      msg += `經過起點領零用錢囉！✨`;
      nextState = 'END_TURN';
    } else if (sq.type === 'TAX') {
      playSound('bad', isMuted); 
      currPlayerClone.money -= sq.amount;
      msg += `💸 繳納 ${sq.name} $${sq.amount}！`;
      nextState = 'END_TURN';
    } else if (sq.type === 'CHANCE_GOOD' || sq.type === 'CHANCE_BAD') {
      const cardPool = sq.type === 'CHANCE_GOOD' ? GOOD_CARDS : BAD_CARDS;
      const cardIdx = Math.floor(Math.random() * cardPool.length);
      const card = cardPool[cardIdx];
      
      msg += `【 ${card.desc} 】\n\n`;
      if (card.goToJail) {
         playSound('bad', isMuted); 
         currPlayerClone.pos = 10;
         currPlayerClone.inJail = true;
         currPlayerClone.jailRoundsLeft = -1; 
         msg += `好好的懺悔反省 🙏\n請誠心擲杯問神明。`;
         nextState = 'JAIL_BWA_BWEI'; 
      } else {
         if (card.effectM > 0 || card.effectT > 0) playSound('win', isMuted); 
         else playSound('bad', isMuted); 
         currPlayerClone.money += card.effectM;
         currPlayerClone.trust += card.effectT;
         msg += `資金 ${card.effectM > 0 ? '+'+card.effectM : card.effectM}\n信用 ${card.effectT > 0 ? '+'+card.effectT : card.effectT}`;
      }
      if (!card.goToJail) nextState = 'END_TURN';
    } else if (sq.type === 'GO_TO_JAIL' || sq.id === 30 || sq.type === 'JAIL' || sq.id === 10) {
      playSound('bad', isMuted); 
      currPlayerClone.pos = 10;
      currPlayerClone.inJail = true;
      currPlayerClone.jailRoundsLeft = -1; 
      msg += `好好的懺悔反省 🙏\n請誠心擲杯問神明。`;
      nextState = 'JAIL_BWA_BWEI'; 
    } else if (sq.type === 'PROPERTY') {
      const ownerId = gameData.properties ? gameData.properties[sq.id] : undefined;
      if (ownerId !== undefined && ownerId !== activePlayerIndex) {
        const owner = nextPlayers[ownerId];
        if (!owner.inJail && !owner.isBankrupt) { 
           playSound('bad', isMuted); 
           const rent = Math.floor(sq.price * 0.4);
           currPlayerClone.money -= rent;
           nextPlayers[ownerId].money += rent;
           msg += `踩到 ${owner.name} 的地盤，\n付過路費 $${rent} 給他吧！`;
        } else {
           playSound('win', isMuted); 
           msg += `幸運！ ${owner.name} ${owner.inJail ? '正在反省' : '已出局'}，免付過路費！ 🎉`;
        }
        nextState = 'END_TURN';
      } else if (ownerId === undefined) {
        playSound('click', isMuted); 
        msg += `來到空地：${sq.name} 🏕️`;
      } else {
        playSound('click', isMuted); 
        msg += `來到自己的 ${sq.name}，\n巡視一下產業！ 😎`;
        nextState = 'END_TURN';
      }
    } else if (sq.type === 'FREE_PARKING') {
      playSound('click', isMuted); 
      msg += `平靜的一回合，\n培養品德心性的好地方 🍵`;
      nextState = 'END_TURN';
    } else {
      playSound('click', isMuted); 
      msg += `在 ${sq.name} 休息一天 💤`;
      nextState = 'END_TURN';
    }

    const bkResult = checkBankruptcy(nextPlayers);
    const bankruptPlayers = bkResult.newPlayers;

    if (bkResult.changed && bankruptPlayers[activePlayerIndex].isBankrupt) {
       playSound('bad', isMuted); 
       msg += `\n\n🚨 哎呀！資金或信用歸零，你出局了！`;
       nextState = 'END_TURN';
    }

    let nextProps = gameData.properties;
    if (bkResult.changed) {
        const bankruptIds = bankruptPlayers.filter(p => p.isBankrupt).map(p => p.id);
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

  const handleThrowBwaBwei = async () => {
    if (gameData.currentPlayerIdx !== activePlayerIndex) return;
    playSound('bwa', isMuted); 
    await syncGameData({ gameState: 'BWA_BWEI_ROLLING' });
  };

  useEffect(() => {
    if (appPhase !== 'GAME') return;
    if (gameData.gameState === 'BWA_BWEI_ROLLING' && gameData.currentPlayerIdx === activePlayerIndex) {
      const timer = setTimeout(async () => {
        const rand = Math.random();
        let res = '';
        if (rand < 0.5) res = 'HOLY'; 
        else if (rand < 0.75) res = 'LAUGH'; 
        else res = 'YIN'; 

        const nextResults = (gameData.bwaBweiResults || []).slice();
        nextResults.push(res);
        await syncGameData({ gameState: 'JAIL_BWA_BWEI', bwaBweiResults: nextResults });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameData.gameState, gameData.currentPlayerIdx, activePlayerIndex, gameData.bwaBweiResults, isOfflineMode, roomId, syncGameData, appPhase]);

  const handleFinishBwaBwei = async () => {
    const nextPlayers = gameData.players.map(p => Object.assign({}, p));
    const currPlayerClone = nextPlayers[activePlayerIndex];
    
    const results = gameData.bwaBweiResults || [];
    const holyCount = results.filter(r => r === 'HOLY').length;
    
    let msg = `總共擲出【 ${holyCount} 次聖杯 】\n`;
    if (holyCount === 3) {
      playSound('win', isMuted); 
      currPlayerClone.jailRoundsLeft = 0;
      currPlayerClone.money -= 500;
      currPlayerClone.inJail = false;
      msg += `✨ 神明原諒你了！(繳交罰款 $500)\n你重獲自由，下回合可正常玩囉！`;
    } else {
      playSound('bad', isMuted); 
      const waitRounds = 3 - holyCount; 
      currPlayerClone.jailRoundsLeft = waitRounds;
      msg += `神明要你繼續反省...\n需在泡泡裡等待 ${waitRounds} 輪。`;
    }
    
    await syncGameData({
      players: nextPlayers,
      gameState: 'END_TURN', 
      actionMessage: msg,
      bwaBweiResults: [] 
    });
  };

  const handleBuyProperty = async () => {
    try {
      const player = gameData.players[activePlayerIndex];
      const sq = BOARD_SQUARES[player.pos];
      
      if (myMoney >= reqMoney && myTrust >= reqTrust) {
        playSound('coin', isMuted); 
        const nextPlayers = gameData.players.map(p => Object.assign({}, p));
        nextPlayers[activePlayerIndex].money -= reqMoney;

        const nextProps = Object.assign({}, gameData.properties);
        nextProps[sq.id] = player.id;

        await syncGameData({
          players: nextPlayers,
          properties: nextProps,
          gameState: 'END_TURN',
          actionMessage: `🎉 成功買下 ${sq.name} 囉！`
        });
      }
    } catch(e) {
      console.error("Buy property error:", e);
    }
  };

  const handleSellToBank = useCallback(async (sqId, price) => {
    playSound('coin', isMuted); 
    const nextPlayers = gameData.players.map(p => Object.assign({}, p));
    nextPlayers[activePlayerIndex].money += price;
    
    const nextProps = Object.assign({}, gameData.properties);
    delete nextProps[sqId];

    await syncGameData({ players: nextPlayers, properties: nextProps });
    setSellProcess(null);
  }, [gameData.players, gameData.properties, activePlayerIndex, isMuted, syncGameData]);

  const initiatePlayerTrade = useCallback(async (sqId, price, buyerIdx) => {
    playSound('click', isMuted);
    await syncGameData({ pendingTrade: { sellerIdx: activePlayerIndex, buyerIdx: buyerIdx, sqId: sqId, price: price } });
    setSellProcess(null);
    setShowAssetManager(false);
  }, [activePlayerIndex, isMuted, syncGameData]);

  const handleRespondTrade = useCallback(async (accept) => {
    if (!gameData.pendingTrade) return;
    const trade = gameData.pendingTrade;
    if (accept) {
        playSound('coin', isMuted);
        const nextPlayers = gameData.players.map(p => Object.assign({}, p));
        nextPlayers[trade.sellerIdx].money += trade.price;
        nextPlayers[trade.buyerIdx].money -= trade.price;
        
        const nextProps = Object.assign({}, gameData.properties);
        nextProps[trade.sqId] = trade.buyerIdx;
        
        await syncGameData({ players: nextPlayers, properties: nextProps, pendingTrade: null });
    } else {
        playSound('click', isMuted);
        await syncGameData({ pendingTrade: null });
    }
  }, [gameData.players, gameData.properties, gameData.pendingTrade, isMuted, syncGameData]);

  const handleMortgageTrust = async () => {
     try {
         const player = gameData.players[activePlayerIndex];
         if (!player || player.trust <= 1) return; 
         playSound('coin', isMuted); 

         const exchangeRate = player.trust >= 10 ? 1000 : 500;
         const nextPlayers = gameData.players.map(p => Object.assign({}, p));
         nextPlayers[activePlayerIndex].trust -= 1;
         nextPlayers[activePlayerIndex].money += exchangeRate;
         await syncGameData({ players: nextPlayers });
     } catch(e) {}
  };

  const handleEndTurn = async () => {
    try {
      playSound('click', isMuted); 
      const nextPlayers = gameData.players.map(p => Object.assign({}, p));
      let nextIdx = gameData.currentPlayerIdx;
      
      let attempts = 0;
      do {
          nextIdx = (nextIdx + 1) % nextPlayers.length;
          attempts++;
      } while ((nextPlayers[nextIdx].isBankrupt || (!isOfflineMode && nextPlayers[nextIdx].uid === null)) && attempts < 10);

      const nextPlayerClone = nextPlayers[nextIdx];
      let nextState = 'IDLE';
      let msg = '';

      if (nextPlayerClone.inJail && nextPlayerClone.jailRoundsLeft > 0) {
          nextPlayerClone.jailRoundsLeft -= 1;
          if (nextPlayerClone.jailRoundsLeft === 0) {
              nextPlayerClone.money -= 500;
              nextPlayerClone.inJail = false;
              msg = `🌟 ${nextPlayerClone.name} 反省期滿，扣除罰金 $500。\n離開反省泡泡，可正常行動囉！`;
          } else {
              nextState = 'END_TURN'; 
              msg = `🔒 ${nextPlayerClone.name} 仍在反省泡泡中...\n(還要等 ${nextPlayerClone.jailRoundsLeft} 輪喔)`;
          }
      }

      const bkResult = checkBankruptcy(nextPlayers);
      const bankruptPlayers = bkResult.newPlayers;

      if (bankruptPlayers[nextIdx].isBankrupt && nextPlayerClone.inJail === false) {
          msg += `\n🚨 資金或信用歸零，宣告破產！`;
          nextState = 'END_TURN';
      }

      const activeCount = bankruptPlayers.filter(p => (isOfflineMode || p.uid !== null)).length;
      const aliveCount = bankruptPlayers.filter(p => (isOfflineMode || p.uid !== null) && !p.isBankrupt).length;
      if (activeCount > 1 && aliveCount <= 1) nextState = 'GAME_OVER';

      let nextProps = gameData.properties;
      if (bkResult.changed) {
          const bankruptIds = bankruptPlayers.filter(p => p.isBankrupt).map(p => p.id);
          nextProps = clearBankruptProperties(gameData.properties, bankruptIds);
      }

      await syncGameData({
        players: bankruptPlayers,
        properties: nextProps,
        currentPlayerIdx: nextIdx,
        gameState: nextState,
        actionMessage: msg
      });
    } catch(e) { console.error("End turn error", e); }
  };

  useEffect(() => {
    if (appPhase !== 'GAME' || !isOfflineMode) return;

    if (gameData.pendingTrade) {
        const buyer = gameData.players[gameData.pendingTrade.buyerIdx];
        if (buyer && buyer.isAI) {
            const tId = setTimeout(() => { handleRespondTrade(buyer.money >= gameData.pendingTrade.price * 1.5); }, 2000);
            return () => clearTimeout(tId);
        }
        return; 
    }

    const currAI = gameData.players[gameData.currentPlayerIdx];
    if (currAI && currAI.isAI) {
        let tId; const { gameState } = gameData;
        if (!currAI.isBankrupt || gameState === 'END_TURN') {
            if (gameState === 'IDLE') { 
                tId = setTimeout(() => { 
                    if (currAI.jailRoundsLeft === -1) { syncGameData({ gameState: 'JAIL_BWA_BWEI', bwaBweiResults: [] }); } else { handleRollDice(); } 
                }, 1200); 
            }
            else if (gameState === 'JAIL_BWA_BWEI') { 
                tId = setTimeout(() => { 
                    if ((gameData.bwaBweiResults || []).length < 3) { handleThrowBwaBwei(); } else { handleFinishBwaBwei(); } 
                }, 1200); 
            }
            else if (gameState === 'ACTION') { 
                tId = setTimeout(() => {
                    const sq = BOARD_SQUARES[currAI.pos];
                    const cB = sq.type === 'PROPERTY' && (!gameData.properties || gameData.properties[sq.id] === undefined) && currAI.money >= sq.price && currAI.trust >= sq.reqTrust;
                    if (cB && Math.random() > 0.2) { handleBuyProperty(); } else { handleEndTurn(); }
                }, 2000); 
            }
            else if (gameState === 'END_TURN') { 
                tId = setTimeout(() => { handleEndTurn(); }, 2000); 
            }
        }
        return () => clearTimeout(tId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData.gameState, gameData.currentPlayerIdx, gameData.bwaBweiResults, gameData.pendingTrade, isOfflineMode, appPhase]);

  // RENDER HELPERS 
  
  const renderBwaBweiList = () => {
      const results = gameData.bwaBweiResults || [];
      const items = [];
      for (let i = 0; i < 3; i++) {
         const res = results[i];
         if (res === 'HOLY') items.push(<div key={i} className="text-emerald-500 font-black text-xl bg-emerald-50 px-4 py-2 rounded-full border-2 border-emerald-200">聖杯 ⭕</div>);
         else if (res === 'LAUGH') items.push(<div key={i} className="text-amber-500 font-black text-xl bg-amber-50 px-4 py-2 rounded-full border-2 border-amber-200">笑杯 💦</div>);
         else if (res === 'YIN') items.push(<div key={i} className="text-slate-500 font-black text-xl bg-slate-50 px-4 py-2 rounded-full border-2 border-slate-200">陰杯 ❌</div>);
         else items.push(<div key={i} className="text-slate-300 font-black text-xl bg-slate-50 px-4 py-2 rounded-full border-2 border-slate-200 border-dashed">等待...</div>);
      }
      return items;
  };

  const handlePlayerCountChange = (num) => setSetupPlayerCount(num);
  const handleTimeLimitChange = (v) => setSetupTimeLimit(v);
  const handleEditingPlayerChange = (i) => setEditingLocalPlayer(i);
  const handleAvatarJoinChange = (avatar) => setSetupAvatar(avatar);

  const renderPlayerCountOptions = () => {
      const opts = [2, 3, 4, 5, 6];
      const result = [];
      for (let i = 0; i < opts.length; i++) {
          const num = opts[i];
          const isActive = setupPlayerCount === num;
          const bgClass = isActive ? 'bg-amber-400 text-amber-900 scale-110 shadow-[0_4px_0_0_#d97706]' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm';
          const btn = <button key={num} onClick={() => handlePlayerCountChange(num)} className={`w-12 h-12 md:w-14 md:h-14 rounded-full text-xl md:text-2xl transition-all border-4 border-white ${bgClass}`}>{num}</button>;
          result.push(btn);
      }
      return result;
  };

  const renderTimeLimitOptions = () => {
      const opts = [ { l: '5 分', v: 300 }, { l: '10 分', v: 600 }, { l: '20 分', v: 1200 }, { l: '不限時', v: -1 } ];
      const result = [];
      for (let i = 0; i < opts.length; i++) {
          const t = opts[i];
          const isActive = setupTimeLimit === t.v;
          const bgClass = isActive ? 'bg-pink-400 text-pink-900 shadow-[0_4px_0_0_#db2777]' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm';
          const btn = <button key={t.v} onClick={() => handleTimeLimitChange(t.v)} className={`px-4 py-2 md:px-5 md:py-3 rounded-[1.5rem] transition-all border-4 border-white text-sm md:text-base ${bgClass}`}>{t.l}</button>;
          result.push(btn);
      }
      return result;
  };

  const renderLocalPlayers = () => {
      const result = [];
      for (let i = 0; i < setupPlayerCount; i++) {
          const isActive = editingLocalPlayer === i;
          const bgClass = isActive ? 'border-amber-400 scale-125 shadow-lg z-10 relative' : 'border-sky-200 opacity-70 hover:opacity-100 hover:scale-110';
          const node = (
            <div key={i} className="flex flex-col items-center gap-1 md:gap-2">
                <button onClick={() => handleEditingPlayerChange(i)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-2xl md:text-3xl flex items-center justify-center bg-white transition-all border-4 ${bgClass}`}>{localAvatars[i]}</button>
                <span className="text-[10px] md:text-xs text-sky-600 bg-white px-2 py-0.5 rounded-full border-2 border-sky-100 max-w-[60px] truncate">{localNames[i]}</span>
            </div>
          );
          result.push(node);
      }
      return result;
  };

  const renderChildAvatarsLocal = () => {
      const targetIdx = editingLocalPlayer < setupPlayerCount ? editingLocalPlayer : 0;
      const result = [];
      for (let i = 0; i < CHILD_AVATARS.length; i++) {
          const avatar = CHILD_AVATARS[i];
          const isActive = localAvatars[targetIdx] === avatar;
          const bgClass = isActive ? 'bg-amber-100 border-4 border-amber-400 scale-110' : 'bg-slate-50 border-2 border-transparent hover:bg-sky-100';
          const node = <button key={avatar} onClick={() => { const nextAvatars = localAvatars.slice(); nextAvatars[targetIdx] = avatar; setLocalAvatars(nextAvatars); }} className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-2xl md:text-3xl flex items-center justify-center transition-all ${bgClass}`}>{avatar}</button>;
          result.push(node);
      }
      return result;
  };

  const renderChildAvatarsJoin = () => {
      const result = [];
      for (let i = 0; i < CHILD_AVATARS.length; i++) {
          const avatar = CHILD_AVATARS[i];
          const isActive = setupAvatar === avatar;
          const bgClass = isActive ? 'border-4 border-amber-400 scale-110 shadow-md' : 'border-2 border-sky-100 hover:bg-sky-100';
          const node = <button key={avatar} onClick={() => handleAvatarJoinChange(avatar)} className={`w-12 h-12 md:w-16 md:h-16 rounded-full text-3xl md:text-4xl flex items-center justify-center bg-white transition-all ${bgClass}`}>{avatar}</button>;
          result.push(node);
      }
      return result;
  };

  const renderTopBarPlayers = () => {
      const result = [];
      for (let i = 0; i < gameData.players.length; i++) {
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

          const node = (
              <div key={p.id} className={`flex items-center gap-3 px-5 py-2.5 rounded-[2.5rem] border-4 shadow-sm h-[75px] shrink-0 transition-all duration-300 ${bgClass} ${grayClass}`}>
                  <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-4xl shadow-sm bg-white border-4 border-slate-100 relative">
                      {p.icon}
                      {p.inJail && !p.isBankrupt && <div className="absolute -top-2 -right-2 text-base animate-bounce drop-shadow-md">🙏</div>}
                  </div>
                  <div className="flex flex-col justify-center min-w-[85px]">
                      <div className="text-[14px] text-slate-500 flex justify-between items-center leading-none mb-1.5"><span className={isCurrent ? "text-amber-700" : "text-slate-600"}>{p.name}</span></div>
                      {statusNode}
                  </div>
              </div>
          );
          result.push(node);
      }
      return result;
  };

  const renderRankedPlayers = () => {
      const ranked = gameData.players.slice().sort((a, b) => b.trust !== a.trust ? b.trust - a.trust : b.money - a.money);
      const result = [];
      for (let i = 0; i < ranked.length; i++) {
          const p = ranked[i];
          const bgClass = i === 0 ? 'bg-amber-50 border-amber-400 shadow-md scale-105 relative z-10' : 'bg-slate-50 border-slate-200';
          const node = (
            <div key={p.id} className={`flex items-center justify-between p-5 mb-4 rounded-[2rem] border-4 ${bgClass}`}>
                {i === 0 && <div className="absolute -top-4 -left-4 text-4xl animate-bounce">👑</div>}
                <div className="flex items-center gap-5">
                    <span className={`font-black text-3xl ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>#{i+1}</span>
                    <div className="text-5xl bg-white p-2 rounded-full shadow-sm border-2 border-slate-100">{p.icon}</div>
                    <span className="font-black text-2xl text-slate-700">{p.name} {p.isBankrupt && <span className="text-sm text-red-400 ml-1">(出局)</span>}</span>
                </div>
                <div className="text-right">
                    <div className="text-amber-500 font-black text-2xl flex items-center justify-end gap-1"><Star size={24} fill="currentColor" /> {p.trust} 點</div>
                    <div className="text-emerald-500 font-black text-lg">💰 ${p.money}</div>
                </div>
            </div>
          );
          result.push(node);
      }
      return result;
  };

  // ------------------------- RENDER SECTIONS -------------------------

  if (appPhase === 'LANDING') {
    return (
      <div className="min-h-screen w-screen bg-[#e0f2fe] flex flex-col items-center justify-center p-4 md:p-6 text-[#4a3424] overflow-x-hidden absolute inset-0 font-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap');
          .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/40 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl animate-pulse delay-700" />
        <h1 className="text-5xl md:text-[4.5rem] font-black mb-4 md:mb-6 text-sky-500 tracking-widest drop-shadow-[0_6px_0_rgba(2,132,199,0.2)] text-center leading-tight">
          大信翁<span className="block text-xl md:text-2xl text-rose-400 mt-1 tracking-normal">糖果泡泡版 🍬</span>
        </h1>
        {errorMsg && <div className="mb-4 bg-rose-100 text-rose-700 p-3 rounded-2xl border-4 border-rose-300 shadow-sm">{errorMsg}</div>}
        <div className={`bg-white/90 backdrop-blur-md border-[6px] border-sky-200 p-6 md:p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full transition-all duration-300 relative z-10 ${setupMode === 'INIT' ? 'max-w-md flex flex-col items-center gap-5' : 'max-w-4xl flex flex-col'}`}>
          {setupMode === 'INIT' && (
            <div className="flex flex-col gap-4 w-full">
              <button onClick={() => setSetupMode('LOCAL')} className="py-4 md:py-5 rounded-[2rem] text-2xl md:text-3xl bg-amber-400 text-amber-900 border-[6px] border-white shadow-[0_6px_0_0_#d97706,0_10px_15px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:bg-amber-300 active:border-b-[0px] active:translate-y-[6px] active:shadow-none transition-all relative overflow-hidden group">
                單機同樂 🎪 <span className="text-sm block font-bold text-amber-800/70 mt-1">大家一起圍著螢幕玩</span>
              </button>
              <div className="flex items-center gap-4 my-1 opacity-40"><div className="flex-1 h-1.5 bg-sky-200 rounded-full" /><span className="font-black text-sky-800 text-sm tracking-widest">線上模式</span><div className="flex-1 h-1.5 bg-sky-200 rounded-full" /></div>
              <button disabled={!user} onClick={() => setSetupMode('CREATE')} className={`py-4 rounded-[2rem] text-xl md:text-2xl border-[5px] border-white shadow-[0_5px_0_0_#0ea5e9,0_8px_10px_rgba(0,0,0,0.1)] hover:-translate-y-1 active:border-b-[0px] active:translate-y-[5px] active:shadow-none transition-all ${!user ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_0_#cbd5e1]' : 'bg-sky-400 text-sky-900 hover:bg-sky-300'}`}>
                {user ? "創建連線房間 🏠" : "雲端連線中..."}
              </button>
              <button disabled={!user} onClick={() => setSetupMode('JOIN')} className={`py-4 rounded-[2rem] text-xl md:text-2xl border-[5px] border-white shadow-[0_5px_0_0_#10b981,0_8px_10px_rgba(0,0,0,0.1)] hover:-translate-y-1 active:border-b-[0px] active:translate-y-[5px] active:shadow-none transition-all ${!user ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_0_#cbd5e1]' : 'bg-emerald-400 text-emerald-900 hover:bg-emerald-300'}`}>
                加入好友房間 🚀
              </button>
            </div>
          )}
          {(setupMode === 'LOCAL' || setupMode === 'CREATE') && (
            <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row w-full gap-6">
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="w-full">
                    <div className="text-center text-sky-700 mb-2 md:mb-3 flex items-center justify-center gap-2 text-lg"><UsersIcon size={20} /> 幾個人一起玩呢？</div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">{renderPlayerCountOptions()}</div>
                  </div>
                  <div className="w-full border-t-[3px] border-dashed border-sky-100" />
                  <div className="w-full">
                    <div className="text-center text-sky-700 mb-2 md:mb-3 flex items-center justify-center gap-2 text-lg"><Clock size={20} /> 玩多久呢？</div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">{renderTimeLimitOptions()}</div>
                  </div>
                </div>
                <div className="flex-[1.2] flex flex-col">
                  {setupMode === 'LOCAL' ? (
                    <div className="w-full bg-sky-50 rounded-[2rem] p-4 md:p-5 border-4 border-white shadow-sm h-full flex flex-col">
                      <div className="text-center text-sky-800 mb-2 md:mb-3 text-base md:text-lg">幫角色取名字＆換頭像吧！👇</div>
                      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-3 md:mb-4">{renderLocalPlayers()}</div>
                      <div className="flex justify-center mt-2 mb-3">
                        <button onClick={() => { const nextTypes = localPlayerTypes.slice(); nextTypes[editingLocalPlayer] = nextTypes[editingLocalPlayer] === 'HUMAN' ? 'AI' : 'HUMAN'; setLocalPlayerTypes(nextTypes); }} className={`px-4 py-1.5 rounded-full border-[3px] text-sm md:text-base font-black transition-all shadow-sm flex items-center gap-1 ${localPlayerTypes[editingLocalPlayer] === 'AI' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-emerald-100 border-emerald-300 text-emerald-700'}`}>
                          {localPlayerTypes[editingLocalPlayer] === 'AI' ? '🤖 電腦控制' : '🧑 玩家控制'}
                        </button>
                      </div>
                      <div className="mb-3 w-full max-w-[200px] mx-auto">
                        <input type="text" value={localNames[editingLocalPlayer]} onChange={e => { const nextNames = localNames.slice(); nextNames[editingLocalPlayer] = e.target.value.substring(0, 6); setLocalNames(nextNames); }} placeholder={`玩家 ${editingLocalPlayer + 1} 名字`} className="w-full bg-white px-3 py-2 rounded-xl text-center text-sm md:text-base font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 max-h-24 md:max-h-32 overflow-y-auto p-2 bg-white rounded-[1.5rem] border-2 border-sky-100 custom-scrollbar mt-auto">
                        {renderChildAvatarsLocal()}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-sky-50 rounded-[2rem] p-5 md:p-6 border-4 border-white shadow-sm h-full flex flex-col justify-center">
                      <div className="text-center text-sky-800 mb-2 md:mb-3 text-lg md:text-xl">你的專屬角色與名字！</div>
                      <div className="mb-4 w-full max-w-[200px] mx-auto">
                        <input type="text" value={setupName} onChange={e => setSetupName(e.target.value.substring(0, 6))} placeholder="輸入你的名字" className="w-full bg-white px-4 py-2.5 rounded-2xl text-center text-lg md:text-xl font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-h-36 md:max-h-48 overflow-y-auto p-2 custom-scrollbar">
                        {renderChildAvatarsJoin()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex w-full gap-3 md:gap-4 mt-2 max-w-lg mx-auto">
                <button onClick={() => setSetupMode('INIT')} className="flex-1 py-3 md:py-4 text-slate-500 bg-white border-4 border-slate-200 rounded-[2rem] hover:bg-slate-50 transition text-lg md:text-xl shadow-sm">返回</button>
                <button onClick={setupMode === 'LOCAL' ? handleStartLocalGame : handleCreateRoom} className="flex-[2] py-3 md:py-4 text-white bg-emerald-400 rounded-[2rem] shadow-[0_5px_0_0_#10b981] hover:-translate-y-1 active:translate-y-[5px] active:shadow-none active:border-b-0 transition-all text-xl md:text-2xl border-[4px] border-white">出發囉！✨</button>
              </div>
            </div>
          )}
          {setupMode === 'JOIN' && (
            <div className="w-full flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row w-full gap-6">
                <div className="flex-1 flex flex-col justify-center gap-5">
                  <div className="w-full">
                    <div className="text-center text-sky-700 mb-3 text-lg md:text-xl">請輸入房間密碼 🔑</div>
                    <input type="text" placeholder="A1B2C3" value={roomId} onChange={e => setRoomId(e.target.value.toUpperCase())} className="w-full bg-white p-4 md:p-5 rounded-[2rem] text-center text-3xl md:text-4xl font-black border-[4px] border-sky-200 focus:border-amber-400 outline-none uppercase tracking-widest text-[#4a3424] shadow-inner" />
                  </div>
                </div>
                <div className="flex-[1.2] flex flex-col">
                  <div className="w-full bg-sky-50 rounded-[2rem] p-5 border-4 border-white shadow-sm h-full flex flex-col justify-center">
                    <div className="text-center text-sky-800 mb-2 md:mb-3 text-lg md:text-xl">你的專屬角色與名字！</div>
                    <div className="mb-4 w-full max-w-[200px] mx-auto">
                      <input type="text" value={setupName} onChange={e => setSetupName(e.target.value.substring(0, 6))} placeholder="輸入你的名字" className="w-full bg-white px-4 py-2.5 rounded-2xl text-center text-lg md:text-xl font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-h-36 overflow-y-auto p-2 custom-scrollbar">
                      {renderChildAvatarsJoin()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full gap-3 md:gap-4 mt-2 max-w-lg mx-auto">
                <button onClick={() => setSetupMode('INIT')} className="flex-1 py-3 md:py-4 text-slate-500 bg-white border-4 border-slate-200 rounded-[2rem] hover:bg-slate-50 transition text-lg md:text-xl shadow-sm">返回</button>
                <button disabled={roomId.length < 4} onClick={handleJoinRoom} className={`flex-[2] py-3 md:py-4 text-white rounded-[2rem] transition-all text-xl md:text-2xl border-[4px] border-white ${roomId.length < 4 ? 'bg-slate-300 border-slate-200' : 'bg-sky-400 shadow-[0_5px_0_0_#0ea5e9] hover:-translate-y-1 active:translate-y-[5px] active:shadow-none active:border-b-0'}`}>加入房間 🚀</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameData.gameState === 'GAME_OVER') {
     return (
        <div className="min-h-screen w-screen bg-[#fff8e7] flex flex-col items-center justify-center p-6 text-[#4a3424] overflow-x-hidden absolute inset-0 font-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
            <PartyPopper size={120} className="text-pink-400 mb-6 animate-bounce drop-shadow-md" />
            <h1 className="text-[5rem] font-black mb-10 text-amber-500 drop-shadow-[0_6px_0_rgba(217,119,6,0.2)]">遊戲結束囉！🎉</h1>
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-[8px] border-amber-200 relative">
                <h2 className="text-3xl font-black mb-8 text-amber-600 border-b-4 border-dashed border-amber-100 pb-6 text-center">🏆 大信翁排行榜 🏆</h2>
                {renderRankedPlayers()}
            </div>
            <button onClick={() => window.location.reload()} className="mt-10 px-10 py-5 bg-sky-400 text-sky-900 rounded-[2.5rem] font-black text-2xl shadow-[0_8px_0_0_#0ea5e9] border-[6px] border-white hover:-translate-y-1 active:translate-y-[8px] active:shadow-none transition-all">再玩一次！</button>
        </div>
     );
  }

  return (
    <div className="h-screen w-screen bg-[#e0f2fe] overflow-hidden relative touch-none select-none font-black text-[#4a3424] flex flex-col" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      
      <div className="absolute top-0 left-0 right-20 z-[150] pointer-events-none">
        <div className={`relative transition-transform duration-500 ease-out ${isTopBarOpen ? 'translate-y-0' : 'translate-y-[-100%]'}`}>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pt-8 pb-6 px-4 md:px-6 pointer-events-auto items-center custom-scrollbar">
            <div className="bg-white text-rose-500 rounded-[2rem] px-6 py-3 flex flex-col items-center justify-center shadow-md h-[75px] shrink-0 border-4 border-rose-200">
              <Timer size={20} className={localTimeLeft < 60 && localTimeLeft > 0 ? "animate-pulse" : ""} /> 
              <span className="text-xl font-black mt-1">{formatTime(localTimeLeft)}</span>
            </div>
            <div className={`bg-white rounded-[2rem] px-6 py-3 flex flex-col items-center justify-center font-black shadow-md h-[75px] shrink-0 border-4 tracking-wider ${isOfflineMode ? 'border-emerald-300 text-emerald-700' : 'border-sky-300 text-sky-700'}`}>
              <div className="text-xs opacity-70">{isOfflineMode ? '模式' : '房號'}</div>
              <div className="text-xl mt-1">{isOfflineMode ? '單機同樂 🎪' : roomId}</div>
            </div>
            <div className="w-1.5 h-10 bg-sky-200/50 mx-2 rounded-full shrink-0" />
            {renderTopBarPlayers()}
          </div>
          
          {/* 收合/展開按鈕 (小舌頭) */}
          <button 
            onClick={() => setIsTopBarOpen(!isTopBarOpen)}
            className="absolute bottom-0 translate-y-full left-6 md:left-8 bg-white/95 backdrop-blur-md text-sky-600 border-[4px] border-t-0 border-white shadow-[0_8px_15px_rgba(0,0,0,0.1)] rounded-b-[1.5rem] px-5 py-2 flex items-center gap-2 hover:bg-sky-50 active:scale-95 transition-all cursor-pointer font-black pointer-events-auto z-50"
          >
            {isTopBarOpen ? (
              <>收起 <ChevronUp size={22} strokeWidth={3} className="text-sky-400" /></>
            ) : (
              <><UsersIcon size={18} strokeWidth={3} /> 玩家名單 <ChevronDown size={22} strokeWidth={3} className="text-sky-400" /></>
            )}
          </button>
        </div>
      </div>

      <div className="absolute right-4 bottom-8 md:right-6 md:bottom-10 flex flex-col items-end z-[150] pointer-events-auto">
        <div className={`flex flex-col items-end gap-3 transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] opacity-100 pb-3 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <button onClick={() => { setZoom(z => Math.min(z + 0.1, 1.5)); setIsMenuOpen(false); }} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-sky-100 flex items-center gap-3 font-black text-sky-600 shadow-lg active:scale-95 transition-all">放大畫面 <ZoomIn size={24} /></button>
          <button onClick={() => { focusOnCurrentPlayer(); setIsMenuOpen(false); }} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-sky-100 flex items-center gap-3 font-black text-sky-600 shadow-lg active:scale-95 transition-all">找回角色 <Target size={24} /></button>
          <button onClick={() => { setZoom(z => Math.max(z - 0.1, 0.4)); setIsMenuOpen(false); }} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-sky-100 flex items-center gap-3 font-black text-sky-600 shadow-lg active:scale-95 transition-all">縮小畫面 <ZoomOut size={24} /></button>
          <button onClick={() => { setIsFullMapMode(!isFullMapMode); setIsMenuOpen(false); }} className={`h-14 px-5 backdrop-blur-md rounded-full border-4 flex items-center gap-3 font-black shadow-lg active:scale-95 transition-all ${isFullMapMode ? 'bg-sky-400 text-white border-white' : 'bg-white/95 text-sky-600 border-sky-100'}`}>{isFullMapMode ? '關閉全覽' : '全覽地圖'}<Menu size={24} /></button>
          <button onClick={() => setIsMuted(!isMuted)} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-amber-100 flex items-center gap-3 font-black text-amber-500 shadow-lg active:scale-95 transition-all">{isMuted ? '開啟音效' : '關閉音效'} {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
          <button onClick={() => { setShowExitConfirm(true); setIsMenuOpen(false); }} className="h-14 px-5 bg-white/95 backdrop-blur-md rounded-full border-4 border-rose-100 flex items-center gap-3 font-black text-rose-500 shadow-lg active:scale-95 transition-all">離開遊戲 <LogOut size={24} /></button>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center border-[5px] transition-all duration-300 transform ${isMenuOpen ? 'bg-sky-400 border-white rotate-90 scale-95 text-white' : 'bg-white/90 backdrop-blur-md border-sky-100 text-sky-500 hover:scale-105 active:scale-95'}`}>
          {isMenuOpen ? <X size={36} strokeWidth={3} /> : <Menu size={36} strokeWidth={3} />}
        </button>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-in zoom-in-95 spin-in-1 border-[8px] border-rose-100">
            <div className="text-rose-500 bg-rose-50 p-6 rounded-full border-4 border-white shadow-inner"><LogOut size={48} className="ml-1" strokeWidth={2.5} /></div>
            <h3 className="text-3xl font-black text-slate-700">要離開遊戲嗎？🥺</h3>
            <p className="text-slate-400 text-center text-lg">離開後目前的進度就不見囉！</p>
            <div className="flex gap-4 w-full mt-4">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xl rounded-[2rem] transition-colors border-4 border-white shadow-sm">按錯了啦</button>
              <button onClick={() => window.location.reload()} className="flex-1 py-4 bg-rose-400 hover:bg-rose-300 text-white text-xl rounded-[2rem] shadow-[0_5px_0_0_#e11d48] active:translate-y-[5px] active:shadow-none transition-all border-4 border-white">確定離開</button>
            </div>
          </div>
        </div>
      )}

      {selectedSquareInfo !== null && (() => {
        const sq = BOARD_SQUARES[selectedSquareInfo];
        const ownerId = gameData.properties ? gameData.properties[sq.id] : undefined;
        let owner = null;
        if (ownerId !== undefined) {
            for (let i = 0; i < gameData.players.length; i++) {
                if (gameData.players[i].id === ownerId) { owner = gameData.players[i]; break; }
            }
        }
        const rentPrice = Math.floor(sq.price * 0.4);

        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedSquareInfo(null)}>
            <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-sky-100 w-full max-w-sm animate-in zoom-in-95 spin-in-1 mx-4 flex flex-col relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedSquareInfo(null)} className="absolute -top-5 -right-5 text-white bg-rose-400 rounded-full p-3 border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"><X size={28} strokeWidth={3} /></button>
              
              <div className={`w-full h-20 rounded-[1.5rem] mb-5 ${sq.color || 'bg-slate-200'} border-4 border-white shadow-sm flex items-center justify-center text-4xl`}>
                {sq.type === 'START' && '✨'}
                {sq.type === 'TAX' && '💸'}
                {sq.type === 'JAIL' && '🙏'}
                {sq.type === 'CHANCE_GOOD' && '🍀'}
                {sq.type === 'CHANCE_BAD' && '⛈️'}
                {sq.type === 'PROPERTY' && '🏠'}
              </div>
              <h2 className="text-3xl font-black text-slate-700 text-center mb-2 drop-shadow-sm">{sq.name}</h2>
              <div className="text-center text-slate-400 mb-6 text-lg">{sq.desc || (sq.type === 'PROPERTY' ? '一塊棒棒的地產 🌟' : '特殊泡泡 🫧')}</div>
              
              {sq.type === 'PROPERTY' && (
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
              )}

              {(sq.type === 'TAX' || sq.type === 'START') && (
                <div className={`flex justify-between items-center p-6 rounded-[2rem] border-4 w-full mt-2 shadow-sm ${sq.type === 'TAX' ? 'bg-rose-100 border-white' : 'bg-emerald-100 border-white'}`}>
                  <span className={`text-2xl ${sq.type === 'TAX' ? 'text-rose-800' : 'text-emerald-800'}`}>{sq.type === 'TAX' ? '要繳交 💸' : '可領取 💰'}</span>
                  <span className={`font-black text-4xl ${sq.type === 'TAX' ? 'text-rose-500' : 'text-emerald-500'}`}>${sq.amount || 500}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {showAssetManager && myPlayer && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto" onClick={() => { setShowAssetManager(false); setSellProcess(null); }}>
          <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-amber-100 w-[92vw] max-w-md relative pt-14 shadow-2xl animate-in zoom-in-95 font-black" onClick={e=>e.stopPropagation()}>
              <button onClick={() => { setShowAssetManager(false); setSellProcess(null); }} className="absolute -top-5 -right-5 text-white bg-rose-400 rounded-full p-3 border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"><X size={28} strokeWidth={3} /></button>

              {!sellProcess ? (
                 <>
                  <div className="flex flex-col items-center border-b-4 border-dashed border-amber-100 pb-4 mb-4">
                      <div className="w-16 h-16 bg-amber-50 rounded-full border-4 border-amber-200 flex items-center justify-center text-4xl mb-2 shadow-inner">💼</div>
                      <h3 className="font-black text-2xl text-amber-700">小金庫與資產</h3>
                      {isOfflineMode && <div className="text-amber-500 text-base mt-1">({myPlayer.name} 的包包)</div>}
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
                      {myProperties.length === 0 ? (
                          <div className="text-center text-slate-300 text-lg py-8 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200">包包裡空空的 🥺</div>
                      ) : (
                          <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                              {myProperties.map(sqId => {
                                  const sq = BOARD_SQUARES[sqId];
                                  if (!sq) return null;
                                  const sellPrice = myPlayer?.trust >= 10 ? sq.price : Math.floor(sq.price * 0.5);
                                  return (
                                      <div key={sqId} className="flex justify-between items-center p-4 bg-sky-50 rounded-[1.5rem] border-4 border-white shadow-sm font-black">
                                          <span className="font-black text-sky-800 text-xl">{sq.name}</span>
                                          <button onClick={() => setSellProcess({ sqId, price: sellPrice })} className="bg-rose-400 hover:bg-rose-300 text-white shadow-[0_4px_0_0_#e11d48] active:translate-y-[4px] active:shadow-none text-xl px-5 py-2 rounded-xl transition-all border-2 border-white font-black">變賣</button>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
                 </>
              ) : (
                 <div className="animate-in slide-in-from-right-4 pt-4 font-black">
                    <button onClick={() => setSellProcess(null)} className="text-sky-500 mb-4 underline font-black">← 返回</button>
                    <h3 className="text-xl font-black text-slate-700 mb-4 text-center">變賣：{BOARD_SQUARES[sellProcess.sqId].name}</h3>
                    <div className="bg-amber-50 p-4 rounded-xl mb-6 text-center border-2 border-amber-200">
                        <div className="text-sm text-slate-500 mb-1">成交價</div>
                        <div className="text-3xl text-amber-600 font-black">${sellProcess.price}</div>
                    </div>
                    <div className="text-xs text-slate-400 mb-3 font-black uppercase tracking-widest">請選擇出售對象：</div>
                    <div className="flex flex-col gap-3">
                       <button onClick={() => handleSellToBank(sellProcess.sqId, sellProcess.price)} className="w-full py-4 bg-indigo-500 text-white rounded-2xl border-4 border-white shadow-md active:scale-95 transition-all font-black">🏦 賣給銀行 (立即領錢)</button>
                       <div className="w-full h-0.5 bg-slate-100 my-1"></div>
                       {gameData.players.filter(p => p.id !== activePlayerIndex && !p.isBankrupt && (isOfflineMode || p.uid !== null)).map(p => (
                          <button key={p.id} onClick={() => initiatePlayerTrade(sellProcess.sqId, sellProcess.price, p.id)} className="w-full py-4 bg-white border-4 border-emerald-100 text-emerald-600 rounded-2xl shadow-sm flex items-center justify-between px-6 active:scale-95 transition-all font-black">
                              <span>🤝 賣給 {p.name}</span><span className="text-4xl">{p.icon}</span>
                          </button>
                       ))}
                    </div>
                 </div>
              )}
          </div>
        </div>
      )}

      {(isTradeActive || (gameData.currentPlayerIdx === activePlayerIndex && myPlayer && !myPlayer.isBankrupt && ['JAIL_BWA_BWEI', 'ACTION', 'END_TURN'].includes(gameData.gameState) && !gameData.pendingTrade)) && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[250] bg-white/98 backdrop-blur-md p-8 rounded-[3rem] border-[8px] border-sky-100 shadow-2xl w-[95vw] max-w-[560px] text-center pointer-events-auto flex flex-col items-center gap-6 animate-in zoom-in-95">
          {isTradeActive ? (
              tradeBuyer?.isAI ? (
                 <div className="flex flex-col items-center gap-4 py-8">
                     <div className="text-6xl animate-bounce mb-4">🤖</div>
                     <h2 className="text-3xl font-black text-slate-700">{tradeBuyer.name} 思考收購中...</h2><p className="text-slate-500 text-lg">請稍候</p>
                 </div>
              ) : (
                 <>
                    <div className="bg-emerald-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-inner"><span className="text-[3rem] drop-shadow-sm">🤝</span></div>
                    <h2 className="text-3xl font-black text-slate-700">🤝 產權購買邀請</h2>
                    <p className="text-xl text-slate-500 leading-relaxed font-black">玩家 <span className="text-amber-600">{gameData.players[gameData.pendingTrade.sellerIdx].name}</span> <br/>想以 <span className="text-emerald-500 font-black">${gameData.pendingTrade.price}</span> 出售 <br/><span className="text-sky-600 font-black">{BOARD_SQUARES[gameData.pendingTrade.sqId].name}</span> 給 <span className="text-emerald-600">{tradeBuyer?.name || ''}</span>！</p>
                    <div className="flex gap-4 w-full">
                       <button onClick={() => handleRespondTrade(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl border-4 border-white shadow-md font-black text-xl active:scale-95 transition-all">婉拒</button>
                       <button disabled={tradeBuyerMoney < gameData.pendingTrade.price} onClick={() => handleRespondTrade(true)} className={`flex-1 py-4 rounded-2xl border-4 border-white shadow-lg font-black text-xl active:translate-y-1 transition-all ${tradeBuyerMoney >= gameData.pendingTrade.price ? 'bg-emerald-400 text-white shadow-[0_6px_0_0_#10b981]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                         {tradeBuyerMoney < gameData.pendingTrade.price ? '資金不足' : '收購！'}
                       </button>
                    </div>
                 </>
              )
          ) : (
              myPlayer?.isAI ? (
                 <div className="flex flex-col items-center gap-4 py-8">
                     <div className="text-6xl animate-bounce mb-4">🤖</div>
                     <h2 className="text-3xl font-black text-slate-700">{myPlayer.name} 行動中...</h2><p className="text-slate-500 text-lg whitespace-pre-line">{gameData.actionMessage || "請稍候"}</p>
                 </div>
              ) : (
                 <>
                   {gameData.gameState === 'JAIL_BWA_BWEI' && (
                     <div className="flex flex-col items-center w-full px-1 md:px-2">
                       <div className="text-2xl font-black text-rose-500 mb-6 bg-rose-50 px-8 py-3 rounded-full border-4 border-white shadow-sm font-black">🚨 靜心房擲杯判定</div>
                       <div className="flex gap-4 mb-8">
                         {renderBwaBweiList()}
                       </div>
                       {(gameData.bwaBweiResults || []).length < 3 ? <button onClick={handleThrowBwaBwei} className="w-full py-5 bg-rose-400 text-white rounded-[2rem] border-4 border-white shadow-lg text-2xl font-black">🙏 擲杯</button> : <button onClick={handleFinishBwaBwei} className="w-full py-5 bg-emerald-400 text-white rounded-[2rem] border-4 border-white shadow-lg text-2xl animate-bounce font-black">✨ 查看結果</button>}
                     </div>
                   )}
                   {gameData.gameState !== 'JAIL_BWA_BWEI' && <div className="text-3xl leading-relaxed whitespace-pre-line px-4 text-slate-700 font-black">{gameData.actionMessage}</div>}
                   <div className="flex flex-col gap-4 w-full mt-4 font-black">
                     {gameData.gameState==='ACTION' && currentSquare?.type==='PROPERTY' && (!gameData.properties || gameData.properties[myPlayer.pos] === undefined) && (
                       <button onClick={canBuy ? handleBuyProperty : undefined} disabled={!canBuy} className={`py-5 rounded-[2rem] border-4 border-white shadow-lg font-black text-2xl transition-all active:scale-95 ${canBuy ? 'bg-sky-400 text-white shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}>🎁 買下這裡！(${currentSquare?.price || 0})</button>
                     )}
                     {(gameData.gameState==='ACTION'||gameData.gameState==='END_TURN') && <button onClick={handleEndTurn} className="py-5 bg-amber-400 text-amber-900 rounded-[2rem] border-4 border-white shadow-lg text-2xl font-black active:translate-y-1 transition-all">✅ 結束回合</button>}
                   </div>
                 </>
              )
          )}
        </div>
      )}

      {gameData.gameState === 'ROLLING' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="flex gap-10 bg-white/80 p-12 rounded-[4rem] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-sky-100 animate-in zoom-in spin-in-3">
            <DiceIcon value={safeDice[0]} className="w-36 h-36 text-sky-400 animate-bounce drop-shadow-md" style={{ animationDelay: '0s' }} strokeWidth={1.5} />
            <DiceIcon value={safeDice[1]} className="w-36 h-36 text-pink-400 animate-bounce drop-shadow-md" style={{ animationDelay: '0.1s' }} strokeWidth={1.5} />
          </div>
        </div>
      )}

      {gameData.gameState === 'BWA_BWEI_ROLLING' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-8 bg-white/90 p-12 rounded-[4rem] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-rose-100 animate-in zoom-in spin-in-3">
            <div className="text-rose-500 font-black text-4xl animate-pulse drop-shadow-sm">🙏 神明請指示...</div>
            <div className="flex gap-12 h-32 items-center justify-center">
              <div className="animate-[bounce_0.4s_infinite_alternate]"><div className="animate-[spin_0.3s_linear_infinite]"><BweiBlock isFlat={false} className="scale-[1.5]" /></div></div>
              <div className="animate-[bounce_0.5s_infinite_alternate-reverse]"><div className="animate-[spin_0.4s_linear_infinite_reverse]"><BweiBlock isFlat={true} className="scale-[1.5] scale-x-[-1]" /></div></div>
            </div>
          </div>
        </div>
      )}

      <div ref={mapRef} className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden z-10">
        <div 
          className="absolute top-0 left-0 origin-top-left transition-transform duration-700 ease-out pointer-events-none" 
          style={{ width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px`, transform: `translate(${cameraOffset.x + manualOffset.x}px, ${cameraOffset.y + manualOffset.y}px) scale(${displayZoom})` }}
        >
          <div className="w-full h-full p-10 bg-[#fff8e7] rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border-[20px] border-[#fde047]" style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)', gap: '10px' }}>
            {BOARD_SQUARES.map((sq, idx) => {
                return (
                    <BoardSquare key={idx} sq={sq} idx={idx} owner={gameData.properties?.[idx] !== undefined ? gameData.players.find(p => p.id === gameData.properties[idx]) : null} activePlayersHere={gameData.players.filter(p => p.pos === idx && p.uid !== null && !p.isBankrupt)} gameData={gameData} activePlayerIndex={activePlayerIndex} myPlayer={myPlayer} inverseZoom={inverseZoom} handleRollDice={handleRollDice} setShowAssetManager={setShowAssetManager} setSelectedSquareInfo={setSelectedSquareInfo} isTradeActive={isTradeActive} dragStatus={dragStatus} />
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}