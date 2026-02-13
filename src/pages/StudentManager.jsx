import React, { useState, useRef } from 'react';
import { Plus, Check, X, Trash2, Camera, BookOpen } from 'lucide-react';
import { DEFAULT_AVATARS, TARGET_SUBJECTS, PASTEL_COLORS } from '../utils/helpers';
import { UI, ConfirmModal } from '../components/SharedUI';

export default function StudentManager({ students, setStudents }) {
  const [modal, setModal] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  
  const save = (data) => { 
    setStudents(modal.type === 'add' 
      ? [...students, { ...data, id: Date.now(), photo: DEFAULT_AVATARS[students.length % 6] }] 
      : students.map(s => s.id === data.id ? data : s)); 
    setModal({ type: 'success' }); 
  };
  
  return (
    <div className="p-8 max-w-7xl mx-auto"><div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-extrabold text-gray-800">학생 관리</h2><UI.Btn onClick={() => setModal({ type: 'add' })} className="bg-gray-800 px-6 rounded-full"><Plus size={20}/> 학생 등록</UI.Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {students.map(s => {
          const theme = s.themeColor || PASTEL_COLORS[s.id % 20] || PASTEL_COLORS[0];
          const cardClass = `${theme.bg} ${theme.border} ${theme.text}`;
          return (
            <div key={s.id} onClick={() => setModal({ type: 'edit', data: s })} className={`cursor-pointer rounded-3xl border-4 ${cardClass} bg-white shadow-lg hover:-translate-y-2 transition-all overflow-hidden`}>
              <div className="p-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 mb-4 flex items-center justify-center"><img src={s.photo} className="w-full h-full object-cover"/></div>
                <div className="px-4 py-1 rounded-full mb-4 bg-white/50 border"><h2 className="text-xl font-bold text-gray-800">{s.name}</h2></div>
                <div className="w-full text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between"><span>성별/형태</span><b>{s.gender || '미상'} / {s.integrationType || '미정'}</b></div>
                  <div className="flex justify-between"><span>학년/반</span><b>{s.grade}학년 {s.classNumber}반</b></div>
                  <div className="flex justify-between"><span>중증도</span><b>{s.severity || '-'}순위</b></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal?.type==='success' && <UI.Modal onClose={()=>setModal(null)} maxWidth="max-w-sm"><div className="p-8 text-center"><Check size={48} className="text-green-500 mx-auto mb-4"/><h3 className="text-xl font-bold mb-6">저장 완료!</h3><UI.Btn className="w-full bg-green-500" onClick={()=>setModal(null)}>확인</UI.Btn></div></UI.Modal>}
      {modal && modal.type !== 'success' && <StudentModal student={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={(id) => setConfirmModal({ open: true, id })} isEdit={modal.type === 'edit'} />}
      <ConfirmModal isOpen={confirmModal.open} message="정말 삭제하시겠습니까?" onConfirm={()=>{setStudents(students.filter(s=>s.id!==confirmModal.id)); setConfirmModal({open:false})}} onCancel={()=>setConfirmModal({open:false})} />
    </div>
  );
}

function StudentModal({ student, onClose, onSave, onDelete, isEdit }) {
  const [form, setForm] = useState(student || { 
    name: '', grade: '1', classNumber: '', severity: '3', teacher: '', targetSubjects: [],
    gender: '남', integrationType: '완전통합', themeColor: PASTEL_COLORS[0]
  });
  const fRef = useRef();
  
  const handlePhoto = (e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setForm(p => ({...p, photo: r.result})); r.readAsDataURL(f); }};
  const toggleSub = (s) => setForm(p => ({...p, targetSubjects: p.targetSubjects.includes(s) ? p.targetSubjects.filter(i => i !== s) : [...p.targetSubjects, s]}));
  
  return (
    <UI.Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6 bg-gray-50 flex flex-col items-center relative"><button onClick={onClose} className="absolute top-4 right-4"><X size={20}/></button>{isEdit && <button onClick={() => onDelete(form.id)} className="absolute top-4 left-4 text-red-500"><Trash2 size={20}/></button>}<div className="relative group w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mb-4" onClick={()=>fRef.current.click()}><img src={form.photo} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"><Camera className="text-white"/></div><input type="file" ref={fRef} onChange={handlePhoto} className="hidden" accept="image/*"/></div><input lang="ko" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="text-3xl font-extrabold bg-transparent text-center outline-none w-40" placeholder="이름" /></div>
      <div className="p-8 h-[50vh] overflow-y-auto custom-scrollbar space-y-6">
        
        {/* 성별 및 통합형태 토글 영역 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['남', '여'].map(g => (
              <button key={g} type="button" onClick={() => setForm({...form, gender: g})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.gender === g ? 'bg-white shadow text-pink-500' : 'text-gray-400'}`}>{g}</button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['완전통합', '시간제'].map(t => (
              <button key={t} type="button" onClick={() => setForm({...form, integrationType: t})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.integrationType === t ? 'bg-white shadow text-blue-500' : 'text-gray-400'}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6"><div className="space-y-3"><div className="flex gap-2"><UI.Select label="학년" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} options={[1,2,3,4,5,6].map(g => ({value: g, label: `${g}학년`}))} /><UI.Input label="반" value={form.classNumber} onChange={e => setForm({...form, classNumber: e.target.value})} /></div><UI.Input label="중증도 순위 (1~3)" type="number" min="1" max="3" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} placeholder="숫자만 입력" /><UI.Input label="담임 선생님" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} /></div>
        <div className="space-y-3"><UI.Input label="생년월일" type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} /><UI.Select label="장애 영역" value={form.disabilityType} onChange={e => setForm({...form, disabilityType: e.target.value})} options={['지적장애', '자폐성장애', '시각장애', '청각장애', '지체장애', '발달지체', '정서행동장애', '기타'].map(v => ({value: v, label: v}))} /></div></div>
        
        {/* 20색 파스텔 컬러 팔레트 영역 */}
        <div className="bg-gray-50 p-4 rounded-2xl">
          <h3 className="font-bold text-gray-500 mb-3 text-sm">🎨 학생 테마 색상 지정</h3>
          <div className="flex flex-wrap gap-2">
            {PASTEL_COLORS.map(c => (
              <button key={c.id} type="button" onClick={() => setForm({...form, themeColor: c})} 
                className={`w-8 h-8 rounded-full border-2 transition-all ${form.themeColor?.id === c.id ? 'border-gray-800 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c.hex }} 
              />
            ))}
          </div>
        </div>

        <div><h3 className="font-bold text-gray-400 border-b pb-2 mb-2 flex items-center gap-2"><BookOpen size={16}/> 대상 과목</h3><div className="flex flex-wrap gap-2">{TARGET_SUBJECTS.map(s => <button key={s} onClick={() => toggleSub(s)} className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${form.targetSubjects.includes(s) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-4"><textarea lang="ko" value={form.dreamCardUsage} onChange={e => setForm({...form, dreamCardUsage: e.target.value})} className="p-3 bg-yellow-50 border-yellow-100 border rounded-xl h-20 text-sm resize-none" placeholder="꿈꾸미 카드 메모" /><textarea lang="ko" value={form.jaramiCardUsage} onChange={e => setForm({...form, jaramiCardUsage: e.target.value})} className="p-3 bg-green-50 border-green-100 border rounded-xl h-20 text-sm resize-none" placeholder="자라미 카드 메모" /></div>
      </div>
      <div className="p-4 border-t flex justify-end"><UI.Btn onClick={() => onSave(form)} className="px-8 bg-gray-800">저장하기</UI.Btn></div>
    </UI.Modal>
  );
}