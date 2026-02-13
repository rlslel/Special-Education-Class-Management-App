import React, { useState, useEffect } from 'react';
import { User, Lock, Calendar, GraduationCap, Image, Settings, Home, Users, Coins, AlertTriangle } from 'lucide-react';
import { SECURITY_QUESTIONS, usePersistentState } from './utils/helpers';
import { UI, RecoveryModal } from './components/SharedUI';

import HomeManager from './pages/HomeManager';
import StudentManager from './pages/StudentManager';
import PersonnelManager from './pages/PersonnelManager';
import ScheduleManager from './pages/ScheduleManager';
import BudgetManager from './pages/BudgetManager';
import EducationManager from './pages/EducationManager';
import PhotoManager from './pages/PhotoManager';
import SettingsPage from './pages/SettingsPage';

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
      if (pwInput === storedPw) setAuth({ ...auth, authenticated: true }); 
      else { setModal({ type: 'error', msg: '비밀번호 불일치' }); setPwInput(''); }
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
  
  // 🔥 [수정됨] MainLayout에 setStoredPw와 setSecurity를 넘겨줍니다!
  return <MainLayout storedPw={storedPw} setStoredPw={setStoredPw} security={security} setSecurity={setSecurity} showGlobalError={msg => setModal({ type: 'error', msg })} />;
}

// 🔥 [수정됨] 전달받은 리모컨들을 props로 받아옵니다.
function MainLayout({ storedPw, setStoredPw, security, setSecurity, showGlobalError }) {
  const [menu, setMenu] = useState('home');
  const [students, setStudents] = usePersistentState('students_data', []);
  const [staff, setStaff] = usePersistentState('staff_data', []);
  const [secCheck, setSecCheck] = useState({ open: false, target: null, input: '' });

  const MENU_ITEMS = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'students', label: '학생관리', icon: User },
    { id: 'schedule', label: '시간표', icon: Calendar },
    { id: 'personnel', label: '지원인력', icon: Users },
    { id: 'education', label: '개별화교육', icon: GraduationCap },
    { id: 'photos', label: '학급앨범', icon: Image },
    { id: 'budget', label: '예산', icon: Coins },
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
      <main className="flex-1 overflow-y-auto relative">{menu === 'settings' ? <SettingsPage storedPw={storedPw} setStoredPw={setStoredPw} security={security} setSecurity={setSecurity} showGlobalError={showGlobalError}/> : <Page {...commonProps} />}</main>
      {secCheck.open && <UI.Modal onClose={() => setSecCheck({ ...secCheck, open: false })} maxWidth="max-w-sm"><div className="p-6 text-center"><Lock size={40} className="mx-auto text-gray-300 mb-4"/><h3 className="text-xl font-bold mb-4">보안 접근 확인</h3><form onSubmit={verify}><UI.Input type="password" autoFocus value={secCheck.input} onChange={e => setSecCheck({...secCheck, input: e.target.value})} className="mb-4 text-center text-lg tracking-widest" placeholder="••••" /><div className="flex gap-2"><UI.Btn type="button" variant="secondary" className="flex-1" onClick={() => setSecCheck({ ...secCheck, open: false })}>취소</UI.Btn><UI.Btn type="submit" className="flex-1">확인</UI.Btn></div></form></div></UI.Modal>}
    </div>
  );
}