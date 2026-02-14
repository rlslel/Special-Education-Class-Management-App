import React, { useState, useRef } from 'react';
import { Save, Lock, School, Key, Download, Upload, AlertTriangle, Database } from 'lucide-react';
import { UI } from '../components/SharedUI';
import { usePersistentState } from '../utils/helpers';

export default function SettingsPage({ storedPw, setStoredPw, showGlobalError }) {
  // 상태 관리
  const [classInfo, setClassInfo] = usePersistentState('class_info_data', { official: '', nickname: '' });
  const [apiKey, setApiKey] = usePersistentState('gemini_api_key', '');
  
  const [classForm, setClassForm] = useState({ official: classInfo.official, nickname: classInfo.nickname });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [apiForm, setApiForm] = useState(apiKey);
  
  const fileInputRef = useRef(null);

  // 학급 정보 저장
  const handleClassInfoSave = (e) => {
    e.preventDefault();
    setClassInfo(classForm);
    alert('학급 정보가 성공적으로 저장되었습니다! 🎈\n(인쇄 시 제목으로 반영됩니다)');
  };

  // 비밀번호 변경
  const handlePwChange = (e) => {
    e.preventDefault();
    if (pwForm.current !== storedPw) return showGlobalError('현재 비밀번호가 일치하지 않습니다.');
    if (pwForm.newPw.length < 4) return showGlobalError('새 비밀번호는 4자리 이상이어야 합니다.');
    if (pwForm.newPw !== pwForm.confirm) return showGlobalError('새 비밀번호가 일치하지 않습니다.');
    
    setStoredPw(pwForm.newPw);
    alert('비밀번호가 안전하게 변경되었습니다. 🔒');
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  // API 키 저장
  const handleApiSave = (e) => {
    e.preventDefault();
    setApiKey(apiForm);
    alert('Gemini API 키가 저장되었습니다! 이제 AI 기능을 사용할 수 있습니다. ✨');
  };

  // 백업 (내보내기)
  const handleBackup = () => {
    const data = { ...localStorage };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `special_class_backup_${new Date().getTime()}.json`; 
    a.click();
  };

  // 복원 (불러오기)
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        alert('데이터 복원이 완료되었습니다! 시스템을 재시작합니다.');
        window.location.reload();
      } catch(err) {
        showGlobalError('잘못된 백업 파일입니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-8">환경설정</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* 1. 학급 정보 설정 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-50 text-pink-500 rounded-xl"><School size={24}/></div>
            <h3 className="text-xl font-bold text-gray-800">학급 정보 설정</h3>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 mb-4 leading-relaxed">
            <p><b>공식 명칭:</b> 가정통신문(개인) 시간표 인쇄 제목 (예: 도움3반)</p>
            <p className="mt-1"><b>애칭:</b> 교실 부착용(전체) 시간표 인쇄 제목 (예: 사랑반)</p>
          </div>
          <form onSubmit={handleClassInfoSave} className="flex flex-col gap-3 flex-1">
            <UI.Input label="학급 공식 명칭" placeholder="예: 도움3반" value={classForm.official} onChange={e => setClassForm({...classForm, official: e.target.value})} />
            <UI.Input label="학급 애칭 (선택)" placeholder="예: 사랑반" value={classForm.nickname} onChange={e => setClassForm({...classForm, nickname: e.target.value})} />
            <div className="mt-auto pt-4">
              <UI.Btn type="submit" className="w-full flex items-center justify-center gap-2"><Save size={18}/> 학급 정보 저장</UI.Btn>
            </div>
          </form>
        </div>

        {/* 2. API 키 설정 (AI 기능용) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><Key size={24}/></div>
            <h3 className="text-xl font-bold text-gray-800">AI 연동 (API 키 설정)</h3>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 mb-4 leading-relaxed">
            <p>자동 시간표 최적화 및 <b>학사일정 이미지 분석기</b>를 사용하려면 Google Gemini API 키가 필요합니다. (gemini-2.5-flash 모델 적용)</p>
          </div>
          <form onSubmit={handleApiSave} className="flex flex-col gap-3 flex-1">
            <UI.Input label="Gemini API 키" type="password" placeholder="AIzaSy..." value={apiForm} onChange={e => setApiForm(e.target.value)} />
            <div className="mt-auto pt-4">
              <UI.Btn type="submit" className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600"><Save size={18}/> API 키 저장</UI.Btn>
            </div>
          </form>
        </div>

        {/* 3. 보안 설정 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><Lock size={24}/></div>
            <h3 className="text-xl font-bold text-gray-800">보안 설정</h3>
          </div>
          <form onSubmit={handlePwChange} className="flex flex-col gap-3 flex-1">
            <UI.Input label="현재 비밀번호" type="password" placeholder="••••" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} />
            <UI.Input label="새 비밀번호 (4자리 이상)" type="password" placeholder="••••" value={pwForm.newPw} onChange={e => setPwForm({...pwForm, newPw: e.target.value})} />
            <UI.Input label="새 비밀번호 확인" type="password" placeholder="••••" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} />
            <div className="mt-auto pt-4">
              <UI.Btn type="submit" className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900"><Save size={18}/> 비밀번호 변경</UI.Btn>
            </div>
          </form>
        </div>

        {/* 4. 데이터 백업 및 복원 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-green-500 rounded-xl"><Database size={24}/></div>
            <h3 className="text-xl font-bold text-gray-800">데이터 백업 및 복원</h3>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 mb-6 leading-relaxed flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5"/>
            <p>앱에 저장된 모든 학생, 시간표, 일정 데이터를 파일로 저장하거나 불러옵니다. 기기를 변경할 때 유용합니다.</p>
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <button onClick={handleBackup} className="w-full py-3 bg-green-50 text-green-600 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition flex items-center justify-center gap-2">
              <Download size={18}/> 데이터 백업하기 (JSON)
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} className="w-full py-3 bg-white text-gray-600 font-bold rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition flex items-center justify-center gap-2">
              <Upload size={18}/> 복원 파일 불러오기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}