import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
  Timer, Target, Volume2, VolumeX, 
  LogOut, Star, Users as UsersIcon, Clock,
  Briefcase, X, PartyPopper, Menu
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

// 🎨 全新糖果色系的地產顏色設定
const BOARD_SQUARES = [
  { id: 0, name: '起點', type: 'START', desc: '經過得$500' },
  { id: 1, name: '冰店', type: 'PROPERTY', price: 400, reqTrust: 12, color: 'bg-sky-300' },
  { id: 2, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 3, name: '飲料店', type: 'PROPERTY', price: 500, reqTrust: 12, color: 'bg-sky-300' },
  { id: 4, name: '班費', type: 'TAX', amount: 200, color: 'bg-slate-200' },
  { id: 5, name: '火車站', type: 'PROPERTY', price: 1800, reqTrust: 15, color: 'bg-slate-300' },
  { id: 6, name: '小吃店', type: 'PROPERTY', price: 400, reqTrust: 12, color: 'bg-orange-300' },
  { id: 7, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 8, name: '麵包店', type: 'PROPERTY', price: 500, reqTrust: 12, color: 'bg-orange-300' },
  { id: 9, name: '便利商店', type: 'PROPERTY', price: 600, reqTrust: 12, color: 'bg-orange-300' },
  { id: 10, name: '靜心房', type: 'JAIL', desc: '反省懺悔', color: 'bg-fuchsia-200' },
  { id: 11, name: '服飾店', type: 'PROPERTY', price: 700, reqTrust: 12, color: 'bg-pink-300' },
  { id: 12, name: '超級市場', type: 'PROPERTY', price: 700, reqTrust: 12, color: 'bg-pink-300' },
  { id: 13, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 14, name: '鞋店', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-pink-300' },
  { id: 15, name: '書局', type: 'PROPERTY', price: 800, reqTrust: 0, color: 'bg-yellow-300' },
  { id: 16, name: '補習班', type: 'PROPERTY', price: 900, reqTrust: 12, color: 'bg-yellow-300' },
  { id: 17, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 18, name: '才藝班', type: 'PROPERTY', price: 900, reqTrust: 0, color: 'bg-yellow-300' },
  { id: 19, name: '網咖', type: 'PROPERTY', price: 1600, reqTrust: 10, color: 'bg-purple-300' },
  { id: 20, name: '道育班', type: 'FREE_PARKING', desc: '平安無事', color: 'bg-teal-200' },
  { id: 21, name: '遊樂場', type: 'PROPERTY', price: 1100, reqTrust: 12, color: 'bg-teal-300' },
  { id: 22, name: '博物館', type: 'PROPERTY', price: 1600, reqTrust: 12, color: 'bg-teal-300' },
  { id: 23, name: '公園', type: 'PROPERTY', price: 1000, reqTrust: 12, color: 'bg-teal-300' },
  { id: 24, name: '虛卡', type: 'CHANCE_BAD', color: 'bg-rose-200' },
  { id: 25, name: '美髮店', type: 'PROPERTY', price: 600, reqTrust: 0, color: 'bg-indigo-300' },
  { id: 26, name: '實卡', type: 'CHANCE_GOOD', color: 'bg-emerald-200' },
  { id: 27, name: '電力公司', type: 'PROPERTY', price: 2000, reqTrust: 15, color: 'bg-slate-300' },
  { id: 28, name: '玩具店', type: 'PROPERTY', price: 700, reqTrust: 0, color: 'bg-indigo-300' },
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

const GRID_ORDER = (() => {
  const order = new Array(40).fill(null);
  for (let i = 0; i <= 10; i++) order[i] = { row: 11, col: 11 - i };
  for (let i = 11; i <= 19; i++) order[i] = { row: 11 - (i - 10), col: 1 };
  for (let i = 20; i <= 30; i++) order[i] = { row: 1, col: 1 + (i - 20) };
  for (let i = 31; i <= 39; i++) order[i] = { row: 1 + (i - 30), col: 11 };
  return order;
})();

const CHILD_AVATARS = ['👦', '👧', '👶', '👼', '👲', '👸', '🤴', '🤓', '🤠', '😎', '👻', '👽', '🤖', '👾', '🦊', '🐼'];

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

// =========================================================

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
  }
};

