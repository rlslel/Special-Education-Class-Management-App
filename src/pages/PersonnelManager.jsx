import React, { useState } from 'react';
import { Users, Plus, Trash2, Check } from 'lucide-react';
import { UI, ConfirmModal } from '../components/SharedUI';

export default function PersonnelManager({ students, staff, setStaff }) {
  const [modal, setModal] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  
  const saveStaff = (d) => { 
    setStaff(modal.mode === 'add' ? [...staff, { ...d, id: Date.now(), role: modal.type==='practical'?'실무사':'사회복무', type: modal.type }] : staff.map(s => s.id === d.id ? { ...s, ...d } : s)); 
    setModal(null); 
  };
  
  const StaffList = ({ type, title, color }) => (
    <div className="flex-1 flex flex-col"><div className={`p-4 rounded-t-2xl border-b-2 flex justify-between items-center bg-${color}-100 border-${color}-200 text-${color}-800`}><h3 className="font-extrabold flex gap-2"><Users size={20}/> {title}</h3><button onClick={()=>setModal({ type, mode: 'add', data: {} })} className="bg-white/50 p-2 rounded-full hover:bg-white"><Plus size={18}/></button></div><div className="bg-white p-4 rounded-b-2xl shadow-lg border-t-0 space-y-3 min-h-[200px]">{staff.filter(s=>s.type===type).map(s => (<div key={s.id} onClick={() => setModal({ type, mode: 'edit', data: s })} className={`cursor-pointer p-3 rounded-xl border flex justify-between items-center hover:-translate-y-1 transition-transform bg-${color}-50 border-${color}-200`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">👤</div><div><div className="font-bold">{s.name}</div>{s.assignedStudentIds?.length > 0 && <div className="text-[10px] text-gray-500 mt-1">담당: {s.assignedStudentIds.map(id => students.find(s => s.id === id)?.name).join(', ')}</div>}</div></div><button onClick={(e) => { e.stopPropagation(); setConfirmModal({open: true, id: s.id}); }} className="text-red-400 p-2"><Trash2 size={16}/></button></div>))}</div></div>
  );
  
  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto"><h2 className="text-3xl font-extrabold text-gray-800 mb-8">지원인력 관리</h2><div className="flex flex-col md:flex-row gap-6 max-w-6xl mb-8"><StaffList type="practical" title="특수교육 실무사" color="blue"/><StaffList type="social" title="사회복무요원" color="green"/></div>
      {modal && <UI.Modal onClose={()=>setModal(null)} title={`${modal.type==='practical'?'실무사':'사회복무'} ${modal.mode==='add'?'등록':'수정'}`} maxWidth="max-w-md"><form onSubmit={e=>{e.preventDefault(); saveStaff(modal.data);}} className="p-6"><UI.Input label="이름" value={modal.data.name||''} onChange={e=>setModal({...modal, data:{...modal.data, name:e.target.value}})} required className="mb-6"/><div className="mb-6"><label className="text-xs font-bold text-gray-400">전담 지원 학생</label><div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">{students.map(s=><div key={s.id} onClick={()=>{const ids=modal.data.assignedStudentIds||[]; setModal({...modal, data:{...modal.data, assignedStudentIds:ids.includes(s.id)?ids.filter(i=>i!==s.id):[...ids,s.id]}})}} className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${modal.data.assignedStudentIds?.includes(s.id)?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${modal.data.assignedStudentIds?.includes(s.id)?'bg-blue-500 border-blue-500':''}`}>{modal.data.assignedStudentIds?.includes(s.id)&&<Check size={12} className="text-white"/>}</div><span className="text-sm font-bold">{s.name}</span></div>)}</div></div><div className="flex gap-2"><UI.Btn type="button" variant="secondary" className="flex-1" onClick={()=>setModal(null)}>취소</UI.Btn><UI.Btn type="submit" variant="blue" className="flex-1">저장</UI.Btn></div></form></UI.Modal>}
      <ConfirmModal isOpen={confirmModal.open} message="삭제하시겠습니까?" onConfirm={()=>{setStaff(staff.filter(x=>x.id!==confirmModal.id)); setConfirmModal({open: false})}} onCancel={() => setConfirmModal({ open: false })} />
    </div>
  );
}