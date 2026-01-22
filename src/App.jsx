import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Camera, X, User, Plus, Lock, Calendar, GraduationCap, Image, Settings, Home, 
  Trash2, Check, Users, Briefcase, Wand2, RefreshCcw, Edit2, Download, Upload, 
  Database, AlertTriangle, BookOpen, Coins, Clock, Link as LinkIcon, RotateCcw,
  ChevronLeft, ChevronRight, MoreHorizontal, MapPin, AlignLeft, CheckSquare, Link
} from 'lucide-react';

// =================================================================================
// [1] 전역 상수 및 유틸리티
// =================================================================================

const TARGET_SUBJECTS = ['📕 국어', '📐 수학', '🌏 사회', '⚗️ 과학', '⚖️ 도덕', '🅰️ 영어', '🏃 체육', '🎵 음악', '🎨 미술', '💻 실과', '🍳 요리', '✨ 특색'];
const DEFAULT_AVATARS = Array.from({ length: 6 }, (_, i) => `/default-avatars/avatar${i + 1}.png`);
const SECURITY_QUESTIONS = ['보물 1호는?', '추억의 장소는?', '좋아하는 음식은?', '직접 입력'];
const STORAGE_KEYS = ['app_password', 'app_security', 'students_data', 'staff_data', 'integrated_schedule', 'class_photos', 'teacher_todos', 'service_records', 'budget_definitions', 'grade_timetables', 'teacher_schedules', 'class_status_memo', 'google_api_key', 'gas_app_url'];
const COLORS = ['red','orange','amber','green','emerald','teal','cyan','blue','indigo','violet','purple','fuchsia','pink','rose'];
const getStudentColor = (id) => { const c = COLORS[id % COLORS.length]; return `bg-${c}-100 border-${c}-200 text-${c}-800`; };

const usePersistentState = (key, init) => {
  const [state, setState] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || init; } catch { return init; } });
  useEffect(() => localStorage.setItem(key, JSON.stringify(state)), [key, state]);
  return [state, setState];
};

