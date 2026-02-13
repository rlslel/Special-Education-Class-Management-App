import React, { useState, useRef } from 'react';
import { Wand2, User, Lock, Link as LinkIcon, Database, Download, Upload, Trash2 } from 'lucide-react';
import { usePersistentState, STORAGE_KEYS } from '../utils/helpers';

export default function SettingsPage({ storedPw, setStoredPw, security, setSecurity, showGlobalError }) {
  const [apiKey, setApiKey] = usePersistentState('google_api_key', ''); 
  const [gasUrl, setGasUrl] = usePersistentState('gas_app_url', ''); 
  const [showKey, setShowKey] = useState(false); 
  const r = useRef();
  
  const backup = () => { 
    const d = STORAGE_KEYS.reduce((a, k) => ({ ...a, [k]: localStorage.getItem(k) }), {}); 
    delete d['google_api_key']; delete d['gas_app_url']; 
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], {type:'json'})); a.download = `teacher_manager_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); 
  };
  
  const restore = (e) => { 
    const rd = new FileReader(); 
    rd.onload = (ev) => { 
      try { 
        const d = JSON.parse(ev.target.result); 
        STORAGE_KEYS.forEach(k => { if(d[k]) localStorage.setItem(k, d[k]) }); 
        alert('데이터가 성공적으로 복구되었습니다.'); 
        window.location.reload(); 
      } catch { 
        showGlobalError('올바르지 않은 백업 파일입니다.'); 
      } 
    }; 
    if(e.target.files[0]) rd.readAsText(e.target.files[0]); 
  };
  
  return (
    <div className="p-8 max-w-2xl mx-auto"><h2 className="text-3xl font-extrabold mb-8 text-gray-800">환경 설정</h2><div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
        <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Wand2 size={18}/></div><h3 className="font-bold text-lg text-gray-800">Google AI Key</h3></div>
        <div className="relative"><input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm" placeholder="AIzaSy..." /><button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-4 text-gray-400 hover:text-blue-600">{showKey ? <User size={18}/> : <Lock size={18}/>}</button></div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-100">
        <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><LinkIcon size={18}/></div><h3 className="font-bold text-lg text-gray-800">Google Apps Script URL</h3></div>
        <div className="bg-green-50 p-4 rounded-xl text-xs text-green-700 mb-4 leading-relaxed"><b>🔗 배포된 웹앱 URL을 입력해주세요.</b><br/> 예산 관리와 IEP 데이터가 이 주소의 시트로 저장됩니다.</div>
        <input type="text" value={gasUrl} onChange={(e) => setGasUrl(e.target.value)} className="w-full p-4 bg-white border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 font-mono text-sm" placeholder="https://script.google.com/macros/s/..." />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"><Database size={18}/></div><h3 className="font-bold text-lg text-gray-800">데이터 백업 및 복구</h3></div><div className="flex gap-4"><button onClick={backup} className="flex-1 p-4 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"><Download size={20}/> 백업 파일 다운로드</button><button onClick={() => r.current.click()} className="flex-1 p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"><Upload size={20}/> 백업 파일 불러오기</button><input type="file" ref={r} onChange={restore} className="hidden" accept=".json"/></div><div className="mt-6 pt-4 border-t"><button onClick={() => { if(confirm('정말 초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); }}} className="w-full py-3 text-red-400 text-sm font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"><Trash2 size={16}/> 앱 초기화</button></div></div></div></div>
  );
}