const formatTime = (seconds) => {
  if (seconds === -1) return "不限時";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getOwnerBodyClass = (colorClass) => {
  const map = {
    'bg-sky-300': 'bg-sky-100',
    'bg-rose-300': 'bg-rose-100',
    'bg-emerald-300': 'bg-emerald-100',
    'bg-purple-300': 'bg-purple-100',
    'bg-orange-300': 'bg-orange-100',
    'bg-pink-300': 'bg-pink-100',
  };
  return map[colorClass] || 'bg-slate-100';
};

const getOwnerBorderClass = (colorClass) => {
  const map = {
    'bg-sky-300': 'border-sky-300',
    'bg-rose-300': 'border-rose-300',
    'bg-emerald-300': 'border-emerald-300',
    'bg-purple-300': 'border-purple-300',
    'bg-orange-300': 'border-orange-300',
    'bg-pink-300': 'border-pink-300',
  };
  return map[colorClass] || 'border-slate-300';
};

const DiceIcon = ({ value, ...props }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[(value || 1) - 1] || Dice1;
  return <Icon {...props} />;
};

// 🌟 擬真 3D 半月筊杯組件
const BweiBlock = ({ isFlat, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {isFlat ? (
        // 陽面 (平的，朝上)：淺紅粉色，內部平整，沒有高光
        <div className="w-[32px] h-[75px] bg-[#fb7185] border-[2px] border-[#e11d48] rounded-r-[40px] rounded-l-[6px] shadow-inner drop-shadow-md relative overflow-hidden">
           <div className="absolute top-1 bottom-1 left-1 right-2 bg-[#fda4af] rounded-r-[30px] rounded-l-[4px] opacity-90"></div>
        </div>
      ) : (
        // 陰面 (凸的，朝上)：深暗紅色，右側圓弧邊帶有暗角陰影與立體反光高光
        <div className="w-[32px] h-[75px] bg-[#be123c] border-[2px] border-[#881337] rounded-r-[40px] rounded-l-[6px] shadow-[inset_-6px_0_10px_rgba(0,0,0,0.5)] drop-shadow-xl relative overflow-hidden">
           <div className="absolute top-2 bottom-2 right-1.5 w-[6px] bg-white/40 rounded-full blur-[2px]"></div>
           <div className="absolute top-4 bottom-4 right-2.5 w-[2px] bg-white/60 rounded-full blur-[0.5px]"></div>
        </div>
      )}
    </div>
  );
};

// --- 主程式組件 ---
export default function App() {
  const [appPhase, setAppPhase] = useState('LANDING'); 
  
  const [setupMode, setSetupMode] = useState('INIT'); 
  const [setupPlayerCount, setSetupPlayerCount] = useState(4);
  const [setupTimeLimit, setSetupTimeLimit] = useState(600);
  const [setupAvatar, setSetupAvatar] = useState(CHILD_AVATARS[0]);
  
  const [setupName, setSetupName] = useState('玩家 1');
  const [localNames, setLocalNames] = useState(['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5', '玩家 6']);

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
  
  const bgmRef = useRef(null);
  const [bgmStarted, setBgmStarted] = useState(false);

  const [selectedSquareInfo, setSelectedSquareInfo] = useState(null);

  const [gameData, setGameData] = useState({
    players: [], currentPlayerIdx: 0, properties: {},
    gameState: 'IDLE', timeLeft: 0, diceVals: [1, 1], actionMessage: '',
    remainingSteps: 0, bwaBweiResults: [] 
  });

  const [displayDice, setDisplayDice] = useState([1, 1]);
  const [showAssetManager, setShowAssetManager] = useState(false); 
  const [localTimeLeft, setLocalTimeLeft] = useState(0); 

  const [zoom, setZoom] = useState(0.85);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 600 });
  const [isFullMapMode, setIsFullMapMode] = useState(false);

  const dragStatus = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0, moved: false });
  const mapRef = useRef(null);
  const MAP_SIZE = 1900; 

  const activePlayerIndex = isOfflineMode ? gameData.currentPlayerIdx : myPlayerIndex;

  const syncGameData = async (updates) => {
    if (isOfflineMode) {
        setGameData(prev => ({ ...prev, ...updates }));
    } else {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), updates);
        } catch (e) { console.error("Sync error", e); }
    }
  };

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
      bgmRef.current.play().catch(() => console.log("等待使用者互動以播放音樂"));
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

  // 🌟 強制性 Auth 初始化流程
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
          setErrorMsg("網路連線失敗，請檢查金鑰或關閉廣告阻擋器。");
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
    });
  }, [user, roomId, appPhase, isOfflineMode, localTimeLeft]);

  useEffect(() => {
    if (appPhase !== 'GAME' || gameData.timeLeft === -1 || gameData.gameState === 'GAME_OVER') return;
    const timer = setInterval(() => {
        setLocalTimeLeft(prev => {
            if (prev <= 1) {
                if ((isHost || isOfflineMode) && gameData.gameState !== 'GAME_OVER') {
                    syncGameData({ gameState: 'GAME_OVER' });
                }
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [appPhase, gameData.timeLeft, gameData.gameState, isHost, isOfflineMode]);

  const focusOnCurrentPlayer = useCallback(() => {
    setIsFullMapMode(false);
    const currP = gameData.players[gameData.currentPlayerIdx];
    if (!currP) return;

    const displayZoom = zoom;
    const { row, col } = GRID_ORDER[currP.pos];
    const CELL_SIZE = MAP_SIZE / 11;
    
    setCameraOffset({ 
      x: viewportSize.w / 2 - ((col - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom, 
      y: viewportSize.h * 0.65 - ((row - 1) * CELL_SIZE + CELL_SIZE / 2) * displayZoom 
    });
    setManualOffset({ x: 0, y: 0 }); 
  }, [gameData.players, gameData.currentPlayerIdx, viewportSize, zoom]);

  const displayZoom = isFullMapMode ? Math.min(viewportSize.w / MAP_SIZE, viewportSize.h / MAP_SIZE) * 0.9 : zoom;
  
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

  const handleStartLocalGame = async () => {
    playSound('win', isMuted); 
    setIsOfflineMode(true);
    const players = Array.from({ length: setupPlayerCount }).map((_, i) => ({
      id: i, 
      name: localNames[i].trim() || `玩家 ${i + 1}`,
      icon: localAvatars[i], 
      color: ['bg-sky-300', 'bg-rose-300', 'bg-emerald-300', 'bg-purple-300', 'bg-orange-300', 'bg-pink-300'][i % 6],
      pos: 0, money: BASE_MONEY, trust: BASE_TRUST, 
      inJail: false, jailRoundsLeft: 0, isBankrupt: false,
      uid: `local_player_${i}`
    }));
    
    setGameData({
      players, currentPlayerIdx: 0, gameState: 'IDLE', roomId: 'LOCAL', timeLeft: setupTimeLimit, properties: {}, actionMessage: '', remainingSteps: 0, diceVals: [1, 1], bwaBweiResults: []
    });
    setRoomId('單機同樂');
    setAppPhase('GAME'); 
    setLocalTimeLeft(setupTimeLimit);
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    playSound('win', isMuted); 
    setIsOfflineMode(false);
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const players = Array.from({ length: setupPlayerCount }).map((_, i) => ({
      id: i, 
      name: i === 0 ? (setupName.trim() || '房主') : `玩家 ${i + 1}`,
      icon: i === 0 ? setupAvatar : '⏳', 
      color: ['bg-sky-300', 'bg-rose-300', 'bg-emerald-300', 'bg-purple-300', 'bg-orange-300', 'bg-pink-300'][i],
      pos: 0, money: BASE_MONEY, trust: BASE_TRUST, 
      inJail: false, jailRoundsLeft: 0, isBankrupt: false,
      uid: i === 0 ? user.uid : null 
    }));
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', id), {
        players, currentPlayerIdx: 0, gameState: 'IDLE', roomId: id, timeLeft: setupTimeLimit, properties: {}, actionMessage: '', remainingSteps: 0, diceVals: [1, 1], bwaBweiResults: []
      });
      setRoomId(id); setIsHost(true); setMyPlayerIndex(0); setAppPhase('GAME'); setLocalTimeLeft(setupTimeLimit);
    } catch (e) { setErrorMsg("建立失敗，請確認 Firebase 設定。"); }
  };

  const handleJoinRoom = async () => {
    if (!user || roomId.length < 4) return;
    playSound('win', isMuted); 
    setIsOfflineMode(false);
    try {
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) { setErrorMsg("找不到房號！"); return; }
      const data = snap.data();
      
      const existingSlot = data.players.findIndex(p => p.uid === user.uid);
      if (existingSlot !== -1) {
        setMyPlayerIndex(existingSlot);
        setAppPhase('GAME');
        if (data.timeLeft !== -1) setLocalTimeLeft(data.timeLeft);
        return;
      }

      const slot = data.players.findIndex(p => p.uid === null);
      if (slot === -1) { setErrorMsg("房間已滿！"); return; }
      
      data.players[slot].uid = user.uid;
      data.players[slot].icon = setupAvatar;
      data.players[slot].name = setupName.trim() || `玩家 ${slot + 1}`;
      data.players[slot].inJail = false; 
      
      await updateDoc(roomRef, { players: data.players });
      setMyPlayerIndex(slot); setAppPhase('GAME');
      if (data.timeLeft !== -1) setLocalTimeLeft(data.timeLeft);
    } catch (e) { setErrorMsg("加入失敗。"); }
  };

  const checkBankruptcy = (players) => {
      let changed = false;
      const newPlayers = players.map(p => {
          if (!p.isBankrupt && (p.money < 0 || p.trust <= 0)) {
              changed = true;
              return { ...p, isBankrupt: true };
          }
          return p;
      });
      return { changed, newPlayers };
  };

  const clearBankruptProperties = (props, bankruptPlayerIds) => {
      const newProps = { ...props };
      Object.keys(newProps).forEach(sqId => {
          if (bankruptPlayerIds.includes(newProps[sqId])) {
              delete newProps[sqId];
          }
      });
      return newProps;
  };

  const handleRollDice = async () => {
    if (gameData.currentPlayerIdx !== activePlayerIndex) return;

    playSound('roll', isMuted); 

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const steps = d1 + d2;

    await syncGameData({
      diceVals: [d1, d2],
      remainingSteps: steps,
      gameState: 'ROLLING', 
      actionMessage: ''
    });
  };

  useEffect(() => {
    if (gameData.gameState === 'ROLLING') {
      const interval = setInterval(() => {
        setDisplayDice([Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1]);
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
  }, [gameData.gameState, gameData.currentPlayerIdx, activePlayerIndex, roomId, isOfflineMode]);

  useEffect(() => {
    if (appPhase !== 'GAME') return;
    if (gameData.gameState !== 'MOVING') return;
    if (gameData.currentPlayerIdx !== activePlayerIndex) return;

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
          
          const newPlayers = [...gameData.players];
          newPlayers[activePlayerIndex] = { ...player, pos: newPos, money: newMoney };

          await syncGameData({
            players: newPlayers,
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
  }, [gameData.gameState, gameData.remainingSteps, gameData.currentPlayerIdx, activePlayerIndex, isOfflineMode]);

  const handleLandOnSquare = async () => {
    const player = gameData.players[activePlayerIndex];
    const sq = BOARD_SQUARES[player.pos];
    let nextState = 'ACTION';
    let msg = gameData.actionMessage || '';
    const newPlayers = [...gameData.players];

    if (sq.type === 'START') {
      playSound('coin', isMuted); 
      msg += `停在起點休息，沒有零用錢喔 😜`;
      nextState = 'END_TURN';
    } else if (sq.type === 'TAX') {
      playSound('bad', isMuted); 
      newPlayers[activePlayerIndex].money -= sq.amount;
      msg += `💸 繳納 ${sq.name} $${sq.amount}！`;
      nextState = 'END_TURN';
    } else if (sq.type === 'CHANCE_GOOD' || sq.type === 'CHANCE_BAD') {
      const cardPool = sq.type === 'CHANCE_GOOD' ? GOOD_CARDS : BAD_CARDS;
      const card = cardPool[Math.floor(Math.random() * cardPool.length)];
      
      msg += `【 ${card.desc} 】\n\n`;
      if (card.goToJail) {
         playSound('bad', isMuted); 
         newPlayers[activePlayerIndex].pos = 10;
         newPlayers[activePlayerIndex].inJail = true;
         newPlayers[activePlayerIndex].jailRoundsLeft = -1; 
         msg += `好好的懺悔反省 🙏\n請誠心擲杯問神明。`;
         nextState = 'JAIL_BWA_BWEI'; 
      } else {
         if (card.effectM > 0 || card.effectT > 0) playSound('win', isMuted); 
         else playSound('bad', isMuted); 
         newPlayers[activePlayerIndex].money += card.effectM;
         newPlayers[activePlayerIndex].trust += card.effectT;
         msg += `資金 ${card.effectM > 0 ? '+'+card.effectM : card.effectM}\n信用 ${card.effectT > 0 ? '+'+card.effectT : card.effectT}`;
      }
      if (!card.goToJail) nextState = 'END_TURN';
    } else if (sq.type === 'GO_TO_JAIL' || sq.id === 30 || sq.type === 'JAIL' || sq.id === 10) {
      playSound('bad', isMuted); 
      newPlayers[activePlayerIndex].pos = 10;
      newPlayers[activePlayerIndex].inJail = true;
      newPlayers[activePlayerIndex].jailRoundsLeft = -1; 
      msg += `好好的懺悔反省 🙏\n請誠心擲杯問神明。`;
      nextState = 'JAIL_BWA_BWEI'; 
    } else if (sq.type === 'PROPERTY') {
      const ownerId = gameData.properties?.[sq.id];
      if (ownerId !== undefined && ownerId !== activePlayerIndex) {
        const owner = newPlayers[ownerId];
        if (!owner.inJail && !owner.isBankrupt) { 
           playSound('bad', isMuted); 
           const rent = Math.floor(sq.price * 0.4);
           newPlayers[activePlayerIndex].money -= rent;
           newPlayers[ownerId].money += rent;
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

    const bankruptCheck = checkBankruptcy(newPlayers);
    if (bankruptCheck.changed && bankruptCheck.newPlayers[activePlayerIndex].isBankrupt) {
       playSound('bad', isMuted); 
       msg += `\n\n🚨 哎呀！資金或信用歸零，你出局了！`;
       nextState = 'END_TURN';
    }

    await syncGameData({
      players: bankruptCheck.newPlayers,
      properties: bankruptCheck.changed ? clearBankruptProperties(gameData.properties, bankruptCheck.newPlayers.filter(p=>p.isBankrupt).map(p=>p.id)) : gameData.properties,
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

        const newResults = [...(gameData.bwaBweiResults || []), res];
        
        await syncGameData({ 
          gameState: 'JAIL_BWA_BWEI',
          bwaBweiResults: newResults
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameData.gameState, gameData.currentPlayerIdx, activePlayerIndex, gameData.bwaBweiResults, isOfflineMode, roomId]);

  const handleFinishBwaBwei = async () => {
    const newPlayers = [...gameData.players];
    const holyCount = (gameData.bwaBweiResults || []).filter(r => r === 'HOLY').length;
    
    let msg = `總共擲出【 ${holyCount} 次聖杯 】\n`;
    if (holyCount === 3) {
      playSound('win', isMuted); 
      newPlayers[activePlayerIndex].jailRoundsLeft = 0;
      newPlayers[activePlayerIndex].money -= 500;
      newPlayers[activePlayerIndex].inJail = false;
      msg += `✨ 神明原諒你了！(繳交罰款 $500)\n你重獲自由，下回合可正常玩囉！`;
    } else {
      playSound('bad', isMuted); 
      const waitRounds = 3 - holyCount; 
      newPlayers[activePlayerIndex].jailRoundsLeft = waitRounds;
      msg += `神明要你繼續反省...\n需在泡泡裡等待 ${waitRounds} 輪。`;
    }
    
    await syncGameData({
      players: newPlayers,
      gameState: 'END_TURN', 
      actionMessage: msg,
      bwaBweiResults: [] 
    });
  };

  const handleBuyProperty = async () => {
    try {
      const player = gameData.players[activePlayerIndex];
      const sq = BOARD_SQUARES[player.pos];
      
      const pMoney = Number(player.money || 0);
      const pTrust = Number(player.trust || 0);
      const reqMoney = Number(sq.price || 0);
      const reqTrust = Number(sq.reqTrust || 0);

      if (pMoney >= reqMoney && pTrust >= reqTrust) {
        playSound('coin', isMuted); 
        const newPlayers = [...gameData.players];
        newPlayers[activePlayerIndex].money -= reqMoney;

        const currentProps = gameData.properties || {};
        const newProps = { ...currentProps, [sq.id]: player.id }; 

        await syncGameData({
          players: newPlayers,
          properties: newProps,
          gameState: 'END_TURN',
          actionMessage: `🎉 成功買下 ${sq.name} 囉！`
        });
      }
    } catch(e) {
      console.error("Buy property error:", e);
    }
  };

  const handleSellProperty = async (sqId) => {
     try {
        const player = gameData.players[activePlayerIndex];
        const sq = BOARD_SQUARES[sqId];
        if (!sq) return;
        
        playSound('coin', isMuted); 

        const isHighTrust = player.trust > 10;
        const sellPrice = isHighTrust ? sq.price : Math.floor(sq.price / 2);

        const newPlayers = [...gameData.players];
        newPlayers[activePlayerIndex].money += sellPrice;

        const newProps = { ...gameData.properties };
        delete newProps[sqId];

        await syncGameData({
            players: newPlayers,
            properties: newProps
        });
     } catch (e) {}
  };

  const handleMortgageTrust = async () => {
     try {
         const player = gameData.players[activePlayerIndex];
         if (player.trust <= 1) return; 
         
         playSound('coin', isMuted); 

         const isHighTrust = player.trust >= 10;
         const exchangeRate = isHighTrust ? 1000 : 500;

         const newPlayers = [...gameData.players];
         newPlayers[activePlayerIndex].trust -= 1;
         newPlayers[activePlayerIndex].money += exchangeRate;

         await syncGameData({
             players: newPlayers
         });
     } catch(e) {}
  };

  const handleEndTurn = async () => {
    try {
      playSound('click', isMuted); 
      let newPlayers = [...gameData.players];
      let nextIdx = gameData.currentPlayerIdx;
      
      let attempts = 0;
      do {
          nextIdx = (nextIdx + 1) % newPlayers.length;
          attempts++;
      } while (newPlayers[nextIdx].isBankrupt && attempts < 10);

      let nextPlayer = newPlayers[nextIdx];
      let nextState = 'IDLE';
      let msg = '';

      if (nextPlayer.inJail && nextPlayer.jailRoundsLeft > 0) {
          nextPlayer.jailRoundsLeft -= 1;
          
          if (nextPlayer.jailRoundsLeft === 0) {
              nextPlayer.money -= 500;
              nextPlayer.inJail = false;
              msg = `🌟 ${nextPlayer.name} 反省期滿，扣除罰金 $500。\n離開反省泡泡，可正常行動囉！`;
          } else {
              nextState = 'END_TURN'; 
              msg = `🔒 ${nextPlayer.name} 仍在反省泡泡中...\n(還要等 ${nextPlayer.jailRoundsLeft} 輪喔)`;
          }
      }

      const bankruptCheck = checkBankruptcy(newPlayers);
      if (bankruptCheck.newPlayers[nextIdx].isBankrupt && nextPlayer.inJail === false) {
          msg += `\n🚨 資金或信用歸零，宣告破產！`;
          nextState = 'END_TURN';
      }

      const joinedPlayers = bankruptCheck.newPlayers.filter(p => (isOfflineMode || p.uid !== null));
      const alivePlayers = joinedPlayers.filter(p => !p.isBankrupt);
      if (joinedPlayers.length > 1 && alivePlayers.length <= 1) {
          nextState = 'GAME_OVER';
      }

      await syncGameData({
        players: bankruptCheck.newPlayers,
        properties: bankruptCheck.changed ? clearBankruptProperties(gameData.properties, bankruptCheck.newPlayers.filter(p=>p.isBankrupt).map(p=>p.id)) : gameData.properties,
        currentPlayerIdx: nextIdx,
        gameState: nextState,
        actionMessage: msg
      });
    } catch(e) { console.error("End turn error", e); }
  };


  if (appPhase === 'LANDING') {
    return (
      <div className="min-h-[100dvh] w-screen bg-[#e0f2fe] flex flex-col items-center justify-center p-4 md:p-6 text-[#4a3424] overflow-x-hidden absolute inset-0 font-black">
        
        {/* 開頭選單專屬的音樂開關按鈕 (右上角) - 放大版 */}
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className={`absolute top-4 right-4 md:top-8 md:right-8 z-[100] w-16 h-16 md:w-20 md:h-20 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center transition-all border-[5px] ${isMuted ? 'bg-slate-300 text-slate-600 border-white' : 'bg-white/90 text-amber-500 hover:scale-110 active:scale-95 border-amber-100'}`}
        >
          {isMuted ? <VolumeX size={44} strokeWidth={3}/> : <Volume2 size={44} strokeWidth={3}/>}
        </button>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
        
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/40 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl animate-pulse delay-700"></div>

        <h1 className="text-5xl md:text-[4.5rem] font-black mb-4 md:mb-6 text-sky-500 tracking-widest drop-shadow-[0_6px_0_rgba(2,132,199,0.2)] text-center leading-tight">
          大信翁
          <span className="block text-xl md:text-2xl text-rose-400 mt-1 tracking-normal">Candy Bubble Edition 🍬</span>
        </h1>
        
        {errorMsg && <div className="mb-4 bg-rose-100 text-rose-700 p-3 rounded-2xl border-4 border-rose-300 shadow-sm">{errorMsg}</div>}
        
        <div className={`bg-white/90 backdrop-blur-md border-[6px] border-sky-200 p-6 md:p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full transition-all duration-300 relative z-10 ${setupMode === 'INIT' ? 'max-w-md flex flex-col items-center gap-5' : 'max-w-4xl flex flex-col'}`}>
          
          {setupMode === 'INIT' && (
            <div className="flex flex-col gap-4 w-full">
              <button onClick={() => setSetupMode('LOCAL')} className="py-4 md:py-5 rounded-[2rem] text-2xl md:text-3xl bg-amber-400 text-amber-900 border-[6px] border-white shadow-[0_6px_0_0_#d97706,0_10px_15px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:bg-amber-300 active:border-b-[0px] active:translate-y-[6px] active:shadow-none transition-all relative overflow-hidden group">
                單機同樂 🎪
                <span className="text-sm block font-bold text-amber-800/70 mt-1">大家一起圍著螢幕玩</span>
              </button>
              
              <div className="flex items-center gap-4 my-1 opacity-40">
                <div className="flex-1 h-1.5 bg-sky-200 rounded-full"></div>
                <span className="font-black text-sky-800 text-sm tracking-widest">線上模式</span>
                <div className="flex-1 h-1.5 bg-sky-200 rounded-full"></div>
              </div>

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
                    <div className="text-center text-sky-700 mb-2 md:mb-3 flex items-center justify-center gap-2 text-lg"><UsersIcon size={20}/> 幾個人一起玩呢？</div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                      {[2, 3, 4, 5, 6].map(num => (
                        <button key={num} onClick={() => setSetupPlayerCount(num)} className={`w-12 h-12 md:w-14 md:h-14 rounded-full text-xl md:text-2xl transition-all border-4 border-white ${setupPlayerCount === num ? 'bg-amber-400 text-amber-900 scale-110 shadow-[0_4px_0_0_#d97706]' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm'}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full border-t-[3px] border-dashed border-sky-100"></div>

                  <div className="w-full">
                    <div className="text-center text-sky-700 mb-2 md:mb-3 flex items-center justify-center gap-2 text-lg"><Clock size={20}/> 玩多久呢？</div>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                      {[{l: '5 分', v: 300}, {l: '10 分', v: 600}, {l: '20 分', v: 1200}, {l: '不限時', v: -1}].map(t => (
                        <button key={t.v} onClick={() => setSetupTimeLimit(t.v)} className={`px-4 py-2 md:px-5 md:py-3 rounded-[1.5rem] transition-all border-4 border-white text-sm md:text-base ${setupTimeLimit === t.v ? 'bg-pink-400 text-pink-900 shadow-[0_4px_0_0_#db2777]' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm'}`}>
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-[1.2] flex flex-col">
                  {setupMode === 'LOCAL' ? (
                    <div className="w-full bg-sky-50 rounded-[2rem] p-4 md:p-5 border-4 border-white shadow-sm h-full flex flex-col">
                      <div className="text-center text-sky-800 mb-2 md:mb-3 text-base md:text-lg">幫角色取名字＆換頭像吧！👇</div>
                      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-3 md:mb-4">
                        {Array.from({ length: setupPlayerCount }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 md:gap-2">
                            <button 
                              onClick={() => setEditingLocalPlayer(i)}
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-2xl md:text-3xl flex items-center justify-center bg-white transition-all border-4 ${editingLocalPlayer === i ? 'border-amber-400 scale-125 shadow-lg z-10 relative' : 'border-sky-200 opacity-70 hover:opacity-100 hover:scale-110'}`}
                            >
                              {localAvatars[i]}
                            </button>
                            <span className="text-[10px] md:text-xs text-sky-600 bg-white px-2 py-0.5 rounded-full border-2 border-sky-100 max-w-[60px] truncate">{localNames[i]}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mb-3 w-full max-w-[200px] mx-auto">
                        <input 
                          type="text" 
                          value={localNames[editingLocalPlayer]} 
                          onChange={e => {
                            const newNames = [...localNames];
                            newNames[editingLocalPlayer] = e.target.value.substring(0, 6);
                            setLocalNames(newNames);
                          }} 
                          placeholder={`玩家 ${editingLocalPlayer + 1} 名字`}
                          className="w-full bg-white px-3 py-2 rounded-xl text-center text-sm md:text-base font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors"
                        />
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 max-h-24 md:max-h-32 overflow-y-auto p-2 bg-white rounded-[1.5rem] border-2 border-sky-100 custom-scrollbar mt-auto">
                        {CHILD_AVATARS.map(avatar => {
                          const targetIdx = editingLocalPlayer < setupPlayerCount ? editingLocalPlayer : 0;
                          return (
                            <button 
                              key={avatar} 
                              onClick={() => {
                                const newAvatars = [...localAvatars];
                                newAvatars[targetIdx] = avatar;
                                setLocalAvatars(newAvatars);
                              }} 
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-2xl md:text-3xl flex items-center justify-center transition-all ${localAvatars[targetIdx] === avatar ? 'bg-amber-100 border-4 border-amber-400 scale-110' : 'bg-slate-50 border-2 border-transparent hover:bg-sky-100'}`}
                            >
                              {avatar}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-sky-50 rounded-[2rem] p-5 md:p-6 border-4 border-white shadow-sm h-full flex flex-col justify-center">
                      <div className="text-center text-sky-800 mb-2 md:mb-3 text-lg md:text-xl">你的專屬角色與名字！</div>
                      
                      <div className="mb-4 w-full max-w-[200px] mx-auto">
                        <input 
                          type="text" 
                          value={setupName} 
                          onChange={e => setSetupName(e.target.value.substring(0, 6))} 
                          placeholder="輸入你的名字"
                          className="w-full bg-white px-4 py-2.5 rounded-2xl text-center text-lg md:text-xl font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors"
                        />
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-h-36 md:max-h-48 overflow-y-auto p-2 custom-scrollbar">
                        {CHILD_AVATARS.map(avatar => (
                          <button key={avatar} onClick={() => setSetupAvatar(avatar)} className={`w-12 h-12 md:w-16 md:h-16 rounded-full text-3xl md:text-4xl flex items-center justify-center bg-white transition-all ${setupAvatar === avatar ? 'border-4 border-amber-400 scale-110 shadow-md' : 'border-2 border-sky-100 hover:bg-sky-100'}`}>
                            {avatar}
                          </button>
                        ))}
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
                    <input 
                      type="text" placeholder="A1B2C3" 
                      value={roomId} onChange={e => setRoomId(e.target.value.toUpperCase())} 
                      className="w-full bg-white p-4 md:p-5 rounded-[2rem] text-center text-3xl md:text-4xl font-black border-[4px] border-sky-200 focus:border-amber-400 outline-none uppercase tracking-widest text-[#4a3424] shadow-inner" 
                    />
                  </div>
                </div>

                <div className="flex-[1.2] flex flex-col">
                  <div className="w-full bg-sky-50 rounded-[2rem] p-5 border-4 border-white shadow-sm h-full flex flex-col justify-center">
                    <div className="text-center text-sky-800 mb-2 md:mb-3 text-lg md:text-xl">你的專屬角色與名字！</div>
                    
                    <div className="mb-4 w-full max-w-[200px] mx-auto">
                      <input 
                        type="text" 
                        value={setupName} 
                        onChange={e => setSetupName(e.target.value.substring(0, 6))} 
                        placeholder="輸入你的名字"
                        className="w-full bg-white px-4 py-2.5 rounded-2xl text-center text-lg md:text-xl font-black border-4 border-sky-200 focus:border-amber-400 outline-none text-[#4a3424] shadow-inner transition-colors"
                      />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-h-36 overflow-y-auto p-2 custom-scrollbar">
                      {CHILD_AVATARS.map(avatar => (
                        <button key={avatar} onClick={() => setSetupAvatar(avatar)} className={`w-12 h-12 md:w-16 md:h-16 rounded-full text-3xl md:text-4xl flex items-center justify-center bg-white transition-all ${setupAvatar === avatar ? 'border-4 border-amber-400 scale-110 shadow-md' : 'border-2 border-sky-100 hover:bg-sky-100'}`}>
                          {avatar}
                        </button>
                      ))}
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
     const rankedPlayers = [...gameData.players].sort((a, b) => {
         if (b.trust !== a.trust) return b.trust - a.trust; 
         return b.money - a.money; 
     });

     return (
        <div className="min-h-[100dvh] w-screen bg-[#fff8e7] flex flex-col items-center justify-center p-6 text-[#4a3424] overflow-x-hidden absolute inset-0 font-black">
            <PartyPopper size={120} className="text-pink-400 mb-6 animate-bounce drop-shadow-md" />
            <h1 className="text-[5rem] font-black mb-10 text-amber-500 drop-shadow-[0_6px_0_rgba(217,119,6,0.2)]">遊戲結束囉！🎉</h1>
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-[8px] border-amber-200 relative">
                <h2 className="text-3xl font-black mb-8 text-amber-600 border-b-4 border-dashed border-amber-100 pb-6 text-center">🏆 大信翁排行榜 🏆</h2>
                {rankedPlayers.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-5 mb-4 rounded-[2rem] border-4 ${i === 0 ? 'bg-amber-50 border-amber-400 shadow-md scale-105 relative z-10' : 'bg-slate-50 border-slate-200'}`}>
                        {i === 0 && <div className="absolute -top-4 -left-4 text-4xl animate-bounce">👑</div>}
                        <div className="flex items-center gap-5">
                            <span className={`font-black text-3xl ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>#{i+1}</span>
                            <div className="text-5xl bg-white p-2 rounded-full shadow-sm border-2 border-slate-100">{p.icon}</div>
                            <span className="font-black text-2xl text-slate-700">{p.name} {p.isBankrupt && <span className="text-sm text-red-400 ml-1">(出局)</span>}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-amber-500 font-black text-2xl flex items-center justify-end gap-1"><Star size={24} fill="currentColor"/> {p.trust} 點</div>
                            <div className="text-emerald-500 font-black text-lg">💰 ${p.money}</div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => window.location.reload()} className="mt-10 px-10 py-5 bg-sky-400 text-sky-900 rounded-[2.5rem] font-black text-2xl shadow-[0_8px_0_0_#0ea5e9] border-[6px] border-white hover:-translate-y-1 active:translate-y-[8px] active:shadow-none transition-all">再玩一次！</button>
        </div>
     );
  }

  const myPlayer = gameData.players[activePlayerIndex];
  const currentSquare = myPlayer ? BOARD_SQUARES[myPlayer.pos] : null;

  const myTrust = Number(myPlayer?.trust || 0);
  const myMoney = Number(myPlayer?.money || 0);
  const reqTrust = Number(currentSquare?.reqTrust || 0);
  const reqMoney = Number(currentSquare?.price || 0);
  const canBuy = myMoney >= reqMoney && myTrust >= reqTrust;

  const myProperties = Object.keys(gameData.properties || {}).filter(sqId => gameData.properties[sqId] === activePlayerIndex);
  
  const safeDice = displayDice || [1, 1];

  return (
    <div className="h-[100dvh] w-screen bg-[#e0f2fe] overflow-hidden relative touch-none select-none font-black text-[#4a3424] flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      
      <div className="absolute top-6 left-6 right-24 z-[150] flex gap-4 overflow-x-auto pb-6 px-2 pointer-events-auto items-center custom-scrollbar">
        
        <div className="bg-white text-rose-500 rounded-[2rem] px-6 py-3 flex flex-col items-center justify-center shadow-md h-[75px] shrink-0 border-4 border-rose-200">
          <Timer size={20} className={localTimeLeft < 60 && localTimeLeft > 0 ? "animate-pulse" : ""}/> 
          <span className="text-xl font-black mt-1">{formatTime(localTimeLeft)}</span>
        </div>
        
        <div className={`bg-white rounded-[2rem] px-6 py-3 flex flex-col items-center justify-center font-black shadow-md h-[75px] shrink-0 border-4 tracking-wider ${isOfflineMode ? 'border-emerald-300 text-emerald-700' : 'border-sky-300 text-sky-700'}`}>
          <div className="text-xs opacity-70">{isOfflineMode ? '模式' : '房號'}</div>
          <div className="text-xl mt-1">{isOfflineMode ? '單機同樂 🎪' : roomId}</div>
        </div>
        
        <div className="w-1.5 h-10 bg-sky-200/50 mx-2 rounded-full shrink-0"></div>

        {gameData.players.map(p => (
          <div key={p.id} className={`flex items-center gap-3 px-5 py-2.5 rounded-[2.5rem] border-4 shadow-sm h-[75px] shrink-0 transition-all duration-300 ${gameData.currentPlayerIdx === p.id ? 'border-amber-400 bg-amber-50 scale-110 z-10 shadow-[0_5px_15px_rgba(217,119,6,0.2)]' : 'border-white bg-white/80 opacity-90'} ${p.isBankrupt ? 'grayscale opacity-50' : ''}`}>
            <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-4xl shadow-sm bg-white border-4 border-slate-100 relative`}>
              {p.icon}
              {p.inJail && !p.isBankrupt && <div className="absolute -top-2 -right-2 text-base animate-bounce drop-shadow-md">🙏</div>}
            </div>
            <div className="flex flex-col justify-center min-w-[85px]">
              <div className="text-[14px] text-slate-500 flex justify-between items-center leading-none mb-1.5">
                <span className={gameData.currentPlayerIdx === p.id ? "text-amber-700" : "text-slate-600"}>{p.name}</span>
              </div>
              {p.uid !== null && !p.isBankrupt ? (
                <div className="flex gap-2 items-end leading-none">
                  <span className={`text-[1.1rem] ${p.money < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>${p.money}</span>
                  <span className={`text-[13px] flex items-center gap-0.5 ${p.trust <= 0 ? 'text-rose-500' : 'text-amber-500'}`}><Star size={12} fill="currentColor"/>{p.trust}</span>
                </div>
              ) : (
                <span className="text-sm text-slate-400 italic mt-1">{p.isBankrupt ? '出局 🥺' : '等待中...'}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-4 bottom-24 md:right-6 md:bottom-8 flex flex-col items-center z-[150] pointer-events-auto">
        <div className={`flex flex-col items-center gap-3 overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] opacity-100 pb-3' : 'max-h-0 opacity-0 pb-0 pointer-events-none'}`}>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center text-sky-500 hover:scale-110 active:scale-95 transition-all border-4 border-sky-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button onClick={focusOnCurrentPlayer} className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center text-sky-500 hover:scale-110 active:scale-95 transition-all border-4 border-sky-100 shrink-0">
            <Target size={38} strokeWidth={3}/>
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center text-sky-500 hover:scale-110 active:scale-95 transition-all border-4 border-sky-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button onClick={() => setIsFullMapMode(!isFullMapMode)} className={`w-16 h-16 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center transition-all border-4 shrink-0 ${isFullMapMode ? 'bg-sky-400 text-white border-white scale-110' : 'bg-white/90 text-sky-500 hover:scale-110 active:scale-95 border-sky-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          </button>
          
          <div className="w-8 h-1.5 bg-sky-200/50 mx-auto my-0.5 rounded-full shrink-0"></div>

          <button onClick={() => setIsMuted(!isMuted)} className={`w-16 h-16 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center transition-all border-4 shrink-0 ${isMuted ? 'bg-slate-300 text-slate-600 border-white' : 'bg-white/90 text-amber-500 hover:scale-110 active:scale-95 border-amber-100'}`}>
            {isMuted ? <VolumeX size={42} strokeWidth={3}/> : <Volume2 size={42} strokeWidth={3}/>}
          </button>

          <button onClick={() => setShowExitConfirm(true)} className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)] flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all border-4 border-rose-100 shrink-0">
            <LogOut size={38} strokeWidth={3} className="ml-1"/>
          </button>
        </div>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className={`w-20 h-20 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-300 border-[5px] mt-1 z-10 ${isMenuOpen ? 'bg-sky-400 text-white border-white rotate-90 scale-95' : 'bg-white/95 backdrop-blur-md text-sky-500 border-sky-200 hover:scale-105'}`}
        >
          {isMenuOpen ? <X size={44} strokeWidth={3} /> : <Menu size={44} strokeWidth={3} />}
        </button>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-in zoom-in-95 spin-in-1 border-[8px] border-rose-100">
            <div className="text-rose-500 bg-rose-50 p-6 rounded-full border-4 border-white shadow-inner"><LogOut size={48} className="ml-1" strokeWidth={2.5}/></div>
            <h3 className="text-3xl font-black text-slate-700">要離開遊戲嗎？🥺</h3>
            <p className="text-slate-400 text-center text-lg">離開後目前的進度就不見囉！</p>
            <div className="flex gap-4 w-full mt-4">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xl rounded-[2rem] transition-colors border-4 border-white shadow-sm">按錯了啦</button>
              <button onClick={() => window.location.reload()} className="flex-1 py-4 bg-rose-400 hover:bg-rose-300 text-white text-xl rounded-[2rem] shadow-[0_5px_0_0_#e11d48] active:translate-y-[5px] active:shadow-none transition-all border-4 border-white">確定離開</button>
            </div>
          </div>
        </div>
      )}

      {selectedSquareInfo !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedSquareInfo(null)}>
          <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-sky-100 w-full max-w-sm animate-in zoom-in-95 spin-in-1 mx-4 flex flex-col relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedSquareInfo(null)} className="absolute -top-5 -right-5 text-white bg-rose-400 rounded-full p-3 border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"><X size={28} strokeWidth={3}/></button>
            
            {(() => {
               const sq = BOARD_SQUARES[selectedSquareInfo];
               const ownerId = gameData.properties?.[sq.id];
               const owner = ownerId !== undefined ? gameData.players.find(p => p.id === ownerId) : null;
               
               return (
                 <>
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
                         <span className="font-black text-sky-600 text-2xl">💰 ${sq.price}</span>
                       </div>
                       <div className="flex justify-between items-center bg-rose-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm">
                         <span className="text-rose-800 text-lg">過路費</span>
                         <span className="font-black text-rose-500 text-2xl">💸 ${Math.floor(sq.price * 0.4)}</span>
                       </div>
                       <div className="flex justify-between items-center bg-amber-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm">
                         <span className="text-amber-800 text-lg">信用門檻</span>
                         <span className="font-black text-amber-500 text-2xl flex items-center gap-1"><Star size={24} fill="currentColor"/> {sq.reqTrust}</span>
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
                 </>
               )
            })()}
          </div>
        </div>
      )}

      {showAssetManager && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-900/40 backdrop-blur-sm pointer-events-auto" onClick={() => setShowAssetManager(false)}>
          <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-amber-100 w-full max-w-sm animate-in zoom-in-95 spin-in-1 mx-4 flex flex-col relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowAssetManager(false)} className="absolute -top-5 -right-5 text-white bg-rose-400 rounded-full p-3 border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"><X size={28} strokeWidth={3}/></button>

              <div className="flex flex-col items-center border-b-4 border-dashed border-amber-100 pb-4 mb-4">
                  <div className="w-16 h-16 bg-amber-50 rounded-full border-4 border-amber-200 flex items-center justify-center text-4xl mb-2 shadow-inner">💼</div>
                  <h3 className="font-black text-2xl text-amber-700">小金庫與資產</h3>
                  {isOfflineMode && <div className="text-amber-500 text-base mt-1">({myPlayer?.name} 的包包)</div>}
              </div>
              
              <div className="flex gap-3 mb-5">
                 <div className="flex-1 bg-emerald-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -right-2 -bottom-4 text-[4rem] opacity-10">💰</div>
                    <div className="text-emerald-800 font-bold text-sm mb-1 z-10">目前資金</div>
                    <div className="font-black text-2xl text-emerald-500 z-10">${myPlayer?.money || 0}</div>
                 </div>
                 <div className="flex-1 bg-amber-50 p-4 rounded-[1.5rem] border-4 border-white shadow-sm flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -right-2 -bottom-4 text-[4rem] opacity-10">⭐</div>
                    <div className="text-amber-800 font-bold text-sm mb-1 z-10">目前信用</div>
                    <div className="font-black text-2xl text-amber-500 z-10 flex items-center gap-1"><Star size={20} fill="currentColor"/>{myPlayer?.trust || 0}</div>
                 </div>
              </div>

              <div className="mb-5">
                  <div className="text-slate-400 mb-2 text-center text-sm font-bold">🌟 拿 1 點信用換零用錢</div>
                  <button 
                     onClick={handleMortgageTrust}
                     disabled={myPlayer?.trust <= 1}
                     className={`w-full py-4 rounded-[1.5rem] text-xl shadow-[0_5px_0_0_rgba(0,0,0,0.1)] active:translate-y-[5px] active:shadow-none active:border-b-0 transition-all flex items-center justify-center gap-2 border-[4px] border-white ${myPlayer?.trust > 1 ? 'bg-amber-400 text-amber-900 hover:bg-amber-300 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                     <Star size={24} fill="currentColor"/> 
                     {myPlayer?.trust >= 10 ? '換取 $1000' : '換取 $500'}
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
                             const sellPrice = myPlayer.trust >= 10 ? sq.price : Math.floor(sq.price / 2);
                             return (
                                 <div key={sqId} className="flex justify-between items-center p-4 bg-sky-50 rounded-[1.5rem] border-4 border-white shadow-sm">
                                     <span className="font-black text-sky-800 text-xl">{sq.name}</span>
                                     <button onClick={() => handleSellProperty(sqId)} className="bg-rose-400 hover:bg-rose-300 text-white shadow-[0_4px_0_0_#e11d48] active:translate-y-[4px] active:shadow-none text-xl px-5 py-2 rounded-xl transition-all border-2 border-white">
                                         賣 $ {sellPrice}
                                     </button>
                                 </div>
                             );
                         })}
                      </div>
                  )}
              </div>
          </div>
        </div>
      )}

      {gameData.currentPlayerIdx === activePlayerIndex && !myPlayer?.isBankrupt && ['JAIL_BWA_BWEI', 'ACTION', 'END_TURN'].includes(gameData.gameState) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[250] bg-white/95 backdrop-blur-md p-10 rounded-[3rem] shadow-[0_25px_50px_rgba(0,0,0,0.1)] border-[8px] border-sky-100 min-w-[380px] max-w-[95vw] text-center animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto flex flex-col items-center gap-6">
          
          {gameData.gameState === 'JAIL_BWA_BWEI' && (
            <div className="flex flex-col items-center w-full px-2">
              <div className="text-3xl font-black text-rose-500 drop-shadow-sm mb-6 bg-rose-50 px-6 py-2 rounded-full border-4 border-white shadow-sm">🚨 反省泡泡時間</div>
              
              <div className="flex gap-5 justify-center mb-6">
                {[0, 1, 2].map(i => {
                  const res = gameData.bwaBweiResults?.[i];
                  if (!res) return (
                    <div key={i} className="w-[90px] h-[110px] border-[6px] border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-200 font-black text-4xl">?</div>
                  );
                  
                  const config = {
                    'HOLY': { label: '聖杯', desc: '一正一反', color: 'bg-rose-50 border-rose-200 shadow-[0_4px_0_0_#fecdd3]', text: 'text-rose-600' },
                    'LAUGH': { label: '笑杯', desc: '兩正', color: 'bg-amber-50 border-amber-200 shadow-[0_4px_0_0_#fde68a]', text: 'text-amber-600' },
                    'YIN': { label: '無杯', desc: '兩反', color: 'bg-slate-50 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]', text: 'text-slate-600' }
                  };
                  const c = config[res];

                  return (
                    <div key={i} className={`w-[90px] h-[110px] rounded-[2rem] flex flex-col items-center justify-center border-4 animate-in zoom-in spin-in-12 ${c.color} transition-all`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                         {res === 'HOLY' && (
                           <>
                             <BweiBlock isFlat={true} className="rotate-[15deg] scale-75" />
                             <BweiBlock isFlat={false} className="-rotate-[15deg] scale-x-[-1] scale-75" />
                           </>
                         )}
                         {res === 'LAUGH' && (
                           <>
                             <BweiBlock isFlat={true} className="rotate-[15deg] scale-75" />
                             <BweiBlock isFlat={true} className="-rotate-[15deg] scale-x-[-1] scale-75" />
                           </>
                         )}
                         {res === 'YIN' && (
                           <>
                             <BweiBlock isFlat={false} className="rotate-[15deg] scale-75" />
                             <BweiBlock isFlat={false} className="-rotate-[15deg] scale-x-[-1] scale-75" />
                           </>
                         )}
                      </div>
                      <span className={`font-black text-lg mb-1 leading-none ${c.text}`}>{c.label}</span>
                    </div>
                  );
                })}
              </div>

              {(gameData.bwaBweiResults || []).length < 3 ? (
                <button onClick={handleThrowBwaBwei} className="w-full bg-rose-400 hover:bg-rose-300 text-white font-black py-5 px-6 rounded-[2rem] active:translate-y-[6px] active:shadow-none active:border-b-0 transition-all shadow-[0_6px_0_0_#e11d48] text-2xl border-[4px] border-white flex justify-center items-center gap-2 mt-3">
                  🙏 進行第 {(gameData.bwaBweiResults || []).length + 1} 次擲杯
                </button>
              ) : (
                <button onClick={handleFinishBwaBwei} className="w-full bg-emerald-400 hover:bg-emerald-300 text-white font-black py-5 px-6 rounded-[2rem] active:translate-y-[6px] active:shadow-none active:border-b-0 transition-all shadow-[0_6px_0_0_#10b981] text-2xl border-[4px] border-white flex justify-center items-center gap-2 mt-3 animate-bounce">
                  ✨ 查看神明旨意
                </button>
              )}
            </div>
          )}

          {gameData.gameState !== 'JAIL_BWA_BWEI' && gameData.actionMessage && (
            <div className="font-black text-slate-700 text-[1.6rem] leading-relaxed whitespace-pre-line px-4 text-center">
              {gameData.actionMessage}
            </div>
          )}

          <div className="flex flex-col gap-4 w-full mt-3">
            {gameData.gameState === 'ACTION' && currentSquare?.type === 'PROPERTY' && !gameData.properties[myPlayer.pos] && (
              <button 
                onClick={canBuy ? handleBuyProperty : undefined} 
                disabled={!canBuy}
                className={`font-black py-5 px-8 w-full rounded-[2rem] transition-all text-3xl border-[4px] border-white flex flex-col items-center justify-center ${canBuy ? 'bg-sky-400 hover:bg-sky-300 text-white shadow-[0_6px_0_0_#0ea5e9] active:translate-y-[6px] active:shadow-none cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
              >
                {!canBuy ? (
                  <>
                    <span className="text-2xl">😢 沒辦法買耶</span>
                    <span className="text-base font-bold text-rose-400 mt-1">
                      {myMoney < reqMoney ? `錢錢還差 $${reqMoney - myMoney}` : `信用還差 ${reqTrust - myTrust} 點喔`}
                    </span>
                  </>
                ) : (
                  <span>🎁 買下這裡！($${reqMoney})</span>
                )}
              </button>
            )}
            
            {(gameData.gameState === 'ACTION' || gameData.gameState === 'END_TURN') && (
              <button onClick={handleEndTurn} className="bg-amber-400 w-full hover:bg-amber-300 text-amber-900 font-black py-5 px-6 rounded-[2rem] active:translate-y-[6px] active:shadow-none transition-all shadow-[0_6px_0_0_#d97706] text-3xl border-[4px] border-white">
                ✅ 換下一位囉！
              </button>
            )}
          </div>
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
              <div className="animate-[bounce_0.4s_infinite_alternate]">
                <div className="animate-[spin_0.3s_linear_infinite]">
                   <BweiBlock isFlat={false} className="scale-[1.5]" />
                </div>
              </div>
              <div className="animate-[bounce_0.5s_infinite_alternate-reverse]">
                <div className="animate-[spin_0.4s_linear_infinite_reverse]">
                   <BweiBlock isFlat={true} className="scale-[1.5] scale-x-[-1]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={mapRef} className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden z-10">
        <div 
          className="absolute top-0 left-0 origin-top-left transition-transform duration-700 ease-out pointer-events-none" 
          style={{ 
            width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px`, 
            transform: `translate(${cameraOffset.x + manualOffset.x}px, ${cameraOffset.y + manualOffset.y}px) scale(${displayZoom})` 
          }}
        >
          <div 
            className="w-full h-full p-10 bg-[#fff8e7] rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border-[20px] border-[#fde047]"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)', gap: '10px' }}
          >
            {BOARD_SQUARES.map((sq, idx) => {
              const {row, col} = GRID_ORDER[idx];
              const owner = gameData.properties ? gameData.players.find(p => gameData.properties[idx] === p.id) : null;
              const activePlayersHere = gameData.players.filter(p => p.pos === idx && p.uid !== null && !p.isBankrupt);
              
              const bodyBg = owner ? getOwnerBodyClass(owner.color) : 'bg-white';
              const borderClass = owner ? getOwnerBorderClass(owner.color) : 'border-white';

              let contentClass = `flex-1 flex flex-col items-center justify-center p-2 relative w-full h-full ${bodyBg} z-10`;

              const isActiveCell = activePlayersHere.some(p => p.id === gameData.currentPlayerIdx);
              const isMyTurnOnThisCell = isActiveCell && gameData.currentPlayerIdx === activePlayerIndex;

              let inactiveCount = 0;
              const INACTIVE_OFFSETS = [
                { x: -35, y: -35 }, 
                { x: 35, y: 35 },   
                { x: -35, y: 35 },  
                { x: 35, y: -35 },  
                { x: 0, y: -45 },   
                { x: 0, y: 45 }     
              ];

              return (
                <React.Fragment key={idx}>
                  <div 
                    onClick={() => {
                       if (!dragStatus.current.moved) {
                           setSelectedSquareInfo(idx);
                       }
                    }}
                    className={`rounded-[1.5rem] relative flex flex-col overflow-hidden shadow-sm z-10 border-4 border-b-[8px] cursor-pointer hover:scale-[1.03] transition-transform pointer-events-auto ${borderClass}`} 
                    style={{ gridRow: row, gridColumn: col }}
                  >
                    
                    {sq.type === 'PROPERTY' && (
                      <div className={`h-[20%] min-h-[20%] w-full ${owner ? owner.color : sq.color} border-b-4 border-white/50 z-0 shrink-0`}></div>
                    )}

                    <div className={contentClass}>
                      <span className="font-black text-slate-700 text-2xl leading-tight text-center mt-1 drop-shadow-sm">{sq.name}</span>
                      
                      {sq.type === 'START' && <span className="text-emerald-700 font-black text-lg leading-tight mt-1 bg-emerald-100 px-3 py-0.5 rounded-full border-2 border-emerald-300">領 $500</span>}
                      {sq.type === 'TAX' && <span className="text-rose-700 font-black text-lg leading-tight mt-1 bg-rose-100 px-3 py-0.5 rounded-full border-2 border-rose-300">繳 ${sq.amount}</span>}
                      
                      {sq.price && <span className="text-sky-600 font-black text-xl leading-tight mt-1">${sq.price}</span>}
                      
                      {sq.reqTrust > 0 && (
                        <div className="mt-1 bg-amber-50 text-amber-600 text-xs font-black px-2 py-0.5 rounded-full border-2 border-amber-300 flex items-center justify-center gap-1 shadow-sm">
                          <Star size={14} fill="currentColor"/> {sq.reqTrust} 點
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center justify-center relative ${isActiveCell ? 'z-[100]' : 'z-20 pointer-events-none'}`} style={{ gridRow: row, gridColumn: col }}>
                    {activePlayersHere.map((p) => {
                      const isActive = gameData.currentPlayerIdx === p.id;
                      let tX = 0;
                      let tY = 0;
                      
                      if (!isActive) {
                          const pos = INACTIVE_OFFSETS[inactiveCount % INACTIVE_OFFSETS.length];
                          tX = pos.x;
                          tY = pos.y;
                          inactiveCount++;
                      }

                      return (
                        <div key={p.id} className={`absolute transition-all duration-500 ease-out pointer-events-auto flex flex-col items-center ${isActive ? 'z-50' : 'z-10'}`} style={{ transform: `translate(${tX}px, ${tY}px)` }}>
                          
                          {gameData.gameState === 'MOVING' && gameData.currentPlayerIdx === p.id && gameData.remainingSteps > 0 && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[150] w-24 flex justify-center">
                              <div className="bg-sky-400 border-[6px] border-white text-white font-black rounded-full w-24 h-24 flex items-center justify-center text-[3rem] shadow-[0_10px_20px_rgba(0,0,0,0.15)] animate-bounce">
                                {gameData.remainingSteps}
                              </div>
                            </div>
                          )}

                          {p.inJail && (
                            <div className="absolute -top-6 -right-6 text-4xl animate-pulse drop-shadow-md z-40 bg-white p-1 rounded-full border-2 border-slate-100">🙏</div>
                          )}

                          <div 
                            onClick={(e) => {
                               if (p.id === activePlayerIndex) {
                                   e.stopPropagation();
                                   setShowAssetManager(true);
                               }
                            }}
                            className={`w-20 h-20 bg-white rounded-full border-[6px] flex items-center justify-center text-[3rem] shadow-[0_8px_15px_rgba(0,0,0,0.1)] transition-all duration-500 ${
                              gameData.currentPlayerIdx === p.id 
                                ? 'border-amber-400 scale-125 z-40 relative' 
                                : 'border-slate-200 scale-[0.65] grayscale opacity-70 z-10' 
                            } ${
                              p.id === activePlayerIndex 
                                ? 'cursor-pointer hover:ring-[6px] hover:ring-sky-300 hover:scale-[1.4] hover:grayscale-0 hover:opacity-100' 
                                : ''
                            }`}
                          >
                            {p.icon}

                            {p.id === activePlayerIndex && !p.isBankrupt && (
                              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 p-1.5 rounded-full shadow-md border-4 border-white z-50 animate-bounce">
                                 <Briefcase size={18} strokeWidth={3}/>
                              </div>
                            )}
                          </div>

                          {isMyTurnOnThisCell && p.id === activePlayerIndex && !myPlayer?.isBankrupt && gameData.gameState === 'IDLE' && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-[200]">
                              <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-300" style={{ transform: `scale(${1 / displayZoom})`, transformOrigin: 'bottom center' }}>
                                
                                {gameData.actionMessage && (
                                  <div className="bg-white/95 text-slate-700 font-black px-6 py-3 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.05)] text-xl mb-1 text-center whitespace-pre-line border-4 border-sky-100">
                                    {gameData.actionMessage}
                                  </div>
                                )}
                                
                                {myPlayer?.jailRoundsLeft === -1 ? (
                                  <button onClick={() => syncGameData({ gameState: 'JAIL_BWA_BWEI', bwaBweiResults: [] })} className="whitespace-nowrap px-8 py-4 bg-rose-400 hover:bg-rose-300 text-white rounded-[2rem] font-black text-3xl shadow-[0_8px_0_0_#e11d48,0_10px_20px_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[8px] active:border-b-0 transition-all flex items-center gap-3 border-[4px] border-white">
                                    🙏 開始擲杯！
                                  </button>
                                ) : (
                                  <button onClick={handleRollDice} className="whitespace-nowrap px-8 py-4 bg-sky-400 hover:bg-sky-300 text-white rounded-[2rem] font-black text-3xl shadow-[0_8px_0_0_#0284c7,0_10px_20px_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-[8px] active:border-b-0 transition-all flex items-center gap-3 border-[4px] border-white animate-bounce">
                                    <Dice5 size={32} strokeWidth={3}/> 擲骰子
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}