// API 호출 헬퍼
const callGAS = async (url, body) => {
  if (!url || url.includes("여기에")) return null;
  const opts = body ? { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined;
  const res = await fetch(url, opts);
  return body ? true : await res.json();
};

const callGemini = async (apiKey, prompt, retries = 3) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const data = await res.json();
    if (data.error) {
      if ((data.error.code === 503 || data.error.message.includes("overloaded")) && retries > 0) {
        await new Promise(r => setTimeout(r, 1500)); return callGemini(apiKey, prompt, retries - 1);
      }
      throw new Error(data.error.message);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (e) { throw e; }
};

// =================================================================================
// [2] UI 컴포넌트
// =================================================================================

const UI = {
  Btn: ({ children, onClick, className = "", variant = "primary", ...props }) => {
    const base = "py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2";
    const variants = {
      primary: "bg-pink-400 hover:bg-pink-500 text-white shadow-md",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-600",
      blue: "bg-blue-500 hover:bg-blue-600 text-white shadow-md",
      danger: "bg-red-50 hover:bg-red-100 text-red-500",
      ghost: "bg-transparent hover:bg-gray-50 text-gray-500"
    };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
  },
  Input: ({ label, className = "", ...props }) => (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">{label}</label>}
      <input lang="ko" className={`w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-pink-200 ${className}`} {...props} />
    </div>
  ),
  Select: ({ label, options, ...props }) => (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">{label}</label>}
      <select className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-pink-200" {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  ),
  Modal: ({ children, onClose, title, maxWidth = "max-w-2xl" }) => {
    useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up" onClick={onClose}>
        <div className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
          {title && <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10"><h3 className="text-xl font-bold ml-2">{title}</h3><button onClick={onClose}><X size={20}/></button></div>}
          {children}
        </div>
      </div>
    );
  },
  Card: ({ icon, title, value, color }) => {
    const colors = { pink: 'bg-pink-100 text-pink-600', blue: 'bg-sky-100 text-sky-600', purple: 'bg-purple-100 text-purple-600' };
    return (
      <div className="bg-white p-6 rounded-[2rem] shadow-lg flex items-center gap-6 hover:-translate-y-1 transition-transform cursor-pointer border border-gray-50">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${colors[color]}`}>{icon}</div>
        <div><h3 className="text-gray-400 font-bold text-sm mb-1">{title}</h3><p className="text-3xl font-extrabold text-gray-800">{value}</p></div>
      </div>
    );
  }
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => !isOpen ? null : (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center animate-bounce-short">
    <AlertTriangle size={24} className="text-red-500 mx-auto mb-4"/><h3 className="text-lg font-bold text-gray-800 mb-2">확인</h3><p className="text-gray-600 text-sm mb-6">{message}</p>
    <div className="flex gap-2"><UI.Btn variant="secondary" className="flex-1" onClick={onCancel}>취소</UI.Btn><UI.Btn variant="danger" className="flex-1" onClick={onConfirm}>확인</UI.Btn></div>
  </div></div>
);

// =================================================================================
// [3] 메인 앱
// =================================================================================

export default function App() {
  const [auth, setAuth] = useState({ authenticated: false, setupMode: false });
  const [pwInput, setPwInput] = useState('');
  const [storedPw, setStoredPw] = usePersistentState('app_password', null);
  const [security, setSecurity] = usePersistentState('app_security', null);
  const [modal, setModal] = useState({ type: null, msg: '' }); 
  const [setup, setSetup] = useState({ pw: '', q: SECURITY_QUESTIONS[0], a: '', customQ: '' });

  useEffect(() => { if (!storedPw) setAuth(p => ({ ...p, setupMode: true })); }, [storedPw]);

  const handleAuth = () => {
    if (auth.setupMode) {
      if (setup.pw.length < 4 || !setup.a.trim()) return setModal({ type: 'error', msg: '입력 정보를 확인하세요' });
      setStoredPw(setup.pw); setSecurity({ question: setup.q === '직접 입력' ? setup.customQ : setup.q, answer: setup.a });
      setAuth({ setupMode: false, authenticated: true });
    } else {
      if (pwInput === storedPw) setAuth({ ...auth, authenticated: true }); else { setModal({ type: 'error', msg: '비밀번호 불일치' }); setPwInput(''); }
    }
  };

  if (!auth.authenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md text-center animate-fade-in-up">
        <div className="flex justify-center mb-6"><div className="w-24 h-24 bg-yellow-200 rounded-full flex items-center justify-center text-4xl shadow-inner">🌟</div></div>
        <h1 className="text-2xl font-extrabold text-gray-700 mb-2">{auth.setupMode ? '환영합니다!' : '선생님, 안녕하세요!'}</h1>
        {auth.setupMode ? (
          <div className="space-y-4 text-left"><UI.Input label="비밀번호 설정" type="password" value={setup.pw} onChange={e => setSetup({...setup, pw: e.target.value})} />
            <UI.Select label="본인 확인 질문" options={SECURITY_QUESTIONS.map(q => ({ value: q, label: q }))} value={setup.q} onChange={e => setSetup({...setup, q: e.target.value})} />
            {setup.q === '직접 입력' && <UI.Input value={setup.customQ} onChange={e => setSetup({...setup, customQ: e.target.value})} placeholder="질문 입력" />}
            <UI.Input value={setup.a} onChange={e => setSetup({...setup, a: e.target.value})} placeholder="정답 입력" /><UI.Btn className="w-full mt-2" onClick={handleAuth}>시작하기</UI.Btn>
          </div>
        ) : (<><div className="relative mb-4"><UI.Input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAuth()} placeholder="••••" className="text-center text-xl tracking-[0.5em]" /><Lock size={20} className="absolute top-9 right-4 text-gray-300"/></div><UI.Btn className="w-full" onClick={handleAuth}>로그인</UI.Btn><button onClick={() => setModal({ type: 'recovery' })} className="mt-4 text-xs text-gray-400 underline">비밀번호 찾기</button></>)}
      </div>
      {modal.type === 'error' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setModal({ type: null })}><div className="bg-white p-6 rounded-3xl w-80 text-center"><AlertTriangle size={48} className="text-red-400 mx-auto mb-4" /><p className="text-gray-500 mb-6">{modal.msg}</p><UI.Btn className="w-full bg-gray-800" onClick={() => setModal({ type: null })}>확인</UI.Btn></div></div>}
      {modal.type === 'recovery' && <RecoveryModal securityData={security} onClose={() => setModal({ type: null })} onSuccess={p=>{setStoredPw(p); setModal({type:'error', msg:'재설정되었습니다.'})}} onError={msg => setModal({ type: 'error', msg })} />}
    </div>
  );
  return <MainLayout storedPw={storedPw} security={security} showGlobalError={msg => setModal({ type: 'error', msg })} />;
}

// =================================================================================
// [4] 레이아웃
// =================================================================================

function MainLayout({ storedPw, showGlobalError }) {
  const [menu, setMenu] = useState('home');
  const [students, setStudents] = usePersistentState('students_data', []);
  const [staff, setStaff] = usePersistentState('staff_data', []);
  const [secCheck, setSecCheck] = useState({ open: false, target: null, input: '' });

  const MENU_ITEMS = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'students', label: '학생관리', icon: User, protected: true },
    { id: 'schedule', label: '시간표', icon: Calendar },
    { id: 'personnel', label: '지원인력', icon: Users, protected: true },
    { id: 'education', label: '개별화교육', icon: GraduationCap, protected: true },
    { id: 'photos', label: '학급앨범', icon: Image },
    { id: 'budget', label: '예산', icon: Coins, protected: true },
    { id: 'settings', label: '환경설정', icon: Settings, protected: true },
  ];

  const navigate = (id, isProtected) => { if (menu === id) return; isProtected ? setSecCheck({ open: true, target: id, input: '' }) : setMenu(id); };
  const verify = (e) => { e.preventDefault(); if (secCheck.input === storedPw) { setMenu(secCheck.target); setSecCheck({ ...secCheck, open: false }); } else showGlobalError('비밀번호 불일치'); };

  const commonProps = { students, setStudents, staff, setStaff, showGlobalError };
  const Page = { home: HomeManager, students: StudentManager, personnel: PersonnelManager, budget: BudgetManager, schedule: ScheduleManager, education: EducationManager, photos: PhotoManager, settings: SettingsPage }[menu] || HomeManager;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex font-sans text-gray-700">
      <aside className="w-20 bg-white/80 backdrop-blur-md border-r border-white shadow-xl flex flex-col z-10 items-center py-6 shrink-0">
        <div className="mb-8 w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center text-2xl shadow-lg">🚀</div>
        <nav className="flex-1 w-full space-y-4 px-2">
          {MENU_ITEMS.map(({ id, label, icon: Icon, protected: isProtected }) => (
            <button key={id} onClick={() => navigate(id, isProtected)} className={`w-full flex flex-col items-center py-3 rounded-2xl transition-all relative ${menu === id ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-lg' : 'text-gray-400 hover:bg-white'}`}>
              <Icon size={24} className={menu === id ? 'text-white' : 'group-hover:text-pink-400'} />
              <span className={`text-[10px] mt-1 font-bold ${menu === id ? 'text-white' : 'text-gray-400 group-hover:text-pink-400'}`}>{label}</span>
              {isProtected && menu !== id && <Lock size={10} className="absolute top-1 right-2 text-gray-300" />}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto relative">{menu === 'settings' ? <SettingsPage storedPw={storedPw} showGlobalError={showGlobalError}/> : <Page {...commonProps} />}</main>
      {secCheck.open && <UI.Modal onClose={() => setSecCheck({ ...secCheck, open: false })} maxWidth="max-w-sm"><div className="p-6 text-center"><Lock size={40} className="mx-auto text-gray-300 mb-4"/><h3 className="text-xl font-bold mb-4">보안 접근 확인</h3><form onSubmit={verify}><UI.Input type="password" autoFocus value={secCheck.input} onChange={e => setSecCheck({...secCheck, input: e.target.value})} className="mb-4 text-center text-lg tracking-widest" placeholder="••••" /><div className="flex gap-2"><UI.Btn type="button" variant="secondary" className="flex-1" onClick={() => setSecCheck({ ...secCheck, open: false })}>취소</UI.Btn><UI.Btn type="submit" className="flex-1">확인</UI.Btn></div></form></div></UI.Modal>}
    </div>
  );
}

// =================================================================================
// [5] 홈 (NEW: 그라데이션 플래너 & 스티커 메모)
// =================================================================================

function HomeManager() {
  // 데이터 상태 관리
  const [schedules, setSchedules] = usePersistentState('teacher_schedules', {});
  const [todos, setTodos] = usePersistentState('teacher_todos_date_v2', {}); // 날짜별 투두로 변경 (키 변경)
  const [memos, setMemos] = usePersistentState('class_sticky_memos', []); // 포스트잇 배열
  
  // UI 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState('schedule'); // schedule, todo, memo
  
  // 색상 팔레트 (User Provided)
  const PALETTE = {
    blue: '#405DE6',
    royal: '#5B51D8',
    purple: '#833AB4',
    magenta: '#C13584',
    pink: '#E1306C',
    red: '#FD1D1D',
    orangeRed: '#F56040',
    orange: '#F77737', // 약간 수정 (가독성)
    yellowOrange: '#FCAF45',
    yellow: '#FFDC80'
  };

  // 날짜 관련 유틸
  const dateString = (date) => date ? date.toISOString().slice(0, 10) : '';
  const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  };

  // 통합 입력 핸들러
  const handleAdd = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (inputType === 'memo') {
      // 스티커 메모 추가 (날짜 무관, 랜덤 회전각)
      const rotation = Math.random() * 4 - 2; // -2도 ~ +2도 회전
      setMemos([...memos, { id: Date.now(), text: inputText, rotation }]);
    } else {
      // 일정 & 할 일 (날짜 종속)
      const key = dateString(selectedDate);
      const newItem = { id: Date.now(), text: inputText, done: false }; // 통일된 구조
      
      if (inputType === 'schedule') {
        setSchedules({ ...schedules, [key]: [...(schedules[key] || []), { id: Date.now(), title: inputText }] });
      } else {
        setTodos({ ...todos, [key]: [...(todos[key] || []), newItem] });
      }
    }
    setInputText('');
  };

  // 삭제 핸들러
  const deleteItem = (type, id) => {
    const key = dateString(selectedDate);
    if (type === 'schedule') {
      setSchedules({ ...schedules, [key]: schedules[key].filter(s => s.id !== id) });
    } else if (type === 'todo') {
      setTodos({ ...todos, [key]: todos[key].filter(t => t.id !== id) });
    } else if (type === 'memo') {
      setMemos(memos.filter(m => m.id !== id));
    }
  };

  // 할 일 토글
  const toggleTodo = (id) => {
    const key = dateString(selectedDate);
    const newTodos = todos[key].map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTodos({ ...todos, [key]: newTodos });
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-7xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] border border-white relative">
        
        {/* =================================================================================
            [좌측] 캘린더 영역 (35%) 
           ================================================================================= */}
        <div className="md:w-[35%] bg-white p-8 flex flex-col border-r border-gray-100 z-10">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2 className="text-3xl font-light" style={{ color: PALETTE.purple }}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentDate.getMonth()]}
              <span className="text-gray-300 font-bold text-lg ml-2">{currentDate.getFullYear()}</span>
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ChevronLeft/></button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ChevronRight/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center mb-4">
            {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-xs font-bold text-gray-300">{d}</div>)}
          </div>

          <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2">
            {getCalendarDays().map((date, i) => {
              if (!date) return <div key={i} />;
              const dStr = dateString(date);
              const isSel = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              // 일정/할일 존재 여부 체크
              const hasSch = (schedules[dStr] || []).length > 0;
              const hasTodo = (todos[dStr] || []).length > 0;

              return (
                <div key={i} onClick={() => setSelectedDate(date)} className="flex flex-col items-center justify-center cursor-pointer relative group">
                  <div 
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${isSel ? 'text-white shadow-lg scale-110' : 'text-gray-600 group-hover:bg-gray-50'}`}
                    style={{ background: isSel ? `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.pink})` : (isToday ? '#F3F4F6' : 'transparent'), color: isToday && !isSel ? PALETTE.pink : '' }}
                  >
                    {date.getDate()}
                  </div>
                  {/* 인디케이터 점 */}
                  <div className="flex gap-0.5 mt-1 h-1">
                    {hasSch && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PALETTE.blue }}></div>}
                    {hasTodo && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PALETTE.orangeRed }}></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================================
            [우측] 타임라인 & 스티커 메모 (65%) 
           ================================================================================= */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          
          {/* 1. 상단 헤더 & 입력창 */}
          <div className="p-8 pb-4 shrink-0 z-20 bg-white/80 backdrop-blur-md">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: PALETTE.blue }}>Daily Plan</p>
                <h2 className="text-4xl font-extrabold text-gray-800">
                  {selectedDate.getDate()} <span className="text-xl font-medium text-gray-400">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][selectedDate.getDay()]}</span>
                </h2>
              </div>
              {/* 입력 모드 선택 탭 */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {[
                  { id: 'schedule', icon: Clock, color: PALETTE.blue, label: '일정' },
                  { id: 'todo', icon: CheckSquare, color: PALETTE.red, label: '할일' },
                  { id: 'memo', icon: Edit2, color: PALETTE.yellowOrange, label: '메모' }
                ].map(mode => (
                  <button key={mode.id} onClick={() => setInputType(mode.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inputType === mode.id ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} style={{ color: inputType === mode.id ? mode.color : '' }}>
                    <mode.icon size={14}/> {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 통합 입력바 */}
            <form onSubmit={handleAdd} className="relative group shadow-sm rounded-2xl">
              <input 
                lang="ko"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full bg-gray-50 pl-5 pr-16 py-4 rounded-2xl border-2 border-transparent outline-none transition-all placeholder-gray-400 text-gray-700 font-medium"
                style={{ borderColor: inputType === 'schedule' ? `${PALETTE.blue}20` : inputType === 'todo' ? `${PALETTE.red}20` : `${PALETTE.yellowOrange}40` }}
                placeholder={inputType === 'memo' ? "잊지 말아야 할 내용을 적어두세요 (스티커 메모)" : inputType === 'schedule' ? "새로운 일정을 입력하세요" : "오늘 할 일을 입력하세요"}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white transition-transform hover:scale-105 active:scale-95" style={{ background: inputType === 'memo' ? PALETTE.yellowOrange : inputType === 'schedule' ? PALETTE.blue : PALETTE.red }}>
                <Plus size={18}/>
              </button>
            </form>
          </div>

          {/* 2. 메인 스크롤 영역 (일정 -> 할일 -> 메모장 순) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10">
            
            {/* 섹션 1: 일정 (Schedule) */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.blue}}></div> Schedule</h4>
              <div className="space-y-3">
                {(schedules[dateString(selectedDate)] || []).map((sch, i) => (
                  <div key={sch.id} className="flex items-center gap-4 group animate-fade-in-up" style={{animationDelay: `${i*0.05}s`}}>
                    <div className="w-1 h-full min-h-[3rem] rounded-full" style={{ background: `linear-gradient(to bottom, ${PALETTE.blue}, ${PALETTE.royal})` }}></div>
                    <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                      <span className="font-bold text-gray-700">{sch.title}</span>
                      <button onClick={() => deleteItem('schedule', sch.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {(schedules[dateString(selectedDate)] || []).length === 0 && <div className="text-gray-300 text-xs italic pl-4">등록된 일정이 없습니다.</div>}
              </div>
            </div>

            {/* 섹션 2: 할 일 (To-Do) */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.red}}></div> To-Do List</h4>
              <div className="space-y-3">
                {(todos[dateString(selectedDate)] || []).map((todo, i) => (
                  <div key={todo.id} className="flex items-center gap-4 group animate-fade-in-up" style={{animationDelay: `${i*0.05}s`}}>
                    <div className="w-1 h-full min-h-[3rem] rounded-full transition-colors" style={{ background: todo.done ? '#E5E7EB' : `linear-gradient(to bottom, ${PALETTE.red}, ${PALETTE.yellowOrange})` }}></div>
                    <div className={`flex-1 p-4 rounded-2xl border flex justify-between items-center transition-all ${todo.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTodo(todo.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${todo.done ? 'border-gray-300 bg-gray-300 text-white' : 'border-red-200 text-transparent hover:border-red-400'}`} style={!todo.done ? {borderColor: PALETTE.orange} : {}}>
                          <Check size={12} strokeWidth={4} />
                        </button>
                        <span className={`font-bold transition-all ${todo.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.text}</span>
                      </div>
                      <button onClick={() => deleteItem('todo', todo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {(todos[dateString(selectedDate)] || []).length === 0 && <div className="text-gray-300 text-xs italic pl-4">등록된 할 일이 없습니다.</div>}
              </div>
            </div>

            {/* 섹션 3: 스티커 메모 (Sticky Notes) */}
            <div className="pt-6 border-t border-dashed border-gray-200">
              <h4 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.yellowOrange}}></div> Sticky Notes (Always Visible)
              </h4>
              
              {/* 가로 스크롤 가능한 메모 영역 */}
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[160px]">
                {memos.length > 0 ? memos.map(memo => (
                  <div 
                    key={memo.id} 
                    className="shrink-0 w-48 h-48 p-5 shadow-lg flex flex-col justify-between transition-transform hover:scale-105 hover:z-10 group"
                    style={{ 
                      backgroundColor: PALETTE.yellow, 
                      transform: `rotate(${memo.rotation}deg)`,
                      boxShadow: '4px 4px 15px rgba(0,0,0,0.1)' 
                    }}
                  >
                    <p className="font-gaegu text-gray-800 text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-hidden" style={{ fontFamily: 'sans-serif' }}>{memo.text}</p>
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteItem('memo', memo.id)} className="p-1.5 bg-black/10 rounded-full hover:bg-black/20 text-gray-700">
                        <X size={12}/>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 text-sm h-32">
                    '메모' 탭에서 입력하면 여기에 붙어요! 📌
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
// =================================================================================
// [6] 학생 관리
// =================================================================================

function StudentManager({ students, setStudents }) {
  const [modal, setModal] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const save = (data) => { setStudents(modal.type === 'add' ? [...students, { ...data, id: Date.now(), photo: DEFAULT_AVATARS[students.length % 6] }] : students.map(s => s.id === data.id ? data : s)); setModal({ type: 'success' }); };
  return (
    <div className="p-8 max-w-7xl mx-auto"><div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-extrabold text-gray-800">학생 관리</h2><UI.Btn onClick={() => setModal({ type: 'add' })} className="bg-gray-800 px-6 rounded-full"><Plus size={20}/> 학생 등록</UI.Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">{students.map(s => (<div key={s.id} onClick={() => setModal({ type: 'edit', data: s })} className={`cursor-pointer rounded-3xl border-4 ${getStudentColor(s.id)} bg-white shadow-lg hover:-translate-y-2 transition-all overflow-hidden`}><div className="p-6 flex flex-col items-center"><div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 mb-4 flex items-center justify-center"><img src={s.photo} className="w-full h-full object-cover"/></div><div className="px-4 py-1 rounded-full mb-4 bg-white/50 border"><h2 className="text-xl font-bold text-gray-800">{s.name}</h2></div><div className="w-full text-sm text-gray-600 space-y-1"><div className="flex justify-between"><span>학년/반</span><b>{s.grade}학년 {s.classNumber}반</b></div><div className="flex justify-between"><span>중증도</span><b>{s.severity || '-'}순위</b></div></div></div></div>))}</div>
      {modal?.type==='success' && <UI.Modal onClose={()=>setModal(null)} maxWidth="max-w-sm"><div className="p-8 text-center"><Check size={48} className="text-green-500 mx-auto mb-4"/><h3 className="text-xl font-bold mb-6">저장 완료!</h3><UI.Btn className="w-full bg-green-500" onClick={()=>setModal(null)}>확인</UI.Btn></div></UI.Modal>}
      {modal && modal.type !== 'success' && <StudentModal student={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={(id) => setConfirmModal({ open: true, id })} isEdit={modal.type === 'edit'} />}
      <ConfirmModal isOpen={confirmModal.open} message="정말 삭제하시겠습니까?" onConfirm={()=>{setStudents(students.filter(s=>s.id!==confirmModal.id)); setConfirmModal({open:false})}} onCancel={()=>setConfirmModal({open:false})} />
    </div>
  );
}
function StudentModal({ student, onClose, onSave, onDelete, isEdit }) {
  const [form, setForm] = useState(student || { name: '', grade: '1', classNumber: '', severity: '3', teacher: '', extension: '', targetSubjects: [] });
  const fRef = useRef();
  const handlePhoto = (e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setForm(p => ({...p, photo: r.result})); r.readAsDataURL(f); }};
  const toggleSub = (s) => setForm(p => ({...p, targetSubjects: p.targetSubjects.includes(s) ? p.targetSubjects.filter(i => i !== s) : [...p.targetSubjects, s]}));
  return (
    <UI.Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6 bg-gray-50 flex flex-col items-center relative"><button onClick={onClose} className="absolute top-4 right-4"><X size={20}/></button>{isEdit && <button onClick={() => onDelete(form.id)} className="absolute top-4 left-4 text-red-500"><Trash2 size={20}/></button>}<div className="relative group w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mb-4" onClick={()=>fRef.current.click()}><img src={form.photo} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"><Camera className="text-white"/></div><input type="file" ref={fRef} onChange={handlePhoto} className="hidden" accept="image/*"/></div><input lang="ko" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="text-3xl font-extrabold bg-transparent text-center outline-none w-40" placeholder="이름" /></div>
      <div className="p-8 h-[50vh] overflow-y-auto custom-scrollbar space-y-6">
        <div className="grid grid-cols-2 gap-6"><div className="space-y-3"><div className="flex gap-2"><UI.Select label="학년" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} options={[1,2,3,4,5,6].map(g => ({value: g, label: `${g}학년`}))} /><UI.Input label="반" value={form.classNumber} onChange={e => setForm({...form, classNumber: e.target.value})} /></div><UI.Input label="중증도 순위 (1~3)" type="number" min="1" max="3" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} placeholder="숫자만 입력" /><UI.Input label="담임 선생님" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} /></div>
        <div className="space-y-3"><UI.Input label="생년월일" type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} /><UI.Select label="장애 영역" value={form.disabilityType} onChange={e => setForm({...form, disabilityType: e.target.value})} options={['지적장애', '자폐성장애', '시각장애', '청각장애', '지체장애', '발달지체', '정서행동장애', '기타'].map(v => ({value: v, label: v}))} /></div></div>
        <div><h3 className="font-bold text-gray-400 border-b pb-2 mb-2 flex items-center gap-2"><BookOpen size={16}/> 대상 과목</h3><div className="flex flex-wrap gap-2">{TARGET_SUBJECTS.map(s => <button key={s} onClick={() => toggleSub(s)} className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${form.targetSubjects.includes(s) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-4"><textarea lang="ko" value={form.dreamCardUsage} onChange={e => setForm({...form, dreamCardUsage: e.target.value})} className="p-3 bg-yellow-50 border-yellow-100 border rounded-xl h-20 text-sm resize-none" placeholder="꿈꾸미 카드 메모" /><textarea lang="ko" value={form.jaramiCardUsage} onChange={e => setForm({...form, jaramiCardUsage: e.target.value})} className="p-3 bg-green-50 border-green-100 border rounded-xl h-20 text-sm resize-none" placeholder="자라미 카드 메모" /></div>
      </div>
      <div className="p-4 border-t flex justify-end"><UI.Btn onClick={() => onSave(form)} className="px-8 bg-gray-800">저장하기</UI.Btn></div>
    </UI.Modal>
  );
}

// [7] 인력 관리
function PersonnelManager({ students, staff, setStaff }) {
  const [modal, setModal] = useState(null); const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const saveStaff = (d) => { setStaff(modal.mode === 'add' ? [...staff, { ...d, id: Date.now(), role: modal.type==='practical'?'실무사':'사회복무', type: modal.type }] : staff.map(s => s.id === d.id ? { ...s, ...d } : s)); setModal(null); };
  const StaffList = ({ type, title, color }) => (<div className="flex-1 flex flex-col"><div className={`p-4 rounded-t-2xl border-b-2 flex justify-between items-center bg-${color}-100 border-${color}-200 text-${color}-800`}><h3 className="font-extrabold flex gap-2"><Users size={20}/> {title}</h3><button onClick={()=>setModal({ type, mode: 'add', data: {} })} className="bg-white/50 p-2 rounded-full hover:bg-white"><Plus size={18}/></button></div><div className="bg-white p-4 rounded-b-2xl shadow-lg border-t-0 space-y-3 min-h-[200px]">{staff.filter(s=>s.type===type).map(s => (<div key={s.id} onClick={() => setModal({ type, mode: 'edit', data: s })} className={`cursor-pointer p-3 rounded-xl border flex justify-between items-center hover:-translate-y-1 transition-transform bg-${color}-50 border-${color}-200`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">👤</div><div><div className="font-bold">{s.name}</div>{s.assignedStudentIds?.length > 0 && <div className="text-[10px] text-gray-500 mt-1">담당: {s.assignedStudentIds.map(id => students.find(s => s.id === id)?.name).join(', ')}</div>}</div></div><button onClick={(e) => { e.stopPropagation(); setConfirmModal({open: true, id: s.id}); }} className="text-red-400 p-2"><Trash2 size={16}/></button></div>))}</div></div>);
  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto"><h2 className="text-3xl font-extrabold text-gray-800 mb-8">지원인력 관리</h2><div className="flex flex-col md:flex-row gap-6 max-w-6xl mb-8"><StaffList type="practical" title="특수교육 실무사" color="blue"/><StaffList type="social" title="사회복무요원" color="green"/></div>
      {modal && <UI.Modal onClose={()=>setModal(null)} title={`${modal.type==='practical'?'실무사':'사회복무'} ${modal.mode==='add'?'등록':'수정'}`} maxWidth="max-w-md"><form onSubmit={e=>{e.preventDefault(); saveStaff(modal.data);}} className="p-6"><UI.Input label="이름" value={modal.data.name||''} onChange={e=>setModal({...modal, data:{...modal.data, name:e.target.value}})} required className="mb-6"/><div className="mb-6"><label className="text-xs font-bold text-gray-400">전담 지원 학생</label><div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">{students.map(s=><div key={s.id} onClick={()=>{const ids=modal.data.assignedStudentIds||[]; setModal({...modal, data:{...modal.data, assignedStudentIds:ids.includes(s.id)?ids.filter(i=>i!==s.id):[...ids,s.id]}})}} className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${modal.data.assignedStudentIds?.includes(s.id)?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${modal.data.assignedStudentIds?.includes(s.id)?'bg-blue-500 border-blue-500':''}`}>{modal.data.assignedStudentIds?.includes(s.id)&&<Check size={12} className="text-white"/>}</div><span className="text-sm font-bold">{s.name}</span></div>)}</div></div><div className="flex gap-2"><UI.Btn type="button" variant="secondary" className="flex-1" onClick={()=>setModal(null)}>취소</UI.Btn><UI.Btn type="submit" variant="blue" className="flex-1">저장</UI.Btn></div></form></UI.Modal>}
      <ConfirmModal isOpen={confirmModal.open} message="삭제하시겠습니까?" onConfirm={()=>{setStaff(staff.filter(x=>x.id!==confirmModal.id)); setConfirmModal({open: false})}} onCancel={() => setConfirmModal({ open: false })} />
    </div>
  );
}

// [8] 시간표 관리
function ScheduleManager({ students, staff }) {
  const [semester, setSemester] = useState(1);
  const [schedule, setSchedule] = usePersistentState('integrated_schedule', {});
  const [gradeTimes, setGradeTimes] = usePersistentState('grade_timetables_detail', (() => { const i = {}; [1,2,3,4,5,6].forEach(g => i[g] = Array(5).fill(null).map(() => Array(6).fill(true))); return i; })());
  const [logicMode, setLogicMode] = useState('severity'); const [modal, setModal] = useState(null); const [confirmModal, setConfirmModal] = useState({ open: false, type: null }); const [gradeModal, setGradeModal] = useState(false); const [activeGradeTab, setActiveGradeTab] = useState(1);
  const days = ['월','화','수','목','금']; const periods = [1,2,3,4,5,6];

  const stats = useMemo(() => {
    let teacherClasses = 0; const supportCounts = {}; const studentSupportCounts = {};
    staff.forEach(s => supportCounts[s.id] = 0); students.forEach(s => studentSupportCounts[s.id] = 0);
    Object.values(schedule[semester] || {}).forEach(slots => {
      if (slots.some(i => i.type === 'special')) teacherClasses++;
      slots.forEach(i => { if (i.staffId) { supportCounts[i.staffId]++; studentSupportCounts[i.studentId]++; }});
    });
    return { teacherClasses, supportCounts, studentSupportCounts };
  }, [schedule, semester, staff, students]);

  const autoAssign = () => {
    if(!staff.length) return alert('등록된 인력이 없습니다.');
    const newSch = { ...schedule, [semester]: { ...schedule[semester] } };
    Object.keys(newSch[semester]).forEach(k => newSch[semester][k] = (newSch[semester][k] || []).filter(i => i.type === 'special' || i.blocked));
    const studentCounts = {}; students.forEach(s => studentCounts[s.id] = 0); const staffCounts = {}; staff.forEach(s => staffCounts[s.id] = 0);
    days.forEach((d, dIdx) => periods.forEach(p => {
      const k = `${d}-${p}`; if ((newSch[semester][k]||[]).some(i => i.blocked)) return;
      const slots = newSch[semester][k] || []; const busyS = slots.filter(i => i.type==='special').map(i=>i.studentId); const busySt = new Set(slots.filter(i=>i.staffId).map(i=>i.staffId));
      let cands = students.filter(s => gradeTimes[s.grade]?.[dIdx]?.[p-1] && !busyS.includes(s.id));
      if (logicMode === 'severity') {
        cands.sort((a,b) => a.severity - b.severity).forEach(s => {
          let st = staff.find(x => x.assignedStudentIds?.includes(s.id));
          if (st && !busySt.has(st.id)) { busySt.add(st.id); if(!newSch[semester][k]) newSch[semester][k]=[]; newSch[semester][k].push({studentId:s.id, staffId:st.id, type:'support'}); }
          else if (!st) { st = staff.find(x => !busySt.has(x.id)); if(st){ busySt.add(st.id); if(!newSch[semester][k]) newSch[semester][k]=[]; newSch[semester][k].push({studentId:s.id, staffId:st.id, type:'support'}); } }
        });
      } else {
        cands.sort((a,b)=>studentCounts[a.id]-studentCounts[b.id]); const freeSt = staff.filter(x=>!busySt.has(x.id)).sort((a,b)=>staffCounts[a.id]-staffCounts[b.id]);
        while(freeSt.length && cands.length) { const s=cands.shift(); const st=freeSt.shift(); if(!newSch[semester][k]) newSch[semester][k]=[]; newSch[semester][k].push({studentId:s.id, staffId:st.id, type:'support'}); studentCounts[s.id]++; staffCounts[st.id]++; }
      }
    }));
    setSchedule(newSch); setConfirmModal({ open: false });
  };
  const toggleGradeTime = (d, p) => { const n = { ...gradeTimes }; n[activeGradeTab][d][p] = !n[activeGradeTab][d][p]; setGradeTimes(n); };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex flex-col gap-6 mb-6 shrink-0"><div className="flex justify-between items-center"><div><h2 className="text-3xl font-extrabold text-gray-800">통합 시간표</h2></div><div className="flex gap-2"><button onClick={() => setGradeModal(true)} className="px-4 py-2 bg-white border rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2"><Clock size={18}/> 학년별 시수 설정</button><div className="bg-gray-100 p-1 rounded-xl flex"><button onClick={()=>setLogicMode('severity')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${logicMode==='severity'?'bg-white shadow text-pink-600':'text-gray-400'}`}>중증도 우선</button><button onClick={()=>setLogicMode('equal')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${logicMode==='equal'?'bg-white shadow text-blue-600':'text-gray-400'}`}>균등 배정</button></div><button onClick={() => setConfirmModal({ open: true, type: 'auto' })} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold shadow-md hover:scale-105 transition-transform"><Wand2 size={18}/> 자동 배치</button><button onClick={() => setConfirmModal({ open: true, type: 'reset' })} className="bg-gray-100 p-2 rounded-xl text-gray-500 hover:text-red-500"><RotateCcw size={20}/></button></div></div>
        <div className="bg-gray-800 text-white rounded-2xl p-4 flex flex-wrap items-center shadow-lg gap-4"><div className="flex items-center gap-3 px-2 pr-6 border-r border-gray-600"><div className="bg-pink-500 p-2 rounded-lg"><GraduationCap size={20}/></div><div><p className="text-xs text-gray-400 font-bold">주간 수업</p><p className="text-xl font-bold">{stats.teacherClasses}시간</p></div></div><div className="flex gap-4 overflow-x-auto custom-scrollbar items-center px-2">{staff.map(s => (<div key={s.id} className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-xl whitespace-nowrap"><div className={`w-2 h-2 rounded-full ${s.type==='practical'?'bg-blue-400':'bg-green-400'}`}/><div><p className="text-[10px] text-gray-400">{s.name}</p><p className="font-bold">{stats.supportCounts[s.id] || 0}회</p></div></div>))}</div><div className="w-px h-8 bg-gray-600 mx-2"></div><div className="flex gap-4 overflow-x-auto custom-scrollbar items-center flex-1">{students.map(s => (<div key={s.id} className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-xl whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-yellow-400"/><div><p className="text-[10px] text-gray-400">{s.name}</p><p className="font-bold">{stats.studentSupportCounts[s.id] || 0}회</p></div></div>))}</div></div></header>
      <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-xl overflow-hidden flex flex-col"><div className="grid grid-cols-6 gap-2 mb-2 text-center h-12 shrink-0"><div className="font-bold text-gray-400 bg-gray-50 rounded-xl flex items-center justify-center">교시</div>{days.map(d=><div key={d} className="font-extrabold text-lg text-gray-700 bg-gray-100 rounded-xl flex items-center justify-center">{d}</div>)}</div><div className="flex-1 grid grid-rows-6 gap-2">{periods.map(p => <div key={p} className="grid grid-cols-6 gap-2"><div className="font-bold text-xl text-gray-400 bg-gray-50 rounded-xl flex items-center justify-center">{p}</div>{days.map(d => { const items = schedule[semester]?.[`${d}-${p}`] || []; const isBlocked = items.some(i => i.blocked); return (<div key={d} onClick={()=>setModal({ day: d, period: p, data: JSON.parse(JSON.stringify(items)) })} className={`bg-white border-2 rounded-xl hover:border-pink-300 hover:shadow-lg cursor-pointer p-1 overflow-hidden relative group transition-all ${isBlocked ? 'border-gray-200 bg-gray-50' : 'border-gray-100'}`}>{isBlocked ? <div className="w-full h-full flex items-center justify-center"><X className="text-gray-300" size={32} /></div> : (<div className="flex flex-wrap gap-1 justify-center content-start h-full">{items.map((i,x)=>{ const s = students.find(s=>s.id===i.studentId); const st = staff.find(s=>s.id===i.staffId); if(!s) return null; const isSpecial = i.type === 'special'; return <div key={x} className={`flex flex-col items-center text-[9px] px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap ${getStudentColor(s.id)} ${isSpecial ? 'border-4 border-gray-700 font-extrabold ring-1 ring-white' : 'opacity-90 font-bold'}`}><span>{s.name}</span><span className="opacity-80 scale-90">{isSpecial ? (i.subject || '특수') : (st ? st.name : '?')}</span></div> })}</div>)}</div>); })}</div>)}</div></div>
      {modal && <UI.Modal onClose={()=>setModal(null)} maxWidth="max-w-5xl" title={`${modal.day}요일 ${modal.period}교시 설정`}>
        <div className="flex justify-between items-center px-6 py-2 bg-gray-50 border-b"><span className="text-sm text-gray-500 font-bold">개별 설정</span><button onClick={()=>{const b=modal.data.some(i=>i.blocked); setModal({...modal, data: b?modal.data.filter(i=>!i.blocked):[...modal.data,{blocked:true}]})}} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${modal.data.some(i=>i.blocked) ? 'bg-red-500 text-white' : 'bg-white border'}`}>{modal.data.some(i=>i.blocked) ? '금지 해제' : '배정 금지'}</button></div>
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 gap-4 ${modal.data.some(i=>i.blocked) ? 'opacity-50 pointer-events-none' : ''}`}>
          {students.map(s => { const entry = modal.data.find(i=>i.studentId===s.id); return (<div key={s.id} className={`p-4 rounded-2xl border-2 transition-all ${entry ? (entry.type==='special' ? 'border-gray-600 bg-gray-50 ring-2 ring-pink-100' : 'border-blue-400 bg-blue-50') : 'border-gray-100 bg-white'}`}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><img src={s.photo} className="w-10 h-10 rounded-full border bg-white"/><span className="font-bold">{s.name} <span className="text-xs font-normal text-gray-500">{s.grade}학년 / {s.severity}순위</span></span></div></div><div className="space-y-2"><div><span className="text-[10px] font-bold text-gray-400">특수학급 수업 (직접입력)</span> <div className="flex flex-wrap gap-1">{s.targetSubjects?.map(subj=><button key={subj} onClick={()=>{let n=modal.data.filter(i=>i.studentId!==s.id); if(entry?.subject!==subj) n.push({studentId:s.id, subject:subj, type:'special'}); setModal({...modal, data:n})}} className={`px-2 py-1 rounded text-xs font-bold border ${entry?.subject===subj?'bg-gray-800 text-white':'bg-white text-gray-600'}`}>{subj}</button>)}</div></div><div><span className="text-[10px] font-bold text-gray-400">원반 지원 인력</span> <div className="flex flex-wrap gap-1">{staff.map(st=><button key={st.id} onClick={()=>{let n=modal.data.filter(i=>i.studentId!==s.id); if(entry?.staffId!==st.id) n.push({studentId:s.id, staffId:st.id, type:'support'}); setModal({...modal, data:n})}} className={`px-2 py-1 rounded text-xs font-bold border ${entry?.staffId===st.id?'bg-blue-600 text-white':'bg-white text-blue-600'}`}>{st.name}</button>)}</div></div></div></div>) })}
        </div>
        <div className="p-4 border-t flex gap-3"><UI.Btn variant="secondary" onClick={()=>setModal(null)} className="flex-1 py-4 text-lg">취소</UI.Btn><UI.Btn className="bg-gray-800 flex-1 py-4 text-lg" onClick={()=>{setSchedule({...schedule, [semester]: {...schedule[semester], [`${modal.day}-${modal.period}`]: modal.data}}); setModal(null)}}>저장</UI.Btn></div>
      </UI.Modal>}
      {gradeModal && <UI.Modal onClose={()=>setGradeModal(false)} title="학년별 수업/하교 설정" maxWidth="max-w-2xl"><div className="p-6"><div className="flex gap-2 mb-6 border-b">{[1,2,3,4,5,6].map(g => (<button key={g} onClick={() => setActiveGradeTab(g)} className={`px-6 py-3 font-bold rounded-t-xl transition-all ${activeGradeTab === g ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{g}학년</button>))}</div><div className="bg-gray-50 rounded-2xl p-4"><div className="grid grid-cols-6 gap-2 mb-2 text-center text-sm font-bold text-gray-500"><div>교시</div>{days.map(d => <div key={d}>{d}요일</div>)}</div>{[0,1,2,3,4,5].map((pIdx) => (<div key={pIdx} className="grid grid-cols-6 gap-2 mb-2 items-center"><div className="font-bold text-center text-gray-400">{pIdx + 1}교시</div>{[0,1,2,3,4].map((dIdx) => { const a = gradeTimes[activeGradeTab]?.[dIdx]?.[pIdx]; return <div key={dIdx} onClick={() => toggleGradeTime(dIdx, pIdx)} className={`h-10 rounded-lg cursor-pointer flex items-center justify-center border transition-all text-xs font-bold ${a ? 'bg-green-500 border-green-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-300'}`}>{a ? '수업' : '하교'}</div>; })}</div>))}</div><div className="mt-6 flex justify-end"><UI.Btn className="bg-gray-800 px-8" onClick={()=>setGradeModal(false)}>설정 완료</UI.Btn></div></div></UI.Modal>}
      <ConfirmModal isOpen={confirmModal.open} message={confirmModal.type === 'reset' ? "시간표를 초기화하시겠습니까?" : `[${logicMode==='severity'?'중증도 우선':'균등 배정'}] 로직으로 자동 배치하시겠습니까? (기존 지원 내역은 재작성됩니다)`} onConfirm={confirmModal.type === 'reset' ? () => {setSchedule({...schedule, [semester]:{}}); setConfirmModal({open:false});} : autoAssign} onCancel={() => setConfirmModal({ open: false, type: null })} />
    </div>
  );
}

// [9] 예산 관리
function BudgetManager() {
  const [gasUrl] = usePersistentState('gas_app_url', '');
  const [items, setItems] = useState([]); const [budgets, setBudgets] = usePersistentState('budget_definitions', [{ id: 'default', name: '학급운영비', total: 300000 }]);
  const [activeTab, setActiveTab] = useState(budgets[0]?.name || ''); const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null);
  useEffect(() => { if (budgets.length > 0 && !budgets.find(b => b.name === activeTab)) setActiveTab(budgets[0].name); }, [budgets, activeTab]);
  const stats = useMemo(() => {
    const b = budgets.find(b => b.name === activeTab); const total = b ? Number(b.total) : 0;
    const used = items.filter(i => i.category === activeTab).reduce((acc, cur) => acc + Number(cur.amount), 0);
    return { total, used, remain: total - used };
  }, [items, budgets, activeTab]);
  const fetchData = async () => { setLoading(true); const data = await callGAS(gasUrl); if(data) setItems(data.budget || []); setLoading(false); };
  const saveItem = async (form) => {
    setLoading(true); const newItem = form.id ? form : { ...form, id: Date.now() };
    if (form.id) setItems(items.map(i => i.id === form.id ? newItem : i)); else setItems([newItem, ...items]); setModal(null);
    await callGAS(gasUrl, { type: 'budget', ...newItem }); setLoading(false);
  };
  const executeDelete = async () => {
    if (confirm.type === 'item') {
      const id = confirm.data.id; setLoading(true); setItems(items.filter(i => i.id !== id)); setConfirm(null);
      await callGAS(gasUrl, { type: 'budget', action: 'delete', id }); setLoading(false);
    } else if (confirm.type === 'budget') { const nb = budgets.filter(b => b.name !== activeTab); setBudgets(nb); setActiveTab(nb[0].name); setConfirm(null); }
  };
  const saveBudget = (nb) => { if (budgets.some(b => b.name === nb.name)) return alert("중복된 이름"); setBudgets([...budgets, { ...nb, id: Date.now() }]); setActiveTab(nb.name); setModal(null); };
  useEffect(() => { fetchData(); }, [gasUrl]);
  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n); const filtered = items.filter(i => i.category === activeTab);

  return (
    <div className="p-8 h-full flex flex-col"><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-extrabold text-gray-800">학급 예산 관리</h2><div className="flex gap-2"><button onClick={() => setModal('add_budget')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"><Plus size={18}/> 예산 항목 추가</button><button onClick={fetchData} className={`p-2.5 rounded-full bg-white border shadow hover:bg-gray-50 ${loading ? 'animate-spin' : ''}`}><RefreshCcw size={20} className="text-gray-600"/></button></div></div>
      <div className="flex justify-between items-end border-b mb-6"><div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 max-w-[80%]">{budgets.map(b => (<button key={b.id} onClick={() => setActiveTab(b.name)} className={`px-5 py-2 rounded-t-2xl text-sm font-bold whitespace-nowrap transition-all border-b-0 ${activeTab === b.name ? 'bg-gray-800 text-white shadow-lg translate-y-[1px]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{b.name}</button>))}</div><button onClick={()=>{if(budgets.length<=1)return alert('최소 1개 유지'); setConfirm({type:'budget', data:activeTab})}} className="mb-2 text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-1 px-3 py-1 bg-red-50 rounded-lg"><Trash2 size={12}/> 현재 예산 삭제</button></div>
      {activeTab && (<div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-6"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-pink-100 text-pink-600">📂</div><div><div className="text-sm text-gray-400 font-bold mb-1">{activeTab} 잔액</div><div className={`text-3xl font-extrabold ${stats.remain < 0 ? 'text-red-500' : 'text-gray-800'}`}>{fmt(stats.remain)}원</div></div></div><div className="flex gap-8 w-full md:w-auto bg-gray-50 p-4 rounded-2xl justify-around"><div><div className="text-xs text-gray-400 font-bold">배정 예산</div><div className="text-lg font-bold text-blue-600">{fmt(stats.total)}</div></div><div className="w-px bg-gray-200"></div><div><div className="text-xs text-gray-400 font-bold">현재 사용액</div><div className="text-lg font-bold text-red-500">{fmt(stats.used)}</div></div></div></div>)}
      <div className="flex-1 bg-white rounded-[2rem] shadow border overflow-hidden flex flex-col"><div className="p-4 bg-gray-50 border-b flex font-bold text-gray-500 text-xs text-center"><div className="w-24">날짜</div><div className="w-24">사용처</div><div className="flex-1 text-left pl-4">내역</div><div className="w-24 text-right pr-4">금액</div><div className="w-16">관리</div></div><div className="flex-1 overflow-y-auto custom-scrollbar">{filtered.length > 0 ? filtered.map(item => (<div key={item.id} className="flex items-center p-4 border-b hover:bg-gray-50 transition-colors text-sm"><div className="w-24 text-center text-gray-500 text-xs">{item.date}</div><div className="w-24 text-center"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold truncate block">{item.vendor}</span></div><div className="flex-1 text-left pl-4 font-bold text-gray-700">{item.item}{item.memo && <span className="text-xs text-gray-400 font-normal ml-2">- {item.memo}</span>}</div><div className="w-24 text-right pr-4 font-bold text-red-500">-{fmt(item.amount)}</div><div className="w-16 flex justify-center gap-2"><button onClick={() => setModal({ type: 'item', data: item })} className="text-gray-400 hover:text-blue-500"><Edit2 size={16}/></button><button onClick={() => setConfirm({type:'item', data:item})} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></div></div>)) : <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><Coins size={48} className="mb-4"/><p>지출 내역이 없습니다.</p></div>}</div></div>
      {activeTab && <button onClick={() => setModal({ type: 'item', data: null })} className="fixed bottom-8 right-8 w-16 h-16 bg-gray-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-20"><Edit2 size={28}/></button>}
      {modal === 'add_budget' && <UI.Modal onClose={() => setModal(null)} title="새 예산 항목 추가" maxWidth="max-w-sm"><BudgetDefForm onSave={saveBudget} onClose={() => setModal(null)} /></UI.Modal>}
      {modal?.type === 'item' && <UI.Modal onClose={() => setModal(null)} title={modal.data ? "수정" : "기록"} maxWidth="max-w-sm"><BudgetForm activeTab={activeTab} initialData={modal.data} onSave={saveItem} onClose={() => setModal(null)} /></UI.Modal>}
      <ConfirmModal isOpen={!!confirm} message={confirm?.type === 'budget' ? `'${confirm?.data}' 예산 항목을 삭제하시겠습니까?` : "삭제하시겠습니까? (시트 반영)"} onConfirm={executeDelete} onCancel={() => setConfirm(null)} />
    </div>
  );
}
function BudgetDefForm({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', total: '' });
  return <div className="p-6"><UI.Input label="예산 항목 이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 학급운영비, 학습준비물비" className="mb-4"/><UI.Input label="배정 금액" type="number" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} placeholder="숫자만 입력" className="mb-6"/><div className="flex gap-2"><UI.Btn variant="secondary" onClick={onClose} className="flex-1">취소</UI.Btn><UI.Btn onClick={() => { if (!form.name || !form.total) return alert('모두 입력해주세요.'); onSave(form); }} className="flex-1 bg-gray-800">생성</UI.Btn></div></div>;
}
function BudgetForm({ activeTab, initialData, onSave, onClose }) {
  const [form, setForm] = useState(initialData || { date: new Date().toISOString().slice(0, 10), vendor: '', item: '', amount: '', memo: '', category: activeTab });
  return <div className="p-6 space-y-4"><UI.Input label="날짜" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /><div className="grid grid-cols-2 gap-4"><UI.Input label="사용처 (상호명)" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="예: 쿠팡, 다이소" /><UI.Input label="금액" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="숫자만 입력" /></div><UI.Input label="내역 (품목)" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} placeholder="예: 만들기 재료, 간식" /><UI.Input label="메모 (선택)" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="비고 사항" /><div className="flex gap-2 mt-6"><UI.Btn variant="secondary" onClick={onClose} className="flex-1">취소</UI.Btn><UI.Btn onClick={() => { if (!form.vendor || !form.item || !form.amount) return alert('필수 항목을 입력해주세요.'); onSave(form); }} className="flex-1 bg-blue-600">{initialData ? '수정' : '기록'}</UI.Btn></div></div>;
}

// [10] 개별화 교육 (IEP)
function EducationManager({ students }) {
  const [gasUrl] = usePersistentState('gas_app_url', '');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [iepData, setIepData] = useState({}); const [meetingList, setMeetingList] = useState([]); const [loading, setLoading] = useState(false); const [confirm, setConfirm] = useState(null);
  const fetchData = async () => { setLoading(true); const data = await callGAS(gasUrl); if(data) { const f = {}; (data.iep||[]).forEach(r => f[`${r.studentId}_${r.month}`] = r); setIepData(f); setMeetingList(data.meetings || []); } setLoading(false); };
  useEffect(() => { fetchData(); }, [gasUrl]);
  const saveDaily = async (studentId, month, record) => { setLoading(true); setIepData(p => ({ ...p, [`${studentId}_${month}`]: record })); await callGAS(gasUrl, { type: 'iep', studentId, month, ...record }); setLoading(false); };
  const saveMeeting = async (mData) => { setLoading(true); const nM = mData.id ? mData : { ...mData, id: Date.now() }; setMeetingList(mData.id ? meetingList.map(m => m.id === mData.id ? nM : m) : [nM, ...meetingList]); await callGAS(gasUrl, { type: 'iep_meeting', ...nM }); setLoading(false); };
  const executeDelete = async () => { const id = confirm.id; setLoading(true); setMeetingList(meetingList.filter(m => m.id !== id)); setConfirm(null); await callGAS(gasUrl, { type: 'iep_meeting', action: 'delete', id }); setLoading(false); };

  return (
    <div className="p-8 max-w-7xl mx-auto"><div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-extrabold text-gray-800">개별화 교육 계획 (IEP)</h2><button onClick={fetchData} className={`p-2.5 rounded-full bg-white border shadow hover:bg-gray-50 ${loading ? 'animate-spin' : ''}`}><RefreshCcw size={20} className="text-gray-600"/></button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">{students.map(s => (<div key={s.id} onClick={() => setSelectedStudent(s)} className={`cursor-pointer bg-white p-6 rounded-3xl shadow-lg border-4 ${getStudentColor(s.id)} hover:-translate-y-2 transition-all flex items-center gap-4`}><img src={s.photo} className="w-16 h-16 rounded-full border-2 border-white shadow-sm bg-gray-100 object-cover"/><div><div className="font-bold text-xl text-gray-800">{s.name}</div><div className="text-xs text-gray-500 mt-1">{s.grade}학년 {s.classNumber}반</div></div></div>))}</div>
      {selectedStudent && <UI.Modal onClose={() => setSelectedStudent(null)} title={`${selectedStudent.name} 학생 기록부`} maxWidth="max-w-5xl"><IEPTabContainer student={selectedStudent} iepData={iepData} meetingList={meetingList.filter(m => String(m.studentId) === String(selectedStudent.id))} onSaveDaily={saveDaily} onSaveMeeting={saveMeeting} onDeleteMeeting={(id) => setConfirm({ type: 'delete_meeting', id })} loading={loading} /></UI.Modal>}
      <ConfirmModal isOpen={!!confirm} message="이 협의록을 정말 삭제하시겠습니까? (시트에서도 삭제됩니다)" onConfirm={executeDelete} onCancel={() => setConfirm(null)} />
    </div>
  );
}
function IEPTabContainer({ student, iepData, meetingList, onSaveDaily, onSaveMeeting, onDeleteMeeting, loading }) {
  const [tab, setTab] = useState('daily');
  return <div className="h-[80vh] flex flex-col bg-gray-50"><div className="flex border-b bg-white px-6"><button onClick={() => setTab('daily')} className={`py-4 px-6 font-bold border-b-2 transition-all ${tab === 'daily' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-400'}`}>월별 교육 기록</button><button onClick={() => setTab('meeting')} className={`py-4 px-6 font-bold border-b-2 transition-all ${tab === 'meeting' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}>개별화 협의록 ({meetingList.length})</button></div><div className="flex-1 overflow-hidden">{tab === 'daily' ? <IEPDailyForm student={student} data={iepData} onSave={onSaveDaily} loading={loading} /> : <IEPMeetingList student={student} list={meetingList} onSave={onSaveMeeting} onDelete={onDeleteMeeting} />}</div></div>;
}
function IEPDailyForm({ student, data, onSave, loading }) {
  const [semester, setSemester] = useState(1); const months = semester === 1 ? [3, 4, 5, 6, 7] : [8, 9, 10, 11, 12, 1]; const [activeMonth, setActiveMonth] = useState(months[0]); const [temp, setTemp] = useState({ goal: '', material: '', note: '' });
  useEffect(() => { setTemp(data[`${student.id}_${activeMonth}`] || { goal: '', material: '', note: '' }); }, [activeMonth, student, data]);
  return <div className="flex flex-col h-full"><div className="px-6 py-4 flex justify-between items-center bg-white border-b shrink-0"><div className="flex gap-2 overflow-x-auto custom-scrollbar">{months.map(m => (<button key={m} onClick={() => setActiveMonth(m)} className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all ${activeMonth === m ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200'}`}>{m}월</button>))}</div><div className="flex bg-gray-100 p-1 rounded-lg text-xs font-bold shrink-0 ml-4"><button onClick={()=>{setSemester(1);setActiveMonth(3)}} className={`px-3 py-1 rounded ${semester===1?'bg-white shadow text-pink-600':'text-gray-400'}`}>1학기</button><button onClick={()=>{setSemester(2);setActiveMonth(8)}} className={`px-3 py-1 rounded ${semester===2?'bg-white shadow text-blue-600':'text-gray-400'}`}>2학기</button></div></div><div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"><div className="flex items-center justify-between pb-4 border-b border-dashed"><div className="flex items-center gap-2"><span className="text-2xl">📝</span><h3 className="font-bold text-lg">{activeMonth}월 활동 기록</h3></div><UI.Btn onClick={() => onSave(student.id, activeMonth, temp)} disabled={loading} className="py-2 px-4 text-sm">{loading ? '저장중' : '저장하기'}</UI.Btn></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><UI.Input label="🎯 이달의 목표" value={temp.goal} onChange={e=>setTemp({...temp, goal:e.target.value})} /><UI.Input label="📚 교재 및 교구" value={temp.material} onChange={e=>setTemp({...temp, material:e.target.value})} /></div><div className="flex flex-col h-64"><label className="text-xs font-bold text-gray-400 mb-1 ml-1">📝 월간 관찰 기록</label><textarea lang="ko" value={temp.note} onChange={e=>setTemp({...temp, note:e.target.value})} className="flex-1 w-full p-4 bg-yellow-50 border border-yellow-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-yellow-300" placeholder="내용 입력" /></div></div></div>;
}
function IEPMeetingList({ student, list, onSave, onDelete }) {
  const [view, setView] = useState('list'); const [editData, setEditData] = useState(null);
  const startEdit = (data) => { setEditData(data || { studentId: student.id, date: new Date().toISOString().slice(0,10), attendees: '', subjects: student.targetSubjects?.join(', ') || '', agreement: '', original: '', summary: '' }); setView('edit'); };
  return view === 'list' ? (<div className="flex flex-col h-full p-6"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">협의록 목록</h3><button onClick={() => startEdit(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"><Plus size={18}/> 새 협의록 작성</button></div><div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">{list.length > 0 ? list.map(m => (<div key={m.id} onClick={() => startEdit(m)} className="bg-white border rounded-xl p-4 hover:shadow-md cursor-pointer transition-all flex justify-between items-center"><div><div className="font-bold text-gray-800 mb-1">{m.date} 협의회</div><div className="text-xs text-gray-500 truncate max-w-md">{m.attendees} 참석 / {m.subjects}</div></div><button onClick={(e) => {e.stopPropagation(); onDelete(m.id)}} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></div>)) : <div className="text-center text-gray-400 py-10">작성된 협의록이 없습니다.</div>}</div></div>) : (<IEPMeetingForm student={student} initialData={editData} onSave={d => { onSave(d); setView('list'); }} onCancel={() => setView('list')} />);
}
function IEPMeetingForm({ student, initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData); const [aiLoading, setAiLoading] = useState(false);
  const toggleRole = (r) => { const roles = (form.attendees||'').split(', ').filter(x=>x); setForm({...form, attendees: roles.includes(r)?roles.filter(x=>x!==r).join(', '):[...roles,r].join(', ')}) };
  const toggleBoilerplate = (text) => { if (form.agreement.includes(text)) { setForm(prev => ({ ...prev, agreement: prev.agreement.replace(text, '').replace(/\n\n/g, '\n').trim() })); } else { setForm(prev => ({ ...prev, agreement: (prev.agreement ? prev.agreement + "\n\n" : "") + text })); } };
  const handleAISummary = async () => {
    const key = localStorage.getItem('google_api_key'); if(!key) return alert("설정 탭에서 Google API 키를 등록해주세요.");
    if(!form.original) return alert("회의록 원본 내용을 먼저 입력해주세요."); setAiLoading(true);
    try { const txt = await callGemini(JSON.parse(key)||key, `당신은 특수교육 전문가입니다. 다음 회의 녹취록(Raw Data)을 분석하여, '공식적인 개별화교육지원팀 협의록'에 들어갈 정돈되고 전문적인 교육 용어로 요약 정리해주세요. 문체는 건조하고 명확하게 작성하세요.\n\n[녹취록]: ${form.original}`); if(txt) setForm(p=>({...p, summary:txt})); else alert("요약 결과를 가져오지 못했습니다."); } catch(e){ alert("AI 요약 실패: " + e.message); } finally { setAiLoading(false); }
  };
  const BOILERPLATES = [ { label: "신체적 개입", text: "본인 및 타인의 안전을 위협하는 돌발행동(자해, 타해 등) 발생 시, 교사가 즉각적인 신체적 개입(손목 가이드, 타임아웃 등)을 통해 안전을 확보하는 것에 대해 보호자가 충분히 인지하고 동의함." }, { label: "교육과정 조정", text: "통합학급 수업 중 학생의 현행 수준과 특성을 고려하여, 특수교사가 별도의 학습지 제공 또는 수정된 과제를 제시하는 것에 동의함." }, { label: "행동 중재", text: "긍정적 행동 지원을 위해 강화물(간식, 토큰 등) 사용 및 타임아웃 절차를 적용하며, 가정에서도 일관된 지도를 연계하기로 함." }, { label: "응급 처치", text: "응급 상황 발생 시 학교의 안전 매뉴얼에 따라 조치하며, 보호자에게 즉시 연락 취함. 연락이 닿지 않을 경우 병원 이송 등에 동의함." } ];

  return (
    <div className="flex flex-col h-full bg-white"><div className="p-4 border-b flex items-center justify-between bg-gray-50"><h3 className="font-bold">📝 협의록 작성</h3><div className="flex gap-2"><button onClick={onCancel} className="px-4 py-2 bg-white border rounded-lg text-sm font-bold">취소</button><button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">저장하기</button></div></div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6"><div className="grid grid-cols-2 gap-6 mb-6"><UI.Input label="협의 날짜" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /><div><label className="block text-xs font-bold text-gray-400 mb-2 ml-1">참석자</label><div className="flex gap-3">{[{k:'parent', l:'보호자'}, {k:'special', l:'특수교사'}, {k:'homeroom', l:'담임교사'}, {k:'vice', l:'교감'}].map(r => (<button key={r.k} onClick={() => toggleRole(r.l)} className={`px-3 py-2 rounded-lg text-sm font-bold border ${(form.attendees||'').includes(r.l) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>{r.l}</button>))}</div></div></div>
        <div className="space-y-4 mb-6"><UI.Input label="개별화교육 과목" value={form.subjects} onChange={e => setForm({...form, subjects: e.target.value})} placeholder="예: 국어, 수학" /><div><label className="block text-xs font-bold text-gray-400 mb-1 ml-1">🤝 행동 중재 및 신체적 개입 동의</label><textarea lang="ko" value={form.agreement} onChange={e => setForm({...form, agreement: e.target.value})} className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm focus:ring-2 focus:ring-red-200 outline-none h-24 resize-none" placeholder="협의된 동의 내용을 입력하세요." /><div className="mt-2 flex flex-wrap gap-2"><span className="text-xs font-bold text-gray-400 flex items-center mr-1">⚡ 상용구(토글):</span>{BOILERPLATES.map((bp, idx) => { const isActive = form.agreement.includes(bp.text); return <button key={idx} onClick={() => toggleBoilerplate(bp.text)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${isActive ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{isActive ? '✓ ' : ''}{bp.label}</button> })}</div></div></div>
        <div className="grid grid-cols-2 gap-6 h-64"><div className="flex flex-col"><label className="block text-xs font-bold text-gray-400 mb-1">🎤 회의록 원본 (Raw Data)</label><textarea lang="ko" value={form.original} onChange={e => setForm({...form, original: e.target.value})} className="flex-1 w-full p-3 bg-gray-50 border rounded-xl text-sm resize-none" placeholder="클로바노트 결과 등을 붙여넣으세요." /></div><div className="flex flex-col relative"><label className="block text-xs font-bold text-gray-400 mb-1">🤖 AI 요약 / 정리본</label><textarea lang="ko" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} className="flex-1 w-full p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm resize-none" placeholder="AI가 요약한 내용이 여기에 들어갑니다." /><button onClick={handleAISummary} disabled={aiLoading} className={`absolute bottom-4 right-4 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all ${aiLoading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105'}`}>{aiLoading ? <span className="animate-spin">⌛</span> : <Wand2 size={14}/>} {aiLoading ? '요약 중...' : 'Google AI 자동 요약'}</button></div></div></div>
    </div>
  );
}

// [11] 설정 및 기타
function SettingsPage({ storedPw, setStoredPw, security, setSecurity, showGlobalError }) {
  const [apiKey, setApiKey] = usePersistentState('google_api_key', ''); 
  const [gasUrl, setGasUrl] = usePersistentState('gas_app_url', ''); // GAS URL 추가
  const [showKey, setShowKey] = useState(false); const r = useRef();
  
  const backup = () => { 
    const d = STORAGE_KEYS.reduce((a, k) => ({ ...a, [k]: localStorage.getItem(k) }), {}); 
    delete d['google_api_key']; delete d['gas_app_url']; // 키와 URL은 백업 제외
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], {type:'json'})); a.download = `teacher_manager_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); 
  };
  
  const restore = (e) => { const rd = new FileReader(); rd.onload = (ev) => { try { const d = JSON.parse(ev.target.result); STORAGE_KEYS.forEach(k => { if(d[k]) localStorage.setItem(k, d[k]) }); alert('데이터가 성공적으로 복구되었습니다.'); window.location.reload(); } catch { showGlobalError('올바르지 않은 백업 파일입니다.'); } }; if(e.target.files[0]) rd.readAsText(e.target.files[0]); };
  
  return (
    <div className="p-8 max-w-2xl mx-auto"><h2 className="text-3xl font-extrabold mb-8 text-gray-800">환경 설정</h2><div className="space-y-6">
      
      {/* API Key 설정 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
        <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Wand2 size={18}/></div><h3 className="font-bold text-lg text-gray-800">Google AI Key</h3></div>
        <div className="relative"><input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm" placeholder="AIzaSy..." /><button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-4 text-gray-400 hover:text-blue-600">{showKey ? <User size={18}/> : <Lock size={18}/>}</button></div>
      </div>

      {/* GAS URL 설정 (추가됨) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-100">
        <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><LinkIcon size={18}/></div><h3 className="font-bold text-lg text-gray-800">Google Apps Script URL</h3></div>
        <div className="bg-green-50 p-4 rounded-xl text-xs text-green-700 mb-4 leading-relaxed"><b>🔗 배포된 웹앱 URL을 입력해주세요.</b><br/> 예산 관리와 IEP 데이터가 이 주소의 시트로 저장됩니다.</div>
        <input type="text" value={gasUrl} onChange={(e) => setGasUrl(e.target.value)} className="w-full p-4 bg-white border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 font-mono text-sm" placeholder="https://script.google.com/macros/s/..." />
      </div>

      {/* 데이터 관리 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"><Database size={18}/></div><h3 className="font-bold text-lg text-gray-800">데이터 백업 및 복구</h3></div><div className="flex gap-4"><button onClick={backup} className="flex-1 p-4 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"><Download size={20}/> 백업 파일 다운로드</button><button onClick={() => r.current.click()} className="flex-1 p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"><Upload size={20}/> 백업 파일 불러오기</button><input type="file" ref={r} onChange={restore} className="hidden" accept=".json"/></div><div className="mt-6 pt-4 border-t"><button onClick={() => { if(confirm('정말 초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); }}} className="w-full py-3 text-red-400 text-sm font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"><Trash2 size={16}/> 앱 초기화</button></div></div></div></div>
  );
}

// [12] 사진 관리 (다중 업로드 + 슬라이더 적용)
function PhotoManager() {
  const [posts, setPosts] = usePersistentState('class_photos', []); 
  const [modal, setModal] = useState(null);

  // [수정사항 2] 다중 이미지 저장 구조로 변경 (기존 데이터 호환 고려)
  const addPost = (data) => {
    // data.images: array of base64 strings
    setPosts([{ ...data, id: Date.now(), date: new Date().toLocaleDateString() }, ...posts]);
    setModal(null);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800">학급 앨범 ({posts.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} onClick={() => setModal({ type: 'view', data: post })} className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform group">
            <div className="aspect-square bg-gray-100 relative">
              {/* 첫 번째 이미지만 썸네일로 표시 */}
              <img src={post.images ? post.images[0] : post.url} className="w-full h-full object-cover" />
              {post.images && post.images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <MoreHorizontal size={12}/> +{post.images.length - 1}
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-bold text-gray-800 truncate">{post.caption || '무제'}</p>
              <p className="text-xs text-gray-400 mt-1">{post.date}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setModal({ type: 'upload' })} className="fixed bottom-8 right-8 w-16 h-16 bg-pink-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-20"><Plus size={32}/></button>
      
      {modal?.type === 'upload' && (
        <UI.Modal onClose={() => setModal(null)} title="새 사진 올리기" maxWidth="max-w-md">
          <PhotoUploadForm onSave={addPost} />
        </UI.Modal>
      )}
      
      {modal?.type === 'view' && (
        <UI.Modal onClose={() => setModal(null)} maxWidth="max-w-4xl">
          <PhotoViewer post={modal.data} onDelete={(id) => { setPosts(posts.filter(p => p.id !== id)); setModal(null); }} />
        </UI.Modal>
      )}
    </div>
  );
}

// [수정사항 2] 사진 업로드 폼 (다중 선택)
function PhotoUploadForm({ onSave }) {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 모든 파일을 Base64로 변환
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(promises);
      setImages([...images, ...results]);
    } catch (error) {
      alert("이미지 변환 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
        <div onClick={() => fileRef.current.click()} className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-pink-300 hover:text-pink-400 transition-colors">
          <Camera size={24}/>
          <span className="text-xs mt-1 font-bold">추가</span>
        </div>
        {images.map((img, idx) => (
          <div key={idx} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative group">
            <img src={img} className="w-full h-full object-cover"/>
            <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
          </div>
        ))}
      </div>
      <input type="file" ref={fileRef} onChange={handleFileChange} className="hidden" multiple accept="image/*"/>
      <textarea lang="ko" value={caption} onChange={e => setCaption(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none resize-none h-32" placeholder="어떤 활동이었나요?" />
      <UI.Btn onClick={() => { if(images.length === 0) return alert("사진을 1장 이상 선택해주세요."); onSave({ images, caption }); }} className="w-full mt-4 bg-pink-500">게시하기</UI.Btn>
    </div>
  );
}

// [수정사항 2] 사진 뷰어 (슬라이더 구현)
function PhotoViewer({ post, onDelete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = post.images || [post.url]; // 구버전 호환

  return (
    <div className="flex flex-col md:flex-row h-[80vh]">
      {/* 이미지 슬라이더 영역 */}
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        <img src={images[currentIdx]} className="max-w-full max-h-full object-contain" />
        
        {/* 네비게이션 버튼 */}
        {images.length > 1 && (
          <>
            {currentIdx > 0 && (
              <button onClick={() => setCurrentIdx(currentIdx - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm"><ChevronLeft size={24}/></button>
            )}
            {currentIdx < images.length - 1 && (
              <button onClick={() => setCurrentIdx(currentIdx + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm"><ChevronRight size={24}/></button>
            )}
            {/* 인디케이터 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentIdx ? 'bg-white scale-110' : 'bg-white/30'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="w-full md:w-96 bg-white p-6 border-l flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold">T</div>
          <div>
            <p className="font-bold text-sm text-gray-800">선생님</p>
            <p className="text-xs text-gray-400">{post.date}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
        </div>
        <div className="pt-6 border-t mt-4">
          <button onClick={() => { if(confirm("정말 삭제하시겠습니까?")) onDelete(post.id); }} className="text-red-400 text-sm font-bold flex items-center gap-2 hover:text-red-600"><Trash2 size={16}/> 게시물 삭제</button>
        </div>
      </div>
    </div>
  );
}

function RecoveryModal({ securityData, onClose, onSuccess, onError }) {
  const [s, setS] = useState(1); const [a, setA] = useState(''); const [p, setP] = useState('');
  return <UI.Modal onClose={onClose}><div className="p-6 text-center">{s===1 ? <><div className="font-bold mb-4">Q. {securityData?.question}</div><UI.Input value={a} onChange={e=>setA(e.target.value)} placeholder="정답"/><div className="flex gap-2 mt-4"><UI.Btn variant="secondary" onClick={onClose} className="flex-1">취소</UI.Btn><UI.Btn onClick={()=>a===securityData?.answer?setS(2):onError('오답')} className="flex-1">확인</UI.Btn></div></> : <><UI.Input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="새 비밀번호"/><UI.Btn onClick={()=>onSuccess(p)} className="w-full mt-4">변경</UI.Btn></>}</div></UI.Modal>;
}