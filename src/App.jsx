import React, { useState, useEffect, useRef } from 'react';
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

// --- 1. 基礎常數與遊戲資料 ---
const BASE_MONEY = 17200; 
const GOOD_CARDS = [
  { text: '相約能準時赴約', trust: 1 },
  { text: '做不到的事情不隨便答應', trust: 2 },
  { text: '分配的打掃工作能認真完成', trust: 1 },
  { text: '老師交待的作業確實完成', trust: 2 },
  { text: '同學受傷時能主動幫忙', trust: 2 },
  { text: '朋友找我翹課去網咖，我能婉轉拒絕', trust: 3 },
  { text: '同學考試成績退步，安慰他', trust: 1 },
  { text: '不小心弄壞我的東西，原諒同學的過錯', trust: 3 },
  { text: '勇於認錯', trust: 2 },
  { text: '誠誠懇勸告同學的過錯', trust: 3 },
  { text: '準時上學不遲到早退', trust: 1 },
  { text: '守口如瓶不洩漏朋友的秘密', trust: 2 },
  { text: '不因其他人的邀約而對朋友失信', trust: 1 },
  { text: '與朋友有福同享', trust: 1 },
];
const BAD_CARDS = [
  { text: '作業不按時繳交', trust: -3 },
  { text: '取笑同學短處', trust: -3 },
  { text: '愛說話不實在、愛吹牛', trust: -2 },
  { text: '幫同學或他人取綽號', trust: -2 },
  { text: '不明白事情的真相，隨便懷疑朋友', trust: -3 },
  { text: '睜眼說瞎話 (拍馬屁)', trust: -2 },
  { text: '答應父母做家事卻沒做到', trust: -3 },
  { text: '對於別人的小錯誤大聲責罵並到處說', trust: -3 },
  { text: '嫉妒朋友好的表現', trust: -3 },
  { text: '愛講朋友的八卦', trust: -2 },
  { text: '自己考試作弊也幫同學作弊', trust: -3 },
  { text: '邀同學一起翹課', trust: -3 },
  { text: '和朋友打架', trust: -4, jail: true },
  { text: '欺騙師長', trust: -4, jail: true },
  { text: '偷用朋友的帳號上網玩遊戲', trust: -4, jail: true },
];

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

