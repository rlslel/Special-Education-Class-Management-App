import { useState, useEffect } from 'react';

const HOLIDAYS = {
  '2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날',
  '2026-03-01': '삼일절', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-06-06': '현충일',
  '2026-08-15': '광복절', '2026-09-24': '추석', '2026-09-25': '추석', '2026-09-26': '추석',
  '2026-10-03': '개천절', '2026-10-09': '한글날', '2026-12-25': '기독탄신일'
};

export const PASTEL_COLORS = [
  { id: 'red', bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', hex: '#FECACA' },
  { id: 'orange', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-800', hex: '#FED7AA' },
  { id: 'amber', bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', hex: '#FDE68A' },
  { id: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800', hex: '#FEF08A' },
  { id: 'lime', bg: 'bg-lime-100', border: 'border-lime-200', text: 'text-lime-800', hex: '#D9F99D' },
  { id: 'green', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', hex: '#BBF7D0' },
  { id: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800', hex: '#A7F3D0' },
  { id: 'teal', bg: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-800', hex: '#99F6E4' },
  { id: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-800', hex: '#CFFAFE' },
  { id: 'sky', bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-800', hex: '#BAE6FD' },
  { id: 'blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', hex: '#BFDBFE' },
  { id: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', hex: '#C7D2FE' },
  { id: 'violet', bg: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-800', hex: '#DDD6FE' },
  { id: 'purple', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800', hex: '#E9D5FF' },
  { id: 'fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-200', text: 'text-fuchsia-800', hex: '#F5D0FE' },
  { id: 'pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800', hex: '#FBCFE8' },
  { id: 'rose', bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-800', hex: '#FECDD3' },
  { id: 'stone', bg: 'bg-stone-100', border: 'border-stone-200', text: 'text-stone-800', hex: '#E7E5E4' },
  { id: 'neutral', bg: 'bg-neutral-100', border: 'border-neutral-200', text: 'text-neutral-800', hex: '#E5E5E5' },
  { id: 'slate', bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-800', hex: '#E2E8F0' },
];

export const getStudentColor = (id) => {
  const theme = PASTEL_COLORS[id % PASTEL_COLORS.length];
  return `${theme.bg} ${theme.border} ${theme.text}`;
};

export const TARGET_SUBJECTS = ['📕 국어', '📐 수학', '🌏 사회', '⚗️ 과학', '⚖️ 도덕', '🅰️ 영어', '🏃 체육', '🎵 음악', '🎨 미술', '💻 실과', '🍳 요리', '✨ 특색'];

// 🔥 [수정됨] 없는 파일에서 찾지 않고, 외부에서 귀여운 이모지 아이콘을 불러오도록 변경!
export const DEFAULT_AVATARS = Array.from({ length: 6 }, (_, i) => `https://api.dicebear.com/7.x/fun-emoji/svg?seed=Student${i + 1}`);

export const SECURITY_QUESTIONS = ['보물 1호는?', '추억의 장소는?', '좋아하는 음식은?', '직접 입력'];
export const STORAGE_KEYS = ['app_password', 'app_security', 'students_data', 'staff_data', 'integrated_schedule', 'class_photos', 'teacher_todos_date_v2', 'class_sticky_memos', 'service_records', 'budget_definitions', 'grade_timetables_detail', 'teacher_schedules', 'google_api_key', 'gas_app_url'];
export const DAYS = ['월','화','수','목','금'];
export const PERIODS = [1,2,3,4,5,6];

export const dateString = (date) => date ? date.toISOString().slice(0, 10) : '';
export const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();
export const getHolidayName = (date) => date ? HOLIDAYS[dateString(date)] || null : null; 

export const getCalendarDays = (currentDate) => {
  const year = currentDate.getFullYear(), month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(), lastDate = new Date(year, month + 1, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({length: lastDate}, (_, i) => new Date(year, month, i + 1))];
};

export const usePersistentState = (key, init) => {
  const [state, setState] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || init; } catch { return init; } });
  useEffect(() => localStorage.setItem(key, JSON.stringify(state)), [key, state]);
  return [state, setState];
};

export const callGAS = async (url, body) => {
  if (!url || url.includes("여기에")) return null;
  const opts = body ? { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined;
  const res = await fetch(url, opts);
  return body ? true : await res.json();
};

export const callGemini = async (apiKey, prompt, retries = 3) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const data = await res.json();
    if (data.error) {
      if ((data.error.code === 503 || data.error.message.includes("overloaded")) && retries > 0) {
        await new Promise(r => setTimeout(r, 1500)); return callGemini(apiKey, prompt, retries - 1);
      }
      throw new Error(data.error.message);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (e) { throw e; }
};