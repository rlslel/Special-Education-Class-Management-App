import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const UI = {
  Btn: ({ children, onClick, className = "", variant = "primary", ...props }) => {
    const base = "py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2";
    const variants = { primary: "bg-pink-400 hover:bg-pink-500 text-white shadow-md", secondary: "bg-gray-100 hover:bg-gray-200 text-gray-600", blue: "bg-blue-500 hover:bg-blue-600 text-white shadow-md", danger: "bg-red-50 hover:bg-red-100 text-red-500", ghost: "bg-transparent hover:bg-gray-50 text-gray-500" };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
  },
  Input: ({ label, className = "", ...props }) => (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">{label}</label>}
      <input lang="ko" className={`w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-pink-200 ${className}`} {...props} />
    </div>
  ),
  Select: ({ label, options, ...props }) => (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">{label}</label>}
      <select className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-pink-200" {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  ),
  Modal: ({ children, onClose, title, maxWidth = "max-w-2xl" }) => {
    useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up" onClick={onClose}>
        <div className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
          {title && <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10"><h3 className="text-xl font-bold ml-2">{title}</h3><button onClick={onClose}><X size={20}/></button></div>}
          {children}
        </div>
      </div>
    );
  }
};

export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => !isOpen ? null : (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center animate-bounce-short">
    <AlertTriangle size={24} className="text-red-500 mx-auto mb-4"/><h3 className="text-lg font-bold text-gray-800 mb-2">확인</h3><p className="text-gray-600 text-sm mb-6">{message}</p>
    <div className="flex gap-2"><UI.Btn variant="secondary" className="flex-1" onClick={onCancel}>취소</UI.Btn><UI.Btn variant="danger" className="flex-1" onClick={onConfirm}>확인</UI.Btn></div>
  </div></div>
);

export const RecoveryModal = ({ securityData, onClose, onSuccess, onError }) => {
  const [s, setS] = React.useState(1); const [a, setA] = React.useState(''); const [p, setP] = React.useState('');
  return <UI.Modal onClose={onClose}><div className="p-6 text-center">{s===1 ? <><div className="font-bold mb-4">Q. {securityData?.question}</div><UI.Input value={a} onChange={e=>setA(e.target.value)} placeholder="정답"/><div className="flex gap-2 mt-4"><UI.Btn variant="secondary" onClick={onClose} className="flex-1">취소</UI.Btn><UI.Btn onClick={()=>a===securityData?.answer?setS(2):onError('오답')} className="flex-1">확인</UI.Btn></div></> : <><UI.Input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="새 비밀번호"/><UI.Btn onClick={()=>onSuccess(p)} className="w-full mt-4">변경</UI.Btn></>}</div></UI.Modal>;
};