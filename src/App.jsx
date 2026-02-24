import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
  AlertCircle, RefreshCw, HandCoins, DollarSign, 
  ShieldAlert, ZoomIn, ZoomOut, UserRound, 
  Coins, Map, LocateFixed, Volume2, VolumeX, 
  Music, Users, Play, ChevronRight, Store, 
  Trophy, Timer, Gift, PlusCircle, MinusCircle, LogOut,
  Target, Info, Building2, QrCode, Link2, Copy, Smartphone, Star
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- 1. 遊戲基礎資料 ---
const BASE_MONEY = 17200; 
const BASE_TRUST = 20;

const BOARD_SQUARES = [
  { id: 0, name: '起點', type: 'START', desc: '經過得$500' },
  { id: 1, name: '冰店', type: 'PROPERTY', price: 400, reqTrust: 12, color: 'bg-blue-400' },
  { id: 2, name: '虛卡', type: 'CHANCE_BAD', desc: '遺失錢包', effectM: -300, effectT: -2, color: 'bg-red-200' },
  { id: 3, name: '飲料店', type: 'PROPERTY', price: 500, reqTrust: 12, color: 'bg-blue-400' },
  { id: 4, name: '班費', type: 'TAX', amount: 200, color: 'bg-gray-300' },
  { id: 5, name: '火車站', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-gray-600' },
  { id: 6, name: '小吃店', type: 'PROPERTY', price: 400, reqTrust: 12, color: 'bg-orange-400' },
  { id: 7, name: '實卡', type: 'CHANCE_GOOD', desc: '扶老奶奶過馬路', effectM: 200, effectT: 3, color: 'bg-green-200' },
  { id: 8, name: '麵包店', type: 'PROPERTY', price: 500, reqTrust: 12, color: 'bg-orange-400' },
  { id: 9, name: '便利商店', type: 'PROPERTY', price: 600, reqTrust: 12, color: 'bg-orange-400' },
  { id: 10, name: '靜心房', type: 'JAIL', desc: '反省懺悔', color: 'bg-slate-300' },
  { id: 11, name: '服飾店', type: 'PROPERTY', price: 700, reqTrust: 12, color: 'bg-pink-400' },
  { id: 12, name: '超級市場', type: 'PROPERTY', price: 700, reqTrust: 12, color: 'bg-pink-400' },
  { id: 13, name: '虛卡', type: 'CHANCE_BAD', desc: '隨地亂丟垃圾', effectM: -200, effectT: -3, color: 'bg-red-200' },
  { id: 14, name: '鞋店', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-pink-400' },
  { id: 15, name: '書局', type: 'PROPERTY', price: 800, reqTrust: 0, color: 'bg-yellow-400' },
  { id: 16, name: '補習班', type: 'PROPERTY', price: 900, reqTrust: 12, color: 'bg-yellow-400' },
  { id: 17, name: '實卡', type: 'CHANCE_GOOD', desc: '考試考一百分', effectM: 500, effectT: 2, color: 'bg-green-200' },
  { id: 18, name: '才藝班', type: 'PROPERTY', price: 900, reqTrust: 0, color: 'bg-yellow-400' },
  { id: 19, name: '網咖', type: 'PROPERTY', price: 1600, reqTrust: 10, color: 'bg-purple-500' },
  { id: 20, name: '道育班', type: 'FREE_PARKING', desc: '平安無事', color: 'bg-blue-200' },
  { id: 21, name: '遊樂場', type: 'PROPERTY', price: 1100, reqTrust: 12, color: 'bg-teal-400' },
  { id: 22, name: '博物館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-teal-400' },
  { id: 23, name: '公園', type: 'PROPERTY', price: 1000, reqTrust: 12, color: 'bg-teal-400' },
  { id: 24, name: '虛卡', type: 'CHANCE_BAD', desc: '打破鄰居玻璃', effectM: -400, effectT: -2, color: 'bg-red-200' },
  { id: 25, name: '美髮店', type: 'PROPERTY', price: 600, reqTrust: 0, color: 'bg-indigo-400' },
  { id: 26, name: '實卡', type: 'CHANCE_GOOD', desc: '拾金不昧', effectM: 300, effectT: 5, color: 'bg-green-200' },
  { id: 27, name: '電力公司', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-gray-600' },
  { id: 28, name: '玩具店', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-indigo-400' },
  { id: 29, name: '图書館', type: 'PROPERTY', price: 1500, reqTrust: 12, color: 'bg-indigo-400' },
  { id: 30, name: '進入靜心房', type: 'GO_TO_JAIL', desc: '直接入獄', color: 'bg-slate-400' },
  { id: 31, name: '虛卡', type: 'CHANCE_BAD', desc: '上課遲到', effectM: -100, effectT: -2, color: 'bg-red-200' },
  { id: 32, name: '學校', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-green-400' },
  { id: 33, name: '植物園', type: 'PROPERTY', price: 1400, reqTrust: 12, color: 'bg-green-400' },
  { id: 34, name: '美術館', type: 'PROPERTY', price: 1500, reqTrust: 12, color: 'bg-green-400' },
  { id: 35, name: '科博館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-green-400' },
  { id: 36, name: '實卡', type: 'CHANCE_GOOD', desc: '當選模範生', effectM: 1000, effectT: 5, color: 'bg-green-200' },
  { id: 37, name: '孔廟', type: 'PROPERTY', price: 1900, reqTrust: 15, color: 'bg-red-400' },
  { id: 38, name: '學費', type: 'TAX', amount: 500, color: 'bg-gray-300' },
  { id: 39, name: '自來水廠', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-gray-600' },
];

const GRID_ORDER = (() => {
  const order = new Array(40).fill(null);
  for (let i = 0; i <= 10; i++) order[i] = { row: 11, col: 11 - i };
  for (let i = 11; i <= 19; i++) order[i] = { row: 11 - (i - 10), col: 1 };
  for (let i = 20; i <= 30; i++) order[i] = { row: 1, col: 1 + (i - 20) };
  for (let i = 31; i <= 39; i++) order[i] = { row: 1 + (i - 30), col: 11 };
  return order;
})();

const CHILD_AVATARS = ['👦', '👧', '👶', '👼', '👲', '👸', '🤴', '🤓', '🤠', '😎', '👻', '👽'];

// =========================================================
// 👇 請將您的 Firebase 金鑰貼在下方的引號 "" 內 👇
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
// =========================================================

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'da-xin-wong-v1';

// --- 3. 輔助函數 ---
const formatTime = (seconds) => {
  if (seconds === -1) return "不限時";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- 4. 主程式組件 ---
export default function App() {
  const [appPhase, setAppPhase] = useState('LANDING'); 
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [gameData, setGameData] = useState({
    players: [], currentPlayerIdx: 0, properties: {},
    gameState: 'IDLE', timeLeft: 0, diceVals: [1, 1], actionMessage: ''
  });

  const [zoom, setZoom] = useState(0.8);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 600 });
  const [isFullMapMode, setIsFullMapMode] = useState(false);

  const dragStatus = useRef({ isDragging: false, startX: 0, startY: 0 });
  const mapRef = useRef(null);
  const MAP_SIZE = 1600;

  // --- 手動地圖拖曳 (防報錯機制) ---
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    function onStart(e) {
      dragStatus.current.isDragging = true;
      dragStatus.current.startX = e.clientX - manualOffset.x;
      dragStatus.current.startY = e.clientY - manualOffset.y;
    }
    function onMove(e) {
      if (!dragStatus.current.isDragging) return;
      setManualOffset({ 
        x: e.clientX - dragStatus.current.startX, 
        y: e.clientY - dragStatus.current.startY 
      });
    }
    function onEnd() { dragStatus.current.isDragging = false; }

    el.addEventListener('pointerdown', onStart);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    return () => {
      el.removeEventListener('pointerdown', onStart);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };
  }, [manualOffset]);

  // --- 視窗縮放 ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // --- Firebase 登入 ---
  useEffect(() => {
    const initAuth = async (retries = 3) => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          if (firebaseConfig.apiKey.includes("請貼上") || firebaseConfig.apiKey.includes("填入")) throw new Error("INVALID_KEY");
          await signInAnonymously(auth);
        }
        setErrorMsg(null);
      } catch (e) {
        if (e.message === "INVALID_KEY") {
          setErrorMsg("請在 App.jsx 填入您真實的 Firebase API_KEY！");
        } else if (retries > 0) {
          setTimeout(() => initAuth(retries - 1), 1500); 
        } else {
          setErrorMsg("網路連線失敗，請檢查金鑰或關閉廣告阻擋器。");
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 監聽房間資料 ---
  useEffect(() => {
    if (!user || !roomId || appPhase !== 'GAME') return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setGameData(docSnap.data());
    });
  }, [user, roomId, appPhase]);

  // --- 對焦與視角跟隨 ---
  const focusOnCurrentPlayer = useCallback(() => {
    setIsFullMapMode(false);
    const currP = gameData.players[gameData.currentPlayerIdx];
    if (!currP) return;

    const displayZoom = zoom;
    const { row, col } = GRID_ORDER[currP.pos];
    const CELL_SIZE = MAP_SIZE / 11;
    setCameraOffset({ 
      x: viewportSize.w / 2 - ((col - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom, 
      y: viewportSize.h / 2 - ((row - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom 
    });
    setManualOffset({ x: 0, y: 0 }); // 重置手動拖曳
  }, [gameData.players, gameData.currentPlayerIdx, viewportSize, zoom]);

  const displayZoom = isFullMapMode ? Math.min(viewportSize.w / MAP_SIZE, viewportSize.h / MAP_SIZE) * 0.9 : zoom;
  
  // 自動跟隨回合切換
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
  }, [gameData.currentPlayerIdx, gameData.players[gameData.currentPlayerIdx]?.pos, isFullMapMode, displayZoom, viewportSize, appPhase, focusOnCurrentPlayer]);

  // --- 房間邏輯 ---
  const createRoom = async (count) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const players = Array.from({ length: count }).map((_, i) => ({
      id: i, name: `玩家 ${i + 1}`, icon: CHILD_AVATARS[i],
      color: ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][i],
      pos: 0, money: BASE_MONEY, trust: BASE_TRUST, uid: i === 0 ? user.uid : null
    }));
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id), {
        players, currentPlayerIdx: 0, gameState: 'IDLE', roomId: id, timeLeft: 600, properties: {}, actionMessage: ''
      });
      setRoomId(id); setIsHost(true); setMyPlayerIndex(0); setAppPhase('GAME');
    } catch (e) { setErrorMsg("建立失敗，請確認 Firebase 設定。"); }
  };

  const joinRoom = async (id) => {
    if (!user || !id) return;
    try {
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) { setErrorMsg("找不到房號！"); return; }
      const data = snap.data();
      const slot = data.players.findIndex(p => p.uid === null);
      if (slot === -1) { setErrorMsg("房間已滿！"); return; }
      data.players[slot].uid = user.uid;
      await updateDoc(roomRef, { players: data.players });
      setRoomId(id); setMyPlayerIndex(slot); setAppPhase('GAME');
    } catch (e) { setErrorMsg("加入失敗。"); }
  };

  // ==========================================
  // 🎲 完整遊戲核心邏輯
  // ==========================================

  const handleRollDice = async () => {
    if (gameData.currentPlayerIdx !== myPlayerIndex) return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const steps = d1 + d2;
    const player = gameData.players[myPlayerIndex];

    let newPos = player.pos + steps;
    let newMoney = player.money;
    let newTrust = player.trust;
    let passedStart = false;

    if (newPos >= 40) {
      newPos = newPos % 40;
      newMoney += 500; 
      passedStart = true;
    }

    const newPlayers = [...gameData.players];
    newPlayers[myPlayerIndex] = { ...player, pos: newPos, money: newMoney, trust: newTrust };
    
    const sq = BOARD_SQUARES[newPos];
    let nextState = 'ACTION';
    let msg = passedStart ? '經過起點，獲得 $500！\n' : '';

    if (sq.type === 'TAX') {
      newPlayers[myPlayerIndex].money -= sq.amount;
      msg += `繳納${sq.name} $${sq.amount}。`;
      nextState = 'END_TURN';
    } else if (sq.type === 'CHANCE_GOOD' || sq.type === 'CHANCE_BAD') {
      newPlayers[myPlayerIndex].money += sq.effectM;
      newPlayers[myPlayerIndex].trust += sq.effectT;
      msg += `抽中卡片：${sq.desc}！\n金錢 ${sq.effectM > 0 ? '+'+sq.effectM : sq.effectM}，信用 ${sq.effectT > 0 ? '+'+sq.effectT : sq.effectT}。`;
      nextState = 'END_TURN';
    } else if (sq.type === 'GO_TO_JAIL') {
      newPlayers[myPlayerIndex].pos = 10;
      msg += `直接進入靜心房反省！`;
      nextState = 'END_TURN';
    } else if (sq.type === 'PROPERTY') {
      const ownerId = gameData.properties[newPos];
      if (ownerId !== undefined && ownerId !== myPlayerIndex) {
        const rent = Math.floor(sq.price * 0.4);
        newPlayers[myPlayerIndex].money -= rent;
        newPlayers[ownerId].money += rent;
        msg += `踩到 ${gameData.players[ownerId].name} 的地盤，支付過路費 $${rent}。`;
        nextState = 'END_TURN';
      } else if (ownerId === undefined) {
        msg += `來到空地：${sq.name}。`;
      } else {
        msg += `來到自己的土地。`;
        nextState = 'END_TURN';
      }
    } else {
      msg += `在 ${sq.name} 休息一天。`;
      nextState = 'END_TURN';
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
      players: newPlayers,
      diceVals: [d1, d2],
      gameState: nextState,
      actionMessage: msg
    });
  };

  const handleBuyProperty = async () => {
    const player = gameData.players[myPlayerIndex];
    const sq = BOARD_SQUARES[player.pos];

    if (player.money >= sq.price && player.trust >= sq.reqTrust) {
      const newPlayers = [...gameData.players];
      newPlayers[myPlayerIndex].money -= sq.price;

      const newProps = { ...gameData.properties, [player.pos]: player.id };

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
        players: newPlayers,
        properties: newProps,
        gameState: 'END_TURN',
        actionMessage: `成功購買 ${sq.name}！`
      });
    }
  };

  const handleEndTurn = async () => {
    const nextIdx = (gameData.currentPlayerIdx + 1) % gameData.players.length;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
      currentPlayerIdx: nextIdx,
      gameState: 'IDLE',
      actionMessage: ''
    });
  };

  // --- 畫面渲染 ---
  if (appPhase === 'LANDING') {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <Smartphone size={80} className="text-blue-400 mb-4 animate-bounce" />
        <h1 className="text-4xl font-black mb-2">大信翁多人連線</h1>
        <p className="text-slate-400 mb-8 font-bold text-sm">經典 UI 完美回歸版</p>
        {errorMsg && <div className="mb-6 bg-red-600/30 p-4 rounded-xl border border-red-500 text-sm font-bold">{errorMsg}</div>}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button disabled={!user} onClick={() => createRoom(4)} className={`py-4 rounded-2xl font-black text-xl shadow-xl transition ${!user ? 'bg-slate-700' : 'bg-blue-600'}`}>
            {user ? "我要開房間" : "連線中..."}
          </button>
          <input type="text" placeholder="房號" value={roomId} onChange={e => setRoomId(e.target.value.toUpperCase())} className="bg-slate-800 p-4 rounded-xl text-center text-xl font-bold border-2 border-slate-700" />
          <button disabled={!user || roomId.length < 4} onClick={() => joinRoom(roomId)} className="py-4 rounded-2xl font-black text-xl bg-white text-slate-900">加入遊戲</button>
        </div>
      </div>
    );
  }

  const currentPlayer = gameData.players[gameData.currentPlayerIdx];
  const myPlayer = gameData.players[myPlayerIndex];
  const currentSquare = myPlayer ? BOARD_SQUARES[myPlayer.pos] : null;

  return (
    <div className="h-screen w-screen bg-[#0a192f] overflow-hidden relative touch-none select-none">
      
      {/* 🌟 完美復刻：頂部玩家儀表板 */}
      <div className="absolute top-4 left-4 right-20 z-50 flex gap-4 overflow-x-auto pb-4 px-2 pointer-events-auto items-center">
        {/* 計時器 */}
        <div className="bg-slate-800 text-white rounded-full px-5 py-2 flex items-center justify-center gap-2 font-mono font-bold shadow-lg h-14 shrink-0 border-2 border-slate-700">
          <Timer size={18} className={gameData.timeLeft < 60 ? "text-red-400 animate-pulse" : "text-slate-300"}/> 
          {formatTime(gameData.timeLeft)}
        </div>
        
        {/* 玩家卡片列表 */}
        {gameData.players.map(p => (
          <div key={p.id} className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 shadow-lg h-14 shrink-0 transition-all duration-300 ${gameData.currentPlayerIdx === p.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-300 bg-white/90 opacity-80'}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xl shadow-sm ${p.color}`}>
              {p.icon}
            </div>
            <div className="flex flex-col justify-center min-w-[80px]">
              <div className="text-[11px] font-bold text-slate-500 flex justify-between items-center leading-tight mb-0.5">
                <span>{p.name}</span>
                {p.uid === user.uid && <span className="text-blue-500 ml-1">(你)</span>}
              </div>
              <div className="flex gap-2 items-baseline leading-none">
                <span className="text-sm font-black text-emerald-600">${p.money}</span>
                <span className="text-[10px] font-bold text-yellow-600 flex items-center gap-0.5"><Star size={10} fill="currentColor"/> {p.trust}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 完美復刻：右側浮動控制列 */}
      <div className="absolute right-4 bottom-1/2 translate-y-1/2 flex flex-col gap-3 z-50 pointer-events-auto">
        <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors border border-slate-200">
          <ZoomIn size={24}/>
        </button>
        <button onClick={focusOnCurrentPlayer} className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors border border-slate-200">
          <Target size={24}/>
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors border border-slate-200">
          <ZoomOut size={24}/>
        </button>
        <button onClick={() => setIsFullMapMode(!isFullMapMode)} className={`w-12 h-12 backdrop-blur rounded-full shadow-xl flex items-center justify-center transition-colors border ${isFullMapMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/90 text-slate-700 hover:bg-slate-50 border-slate-200'}`}>
          <Map size={24}/>
        </button>
      </div>

      {/* 顯示擲骰結果 */}
      {gameData.gameState !== 'IDLE' && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white/95 p-3 px-6 rounded-full shadow-2xl font-black text-2xl flex items-center gap-4 z-50 border-4 border-blue-500 animate-bounce">
          🎲 {gameData.diceVals[0]} + {gameData.diceVals[1]} = {gameData.diceVals[0] + gameData.diceVals[1]} 步
        </div>
      )}

      {/* 地圖區域 */}
      <div ref={mapRef} className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
        <div 
          className="absolute top-0 left-0 origin-top-left transition-transform duration-700 ease-out pointer-events-none" 
          style={{ 
            width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px`, 
            transform: `translate(${cameraOffset.x + manualOffset.x}px, ${cameraOffset.y + manualOffset.y}px) scale(${displayZoom})` 
          }}
        >
          {/* 🌟 完美復刻：棋盤背景與間距 */}
          <div 
            className="w-full h-full p-4 bg-[#c8e6c9] rounded-2xl shadow-2xl border-4 border-[#2e7d32]"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)', gap: '4px' }}
          >
            {BOARD_SQUARES.map((sq, idx) => {
              const {row, col} = GRID_ORDER[idx];
              const owner = gameData.players.find(p => gameData.properties?.[idx] === p.id);
              const playersHere = gameData.players.filter(p => p.pos === idx);
              
              // 🌟 完美復刻：文字方向排版
              const isBottom = idx >= 1 && idx <= 9;
              const isLeft = idx >= 11 && idx <= 19;
              const isTop = idx >= 21 && idx <= 29;
              const isRight = idx >= 31 && idx <= 39;
              
              let contentClass = "flex-1 flex flex-col items-center justify-center p-1 relative z-10 w-full";
              if (isLeft) contentClass += " rotate-90";
              else if (isTop) contentClass += " rotate-180";
              else if (isRight) contentClass += " -rotate-90";

              return (
                // 🌟 完美復刻：厚實的卡片樣式與咖啡色底線
                <div key={idx} className="bg-[#fffdf5] rounded-md relative flex flex-col overflow-hidden shadow-sm" style={{ gridRow: row, gridColumn: col, borderBottom: '5px solid #4a3424', borderRight: '1px solid #dcd3cb', borderLeft: '1px solid #dcd3cb', borderTop: '1px solid #dcd3cb' }}>
                  
                  {/* 土地顏色標籤 */}
                  {sq.type === 'PROPERTY' && (
                    <div className={`h-[25%] w-full ${owner ? getOwnerBgColor(owner.color) : sq.color} border-b border-black/10 z-0`}></div>
                  )}

                  <div className={contentClass}>
                    <span className="font-black text-slate-800 text-[11px] leading-tight text-center">{sq.name}</span>
                    {sq.price && <span className="text-blue-600 font-black text-[10px] leading-tight mt-0.5">${sq.price}</span>}
                    {sq.reqTrust > 0 && (
                      <div className="mt-1 bg-yellow-100 text-yellow-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-yellow-300 flex items-center justify-center gap-0.5 shadow-sm">
                        <Star size={8} fill="currentColor"/> {sq.reqTrust}
                      </div>
                    )}
                  </div>

                  {/* 玩家棋子 */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {playersHere.map((p, pIdx) => (
                      <div key={p.id} className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xl shadow-xl transition-all duration-300 ${p.color} ${gameData.currentPlayerIdx === p.id ? 'z-30 scale-125 ring-4 ring-yellow-400' : 'z-10 opacity-90'}`} style={{ transform: `translate(${pIdx * 4}px, ${pIdx * 4}px)` }}>{p.icon}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🎮 遊戲控制面板 (置中或靠右下) */}
      {gameData.currentPlayerIdx === myPlayerIndex && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 pointer-events-auto">
          
          {/* 狀態 1：還沒擲骰子 */}
          {gameData.gameState === 'IDLE' && (
            <button onClick={handleRollDice} className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-3xl shadow-[0_10px_0_0_#1e3a8a,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_0_#1e3a8a,0_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[10px] transition-all flex items-center gap-3 border-4 border-white animate-bounce">
              <Dice5 size={32} /> 擲骰子
            </button>
          )}

          {/* 狀態 2 & 3：行動階段與結束確認 */}
          {(gameData.gameState === 'ACTION' || gameData.gameState === 'END_TURN') && (
            <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col gap-4 border-4 border-slate-800 min-w-[280px]">
              {gameData.actionMessage.split('\n').map((line, i) => (
                <div key={i} className="font-black text-center text-slate-800 text-lg leading-snug">{line}</div>
              ))}
              
              <div className="border-t-2 border-slate-100 my-1"></div>

              {/* 購買按鈕 */}
              {gameData.gameState === 'ACTION' && currentSquare?.type === 'PROPERTY' && !gameData.properties[myPlayer.pos] && (
                <button 
                  onClick={handleBuyProperty} 
                  disabled={myPlayer.money < currentSquare.price || myPlayer.trust < currentSquare.reqTrust}
                  className={`font-black py-4 px-6 rounded-2xl active:scale-95 transition-transform text-lg ${myPlayer.money >= currentSquare.price && myPlayer.trust >= currentSquare.reqTrust ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}
                >
                  {myPlayer.trust < currentSquare.reqTrust ? `信用不足 (需 ${currentSquare.reqTrust})` : `購買土地 ($${currentSquare.price})`}
                </button>
              )}
              
              <button onClick={handleEndTurn} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 px-6 rounded-2xl active:scale-95 transition-transform shadow-lg text-lg">
                結束回合
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}