import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckSquare, Edit2, Plus, Trash2, Check, X } from 'lucide-react';
import { usePersistentState, dateString, isSameDay, getCalendarDays, getHolidayName } from '../utils/helpers';

export default function HomeManager() {
  const [schedules, setSchedules] = usePersistentState('teacher_schedules', {});
  const [todos, setTodos] = usePersistentState('teacher_todos_date_v2', {}); 
  const [memos, setMemos] = usePersistentState('class_sticky_memos', []); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState('schedule'); 
  const [isHolidayAdd, setIsHolidayAdd] = useState(false); // 휴일 지정 상태 관리
  
  const PALETTE = { blue: '#405DE6', royal: '#5B51D8', purple: '#833AB4', magenta: '#C13584', pink: '#E1306C', red: '#FD1D1D', orangeRed: '#F56040', orange: '#F77737', yellowOrange: '#FCAF45', yellow: '#FFDC80' };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (inputType === 'memo') {
      const rotation = Math.random() * 4 - 2;
      setMemos([...memos, { id: Date.now(), text: inputText, rotation }]);
    } else {
      const key = dateString(selectedDate);
      // 일정에 isHoliday 값을 포함해서 저장
      const newItem = { id: Date.now(), text: inputText, done: false, isHoliday: inputType === 'schedule' ? isHolidayAdd : false }; 
      if (inputType === 'schedule') {
        setSchedules({ ...schedules, [key]: [...(schedules[key] || []), { id: Date.now(), title: inputText, isHoliday: isHolidayAdd }] });
        setIsHolidayAdd(false); // 저장 후 체크 해제
      }
      else setTodos({ ...todos, [key]: [...(todos[key] || []), newItem] });
    }
    setInputText('');
  };

  const deleteItem = (type, id) => {
    const key = dateString(selectedDate);
    if (type === 'schedule') setSchedules({ ...schedules, [key]: schedules[key].filter(s => s.id !== id) });
    else if (type === 'todo') setTodos({ ...todos, [key]: todos[key].filter(t => t.id !== id) });
    else if (type === 'memo') setMemos(memos.filter(m => m.id !== id));
  };

  const toggleTodo = (id) => {
    const key = dateString(selectedDate);
    setTodos({ ...todos, [key]: todos[key].map(t => t.id === id ? { ...t, done: !t.done } : t) });
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-7xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] border border-white relative">
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
          <div className="grid grid-cols-7 text-center mb-4">{['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-xs font-bold text-gray-300">{d}</div>)}</div>
          <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2">
            {getCalendarDays(currentDate).map((date, i) => {
              if (!date) return <div key={i} />;
              const dStr = dateString(date);
              const isSel = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              
              // 휴일 계산 로직 (주말 + 법정 공휴일 + 사용자가 추가한 휴일)
              const officialHoliday = getHolidayName(date);
              const manualHolidays = (schedules[dStr] || []).filter(s => s.isHoliday);
              const hasManualHoliday = manualHolidays.length > 0;
              const isRedDay = date.getDay() === 0 || date.getDay() === 6 || officialHoliday || hasManualHoliday;

              return (
                <div key={i} onClick={() => setSelectedDate(date)} className="flex flex-col items-center justify-center cursor-pointer relative group">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${isSel ? 'text-white shadow-lg scale-110' : (isRedDay ? 'text-red-500 group-hover:bg-red-50' : 'text-gray-600 group-hover:bg-gray-50')}`} 
                       style={{ background: isSel ? `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.pink})` : (isToday ? '#F3F4F6' : 'transparent') }}>
                    {date.getDate()}
                  </div>
                  {/* 휴일 이름 표시기 */}
                  <div className="h-3 flex items-center justify-center mt-0.5">
                     <span className="text-[9px] text-red-500 font-bold truncate max-w-[40px]">
                       {officialHoliday || (hasManualHoliday ? manualHolidays[0].title : '')}
                     </span>
                  </div>
                  <div className="flex gap-0.5 h-1">
                    {(schedules[dStr]?.length > 0) && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PALETTE.blue }}></div>}
                    {(todos[dStr]?.length > 0) && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PALETTE.orangeRed }}></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          <div className="p-8 pb-4 shrink-0 z-20 bg-white/80 backdrop-blur-md">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: PALETTE.blue }}>Daily Plan</p>
                <h2 className="text-4xl font-extrabold text-gray-800">{selectedDate.getDate()} <span className="text-xl font-medium text-gray-400">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][selectedDate.getDay()]}</span></h2>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {[ { id: 'schedule', icon: Clock, color: PALETTE.blue, label: '일정' }, { id: 'todo', icon: CheckSquare, color: PALETTE.red, label: '할일' }, { id: 'memo', icon: Edit2, color: PALETTE.yellowOrange, label: '메모' } ].map(mode => (
                  <button key={mode.id} onClick={() => setInputType(mode.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inputType === mode.id ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} style={{ color: inputType === mode.id ? mode.color : '' }}><mode.icon size={14}/> {mode.label}</button>
                ))}
              </div>
            </div>
            <form onSubmit={handleAdd} className="relative group shadow-sm rounded-2xl flex flex-col gap-2">
              <div className="relative">
                <input lang="ko" value={inputText} onChange={e => setInputText(e.target.value)} className="w-full bg-gray-50 pl-5 pr-16 py-4 rounded-2xl border-2 border-transparent outline-none transition-all placeholder-gray-400 text-gray-700 font-medium" style={{ borderColor: inputType === 'schedule' ? `${PALETTE.blue}20` : inputType === 'todo' ? `${PALETTE.red}20` : `${PALETTE.yellowOrange}40` }} placeholder={inputType === 'memo' ? "잊지 말아야 할 내용을 적어두세요 (스티커 메모)" : inputType === 'schedule' ? "새로운 일정을 입력하세요" : "오늘 할 일을 입력하세요"} />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white transition-transform hover:scale-105 active:scale-95" style={{ background: inputType === 'memo' ? PALETTE.yellowOrange : inputType === 'schedule' ? PALETTE.blue : PALETTE.red }}><Plus size={18}/></button>
              </div>
              {inputType === 'schedule' && (
                <label className="flex items-center gap-2 px-2 cursor-pointer w-max">
                  <input type="checkbox" checked={isHolidayAdd} onChange={e => setIsHolidayAdd(e.target.checked)} className="w-4 h-4 text-pink-500 rounded focus:ring-pink-400 border-gray-300" />
                  <span className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">이 일정을 휴일(학교장재량휴업일 등)로 지정합니다 🎈</span>
                </label>
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10">
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.blue}}></div> Schedule</h4>
              <div className="space-y-3">
                {(schedules[dateString(selectedDate)] || []).map((sch, i) => (
                  <div key={sch.id} className="flex items-center gap-4 group animate-fade-in-up" style={{animationDelay: `${i*0.05}s`}}>
                    <div className="w-1 h-full min-h-[3rem] rounded-full" style={{ background: `linear-gradient(to bottom, ${PALETTE.blue}, ${PALETTE.royal})` }}></div>
                    <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                      <span className={`font-bold ${sch.isHoliday ? 'text-red-500' : 'text-gray-700'}`}>{sch.title} {sch.isHoliday && '🎈'}</span>
                      <button onClick={() => deleteItem('schedule', sch.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {(schedules[dateString(selectedDate)] || []).length === 0 && <div className="text-gray-300 text-xs italic pl-4">등록된 일정이 없습니다.</div>}
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.red}}></div> To-Do List</h4>
              <div className="space-y-3">
                {(todos[dateString(selectedDate)] || []).map((todo, i) => (
                  <div key={todo.id} className="flex items-center gap-4 group animate-fade-in-up" style={{animationDelay: `${i*0.05}s`}}>
                    <div className="w-1 h-full min-h-[3rem] rounded-full transition-colors" style={{ background: todo.done ? '#E5E7EB' : `linear-gradient(to bottom, ${PALETTE.red}, ${PALETTE.yellowOrange})` }}></div>
                    <div className={`flex-1 p-4 rounded-2xl border flex justify-between items-center transition-all ${todo.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                      <div className="flex items-center gap-3"><button onClick={() => toggleTodo(todo.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${todo.done ? 'border-gray-300 bg-gray-300 text-white' : 'border-red-200 text-transparent hover:border-red-400'}`} style={!todo.done ? {borderColor: PALETTE.orange} : {}}><Check size={12} strokeWidth={4} /></button><span className={`font-bold transition-all ${todo.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.text}</span></div>
                      <button onClick={() => deleteItem('todo', todo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {(todos[dateString(selectedDate)] || []).length === 0 && <div className="text-gray-300 text-xs italic pl-4">등록된 할 일이 없습니다.</div>}
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-gray-200">
              <h4 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.yellowOrange}}></div> Sticky Notes (Always Visible)</h4>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[160px]">
                {memos.length > 0 ? memos.map(memo => (
                  <div key={memo.id} className="shrink-0 w-48 h-48 p-5 shadow-lg flex flex-col justify-between transition-transform hover:scale-105 hover:z-10 group" style={{ backgroundColor: PALETTE.yellow, transform: `rotate(${memo.rotation}deg)`, boxShadow: '4px 4px 15px rgba(0,0,0,0.1)' }}>
                    <p className="font-gaegu text-gray-800 text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-hidden" style={{ fontFamily: 'sans-serif' }}>{memo.text}</p>
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => deleteItem('memo', memo.id)} className="p-1.5 bg-black/10 rounded-full hover:bg-black/20 text-gray-700"><X size={12}/></button></div>
                  </div>
                )) : <div className="w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 text-sm h-32">'메모' 탭에서 입력하면 여기에 붙어요! 📌</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}