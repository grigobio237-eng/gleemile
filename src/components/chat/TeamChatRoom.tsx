import React, { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Send, Download, Layers, FileText, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { IFirestoreTeamMessage } from '@/types/firebase';

interface TeamChatRoomProps {
  teamId: string;
  currentUserId?: string;
}

interface UIChatMessage extends IFirestoreTeamMessage {
  parsedDate: Date;
}

export function TeamChatRoom({ teamId, currentUserId }: TeamChatRoomProps) {
  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [previewImage, setPreviewImage] = useState<UIChatMessage | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!teamId) return;

    // 💡 Firestore 실시간 메시지 구독 (최신 50개, 역순)
    const messagesRef = collection(db, 'teams', teamId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: UIChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as IFirestoreTeamMessage;
        
        // serverTimestamp() 호출 직후엔 로컬 캐시에 Timestamp가 null로 들어올 수 있으므로 Fallback 처리
        const createdAtDate = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date();

        fetched.push({
          ...data,
          id: doc.id,
          parsedDate: createdAtDate
        });
      });
      
      // UI 렌더링을 위해 과거순(오래된 메시지가 위로) 정렬
      setMessages(fetched.reverse());
      setLoading(false);
      
      // 새 메시지가 올 때마다 스크롤을 맨 아래로
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("채팅 동기화 에러:", error);
    });

    return () => unsubscribe();
  }, [teamId]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUserId) return;
    const text = inputValue;
    setInputValue('');
    
    try {
      const messagesRef = collection(db, 'teams', teamId, 'messages');
      // 💡 서버 타임스탬프 강제 규칙 적용 (Race condition 방어)
      const docRef = await addDoc(messagesRef, {
        senderId: currentUserId,
        text,
        isSystemMessage: false,
        isDeleted: false,
        createdAt: serverTimestamp()
      });

      // 💡 푸시 알림 트리거 (서버사이드 데이터 룩업 검증용 API 호출)
      fetch(`/api/mile/team/${teamId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', messageId: docRef.id })
      }).catch(e => console.error("Notify trigger failed:", e));

    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setIsUploading(true);
    const isImage = file.type.startsWith('image/');
    
    try {
      // 💡 Firebase Storage 업로드 파이프라인
      const storageRef = ref(storage, `teams/${teamId}/chat/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progress 처리 (필요 시)
        }, 
        (error) => {
          console.error("Storage upload failed:", error);
          setIsUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 업로드 완료 후 메시지 발행
          const messagesRef = collection(db, 'teams', teamId, 'messages');
          const docRef = await addDoc(messagesRef, {
            senderId: currentUserId,
            text: isImage ? '사진을 보냈습니다.' : '파일을 보냈습니다.',
            attachmentUrl: downloadURL,
            attachmentType: isImage ? 'image' : 'file',
            isSystemMessage: false,
            isDeleted: false,
            createdAt: serverTimestamp()
          });
          
          // 푸시 알림 트리거
          fetch(`/api/mile/team/${teamId}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'chat', messageId: docRef.id })
          }).catch(e => console.error("Notify trigger failed:", e));

          setIsUploading(false);
        }
      );
    } catch (err) {
      console.error('File processing error', err);
      setIsUploading(false);
    }
  };

  const downloadAsPng = (imageUrl: string, fileName: string = 'image.png') => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName;
    a.target = '_blank';
    a.click();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Drawer에 표시할 미디어 파일 필터링
  const mediaItems = messages.filter(m => m.attachmentUrl);

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] bg-[#f8fafc] rounded-b-[32px] overflow-hidden relative">
      
      {/* 1. Header Options */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={() => setShowMediaDrawer(true)}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pt-16"
      >
        {loading && <p className="text-center text-xs text-slate-400">채팅 불러오는 중...</p>}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          const senderName = isMe ? '나' : (msg.senderId || '알 수 없음');

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <div className="flex items-center gap-2 mb-1 pl-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                    {senderName[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-500">{senderName}</span>
                </div>
              )}
              
              <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Message Bubble */}
                <div className={`px-4 py-2.5 rounded-[20px] max-w-[240px] md:max-w-[300px] break-words shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white text-obsidian border border-slate-100 rounded-tl-sm'
                }`}>
                  {msg.text && (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  )}
                  
                  {msg.attachmentType === 'image' && msg.attachmentUrl && (
                    <div className="cursor-pointer mt-2" onClick={() => setPreviewImage(msg)}>
                      <img src={msg.attachmentUrl} alt="attachment" className="rounded-xl w-full h-auto object-cover max-h-48" />
                    </div>
                  )}

                  {msg.attachmentType === 'file' && msg.attachmentUrl && (
                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/10 p-2 rounded-xl mt-2">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-obsidian'}`}>첨부파일</p>
                      </div>
                      <Download className={`w-4 h-4 shrink-0 ${isMe ? 'text-white' : 'text-indigo-600'}`} />
                    </a>
                  )}
                </div>
                {/* Time */}
                <span className="text-[10px] text-slate-400 font-medium mb-1">
                  {formatTime(msg.parsedDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Input Area */}
      <div className="p-3 bg-white border-t border-slate-200 relative z-30">
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="absolute -top-20 right-4 flex items-center gap-2 z-20 pointer-events-none drop-shadow-xl"
            >
              <div className="bg-white/90 backdrop-blur-sm text-emerald-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-emerald-100 italic">
                Uploading...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSendText} className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 shrink-0 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText(e);
              }
            }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none max-h-24 min-h-[40px] text-sm py-2.5 px-1 text-obsidian scrollbar-hide"
            rows={1}
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="w-10 h-10 shrink-0 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-md disabled:bg-slate-300 transition-colors"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Media Collection Drawer */}
      {showMediaDrawer && (
        <div className="absolute inset-y-0 right-0 w-4/5 md:w-80 bg-white shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-full border-l border-slate-100">
          <div className="p-4 border-b border-line flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-obsidian text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> 서랍 / 미디어 모아보기
            </h3>
            <button onClick={() => setShowMediaDrawer(false)} className="text-slate-400 hover:text-obsidian p-1 bg-white rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <File className="w-10 h-10 mb-2 text-slate-400" />
                <p className="text-xs font-bold">공유된 미디어가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {mediaItems.map(item => (
                  <div key={item.id} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                    {item.attachmentType === 'image' ? (
                      <div className="w-full h-full cursor-pointer" onClick={() => setPreviewImage(item)}>
                        <img src={item.attachmentUrl!} alt="media" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-indigo-50">
                        <FileText className="w-8 h-8 text-indigo-400 mb-1" />
                        <span className="text-[9px] font-bold text-indigo-700 truncate w-full">첨부파일</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center animate-in fade-in">
          <div className="absolute top-4 right-4 flex gap-3">
            <button 
              onClick={() => downloadAsPng(previewImage.attachmentUrl!)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
            >
              <Download className="w-4 h-4" /> 원본 다운로드
            </button>
            <button 
              onClick={() => setPreviewImage(null)}
              className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img src={previewImage.attachmentUrl!} alt="preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
