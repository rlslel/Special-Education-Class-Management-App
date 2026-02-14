import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckSquare, Edit2, Plus, Trash2, Check, X, Calendar as CalIcon, Camera, Sparkles, RefreshCw } from 'lucide-react';
import { usePersistentState, isSameDay, getCalendarDays, getHolidayName, PASTEL_COLORS } from '../utils/helpers';
import { UI } from '../components/SharedUI';

export default function HomeManager() {
  const [schedules, setSchedules] = usePersistentState('teacher_schedules', {});
  const [todos, setTodos] = usePersistentState('teacher_todos_date_v2', {}); 
  const [memos, setMemos] = usePersistentState('class_sticky_memos', []); 
  const [dDays, setDDays] = usePersistentState('class_ddays', []); 
  
  const storedApiKey = localStorage.getItem('gemini_api_key');
  const apiKey = storedApiKey ? JSON.parse(storedApiKey) : '';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState('schedule'); 
  const [isHolidayAdd, setIsHolidayAdd] = useState(false);
  const [showDDayModal, setShowDDayModal] = useState(false); 
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);
  
  const getLocalDateString = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [dDayForm, setDDayForm] = useState({ title: '', date: getLocalDateString(new Date()) });
  const PALETTE = { blue: '#405DE6', royal: '#5B51D8', purple: '#833AB4', magenta: '#C13584', pink: '#E1306C', red: '#FD1D1D', orangeRed: '#F56040', orange: '#F77737', yellowOrange: '#FCAF45', yellow: '#FFDC80' };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!apiKey) {
      alert("환경설정 탭에서 Gemini API 키를 먼저 등록해주세요!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Data = await toBase64(file);
      const base64Content = base64Data.split(',')[1];
      const currentYear = new Date().getFullYear();

      // 🔥 AI에게 전국 공통 법정 공휴일은 제외하라고 명령!
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `당신은 한국 특수교사를 돕는 '학사일정 전사(Transcription) 및 데이터 추출 전문가'입니다. 첨부된 이미지 또는 PDF에서 학사일정을 완벽하게 추출하세요. 현재 기준 연도는 ${currentYear}년입니다.
              
              [초강력 주의사항 - 위반 시 절대 안 됨]
              1. 원본 100% 그대로 전사: 문서에 적힌 텍스트를 그대로 'title'에 적으세요. 임의 해석 절대 금지.
              2. 방학 기간의 정확한 계산 및 분할 (가장 중요): '방학식' 다음 날부터 ~ '개학식' 전날까지 속하는 **모든 개별 날짜(토, 일요일 포함 전부)**를 하루씩 쪼개서 각각의 JSON 객체로 만드세요. ("isHoliday": true)
              3. 전국 공통 법정 공휴일 제외 (필수): 1월 1일(신정), 삼일절, 어린이날, 현충일, 광복절, 추석, 설날, 성탄절 등 **달력에 이미 있는 공휴일은 절대로 추출하지 마세요.** (단, 해당 학교만의 '학교장재량휴업일', '개교기념일'은 추출해야 함)
              4. 날짜 형식: 반드시 "YYYY-MM-DD" 형태로 통일하세요.
              
              반드시 JSON 배열 구조로만 응답하세요.
              [ { "date": "2026-03-07", "title": "학교교육과정 설명회", "isHoliday": false } ]` 
              },
              { inline_data: { mime_type: file.type, data: base64Content } }
            ]
          }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1
          }
        })
      });

      const result = await response.json();
      
      if (!result.candidates || !result.candidates[0]) {
        throw new Error("API 응답에 오류가 있습니다.");
      }

      const rawText = result.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(rawText); 

      setSchedules(prev => {
        const next = { ...prev };
        parsedData.forEach(item => {
          // 🔥 1차 방어막: 시스템에 이미 등록된 공휴일(신정 등)이면 아예 추가 안 함
          const [y, m, d] = item.date.split('-');
          const itemDate = new Date(y, m - 1, d);
          if (getHolidayName(itemDate)) return; 

          if (!next[item.date]) next[item.date] = [];
          
          // 🔥 2차 방어막: 이미 똑같은 이름의 일정이 있으면 중복 추가 방지
          const isDuplicate = next[item.date].some(sch => sch.title === item.title);
          
          if (!isDuplicate) {
            next[item.date].push({ id: Date.now() + Math.random(), title: item.title, isHoliday: item.isHoliday, isAiGenerated: true });
          }
        });
        return next;
      });

      alert(`🎉 분석 완료! 달력에 꼼꼼하게 등록되었습니다. (중복 및 기본 공휴일은 자동 제외)`);
    } catch (err) {
      console.error(err);
      alert("분석 중 오류가 발생했습니다. 사진 화질이 명확한지 확인해주세요.");
    } finally {
      setIsAnalyzing(false);
      e.target.value = ''; 
    }
  };

  const handleClearAiSchedules = () => {
    if(!window.confirm('AI가 분석해서 등록한 일정을 모두 삭제하시겠습니까?\n(선생님이 직접 추가한 일정은 안전하게 유지됩니다!)')) return;
    
    setSchedules(prev => {
      const next = {};
      Object.keys(prev).forEach(date => {
        const manuallyAdded = prev[date].filter(sch => !sch.isAiGenerated);
        if (manuallyAdded.length > 0) {
          next[date] = manuallyAdded;
        }
      });
      return next;
    });
    alert('AI 일정만 깔끔하게 지워졌습니다. 🧹 다시 사진을 올려보세요!');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (inputType === 'memo') {
      const rotation = Math.random() * 4 - 2;
      setMemos([...memos, { id: Date.now(), text: inputText, rotation }]);
    } else {
      const key = getLocalDateString(selectedDate);
      const newItem = { id: Date.now(), text: inputText, done: false, isHoliday: inputType === 'schedule' ? isHolidayAdd : false }; 
      if (inputType === 'schedule') {
        setSchedules({ ...schedules, [key]: [...(schedules[key] || []), { id: Date.now(), title: inputText, isHoliday: isHolidayAdd }] });
        setIsHolidayAdd(false); 
      }
      else setTodos({ ...todos, [key]: [...(todos[key] || []), newItem] });
    }
    setInputText('');
  };

  const deleteItem = (type, id) => {
    const key = getLocalDateString(selectedDate);
    if (type === 'schedule') setSchedules({ ...schedules, [key]: schedules[key].filter(s => s.id !== id) });
    else if (type === 'todo') setTodos({ ...todos, [key]: todos[key].filter(t => t.id !== id) });
    else if (type === 'memo') setMemos(memos.filter(m => m.id !== id));
    else if (type === 'dday') setDDays(dDays.filter(d => d.id !== id));
  };

  const toggleTodo = (id) => {
    const key = getLocalDateString(selectedDate);
    setTodos({ ...todos, [key]: todos[key].map(t => t.id === id ? { ...t, done: !t.done } : t) });
  };

  const calculateDDay = (targetDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = targetDateStr.split('-');
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'D-Day';
    return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
  };

  const saveDDay = () => {
    if (!dDayForm.title.trim()) return;
    setDDays(prev => {
      const updated = [...prev, { id: Date.now(), ...dDayForm }];
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    setShowDDayModal(false);
    setDDayForm({ title: '', date: getLocalDateString(new Date()) });
  };

  // 현재 선택된 날짜의 공휴일 여부 확인
  const currentOfficialHoliday = getHolidayName(selectedDate);

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-7xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] border border-white relative">
        
        <div className="md:w-[35%] bg-white p-8 flex flex-col border-r border-gray-100 z-10 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8 px-2 shrink-0">
            <h2 className="text-3xl font-light" style={{ color: PALETTE.purple }}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentDate.getMonth()]}
              <span className="text-gray-300 font-bold text-lg ml-2">{currentDate.getFullYear()}</span>
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ChevronLeft/></button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ChevronRight/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center mb-4 shrink-0">{['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-xs font-bold text-gray-300">{d}</div>)}</div>
          
          <div className="grid grid-cols-7 grid-rows-6 gap-2 mb-6 shrink-0">
            {getCalendarDays(currentDate).map((date, i) => {
              if (!date) return <div key={i} className="h-10" />;
              const dStr = getLocalDateString(date);
              const isSel = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const officialHoliday = getHolidayName(date);
              
              const manualHolidays = (schedules[dStr] || []).filter(s => s.isHoliday);
              const hasManualHoliday = manualHolidays.length > 0;
              const isRedDay = date.getDay() === 0 || date.getDay() === 6 || officialHoliday || hasManualHoliday;

              const dayDDays = dDays.filter(d => d.date === dStr);

              return (
                <div key={i} onClick={() => setSelectedDate(date)} className="flex flex-col items-center justify-start cursor-pointer relative group h-12">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all duration-300 ${isSel ? 'text-white shadow-lg scale-110 font-bold' : (isRedDay ? 'text-red-500 font-extrabold group-hover:bg-red-50' : 'text-gray-600 font-bold group-hover:bg-gray-50')}`} 
                       style={{ background: isSel ? `linear-gradient(135deg, ${PALETTE.purple}, ${PALETTE.pink})` : (isToday ? '#F3F4F6' : 'transparent') }}>
                    {date.getDate()}
                  </div>
                  <div className="w-full px-0.5 mt-0.5 flex flex-col items-center">
                     <span className="text-[9px] text-red-500 font-bold truncate w-full text-center">
                       {officialHoliday || (hasManualHoliday ? manualHolidays[0].title : '')}
                     </span>
                     {dayDDays.length > 0 && !officialHoliday && !hasManualHoliday && (
                       <span className="text-[9px] text-blue-600 font-extrabold truncate w-full text-center bg-blue-50 rounded-sm">
                         ⭐{dayDDays[0].title.slice(0,3)} {calculateDDay(dStr)}
                       </span>
                     )}
                  </div>
                  <div className="flex gap-0.5 mt-auto pb-1">
                    {(schedules[dStr]?.length > 0) && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PALETTE.blue }}></div>}
                    {(todos[dStr]?.length > 0) && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PALETTE.orangeRed }}></div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col min-h-[180px] bg-gray-50 rounded-2xl p-4 border border-gray-100 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><CalIcon size={14}/> Upcoming D-Day</h3>
              <button onClick={() => setShowDDayModal(true)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><Plus size={14}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {dDays.length > 0 ? dDays.map(d => {
                const dText = calculateDDay(d.date);
                const isPast = dText.includes('+');
                return (
                  <div key={d.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-pink-100 shadow-sm'}`}>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isPast ? 'text-gray-500' : 'text-gray-800'}`}>{d.title}</span>
                      <span className="text-[10px] text-gray-400">{d.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-extrabold ${dText === 'D-Day' ? 'bg-red-500 text-white animate-pulse' : (isPast ? 'bg-gray-200 text-gray-500' : 'bg-pink-100 text-pink-600')}`}>{dText}</span>
                      <button onClick={() => deleteItem('dday', d.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>
                );
              }) : <div className="text-xs text-center text-gray-400 py-4">등록된 일정이 없습니다.</div>}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          <div className="p-8 pb-4 shrink-0 z-20 bg-white/80 backdrop-blur-md">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: PALETTE.blue }}>Daily Plan</p>
                <h2 className="text-4xl font-extrabold text-gray-800 flex items-center gap-4">
                  {selectedDate.getDate()} <span className="text-xl font-medium text-gray-400">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][selectedDate.getDay()]}</span>
                </h2>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex gap-2">
                  <input type="file" accept="image/*, application/pdf" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    disabled={isAnalyzing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm ${isAnalyzing ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 hover:shadow hover:scale-105 border border-purple-200'}`}
                  >
                    {isAnalyzing ? (
                      <><Sparkles size={14} className="animate-spin" /> 데이터 분석 중...</>
                    ) : (
                      <><Camera size={14} /> ✨ AI 학사일정 분석기</>
                    )}
                  </button>
                  <button onClick={handleClearAiSchedules} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200" title="AI로 등록된 일정만 일괄 삭제합니다.">
                    <RefreshCw size={14}/> AI 일정 삭제
                  </button>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {[ { id: 'schedule', icon: Clock, color: PALETTE.blue, label: '일정' }, { id: 'todo', icon: CheckSquare, color: PALETTE.red, label: '할일' }, { id: 'memo', icon: Edit2, color: PALETTE.yellowOrange, label: '메모' } ].map(mode => (
                    <button key={mode.id} onClick={() => setInputType(mode.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inputType === mode.id ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} style={{ color: inputType === mode.id ? mode.color : '' }}><mode.icon size={14}/> {mode.label}</button>
                  ))}
                </div>
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
                
                {/* 🔥 기본 공휴일(읽기 전용 표시 - 삭제 버튼 없음!) */}
                {currentOfficialHoliday && (
                  <div className="flex items-center gap-4 animate-fade-in-up">
                    <div className="w-1 h-full min-h-[3rem] rounded-full bg-red-400"></div>
                    <div className="flex-1 bg-red-50 border border-red-100 p-4 rounded-2xl shadow-sm flex justify-between items-center">
                      <span className="font-extrabold text-red-600 flex items-center gap-2">
                        {currentOfficialHoliday} 🎈
                      </span>
                      <span className="text-[10px] text-red-400 font-bold px-2 py-1 bg-white rounded-md shadow-sm">기본 공휴일</span>
                    </div>
                  </div>
                )}

                {/* 교사가 입력하거나 AI가 추가한 일정 */}
                {(schedules[getLocalDateString(selectedDate)] || []).map((sch, i) => (
                  <div key={sch.id} className="flex items-center gap-4 group animate-fade-in-up" style={{animationDelay: `${i*0.05}s`}}>
                    <div className="w-1 h-full min-h-[3rem] rounded-full" style={{ background: `linear-gradient(to bottom, ${PALETTE.blue}, ${PALETTE.royal})` }}></div>
                    <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                      <span className={`font-bold ${sch.isHoliday ? 'text-red-500' : 'text-gray-700'}`}>{sch.title} {sch.isAiGenerated && <span className="text-xs opacity-50 ml-1" title="AI가 분석한 일정입니다">✨</span>} {sch.isHoliday && '🎈'}</span>
                      <button onClick={() => deleteItem('schedule', sch.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                
                {/* 공휴일도 없고, 교사가 추가한 일정도 없을 때만 표시 */}
                {!currentOfficialHoliday && (schedules[getLocalDateString(selectedDate)] || []).length === 0 && (
                  <div className="text-gray-300 text-xs italic pl-4">등록된 일정이 없습니다.</div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.red}}></div> To-Do List</h4>
              <div className="space-y-3">
                {(todos[getLocalDateString(selectedDate)] || []).map((todo, i) => (
                  <div key={todo.id} className="flex items-center gap-4 group animate-fade-in-up" style={{animationDelay: `${i*0.05}s`}}>
                    <div className="w-1 h-full min-h-[3rem] rounded-full transition-colors" style={{ background: todo.done ? '#E5E7EB' : `linear-gradient(to bottom, ${PALETTE.red}, ${PALETTE.yellowOrange})` }}></div>
                    <div className={`flex-1 p-4 rounded-2xl border flex justify-between items-center transition-all ${todo.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                      <div className="flex items-center gap-3"><button onClick={() => toggleTodo(todo.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${todo.done ? 'border-gray-300 bg-gray-300 text-white' : 'border-red-200 text-transparent hover:border-red-400'}`} style={!todo.done ? {borderColor: PALETTE.orange} : {}}><Check size={12} strokeWidth={4} /></button><span className={`font-bold transition-all ${todo.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.text}</span></div>
                      <button onClick={() => deleteItem('todo', todo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {(todos[getLocalDateString(selectedDate)] || []).length === 0 && <div className="text-gray-300 text-xs italic pl-4">등록된 할 일이 없습니다.</div>}
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
      
      {showDDayModal && (
        <UI.Modal onClose={() => setShowDDayModal(false)} title="D-Day 등록" maxWidth="max-w-sm">
          <div className="p-6 space-y-4">
            <UI.Input label="어떤 일정인가요?" value={dDayForm.title} onChange={e => setDDayForm({...dDayForm, title: e.target.value})} placeholder="예: 현장체험학습, 개별화협의회" />
            <UI.Input label="날짜 선택" type="date" value={dDayForm.date} onChange={e => setDDayForm({...dDayForm, date: e.target.value})} />
            <div className="flex gap-2 mt-4">
              <UI.Btn variant="secondary" className="flex-1" onClick={() => setShowDDayModal(false)}>취소</UI.Btn>
              <UI.Btn className="flex-1" onClick={saveDDay}>저장</UI.Btn>
            </div>
          </div>
        </UI.Modal>
      )}
    </div>
  );
}