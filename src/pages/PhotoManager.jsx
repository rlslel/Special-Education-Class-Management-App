import React, { useState, useRef } from 'react';
import { Plus, MoreHorizontal, Camera, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { usePersistentState } from '../utils/helpers';
import { UI } from '../components/SharedUI';

export default function PhotoManager() {
  const [posts, setPosts] = usePersistentState('class_photos', []); 
  const [modal, setModal] = useState(null);

  const addPost = (data) => {
    setPosts([{ ...data, id: Date.now(), date: new Date().toLocaleDateString() }, ...posts]);
    setModal(null);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800">학급 앨범 ({posts.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} onClick={() => setModal({ type: 'view', data: post })} className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform group">
            <div className="aspect-square bg-gray-100 relative">
              <img src={post.images ? post.images[0] : post.url} className="w-full h-full object-cover" />
              {post.images && post.images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <MoreHorizontal size={12}/> +{post.images.length - 1}
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-bold text-gray-800 truncate">{post.caption || '무제'}</p>
              <p className="text-xs text-gray-400 mt-1">{post.date}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setModal({ type: 'upload' })} className="fixed bottom-8 right-8 w-16 h-16 bg-pink-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-20"><Plus size={32}/></button>
      
      {modal?.type === 'upload' && (
        <UI.Modal onClose={() => setModal(null)} title="새 사진 올리기" maxWidth="max-w-md">
          <PhotoUploadForm onSave={addPost} />
        </UI.Modal>
      )}
      
      {modal?.type === 'view' && (
        <UI.Modal onClose={() => setModal(null)} maxWidth="max-w-4xl">
          <PhotoViewer post={modal.data} onDelete={(id) => { setPosts(posts.filter(p => p.id !== id)); setModal(null); }} />
        </UI.Modal>
      )}
    </div>
  );
}

function PhotoUploadForm({ onSave }) {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const promises = files.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }));

    try {
      const results = await Promise.all(promises);
      setImages([...images, ...results]);
    } catch (error) { alert("이미지 변환 중 오류가 발생했습니다."); }
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
        <div onClick={() => fileRef.current.click()} className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-pink-300 hover:text-pink-400 transition-colors">
          <Camera size={24}/>
          <span className="text-xs mt-1 font-bold">추가</span>
        </div>
        {images.map((img, idx) => (
          <div key={idx} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative group">
            <img src={img} className="w-full h-full object-cover"/>
            <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
          </div>
        ))}
      </div>
      <input type="file" ref={fileRef} onChange={handleFileChange} className="hidden" multiple accept="image/*"/>
      <textarea lang="ko" value={caption} onChange={e => setCaption(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none resize-none h-32" placeholder="어떤 활동이었나요?" />
      <UI.Btn onClick={() => { if(images.length === 0) return alert("사진을 1장 이상 선택해주세요."); onSave({ images, caption }); }} className="w-full mt-4 bg-pink-500">게시하기</UI.Btn>
    </div>
  );
}

function PhotoViewer({ post, onDelete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = post.images || [post.url]; 

  return (
    <div className="flex flex-col md:flex-row h-[80vh]">
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        <img src={images[currentIdx]} className="max-w-full max-h-full object-contain" />
        {images.length > 1 && (
          <>
            {currentIdx > 0 && <button onClick={() => setCurrentIdx(currentIdx - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm"><ChevronLeft size={24}/></button>}
            {currentIdx < images.length - 1 && <button onClick={() => setCurrentIdx(currentIdx + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm"><ChevronRight size={24}/></button>}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentIdx ? 'bg-white scale-110' : 'bg-white/30'}`} />)}
            </div>
          </>
        )}
      </div>

      <div className="w-full md:w-96 bg-white p-6 border-l flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold">T</div>
          <div><p className="font-bold text-sm text-gray-800">선생님</p><p className="text-xs text-gray-400">{post.date}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p></div>
        <div className="pt-6 border-t mt-4"><button onClick={() => { if(confirm("정말 삭제하시겠습니까?")) onDelete(post.id); }} className="text-red-400 text-sm font-bold flex items-center gap-2 hover:text-red-600"><Trash2 size={16}/> 게시물 삭제</button></div>
      </div>
    </div>
  );
}