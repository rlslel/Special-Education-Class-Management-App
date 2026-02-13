import React, { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCcw, Trash2, Coins, Edit2 } from 'lucide-react';
import { usePersistentState, callGAS } from '../utils/helpers';
import { UI, ConfirmModal } from '../components/SharedUI';

export default function BudgetManager() {
  const [gasUrl] = usePersistentState('gas_app_url', '');
  const [items, setItems] = useState([]); 
  const [budgets, setBudgets] = usePersistentState('budget_definitions', [{ id: 'default', name: '학급운영비', total: 300000 }]);
  const [activeTab, setActiveTab] = useState(budgets[0]?.name || ''); 
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); 
  const [confirm, setConfirm] = useState(null);
  
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
  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n); 
  const filtered = items.filter(i => i.category === activeTab);

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