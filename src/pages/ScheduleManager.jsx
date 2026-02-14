import React, { useState, useMemo } from 'react';
import { Clock, Wand2, RotateCcw, GraduationCap, X, Printer, Activity, Calendar as CalIcon, Sparkles } from 'lucide-react';
import { usePersistentState, DAYS, PERIODS, getStudentColor, PASTEL_COLORS, getHolidayName } from '../utils/helpers';
import { UI, ConfirmModal } from '../components/SharedUI';

const getKoreanHoliday = (date) => {
  if (!date) return null;
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const solarHolidays = { '01-01': '신정', '03-01': '삼일절', '05-05': '어린이날', '06-06': '현충일', '08-15': '광복절', '10-03': '개천절', '10-09': '한글날', '12-25': '성탄절' };
  if (solarHolidays[mmdd]) return solarHolidays[mmdd];
  
  const official = getHolidayName(date);
  if (official) {
    if (official.includes('신정') || official.includes('새해')) return null; 
    if (official.includes('기독탄신일') || official.includes('크리스마스')) return null;
  }
  return official;
};

export default function ScheduleManager({ students, staff }) {
  const [semester, setSemester] = useState(1);
  const [schedule, setSchedule] = usePersistentState('integrated_schedule', {});
  const [gradeTimes, setGradeTimes] = usePersistentState('grade_timetables_detail', (() => { const i = {}; [1,2,3,4,5,6].forEach(g => i[g] = Array(5).fill(null).map(() => Array(6).fill(true))); return i; })());
  
  const [semesterDates, setSemesterDates] = usePersistentState('semester_dates_v1', {
    1: { start: '2026-03-02', end: '2026-07-17' },
    2: { start: '2026-08-17', end: '2026-12-31' }
  });
  
  const [teacherSchedules] = usePersistentState('teacher_schedules', {});

  const [logicMode, setLogicMode] = useState('severity'); 
  const [modal, setModal] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null }); 
  const [gradeModal, setGradeModal] = useState(false); 
  const [datesModal, setDatesModal] = useState(false); 
  
  const [printModal, setPrintModal] = useState(false);
  const [printTargetId, setPrintTargetId] = useState('all');

  const [classInfo] = usePersistentState('class_info_data', { official: '', nickname: '' });

  const stats = useMemo(() => {
    let teacherClasses = 0; const supportCounts = {}; const studentSupportCounts = {};
    staff.forEach(s => supportCounts[s.id] = 0); students.forEach(s => studentSupportCounts[s.id] = 0);
    Object.values(schedule[semester] || {}).forEach(slots => {
      if (slots.some(i => i.type === 'special')) teacherClasses++;
      slots.forEach(i => { if (i.staffId) { supportCounts[i.staffId]++; studentSupportCounts[i.studentId]++; }});
    });
    return { teacherClasses, supportCounts, studentSupportCounts };
  }, [schedule, semester, staff, students]);

  const currentHours = useMemo(() => {
    const counts = {}; 
    students.forEach(s => counts[s.id] = {});
    Object.values(schedule[semester] || {}).forEach(slots => {
      slots.forEach(slot => {
        if (slot.type === 'special' && slot.subject && counts[slot.studentId]) {
          counts[slot.studentId][slot.subject] = (counts[slot.studentId][slot.subject] || 0) + 1;
        }
      });
    });
    return counts;
  }, [schedule, semester, students]);

  const validDaysCount = useMemo(() => {
    const dates = semesterDates[semester];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
    if (!dates || !dates.start || !dates.end) return counts;
    
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; 
      
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (getKoreanHoliday(d)) continue;
      
      const daySchedules = teacherSchedules[dStr] || [];
      if (daySchedules.some(s => s.isHoliday)) continue;
      
      counts[dayNames[dayOfWeek]]++; 
    }
    return counts;
  }, [semester, semesterDates, teacherSchedules]);

  const expectedSemesterHours = useMemo(() => {
    const totals = {}; 
    students.forEach(s => totals[s.id] = {});
    
    Object.keys(schedule[semester] || {}).forEach(key => {
      const [day, period] = key.split('-'); 
      const slots = schedule[semester][key] || [];
      slots.forEach(slot => {
        if (slot.type === 'special' && slot.subject && totals[slot.studentId]) {
          const currentTotal = totals[slot.studentId][slot.subject] || 0;
          totals[slot.studentId][slot.subject] = currentTotal + (validDaysCount[day] || 0);
        }
      });
    });
    return totals;
  }, [schedule, semester, students, validDaysCount]);

  // 🔥 [신규] 달력 일정에서 개학식/방학식을 스캔하여 자동 입력하는 함수
  const autoDetectSemesters = () => {
    let sem1Start = '', sem1End = '', sem2Start = '', sem2End = '';
    const allDates = Object.keys(teacherSchedules).sort();
    
    allDates.forEach(date => {
      const events = teacherSchedules[date];
      events.forEach(ev => {
        const t = ev.title;
        const month = parseInt(date.split('-')[1], 10);
        
        if ((t.includes('시업') || t.includes('개학') || t.includes('입학')) && month <= 3) {
          if(!sem1Start) sem1Start = date;
        }
        if (t.includes('여름방학') && month >= 7 && month <= 8) {
          if(!sem1End) sem1End = date;
        }
        if (t.includes('개학') && month >= 8 && month <= 9) {
          if(!sem2Start) sem2Start = date;
        }
        if ((t.includes('종업') || t.includes('겨울방학') || t.includes('졸업')) && (month >= 12 || month <= 2)) {
           sem2End = date;
        }
      });
    });
    
    setSemesterDates({
      1: { start: sem1Start || semesterDates[1].start, end: sem1End || semesterDates[1].end },
      2: { start: sem2Start || semesterDates[2].start, end: sem2End || semesterDates[2].end }
    });
    
    alert('달력에 등록된 학사일정(개학, 방학 등)을 스캔하여 기간을 불러왔습니다!\n자동 입력된 날짜가 정확한지 확인해주세요. ✨');
  };

  const autoAssign = () => {
    if(!staff.length) return alert('등록된 인력이 없습니다.');
    const newSch = { ...schedule, [semester]: { ...schedule[semester] } };
    Object.keys(newSch[semester]).forEach(k => newSch[semester][k] = (newSch[semester][k] || []).filter(i => i.type === 'special' || i.blocked));
    const studentCounts = {}; students.forEach(s => studentCounts[s.id] = 0); const staffCounts = {}; staff.forEach(s => staffCounts[s.id] = 0);
    DAYS.forEach((d, dIdx) => PERIODS.forEach(p => {
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

  const getPrintData = (d, p) => {
    const items = schedule[semester]?.[`${d}-${p}`] || [];
    if (printTargetId === 'all') return items.filter(i => i.type === 'special');
    return items.filter(i => String(i.studentId) === String(printTargetId));
  };

  const sTarget = students.find(s => String(s.id) === String(printTargetId));
  const defaultClassText = '특수학급';
  const getPrintTitle = () => {
    if (printTargetId === 'all') {
      const titleName = classInfo.nickname || classInfo.official || defaultClassText;
      return `${titleName} 시간표`;
    } else {
      const titleName = classInfo.official || defaultClassText;
      return `${titleName} 시간표`;
    }
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body, html { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; }
            aside { display: none !important; } 
            main { overflow: visible !important; } 
            .normal-view { display: none !important; } 
            .print-view { display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: white !important; z-index: 999999 !important; flex-direction: column; padding: 20px; box-sizing: border-box; }
          }
        `}
      </style>

      <div className="normal-view p-8 h-full flex flex-col">
        <header className="flex flex-col gap-4 mb-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-extrabold text-gray-800">통합 시간표</h2>
              <select value={semester} onChange={e => setSemester(Number(e.target.value))} className="p-2 border rounded-xl font-bold bg-white text-gray-700 outline-none">
                <option value={1}>1학기</option>
                <option value={2}>2학기</option>
              </select>
              <button onClick={() => setDatesModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors text-sm">
                <CalIcon size={16}/> 기간 설정
              </button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => setGradeModal(true)} className="px-4 py-2 bg-white border rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2"><Clock size={18}/> 학년별 시수 설정</button>
              <button onClick={() => setPrintModal(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl font-bold border border-pink-200 hover:bg-pink-100 transition-colors"><Printer size={18}/> 맞춤형 인쇄/저장</button>
              <div className="bg-gray-100 p-1 rounded-xl flex"><button onClick={()=>setLogicMode('severity')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${logicMode==='severity'?'bg-white shadow text-pink-600':'text-gray-400'}`}>중증도 우선</button><button onClick={()=>setLogicMode('equal')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${logicMode==='equal'?'bg-white shadow text-blue-600':'text-gray-400'}`}>균등 배정</button></div><button onClick={() => setConfirmModal({ open: true, type: 'auto' })} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold shadow-md hover:scale-105 transition-transform"><Wand2 size={18}/> 자동 배치</button><button onClick={() => setConfirmModal({ open: true, type: 'reset' })} className="bg-gray-100 p-2 rounded-xl text-gray-500 hover:text-red-500"><RotateCcw size={20}/></button>
            </div>
          </div>
          <div className="bg-gray-800 text-white rounded-2xl p-4 flex flex-wrap items-center shadow-lg gap-4"><div className="flex items-center gap-3 px-2 pr-6 border-r border-gray-600"><div className="bg-pink-500 p-2 rounded-lg"><GraduationCap size={20}/></div><div><p className="text-xs text-gray-400 font-bold">주간 수업</p><p className="text-xl font-bold">{stats.teacherClasses}시간</p></div></div><div className="flex gap-4 overflow-x-auto custom-scrollbar items-center px-2">{staff.map(s => (<div key={s.id} className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-xl whitespace-nowrap"><div className={`w-2 h-2 rounded-full ${s.type==='practical'?'bg-blue-400':'bg-green-400'}`}/><div><p className="text-[10px] text-gray-400">{s.name}</p><p className="font-bold">{stats.supportCounts[s.id] || 0}회</p></div></div>))}</div><div className="w-px h-8 bg-gray-600 mx-2"></div><div className="flex gap-4 overflow-x-auto custom-scrollbar items-center flex-1">{students.map(s => (<div key={s.id} className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-xl whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-yellow-400"/><div><p className="text-[10px] text-gray-400">{s.name}</p><p className="font-bold">{stats.studentSupportCounts[s.id] || 0}회</p></div></div>))}</div></div>
        </header>

        <div className="flex-1 flex gap-6 min-h-0">
          
          <div className="bg-white p-4 rounded-[2rem] shadow-xl flex flex-col overflow-hidden" style={{ flex: 4 }}>
            <div className="grid grid-cols-6 gap-2 mb-2 text-center h-12 shrink-0">
              <div className="font-bold text-gray-400 bg-gray-50 rounded-xl flex items-center justify-center">교시</div>
              {DAYS.map(d=><div key={d} className="font-extrabold text-lg text-gray-700 bg-gray-100 rounded-xl flex items-center justify-center">{d}</div>)}
            </div>
            <div className="flex-1 grid grid-rows-6 gap-2">
              {PERIODS.map(p => (
                <div key={p} className="grid grid-cols-6 gap-2">
                  <div className="font-bold text-xl text-gray-400 bg-gray-50 rounded-xl flex items-center justify-center">{p}</div>
                  {DAYS.map(d => { 
                    const items = schedule[semester]?.[`${d}-${p}`] || []; 
                    const isBlocked = items.some(i => i.blocked); 
                    return (
                      <div key={d} onClick={()=>setModal({ day: d, period: p, data: JSON.parse(JSON.stringify(items)) })} className={`bg-white border-2 rounded-xl hover:border-pink-300 hover:shadow-lg cursor-pointer p-1 overflow-hidden relative group transition-all ${isBlocked ? 'border-gray-200 bg-gray-50' : 'border-gray-100'}`}>
                        {isBlocked ? <div className="w-full h-full flex items-center justify-center"><X className="text-gray-300" size={32} /></div> : (
                          <div className="flex flex-wrap gap-1 justify-center content-start h-full">
                            {items.map((i,x)=>{ 
                              const s = students.find(s=>s.id===i.studentId); const st = staff.find(s=>s.id===i.staffId); 
                              if(!s) return null; const isSpecial = i.type === 'special'; 
                              return <div key={x} className={`flex flex-col items-center text-[9px] px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap ${getStudentColor(s.id)} ${isSpecial ? 'border-4 border-gray-700 font-extrabold ring-1 ring-white' : 'opacity-90 font-bold'}`}><span>{s.name}</span><span className="opacity-80 scale-90">{isSpecial ? (i.subject || '특수') : (st ? st.name : '?')}</span></div> 
                            })}
                          </div>
                        )}
                      </div>
                    ); 
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-200 shadow-inner flex flex-col overflow-y-auto custom-scrollbar" style={{ flex: 1 }}>
            <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
              <span className="p-1.5 bg-pink-100 text-pink-600 rounded-lg"><Activity size={16}/></span>
              실시간 시수 검증
            </h3>
            
            <div className="flex-1 space-y-4 pr-1">
              {students.length === 0 ? (
                <p className="text-xs text-center text-gray-400 mt-10">학생을 등록해주세요.</p>
              ) : students.map(s => {
                if (!s.targetSubjects?.length) return null;
                return (
                  <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.themeColor?.hex || '#ccc' }}></div>
                      {s.name}
                    </div>
                    <div className="space-y-4">
                      {s.targetSubjects.map(subj => {
                        const target = s.subjectHours?.[subj] || 1; 
                        const current = currentHours[s.id]?.[subj] || 0;
                        const isMet = current === target;
                        const isOver = current > target;
                        const percent = Math.min((current / target) * 100, 100);
                        
                        const expectedTotal = expectedSemesterHours[s.id]?.[subj] || 0;
                        
                        const barColor = isOver ? 'bg-red-400' : (isMet ? 'bg-green-400' : 'bg-yellow-400');
                        const textColor = isOver ? 'text-red-500' : (isMet ? 'text-green-500' : 'text-yellow-600');

                        return (
                          <div key={subj} className="text-xs">
                            <div className="flex justify-between items-end mb-1">
                              <span className="font-bold text-gray-600">{subj}</span>
                              <div className="flex items-end gap-2">
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">학기: {expectedTotal}시간 예상</span>
                                <span className={`font-extrabold tracking-wider ${textColor}`}>
                                  {current} <span className="text-gray-300 font-normal">/ {target}</span>
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className={`h-full ${barColor} transition-all duration-500 ease-out`} style={{ width: `${percent}%` }}></div>
                            </div>
                            {isOver && <p className="text-[9px] text-red-400 mt-1 text-right">⚠️ 주간 시수 초과</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {modal && <UI.Modal onClose={()=>setModal(null)} maxWidth="max-w-5xl" title={`${modal.day}요일 ${modal.period}교시 설정`}>
        <div className="flex justify-between items-center px-6 py-2 bg-gray-50 border-b"><span className="text-sm text-gray-500 font-bold">개별 설정</span><button onClick={()=>{const b=modal.data.some(i=>i.blocked); setModal({...modal, data: b?modal.data.filter(i=>!i.blocked):[...modal.data,{blocked:true}]})}} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${modal.data.some(i=>i.blocked) ? 'bg-red-500 text-white' : 'bg-white border'}`}>{modal.data.some(i=>i.blocked) ? '금지 해제' : '배정 금지'}</button></div>
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 gap-4 ${modal.data.some(i=>i.blocked) ? 'opacity-50 pointer-events-none' : ''}`}>
          {students.map(s => { const entry = modal.data.find(i=>i.studentId===s.id); return (<div key={s.id} className={`p-4 rounded-2xl border-2 transition-all ${entry ? (entry.type==='special' ? 'border-gray-600 bg-gray-50 ring-2 ring-pink-100' : 'border-blue-400 bg-blue-50') : 'border-gray-100 bg-white'}`}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><img src={s.photo} className="w-10 h-10 rounded-full border bg-white"/><span className="font-bold">{s.name} <span className="text-xs font-normal text-gray-500">{s.grade}학년 / {s.severity}순위</span></span></div></div><div className="space-y-2"><div><span className="text-[10px] font-bold text-gray-400">특수학급 수업 (직접입력)</span> <div className="flex flex-wrap gap-1">{s.targetSubjects?.map(subj=><button key={subj} onClick={()=>{let n=modal.data.filter(i=>i.studentId!==s.id); if(entry?.subject!==subj) n.push({studentId:s.id, subject:subj, type:'special'}); setModal({...modal, data:n})}} className={`px-2 py-1 rounded text-xs font-bold border ${entry?.subject===subj?'bg-gray-800 text-white':'bg-white text-gray-600'}`}>{subj}</button>)}</div></div><div><span className="text-[10px] font-bold text-gray-400">원반 지원 인력</span> <div className="flex flex-wrap gap-1">{staff.map(st=><button key={st.id} onClick={()=>{let n=modal.data.filter(i=>i.studentId!==s.id); if(entry?.staffId!==st.id) n.push({studentId:s.id, staffId:st.id, type:'support'}); setModal({...modal, data:n})}} className={`px-2 py-1 rounded text-xs font-bold border ${entry?.staffId===st.id?'bg-blue-600 text-white':'bg-white text-blue-600'}`}>{st.name}</button>)}</div></div></div></div>) })}
        </div>
        <div className="p-4 border-t flex gap-3"><UI.Btn variant="secondary" onClick={()=>setModal(null)} className="flex-1 py-4 text-lg">취소</UI.Btn><UI.Btn className="bg-gray-800 flex-1 py-4 text-lg" onClick={()=>{setSchedule({...schedule, [semester]: {...schedule[semester], [`${modal.day}-${modal.period}`]: modal.data}}); setModal(null)}}>저장</UI.Btn></div>
      </UI.Modal>}
      
      {gradeModal && <UI.Modal onClose={()=>setGradeModal(false)} title="학년별 수업/하교 설정" maxWidth="max-w-2xl"><div className="p-6"><div className="flex gap-2 mb-6 border-b">{[1,2,3,4,5,6].map(g => (<button key={g} onClick={() => setActiveGradeTab(g)} className={`px-6 py-3 font-bold rounded-t-xl transition-all ${activeGradeTab === g ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{g}학년</button>))}</div><div className="bg-gray-50 rounded-2xl p-4"><div className="grid grid-cols-6 gap-2 mb-2 text-center text-sm font-bold text-gray-500"><div>교시</div>{DAYS.map(d => <div key={d}>{d}요일</div>)}</div>{[0,1,2,3,4,5].map((pIdx) => (<div key={pIdx} className="grid grid-cols-6 gap-2 mb-2 items-center"><div className="font-bold text-center text-gray-400">{pIdx + 1}교시</div>{[0,1,2,3,4].map((dIdx) => { const a = gradeTimes[activeGradeTab]?.[dIdx]?.[pIdx]; return <div key={dIdx} onClick={() => toggleGradeTime(dIdx, pIdx)} className={`h-10 rounded-lg cursor-pointer flex items-center justify-center border transition-all text-xs font-bold ${a ? 'bg-green-500 border-green-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-300'}`}>{a ? '수업' : '하교'}</div>; })}</div>))}</div><div className="mt-6 flex justify-end"><UI.Btn className="bg-gray-800 px-8" onClick={()=>setGradeModal(false)}>설정 완료</UI.Btn></div></div></UI.Modal>}
      
      {/* 🔥 모달에 '자동 불러오기' 버튼 추가 */}
      {datesModal && (
        <UI.Modal onClose={() => setDatesModal(false)} title="📅 학기 기간 설정" maxWidth="max-w-md">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl text-blue-600 text-xs leading-relaxed">
              <div>
                <span className="font-bold block mb-1">💡 학기 예상 시수란?</span>
                기간 내 '주말, 공휴일, 달력에 등록된 휴업일'을 뺀 <b>순수 학교 출석일수</b>를 계산해 학기 총 시수를 예측합니다.
              </div>
            </div>
            
            <div className="flex justify-end -mb-2">
              <button onClick={autoDetectSemesters} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 font-bold rounded-lg text-xs hover:bg-purple-200 transition-colors shadow-sm border border-purple-200">
                <Sparkles size={14}/> 달력 일정에서 자동 불러오기
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-700 mb-3">1학기 기간</h4>
                <div className="flex items-center gap-2">
                  <input type="date" value={semesterDates[1]?.start || ''} onChange={e => setSemesterDates({...semesterDates, 1: {...semesterDates[1], start: e.target.value}})} className="flex-1 p-2 border rounded text-sm"/>
                  <span className="text-gray-400">~</span>
                  <input type="date" value={semesterDates[1]?.end || ''} onChange={e => setSemesterDates({...semesterDates, 1: {...semesterDates[1], end: e.target.value}})} className="flex-1 p-2 border rounded text-sm"/>
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-700 mb-3">2학기 기간</h4>
                <div className="flex items-center gap-2">
                  <input type="date" value={semesterDates[2]?.start || ''} onChange={e => setSemesterDates({...semesterDates, 2: {...semesterDates[2], start: e.target.value}})} className="flex-1 p-2 border rounded text-sm"/>
                  <span className="text-gray-400">~</span>
                  <input type="date" value={semesterDates[2]?.end || ''} onChange={e => setSemesterDates({...semesterDates, 2: {...semesterDates[2], end: e.target.value}})} className="flex-1 p-2 border rounded text-sm"/>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <UI.Btn className="w-full bg-gray-800" onClick={() => setDatesModal(false)}>확인 및 자동 계산</UI.Btn>
            </div>
          </div>
        </UI.Modal>
      )}

      <ConfirmModal isOpen={confirmModal.open} message={confirmModal.type === 'reset' ? "시간표를 초기화하시겠습니까?" : `[${logicMode==='severity'?'중증도 우선':'균등 배정'}] 로직으로 자동 배치하시겠습니까?`} onConfirm={confirmModal.type === 'reset' ? () => {setSchedule({...schedule, [semester]:{}}); setConfirmModal({open:false});} : autoAssign} onCancel={() => setConfirmModal({ open: false, type: null })} />

      {printModal && (
        <UI.Modal onClose={() => setPrintModal(false)} title="🖨️ 시간표 인쇄 설정" maxWidth="max-w-md">
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">누구의 시간표를 인쇄할까요?</p>
            <select value={printTargetId} onChange={e => setPrintTargetId(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-bold mb-6">
              <option value="all">전체 특수학급 시간표 (교실 부착용)</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} 학생 (가정통신문용)</option>)}
            </select>
            <div className="bg-pink-50 text-pink-700 p-4 rounded-xl text-xs leading-relaxed mb-6">
              <b>💡 인쇄 전 필독!</b><br/>
              인쇄 창이 뜨면 <b>[방향: 가로(Landscape)]</b>를 꼭 직접 선택해 주시고,<br/>
              설정에서 <b>'배경 그래픽 인쇄'를 체크</b>해야 예쁜 색상이 나타납니다.
            </div>
            <div className="flex gap-2">
              <UI.Btn variant="secondary" className="flex-1" onClick={() => setPrintModal(false)}>취소</UI.Btn>
              <UI.Btn className="flex-1 bg-pink-500" onClick={() => { setPrintModal(false); setTimeout(() => window.print(), 500); }}>인쇄 / PDF 저장</UI.Btn>
            </div>
          </div>
        </UI.Modal>
      )}

      <div className="hidden print-view text-[#8D6E63]">
        <div className="w-full flex flex-col items-center shrink-0 mb-4">
          <h1 className="text-3xl font-extrabold bg-[#EFEBE4] px-16 py-3 rounded-xl tracking-widest shadow-sm mb-4">
            {getPrintTitle()}
          </h1>
          {printTargetId !== 'all' && (
            <div className="flex w-full justify-between px-10 font-bold text-xl">
              <div className="flex items-center gap-4">
                <span>Name :</span>
                <span className="border-b-[2px] border-dashed border-[#D7CCC8] w-48 inline-block text-center text-gray-800 pb-1">
                  {sTarget?.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>Class :</span>
                <span className="border-b-[2px] border-dashed border-[#D7CCC8] w-48 inline-block text-center text-gray-800 pb-1">
                  {`${sTarget?.grade}-${sTarget?.classNumber}`}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 w-full min-h-0">
          <table className="w-full h-full table-fixed border-collapse border-[3px] border-[#D7CCC8]">
            <thead>
              <tr className="bg-[#FBF8F1]">
                <th className="border-[2px] border-[#D7CCC8] w-24 text-xl font-extrabold py-3">Time</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
                  <th key={d} className="border-[2px] border-[#D7CCC8] text-xl font-extrabold py-3">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="border-[2px] border-[#D7CCC8] text-center font-bold text-xl">{p}</td>
                  {DAYS.map((d) => {
                    const items = getPrintData(d, p);
                    if (items.length === 0) return <td key={d} className="border-[2px] border-[#D7CCC8] bg-white"></td>;
                    return (
                      <td key={d} className="border-[2px] border-[#D7CCC8] p-1.5 align-middle">
                        <div className="flex flex-wrap justify-center items-center gap-1.5 h-full w-full">
                          {items.map((item, x) => {
                            const s = students.find(st => st.id === item.studentId);
                            if (!s) return null;
                            const theme = s.themeColor || PASTEL_COLORS[0];
                            const displaySubject = item.type === 'support' ? '원반' : (item.subject || '특수');
                            const cardWidth = printTargetId === 'all' ? 'w-[45%]' : 'w-[80%]';
                            return (
                              <div key={x} className={`flex flex-col items-center justify-center p-1.5 rounded-xl shadow-sm ${cardWidth}`} style={{ backgroundColor: theme.hex }}>
                                {printTargetId === 'all' && <span className="font-extrabold text-[14px] text-gray-900 leading-tight mb-0.5 whitespace-nowrap tracking-tight">{s.name}</span>}
                                <span className="font-bold text-gray-800 bg-white/70 px-1.5 py-0.5 rounded-md text-[12px] whitespace-nowrap tracking-tight">{displaySubject}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}