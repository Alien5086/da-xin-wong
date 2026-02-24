import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
  AlertCircle, RefreshCw, HandCoins, DollarSign, 
  ShieldAlert, ZoomIn, ZoomOut, UserRound, 
  Coins, Map, LocateFixed, Volume2, VolumeX, 
  Music, Users, Play, ChevronRight, Store, 
  Trophy, Timer, Gift, PlusCircle, MinusCircle, LogOut,
  Target, Info, Building2, QrCode, Link2, Copy, Smartphone
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, updateDoc, 
  collection, query, where, getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- 1. 遊戲基礎資料 ---
const BASE_MONEY = 17200; 
const BOARD_SQUARES = [
  { id: 0, name: '起點', type: 'START', desc: '經過得$500' },
  { id: 1, name: '冰店', type: 'PROPERTY', price: 400, reqTrust: 12, color: 'bg-blue-200' },
  { id: 2, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-red-100' },
  { id: 3, name: '飲料店', type: 'PROPERTY', price: 500, reqTrust: 12, color: 'bg-blue-200' },
  { id: 4, name: '班費', type: 'TAX', amount: 200, color: 'bg-gray-200' },
  { id: 5, name: '火車站', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-gray-400' },
  { id: 6, name: '小吃店', type: 'PROPERTY', price: 400, reqTrust: 12, color: 'bg-orange-200' },
  { id: 7, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-green-100' },
  { id: 8, name: '麵包店', type: 'PROPERTY', price: 500, reqTrust: 12, color: 'bg-orange-200' },
  { id: 9, name: '便利商店', type: 'PROPERTY', price: 600, reqTrust: 12, color: 'bg-orange-200' },
  { id: 10, name: '靜心房', type: 'JAIL', desc: '反省懺悔', color: 'bg-slate-300' },
  { id: 11, name: '服飾店', type: 'PROPERTY', price: 700, reqTrust: 12, color: 'bg-pink-200' },
  { id: 12, name: '超級市場', type: 'PROPERTY', price: 700, reqTrust: 12, color: 'bg-pink-200' },
  { id: 13, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-red-100' },
  { id: 14, name: '鞋店', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-pink-200' },
  { id: 15, name: '書局', type: 'PROPERTY', price: 800, reqTrust: 0, color: 'bg-yellow-200' },
  { id: 16, name: '補習班', type: 'PROPERTY', price: 900, reqTrust: 12, color: 'bg-yellow-200' },
  { id: 17, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-green-100' },
  { id: 18, name: '才藝班', type: 'PROPERTY', price: 900, reqTrust: 0, color: 'bg-yellow-200' },
  { id: 19, name: '網咖', type: 'PROPERTY', price: 1600, reqTrust: 10, color: 'bg-purple-300' },
  { id: 20, name: '道育班', type: 'FREE_PARKING', desc: '平安無事', color: 'bg-blue-100' },
  { id: 21, name: '遊樂場', type: 'PROPERTY', price: 1100, reqTrust: 12, color: 'bg-teal-200' },
  { id: 22, name: '博物館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-teal-200' },
  { id: 23, name: '公園', type: 'PROPERTY', price: 1000, reqTrust: 12, color: 'bg-teal-200' },
  { id: 24, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-red-100' },
  { id: 25, name: '美髮店', type: 'PROPERTY', price: 600, reqTrust: 0, color: 'bg-indigo-200' },
  { id: 26, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-green-100' },
  { id: 27, name: '電力公司', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-gray-400' },
  { id: 28, name: '玩具店', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-indigo-200' },
  { id: 29, name: '图書館', type: 'PROPERTY', price: 1500, reqTrust: 12, color: 'bg-indigo-200' },
  { id: 30, name: '進入靜心房', type: 'GO_TO_JAIL', desc: '直接入獄', color: 'bg-slate-400' },
  { id: 31, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-red-100' },
  { id: 32, name: '學校', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-green-300' },
  { id: 33, name: '植物園', type: 'PROPERTY', price: 1400, reqTrust: 12, color: 'bg-green-300' },
  { id: 34, name: '美術館', type: 'PROPERTY', price: 1500, reqTrust: 12, color: 'bg-green-300' },
  { id: 35, name: '科博館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-green-300' },
  { id: 36, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-green-100' },
  { id: 37, name: '孔廟', type: 'PROPERTY', price: 1900, reqTrust: 15, color: 'bg-red-200' },
  { id: 38, name: '學費', type: 'TAX', amount: 500, color: 'bg-gray-200' },
  { id: 39, name: '自來水廠', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-gray-400' },
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

// --- 2. Firebase 配置管理 ---
const firebaseConfig = {
  apiKey: "AIzaSyBNN-5xswc1tq_Y5ymWMVGFldZRfpvsVZM",
  authDomain: "da-xin-wong.firebaseapp.com",
  projectId: "da-xin-wong",
  storageBucket: "da-xin-wong.firebasestorage.app",
  messagingSenderId: "72871979370",
  appId: "1:72871979370:web:97caab1074d5f1e8f9dd13"
 };
};
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 3. 輔助函數 ---
const formatTime = (seconds) => {
  if (seconds === -1) return "不限時";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getOwnerBgColor = (colorClass) => {
  const map = {
    'bg-blue-500': 'bg-blue-300',
    'bg-red-500': 'bg-red-300',
    'bg-green-500': 'bg-green-300',
    'bg-purple-500': 'bg-purple-300',
    'bg-orange-500': 'bg-orange-300',
    'bg-pink-500': 'bg-pink-300',
  };
  return map[colorClass] || 'bg-gray-300';
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
    players: [],
    currentPlayerIdx: 0,
    properties: {},
    gameState: 'IDLE',
    timeLeft: 0,
    diceVals: [1, 1],
    remainingSteps: 0
  });

  const [zoom, setZoom] = useState(0.8);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ 
    w: typeof window !== 'undefined' ? window.innerWidth : 800, 
    h: typeof window !== 'undefined' ? window.innerHeight : 600 
  });
  const [isFullMapMode, setIsFullMapMode] = useState(false);

  const MAP_SIZE = 1600;
  
  // 使用 Ref 追蹤拖拽狀態，避免觸發不必要的渲染
  const dragStatus = useRef({ isDragging: false, startX: 0, startY: 0 });

  // --- 地圖操作函式 (明確定義於組件內，徹底修復 ReferenceError) ---
  const handlePointerDown = (e) => {
    dragStatus.current.isDragging = true;
    dragStatus.current.startX = e.clientX - manualOffset.x;
    dragStatus.current.startY = e.clientY - manualOffset.y;
  };

  const handlePointerMove = (e) => {
    if (!dragStatus.current.isDragging) return;
    const newX = e.clientX - dragStatus.current.startX;
    const newY = e.clientY - dragStatus.current.startY;
    setManualOffset({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    dragStatus.current.isDragging = false;
  };

  // 監聽視窗縮放
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Firebase 邏輯 ---
  useEffect(() => {
    const initAuth = async (retries = 3) => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setErrorMsg(null);
      } catch (e) {
        if (e.message?.includes('blocked') || e.code?.includes('network')) {
          setErrorMsg("連線被阻擋！請關閉 AdBlock 後重新整理。");
        } else if (retries > 0) {
          setTimeout(() => initAuth(retries - 1), 1000);
        } else {
          setErrorMsg("雲端連線失敗。");
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !roomId || appPhase !== 'GAME') return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setGameData(docSnap.data());
    });
  }, [user, roomId, appPhase]);

  const displayZoom = isFullMapMode ? Math.min(viewportSize.w / MAP_SIZE, viewportSize.h / MAP_SIZE) * 0.7 : zoom;
  
  useEffect(() => {
    if (appPhase !== 'GAME' || isFullMapMode) {
      if (isFullMapMode) {
        setCameraOffset({ 
          x: viewportSize.w / 2 - (MAP_SIZE / 2) * displayZoom, 
          y: viewportSize.h / 2 - (MAP_SIZE / 2) * displayZoom 
        });
      }
      return;
    }
    const currP = gameData.players[gameData.currentPlayerIdx];
    if (!currP) return;

    const { row, col } = GRID_ORDER[currP.pos];
    const CELL_SIZE = MAP_SIZE / 11;
    setCameraOffset({ 
      x: viewportSize.w / 2 - ((col - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom, 
      y: viewportSize.h / 2 - ((row - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom 
    });
  }, [gameData.currentPlayerIdx, isFullMapMode, displayZoom, viewportSize, appPhase]);

  const createRoom = async (count) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const players = Array.from({ length: count }).map((_, i) => ({
      id: i,
      name: `玩家 ${i + 1}`,
      icon: CHILD_AVATARS[i],
      color: ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][i],
      pos: 0,
      money: BASE_MONEY,
      uid: i === 0 ? user.uid : null
    }));
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id), {
        players, currentPlayerIdx: 0, gameState: 'IDLE', roomId: id, timeLeft: 600
      });
      setRoomId(id); setIsHost(true); setMyPlayerIndex(0); setAppPhase('GAME');
    } catch (e) { setErrorMsg("建立失敗。"); }
  };

  const joinRoom = async (id) => {
    if (!user || !id) return;
    try {
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) { setErrorMsg("找不到房號！"); return; }
      const data = snap.data();
      const slot = data.players.findIndex(p => p.uid === null);
      if (slot === -1) { setErrorMsg("滿了！"); return; }
      data.players[slot].uid = user.uid;
      await updateDoc(roomRef, { players: data.players });
      setRoomId(id); setMyPlayerIndex(slot); setAppPhase('GAME');
    } catch (e) { setErrorMsg("加入失敗。"); }
  };

  if (appPhase === 'LANDING') {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <Smartphone size={80} className="text-blue-400 mb-4 animate-bounce" />
        <h1 className="text-4xl font-black mb-2">大信翁多人連線</h1>
        <p className="text-slate-400 mb-8 font-bold text-sm">手機連線・穩定發布版</p>
        {errorMsg && <div className="mb-6 bg-red-600/30 p-4 rounded-xl border border-red-500 text-sm font-bold">{errorMsg}</div>}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button disabled={!user} onClick={() => createRoom(4)} className={`py-4 rounded-2xl font-black text-xl shadow-xl transition ${!user ? 'bg-slate-700' : 'bg-blue-600'}`}>{user ? "我要開房間" : "連線中..."}</button>
          <div className="relative flex items-center py-2"><div className="flex-grow border-t border-slate-700"></div><span className="px-3 text-slate-500 text-xs font-bold uppercase">或</span><div className="flex-grow border-t border-slate-700"></div></div>
          <input type="text" placeholder="房號" value={roomId} onChange={e => setRoomId(e.target.value.toUpperCase())} className="bg-slate-800 p-4 rounded-xl text-center text-xl font-bold border-2 border-slate-700" />
          <button disabled={!user || roomId.length < 4} onClick={() => joinRoom(roomId)} className="py-4 rounded-2xl font-black text-xl bg-white text-slate-900">加入遊戲</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen bg-slate-950 overflow-hidden relative touch-none select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 頂部資訊欄 */}
      <div className="bg-white/95 backdrop-blur p-2 flex justify-between items-center z-50 relative border-b-2 border-slate-800">
        <div className="font-black px-3 py-1 bg-slate-900 text-white rounded-lg">房號: {roomId}</div>
        <div className="font-mono font-bold text-lg bg-slate-100 px-4 py-1 rounded-full flex items-center gap-2">
          <Timer size={18} className={gameData.timeLeft < 60 ? "text-red-500 animate-pulse" : "text-slate-600"}/> {formatTime(gameData.timeLeft)}
        </div>
        <button onClick={() => { setIsFullMapMode(!isFullMapMode); setManualOffset({x:0, y:0}); }} className="p-2 bg-slate-200 rounded-lg">
          {isFullMapMode ? <LocateFixed size={20}/> : <Map size={20}/>}
        </button>
      </div>

      {/* 地圖區域 */}
      <div 
        onPointerDown={handlePointerDown}
        className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div 
          className="absolute top-0 left-0 origin-top-left transition-transform duration-700 ease-out" 
          style={{ 
            width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px`, 
            transform: `translate(${cameraOffset.x + manualOffset.x}px, ${cameraOffset.y + manualOffset.y}px) scale(${displayZoom})` 
          }}
        >
          <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-1 p-2 bg-slate-300 rounded-lg">
            {BOARD_SQUARES.map((sq, idx) => {
              const {row, col} = GRID_ORDER[idx];
              const owner = gameData.players.find(p => gameData.properties?.[idx] === p.id);
              const playersHere = gameData.players.filter(p => p.pos === idx);
              return (
                <div key={idx} className={`${owner ? getOwnerBgColor(owner.color) : 'bg-white'} rounded-lg relative border-2 border-slate-400`} style={{ gridRow: row, gridColumn: col }}>
                  <div className="flex flex-col items-center justify-center h-full text-[10px] font-black leading-tight text-center p-0.5">
                    <span className="truncate w-full">{sq.name}</span>
                    {sq.price && <div className="text-blue-700 font-black">${sq.price}</div>}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {playersHere.map((p, pIdx) => (
                      <div key={p.id} className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xl shadow-xl ${p.color} ${gameData.currentPlayerIdx === p.id ? 'z-30 scale-125 ring-4 ring-yellow-400' : 'z-10 opacity-90'}`} style={{ transform: `translate(${pIdx * 4}px, ${pIdx * 4}px)` }}>{p.icon}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 狀態與控制按鈕 */}
      <div className="fixed bottom-6 left-6 bg-slate-900/90 text-white p-4 rounded-3xl border border-white/20 flex items-center gap-4 z-50 shadow-2xl">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner ${gameData.players[myPlayerIndex]?.color || 'bg-slate-700'}`}>{gameData.players[myPlayerIndex]?.icon || '❓'}</div>
        <div>
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">我的錢包</div>
          <div className="text-2xl font-black">${gameData.players[myPlayerIndex]?.money || 0}</div>
        </div>
      </div>

      {gameData.currentPlayerIdx === myPlayerIndex && gameData.gameState === 'IDLE' && (
        <button className="fixed bottom-6 right-6 w-28 h-28 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-2xl shadow-2xl animate-bounce z-50 border-8 border-white active:scale-90 transition-transform flex items-center justify-center text-center">擲骰</button>
      )}
    </div>
  );
}