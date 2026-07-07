'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Send, Download, Layers, FileText, File, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ChatMessage, chatBlockConverter, generateChatMediaStoragePath } from '@/types/chat';

interface TeamChatRoomProps {
  teamId: string;
  currentUserId?: string;
  currentUserRole?: 'owner' | 'manager' | 'member' | 'guest';
}

export function TeamChatRoom({ teamId, currentUserId, currentUserRole = 'member' }: TeamChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [previewImage, setPreviewImage] = useState<ChatMessage | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [unreadThreshold, setUnreadThreshold] = useState<number | null>(null);

  // ==========================================
  // 0. 메타데이터 갱신 (Mount & Unmount 시점에만 기록 - 쓰기 비용 최적화)
  // ==========================================
  useEffect(() => {
    if (!teamId || !currentUserId) return;
    
    const initAndMarkRead = async () => {
      const metadataRef = doc(db, `teams/${teamId}/memberMeta`, currentUserId);
      
      try {
        // 기존 읽은 시간 가져오기
        const metaSnap = await getDoc(metadataRef);
        if (metaSnap.exists()) {
          const data = metaSnap.data();
          if (data.lastReadChatAt) {
            setUnreadThreshold(data.lastReadChatAt.toMillis());
          }
        }
        
        // 가져온 직후 현재 시간으로 업데이트
        setDoc(metadataRef, { lastReadChatAt: serverTimestamp() }, { merge: true }).catch(console.error);
      } catch (e) {
        console.error("Failed to read/update chat metadata:", e);
      }
    };

    initAndMarkRead();

    // Unmount 시점 갱신 (채팅방 이탈 시)
    return () => {
      const metadataRef = doc(db, `teams/${teamId}/memberMeta`, currentUserId);
      setDoc(metadataRef, { lastReadChatAt: serverTimestamp() }, { merge: true }).catch(console.error);
    };
  }, [teamId, currentUserId]);

  // ==========================================
  // 1. 실시간 메시지 구독 (onSnapshot & Optimistic UI)
  // ==========================================
  useEffect(() => {
    if (!teamId) return;

    // Converter가 부착된 타입 안전 컬렉션 참조
    const messagesRef = collection(db, 'teams', teamId, 'messages').withConverter(chatBlockConverter);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    // 다중 리스너 누수 방지를 위한 unsubscribe 클린업
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        // chatBlockConverter.fromFirestore를 통해 파싱된 안전한 객체가 넘어옴
        // pending 상태(낙관적 UI)일 경우 createdAt은 로컬 시간으로 자동 Fallback됨
        fetched.push(doc.data());
      });
      
      // 과거순(오래된 메시지가 위로) 렌더링을 위해 reverse
      setMessages(fetched.reverse());
      setLoading(false);
      
      // 새 메시지 인입 시 하단 자동 스크롤
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }, (error) => {
      console.error("채팅 동기화 에러:", error);
    });

    return () => unsubscribe();
  }, [teamId]);

  // ==========================================
  // 2. 메시지 전송 로직 (Optimistic UI 트리거)
  // ==========================================
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUserId) return;
    
    const text = inputValue;
    setInputValue(''); // 즉시 입력창 초기화
    
    try {
      const messagesRef = collection(db, 'teams', teamId, 'messages').withConverter(chatBlockConverter);
      
      // 💡 서버 응답을 기다리지 않고 로컬 캐시에 쓰기 시작 (Firestore 낙관적 UI 발동)
      // onSnapshot이 즉시 반응하여 임시 객체(Pending)를 화면에 뿌려줌
      const docRef = await addDoc(messagesRef, {
        senderId: currentUserId,
        senderRole: currentUserRole,
        content: text,
      } as any);

      // 서버사이드 알림 트리거 (실제 프로덕션 연동 시 활성화)
      fetch(`/api/mile/team/${teamId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', messageId: docRef.id })
      }).catch(e => console.error("Notify trigger failed:", e));

    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // ==========================================
  // 3. Storage 기반 미디어 업로드 파이프라인
  // ==========================================
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setIsUploading(true);
    const isImage = file.type.startsWith('image/');
    
    try {
      // 💡 유틸리티를 통한 안전한 Storage 경로 생성
      const storagePath = generateChatMediaStoragePath(teamId, file.name);
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progress 처리 로직 추가 가능
        }, 
        (error) => {
          console.error("Storage upload failed:", error);
          setIsUploading(false);
        }, 
        async () => {
          // 업로드 완료 후 Download URL 추출
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 미디어 URL을 포함하여 메시지 발행
          const messagesRef = collection(db, 'teams', teamId, 'messages').withConverter(chatBlockConverter);
          const docRef = await addDoc(messagesRef, {
            senderId: currentUserId,
            senderRole: currentUserRole,
            content: isImage ? '사진을 보냈습니다.' : '파일을 보냈습니다.',
            attachmentUrl: downloadURL
          } as any);
          
          setIsUploading(false);
        }
      );
    } catch (err) {
      console.error('File processing error', err);
      setIsUploading(false);
    }
  };

  // ==========================================
  // UI 렌더링 헬퍼 함수
  // ==========================================
  const formatTime = (timestampMs: number) => {
    const date = new Date(timestampMs);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'owner': return <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black">방장</span>;
      case 'manager': return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black">임원</span>;
      case 'guest': return <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">참관인</span>;
      default: return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[9px] font-black">방원</span>;
    }
  };

  const downloadAsOriginal = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'downloaded_media';
    a.target = '_blank';
    a.click();
  };

  const mediaItems = messages.filter(m => m.attachmentUrl);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] rounded-b-[32px] overflow-hidden relative">
      
      {/* 서랍 버튼 */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={() => setShowMediaDrawer(true)}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* 메시지 리스트 영역 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-5 pt-16 hide-scrollbar"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-3">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-slate-400">채팅 불러오는 중...</p>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          const senderName = isMe ? '나' : (msg.senderId || '알 수 없음');
          const isImageAttachment = msg.attachmentUrl && msg.content === '사진을 보냈습니다.';
          
          const prevMsg = index > 0 ? messages[index - 1] : null;
          let showDivider = false;
          
          if (unreadThreshold && msg.createdAt > unreadThreshold && (!prevMsg || prevMsg.createdAt <= unreadThreshold)) {
            showDivider = true;
          }

          return (
            <React.Fragment key={msg.id}>
              {showDivider && (
                <div className="flex items-center justify-center my-4 animate-in fade-in duration-500 w-full">
                  <div className="bg-slate-200/60 text-slate-500 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm tracking-tight border border-slate-200/80">
                    여기까지 읽으셨습니다.
                  </div>
                </div>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {/* 발신자 정보 & 뱃지 */}
              {!isMe && (
                <div className="flex items-center gap-1.5 mb-1 pl-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {senderName[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-600">{senderName}</span>
                  {getRoleBadge(msg.senderRole)}
                </div>
              )}
              
              <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* 말풍선 버블 */}
                <div className={`px-4 py-2.5 max-w-[240px] md:max-w-[300px] break-words shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-[20px] rounded-tr-sm' 
                    : 'bg-white text-obsidian border border-slate-100 rounded-[20px] rounded-tl-sm'
                }`}>
                  {msg.content && (
                    <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  
                  {/* 미디어 프리뷰 */}
                  {msg.attachmentUrl && (
                    <div className="mt-2">
                      {isImageAttachment ? (
                        <div className="cursor-pointer overflow-hidden rounded-xl" onClick={() => setPreviewImage(msg)}>
                          <img src={msg.attachmentUrl} alt="attachment" className="w-full h-auto object-cover max-h-48 hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-xl border ${isMe ? 'bg-white/10 border-indigo-400' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-indigo-100'}`}>
                            <FileText className={`w-4 h-4 ${isMe ? 'text-white' : 'text-indigo-600'}`} />
                          </div>
                          <p className={`text-[11px] font-bold truncate ${isMe ? 'text-white' : 'text-slate-600'}`}>첨부파일 다운로드</p>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {/* 시간 */}
                <span className="text-[9px] text-slate-400 font-bold mb-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 입력 영역 */}
      <div className="p-3 bg-white border-t border-slate-100 relative z-30">
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 left-4 flex items-center gap-2 z-20"
            >
              <div className="bg-white/90 backdrop-blur-sm text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm border border-indigo-100 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> 파일 업로드 중...
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
            placeholder="팀원들에게 메시지 보내기..."
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

      {/* 미디어 모아보기 서랍 */}
      {showMediaDrawer && (
        <div className="absolute inset-y-0 right-0 w-4/5 md:w-80 bg-white shadow-2xl z-40 flex flex-col animate-in slide-in-from-right-full border-l border-slate-100">
          <div className="p-4 border-b border-line flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-obsidian text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> 미디어 서랍
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
                    {item.content === '사진을 보냈습니다.' ? (
                      <div className="w-full h-full cursor-pointer" onClick={() => setPreviewImage(item)}>
                        <img src={item.attachmentUrl!} alt="media" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
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

      {/* 전체 화면 이미지 프리뷰 */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center animate-in fade-in">
          <div className="absolute top-4 right-4 flex gap-3">
            <button 
              onClick={() => downloadAsOriginal(previewImage.attachmentUrl!)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
            >
              <Download className="w-4 h-4" /> 다운로드
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
