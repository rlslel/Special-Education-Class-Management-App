import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, BookOpen } from 'lucide-react';
import { UI, ConfirmModal } from '../components/SharedUI';
import { TARGET_SUBJECTS, DEFAULT_AVATARS, PASTEL_COLORS } from '../utils/helpers';

export default function StudentManager({ students, setStudents, showGlobalError }) {
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    const data = modal.data;
    if (!data.name) return showGlobalError('이름을 입력하세요.');
    
    if (data.id) {
      setStudents(students.map(s => s.id === data.id ? data : s));
    } else {
      setStudents([...students, { ...data, id: Date.now() }]);
    }
    setModal({ open: false, data: null });
  };

  const toggleSubject = (subj) => {
    const ts = modal.data.targetSubjects || [];
    const sh = modal.data.subjectHours || {};
    if (ts.includes(subj)) {
      const newTs = ts.filter(s => s !== subj);
      const newSh = { ...sh };
      delete newSh[subj];
      setModal({ ...modal, data: { ...modal.data, targetSubjects: newTs, subjectHours: newSh } });
    } else {
      setModal({ ...modal, data: { ...modal.data, targetSubjects: [...ts, subj], subjectHours: { ...sh, [subj]: 1 } } });
    }
  };

  const updateHours = (subj, hours) => {
    setModal({ ...modal, data: { ...modal.data, subjectHours: { ...(modal.data.subjectHours || {}), [subj]: Number(hours) } } });
  };

  const openAdd = () => setModal({ open: true, data: { name: '', grade: 1, classNumber: 1, severity: 1, targetSubjects: [], subjectHours: {}, themeColor: PASTEL_COLORS[0], photo: DEFAULT_AVATARS[0] } });

  return (
    <div className="p-8 h-full flex flex-col bg-gray-50/50">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3"><User className="text-pink-500" size={32} /> 학생 관리</h2>
        <UI.Btn onClick={openAdd} className="flex items-center gap-2 shadow-md hover:scale-105 transition-transform"><Plus size={20} /> 학생 등록</UI.Btn>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {students.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
            <User size={64} className="mb-4" />
            <p className="text-lg font-bold">등록된 학생이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {students.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full p-1 shadow-inner border-2" style={{ borderColor: s.themeColor?.hex || '#ccc', backgroundColor: s.themeColor?.hex || '#f3f4f6' }}>
                    <img src={s.photo} alt={s.name} className="w-full h-full rounded-full object-cover bg-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-800">{s.name}</h3>
                    <p className="text-sm font-bold text-gray-400">{s.grade}학년 {s.classNumber}반 / {s.severity}순위</p>
                  </div>
                  <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ open: true, data: s })} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100"><Edit2 size={16} /></button>
                    <button onClick={() => setConfirm(s.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-dashed border-gray-100">
                  <p className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><BookOpen size={12}/> 개별화교육 목표 시수</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.targetSubjects?.length > 0 ? s.targetSubjects.map(subj => (
                      <span key={subj} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border">
                        {subj} <span className="text-pink-500 ml-1">{s.subjectHours?.[subj] || 1}시간</span>
                      </span>
                    )) : <span className="text-xs text-gray-300">설정된 과목이 없습니다.</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal.open && (
        <UI.Modal onClose={() => setModal({ open: false, data: null })} title={modal.data.id ? '학생 정보 수정' : '새 학생 등록'} maxWidth="max-w-2xl">
          {/* 🔥 스크롤 없이 한 화면에 들어오도록 p-4, space-y-3 등 여백과 크기를 대폭 압축했습니다! */}
          <form onSubmit={handleSave} className="p-4 space-y-3">
            
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={modal.data.photo} className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                <UI.Input label="이름" value={modal.data.name} onChange={e => setModal({...modal, data: {...modal.data, name: e.target.value}})} required className="text-sm" />
                <UI.Input label="학년" type="number" min="1" max="6" value={modal.data.grade} onChange={e => setModal({...modal, data: {...modal.data, grade: Number(e.target.value)}})} className="text-sm" />
                <UI.Input label="반" type="number" min="1" value={modal.data.classNumber} onChange={e => setModal({...modal, data: {...modal.data, classNumber: Number(e.target.value)}})} className="text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <UI.Select label="장애 중증도" value={modal.data.severity} onChange={e => setModal({...modal, data: {...modal.data, severity: Number(e.target.value)}})} options={[1,2,3,4,5].map(n => ({ value: n, label: `${n}순위` }))} className="text-sm py-1" />
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">테마 색상</label>
                <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                  {PASTEL_COLORS.slice(0, 10).map((color, i) => (
                    <button key={i} type="button" onClick={() => setModal({...modal, data: {...modal.data, themeColor: color}})} className={`w-6 h-6 rounded-full shrink-0 border-2 transition-transform ${modal.data.themeColor?.id === color.id ? 'scale-110 border-gray-800' : 'border-transparent'}`} style={{ backgroundColor: color.hex }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label className="block text-xs font-extrabold text-gray-700 mb-2 flex items-center gap-1.5"><BookOpen size={14} className="text-pink-500"/> 특수학급 수업 과목 & 목표 시수 (주당)</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 mb-2">
                {TARGET_SUBJECTS.map(subj => {
                  const isSelected = (modal.data.targetSubjects || []).includes(subj);
                  return (
                    <button key={subj} type="button" onClick={() => toggleSubject(subj)} className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${isSelected ? 'bg-white border-pink-400 text-pink-600 shadow-sm' : 'bg-transparent border-gray-200 text-gray-400 hover:bg-white'}`}>
                      {subj}
                    </button>
                  );
                })}
              </div>
              
              {(modal.data.targetSubjects || []).length > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(modal.data.targetSubjects || []).map(subj => (
                    <div key={subj} className="flex items-center justify-between bg-white px-2 py-1 rounded-md border shadow-sm">
                      <span className="text-[11px] font-bold text-gray-700">{subj}</span>
                      <div className="flex items-center gap-1">
                        <input type="number" min="1" max="10" value={modal.data.subjectHours?.[subj] || 1} onChange={e => updateHours(subj, e.target.value)} className="w-8 text-center bg-gray-50 border rounded p-0.5 text-[11px] font-bold outline-none focus:ring-1 focus:ring-pink-300"/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <UI.Btn type="button" variant="secondary" onClick={() => setModal({ open: false, data: null })} className="flex-1 py-2 text-sm">취소</UI.Btn>
              <UI.Btn type="submit" className="flex-1 bg-gray-800 py-2 text-sm">저장하기</UI.Btn>
            </div>
          </form>
        </UI.Modal>
      )}

      <ConfirmModal isOpen={!!confirm} message="정말 삭제하시겠습니까? 관련된 시간표 데이터에 영향을 줄 수 있습니다." onConfirm={() => { setStudents(students.filter(s => s.id !== confirm)); setConfirm(null); }} onCancel={() => setConfirm(null)} />
    </div>
  );
}