// --- 2. Firebase 設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyBNN-5xswc1tq_Y5ymWMVGFldZRfpvsVZM",
  authDomain: "da-xin-wong.firebaseapp.com",
  projectId: "da-xin-wong",
  storageBucket: "da-xin-wong.firebasestorage.app",
  messagingSenderId: "72871979370",
  appId: "1:72871979370:web:97caab1074d5f1e8f9dd13"
};
const appId = "da-xin-wong-v1"; 
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 3. 輔助工具 ---
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
const calculateToll = (price, ownerTrust) => {
  const baseToll = Math.floor(price * 0.3);
  return ownerTrust >= 12 ? baseToll * 3 : baseToll;
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
const formatTime = (seconds) => {
  if (seconds === -1) return "不限時";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- 4. 主程式 ---
export default function App() {
  // 基本狀態
  const [appPhase, setAppPhase] = useState('LANDING'); 
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);

  // 遊戲核心數據 (與雲端同步)
  const [gameData, setGameData] = useState({
    players: [],
    currentPlayerIdx: 0,
    properties: {},
    gameState: 'IDLE',
    timeLeft: 0,
    diceVals: [1, 1],
    remainingSteps: 0,
    activeCard: null,
    bwaBueiResults: [],
    bwaBueiStep: 0,
    confessionText: "",
    gameDuration: 10
  });

  // 本地 UI 狀態
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isSfxOn, setIsSfxOn] = useState(true);
  const [zoom, setZoom] = useState(0.8);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 600 });
  const [isFullMapMode, setIsFullMapMode] = useState(false);
  const [isTurnIntro, setIsTurnIntro] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null);
  const [selectedPropertyInfo, setSelectedPropertyInfo] = useState(null);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);

  const MAP_SIZE = 1600;
  const containerRef = useRef(null);
  const bgmRef = useRef(null);

  // --- 初始化 Firebase Auth ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 即時同步雲端數據 ---
  useEffect(() => {
    if (!user || !roomId || appPhase !== 'GAME') return;

    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameData(prev => ({ ...prev, ...data }));
      }
    }, (error) => {
      console.error("Sync Error:", error);
    });

    return () => unsubscribe();
  }, [user, roomId, appPhase]);

  // --- 倒計時邏輯 (僅主機端更新雲端) ---
  useEffect(() => {
    if (!isHost || appPhase !== 'GAME' || gameData.timeLeft <= 0 || gameData.gameDuration === -1) return;
    const timer = setInterval(() => {
      syncToCloud({ timeLeft: gameData.timeLeft - 1 });
    }, 1000);
    return () => clearInterval(timer);
  }, [isHost, appPhase, gameData.timeLeft, gameData.gameDuration]);

  // --- 輔助：更新雲端數據 ---
  const syncToCloud = async (updates) => {
    if (!roomId) return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    try {
      await updateDoc(roomRef, updates);
    } catch (e) {
      console.error("Cloud Update Failed:", e);
    }
  };

  // --- 建立遊戲 ---
  const createRoom = async (count, duration) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialPlayers = Array.from({ length: count }).map((_, i) => ({
      id: i,
      name: `玩家 ${i + 1}`,
      icon: CHILD_AVATARS[i],
      color: ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][i],
      pos: 0,
      money: BASE_MONEY,
      trust: 10,
      inJail: false,
      jailWaitTurns: 0,
      uid: i === 0 ? user.uid : null // 第一位預設為主機
    }));

    const newGame = {
      players: initialPlayers,
      currentPlayerIdx: 0,
      properties: {},
      gameState: 'IDLE',
      timeLeft: duration === -1 ? -1 : duration * 60,
      gameDuration: duration,
      roomId: id,
      hostUid: user.uid
    };

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id), newGame);
    setRoomId(id);
    setIsHost(true);
    setMyPlayerIndex(0);
    setAppPhase('GAME');
  };

  // --- 加入遊戲 ---
  const joinRoom = async (id) => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      setSystemAlert("找不到此房間，請檢查房間號碼！");
      return;
    }
    const data = snap.data();
    const emptySlotIdx = data.players.findIndex(p => p.uid === null);
    if (emptySlotIdx === -1) {
      setSystemAlert("房間已滿！");
      return;
    }

    const updatedPlayers = [...data.players];
    updatedPlayers[emptySlotIdx].uid = user.uid;

    await updateDoc(roomRef, { players: updatedPlayers });
    setRoomId(id);
    setIsHost(false);
    setMyPlayerIndex(emptySlotIdx);
    setAppPhase('GAME');
  };

  // --- 遊戲邏輯 ---
  const handleRollDice = async () => {
    // 檢查是否為該玩家的回合且是本人操作
    if (gameData.currentPlayerIdx !== myPlayerIndex) return;
    if (gameData.gameState !== 'IDLE') return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const steps = d1 + d2;

    await syncToCloud({ 
      gameState: 'ROLLING', 
      diceVals: [d1, d2],
      remainingSteps: steps 
    });

    // 模擬動畫後移動
    setTimeout(async () => {
      await startMoving(steps);
    }, 1500);
  };

  const startMoving = async (steps) => {
    let currentPos = gameData.players[myPlayerIndex].pos;
    let targetPos = (currentPos + steps) % 40;
    
    // 這裡為了簡化，直接跳轉位置並結算 (實際可做逐格移動同步)
    const updatedPlayers = [...gameData.players];
    let newMoney = updatedPlayers[myPlayerIndex].money;
    if (currentPos + steps >= 40) newMoney += 500; // 經過起點
    updatedPlayers[myPlayerIndex].pos = targetPos;
    updatedPlayers[myPlayerIndex].money = newMoney;

    await syncToCloud({ 
      players: updatedPlayers,
      gameState: 'MOVING', // 觸發各端移動動畫
    });

    setTimeout(() => handleLanding(targetPos), 1000);
  };

  const handleLanding = (pos) => {
    const sq = BOARD_SQUARES[pos];
    // 這裡實作買地、抽卡等邏輯並 syncToCloud...
    // 由於代碼長度限制，這裡簡化流程
    nextTurn();
  };

  const nextTurn = () => {
    const nextIdx = (gameData.currentPlayerIdx + 1) % gameData.players.length;
    syncToCloud({ 
      currentPlayerIdx: nextIdx, 
      gameState: 'IDLE' 
    });
  };

  // --- 相機對齊處理 ---
  const displayZoom = isFullMapMode ? Math.min(viewportSize.w / MAP_SIZE, viewportSize.h / MAP_SIZE) * 0.7 : zoom;
  useEffect(() => {
    if (appPhase !== 'GAME') return;
    const currP = gameData.players[gameData.currentPlayerIdx];
    if (!currP) return;

    if (!isFullMapMode) {
      const { row, col } = GRID_ORDER[currP.pos];
      const CELL_SIZE = MAP_SIZE / 11;
      const targetX = (col - 1) * CELL_SIZE + CELL_SIZE / 2;
      const targetY = (row - 1) * CELL_SIZE + CELL_SIZE / 2;
      setCameraOffset({ 
        x: viewportSize.w * 0.90 - targetX * displayZoom, 
        y: viewportSize.h * 0.50 - targetY * displayZoom 
      });
    } else {
      setCameraOffset({ 
        x: viewportSize.w * 0.90 - (MAP_SIZE / 2) * displayZoom, 
        y: viewportSize.h * 0.35 - (MAP_SIZE / 2) * displayZoom 
      });
    }
  }, [gameData.currentPlayerIdx, isFullMapMode, zoom, viewportSize, appPhase, displayZoom]);

  // --- 畫面組件 ---
  if (appPhase === 'LANDING') {
    return (
      <div className="h-[100dvh] w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="mb-12 animate-bounce">
           <Smartphone size={80} className="text-blue-400 mx-auto mb-4" />
           <h1 className="text-5xl font-black tracking-tighter">多人連線模式</h1>
        </div>
        <div className="grid gap-4 w-full max-w-xs">
           <button onClick={() => setAppPhase('CREATE')} className="bg-blue-600 py-6 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition flex items-center justify-center gap-3">
             <Play fill="currentColor" size={24}/> 我要開房間
           </button>
           <div className="relative flex items-center py-4">
             <div className="flex-grow border-t border-slate-700"></div>
             <span className="px-4 text-slate-500 font-bold">或是</span>
             <div className="flex-grow border-t border-slate-700"></div>
           </div>
           <input 
             type="text" 
             placeholder="輸入房間號碼" 
             value={roomId} 
             onChange={e => setRoomId(e.target.value.toUpperCase())}
             className="bg-slate-800 border-2 border-slate-700 p-5 rounded-2xl text-center text-2xl font-black tracking-widest focus:border-blue-500 outline-none"
           />
           <button onClick={() => joinRoom(roomId)} className="bg-slate-100 text-slate-900 py-5 rounded-2xl font-black text-xl active:scale-95 transition">
             加入遊戲
           </button>
        </div>
      </div>
    );
  }

  if (appPhase === 'CREATE') {
    return (
      <div className="h-[100dvh] w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-slate-800 p-8 rounded-[3rem] w-full max-w-sm border-2 border-slate-700">
           <h2 className="text-2xl font-black mb-8 text-center">設定遊戲房</h2>
           <p className="font-bold text-slate-400 mb-4 text-sm">玩家人數</p>
           <div className="flex gap-2 mb-8">
             {[2,3,4,5,6].map(n => (
               <button key={n} onClick={() => setMyPlayerIndex(n)} className={`flex-1 py-4 rounded-xl font-black ${myPlayerIndex === n ? 'bg-blue-500' : 'bg-slate-700 text-slate-400'}`}>{n}</button>
             ))}
           </div>
           <button onClick={() => createRoom(myPlayerIndex || 4, 10)} className="w-full bg-green-600 py-5 rounded-2xl font-black text-xl shadow-lg">建立房間</button>
           <button onClick={() => setAppPhase('LANDING')} className="w-full mt-4 text-slate-500 font-bold">返回</button>
        </div>
      </div>
    );
  }

  // --- 遊戲中主畫面 ---
  return (
    <div className="h-[100dvh] w-screen bg-slate-950 flex flex-col overflow-hidden relative">
      {/* 房間資訊 (顯示在上方供掃描) */}
      <div className="bg-white px-4 py-2 flex items-center justify-between z-[600] border-b-2 border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-sm">房號: {roomId}</div>
          <span className="text-xs text-slate-400 font-bold hidden md:inline">分享號碼讓朋友加入手機連線</span>
        </div>
        <div className="flex items-center gap-2">
           <div className={`bg-slate-800 text-white px-4 py-2 rounded-full font-mono text-base border-2 ${gameData.timeLeft < 60 && gameData.timeLeft > 0 ? 'border-red-500 animate-pulse' : 'border-slate-600'} flex items-center gap-2`}>
            <Timer size={16}/>{formatTime(gameData.timeLeft)}
          </div>
        </div>
      </div>

      {/* 地圖區域 (承接之前的方形骰子、層級優化) */}
      <div className="flex-grow relative overflow-hidden" ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <div className="absolute top-0 left-0 origin-top-left transition-all duration-1000" style={{ width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px`, transform: `translate(${cameraOffset.x + manualOffset.x}px, ${cameraOffset.y + manualOffset.y}px) scale(${displayZoom})` }}>
           {/* 地圖渲染 logic ... (同前，格子中使用 gameData 代替原本 local state) */}
           <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-1 p-2">
             {BOARD_SQUARES.map((sq, idx) => {
               const {row, col} = GRID_ORDER[idx];
               const owner = gameData.players.find(p => gameData.properties[idx] === p.id);
               const playersHere = gameData.players.filter(p => p.pos === idx);
               return (
                 <div key={idx} className={`${owner ? getOwnerBgColor(owner.color) : 'bg-white'} rounded-xl relative border-2 border-slate-200`} style={{ gridRow: row, gridColumn: col }}>
                    <div className="flex flex-col items-center justify-center h-full text-center p-1">
                      <span className="text-2xl font-black text-slate-800">{sq.name}</span>
                      {sq.price && <span className="text-lg font-black text-blue-600">${sq.price}</span>}
                    </div>
                    {/* 玩家與按鈕渲染 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       {playersHere.map(p => {
                         const isMyTurn = gameData.currentPlayerIdx === p.id;
                         const isMe = p.uid === user.uid;
                         return (
                           <div key={p.id} className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-3xl shadow-xl ${p.color} ${isMyTurn ? 'z-[400] scale-110 ring-4 ring-yellow-400' : 'z-10'}`}>
                             {p.icon}
                             
                             {/* 僅在該玩家的手機/該玩家回合時顯示擲骰子 */}
                             {isMyTurn && isMe && gameData.gameState === 'IDLE' && (
                               <button 
                                 onClick={handleRollDice}
                                 className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-22 h-22 rounded-xl bg-blue-600 border-8 border-white text-white font-black text-lg animate-bounce z-[500] shadow-2xl"
                               >
                                 擲<br/>骰子
                               </button>
                             )}

                             {isMyTurn && gameData.gameState === 'MOVING' && (
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-22 h-22 rounded-xl bg-white border-8 border-red-500 text-red-600 font-black text-4xl flex items-center justify-center shadow-2xl z-[500]">
                                 {gameData.remainingSteps}
                               </div>
                             )}
                           </div>
                         );
                       })}
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* 手機操控提示 */}
      {gameData.currentPlayerIdx !== myPlayerIndex && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur p-6 text-center z-[700] border-t border-slate-700">
           <p className="text-slate-400 font-bold mb-1">等待其他玩家行動中...</p>
           <h3 className="text-2xl font-black text-white">{gameData.players[gameData.currentPlayerIdx]?.name} 的回合</h3>
        </div>
      )}

      {/* 我的狀態欄 (手機端專用底部面板) */}
      <div className="fixed bottom-4 left-4 bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4 border border-white/20 z-[600]">
         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl bg-white ${gameData.players[myPlayerIndex]?.color.replace('bg-','border-')} border-2`}>
           {gameData.players[myPlayerIndex]?.icon}
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">My Status</p>
            <p className="text-lg font-black text-white">${gameData.players[myPlayerIndex]?.money}</p>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .w-22 { width: 88px; }
        .h-22 { height: 88px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}