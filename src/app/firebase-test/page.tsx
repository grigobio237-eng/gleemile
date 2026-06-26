'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, doc, setDoc, addDoc, onSnapshot, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';

// 1. 다형성(Discriminator) 타입 가드 및 팩토리 패턴 정의
type BlockType = 'OKR' | 'ACWR' | 'SETTLEMENT';

interface BaseBlock {
  blockId: string;
  blockType: BlockType;
  isActive: boolean;
}

interface OkrBlock extends BaseBlock {
  blockType: 'OKR';
  currentProgress: number;
  targetValue: number;
  objectiveTitle: string;
}

interface AcwrBlock extends BaseBlock {
  blockType: 'ACWR';
  acuteLoad: number;
  chronicLoad: number;
  injuryRiskZone: 'Safe' | 'Watch' | 'Danger';
}

interface SettlementBlock extends BaseBlock {
  blockType: 'SETTLEMENT';
  bankAccount: string;
  bankName: string;
  totalAmount: number;
}

// 타입스크립트의 유니온 타입을 이용해 Mongoose의 Discriminator 대체
type TeamBlock = OkrBlock | AcwrBlock | SettlementBlock;

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: Date | null;
}

export default function FirebaseTestPage() {
  const [teamId, setTeamId] = useState<string>('test_team_001');
  const [userId] = useState<string>('test_user_777');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [logs, setLogs] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasCreated, setHasCreated] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  
  const isCreatingRef = useRef(false);
  const isJoiningRef = useRef(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  // --- 1. 방(Team) 생성 및 블록 세팅 (다형성 임베딩 테스트) ---
  const handleCreateTeam = async () => {
    if (isCreatingRef.current || hasCreated) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    try {
      const teamRef = doc(db, 'teams', teamId);
      
      // 타입스크립트가 자동완성으로 보호해 주는 다형성 블록 배열
      // 에디터에서 okrBlock. 을 타이핑하면 OkrBlock에만 있는 속성이 자동완성 됩니다.
      const blocks: TeamBlock[] = [
        {
          blockId: 'block_okr_1',
          blockType: 'OKR',
          isActive: true,
          objectiveTitle: '프로덕트 MVP 런칭',
          currentProgress: 70,
          targetValue: 100
        },
        {
          blockId: 'block_acwr_1',
          blockType: 'ACWR',
          isActive: true,
          acuteLoad: 1500,
          chronicLoad: 1200,
          injuryRiskZone: 'Safe'
        }
      ];

      await setDoc(teamRef, {
        teamName: 'Firebase Test Team',
        enabledBlocks: blocks,
        createdAt: serverTimestamp()
      });
      addLog('✅ 팀 생성 완료 (다형성 블록 임베딩 성공)');
      setHasCreated(true);
    } catch (e: any) {
      addLog(`❌ 팀 생성 에러: ${e.message}`);
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  };

  // --- 2. 중복 방지 가입 버튼 (ID 기반 멱등성 테스트) ---
  const handleJoinTeam = async () => {
    if (isJoiningRef.current || hasJoined) return;
    isJoiningRef.current = true;
    setIsJoining(true);
    try {
      // 복합 유니크 인덱스 대체: teamId + userId 조합을 문서 ID로 사용!
      const memberDocId = `${teamId}_${userId}`;
      const memberRef = doc(db, 'team_members', memberDocId);
      
      // merge: true 옵션으로 여러 번 호출되어도 기존 데이터를 덮어쓰므로 에러가 나지 않고 멱등성 보장
      await setDoc(memberRef, {
        teamId,
        userId,
        role: 'member',
        joinedAt: serverTimestamp()
      }, { merge: true });
      
      addLog(`✅ 팀 가입 성공 (문서 ID: ${memberDocId} - 중복 가입 완벽 방어)`);
      setHasJoined(true);
    } catch (e: any) {
      addLog(`❌ 팀 가입 에러: ${e.message}`);
      isJoiningRef.current = false;
      setIsJoining(false);
    }
  };

  // --- 3. 실시간 채팅 UI (Subcollection 초저지연 체감) ---
  useEffect(() => {
    // 서브컬렉션 리스너 등록: teams/{teamId}/messages
    const messagesRef = collection(db, 'teams', teamId, 'messages');
    // 복합 인덱스 없이도 서브컬렉션 내 정렬 가능
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: ChatMessage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          createdAt: data.createdAt ? data.createdAt.toDate() : null
        });
      });
      // desc로 가져왔으므로 렌더링 시에는 역순(오래된 순) 정렬
      setMessages(loadedMessages.reverse());
    });

    return () => unsubscribe();
  }, [teamId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    try {
      const messagesRef = collection(db, 'teams', teamId, 'messages');
      await addDoc(messagesRef, {
        text: chatInput,
        senderId: userId,
        createdAt: serverTimestamp()
      });
      setChatInput('');
    } catch (e: any) {
      addLog(`❌ 메시지 전송 에러: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-800">
      <div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">🔥 Firebase 아키텍처 검증 센터</h1>
        <p className="text-slate-500">NoSQL(Firestore) 구조 전환 3대 검증 (다형성, 멱등성, 서브컬렉션 실시간 동기화)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 제어 패널 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg text-sm">STEP 1</span>
              다형성 블록 임베딩
            </h2>
            <button 
              onClick={handleCreateTeam} 
              disabled={isCreating || hasCreated}
              className={`w-full text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-lg ${isCreating || hasCreated ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
            >
              {hasCreated ? '✅ 생성 완료 (중복 생성 방어)' : isCreating ? '생성 처리 중...' : '1. 팀 생성 (OKR, ACWR 블록 임베딩)'}
            </button>
            <p className="text-sm text-slate-500 mt-3 break-keep leading-relaxed">
              MongoDB Discriminator를 대체합니다. `teams` 문서 내에 `enabledBlocks` 필드를 배열로 저장하며, VSCode 상에서 TypeScript Union 기반의 강력한 자동완성을 지원합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-sm">STEP 2</span>
              멱등성 가입 테스트
            </h2>
            <button 
              onClick={handleJoinTeam} 
              disabled={isJoining || hasJoined}
              className={`w-full text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-lg ${isJoining || hasJoined ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
            >
              {hasJoined ? '✅ 가입 완료 (중복 가입 방어)' : isJoining ? '가입 처리 중...' : '2. 팀 가입 (연타 광클 테스트)'}
            </button>
            <p className="text-sm text-slate-500 mt-3 break-keep leading-relaxed">
              복합 유니크 인덱스를 대체합니다. 버튼을 수십 번 연타해도 Firestore 콘솔에는 `teamId_userId` 문자열로 조합된 오직 1개의 문서만 덮어쓰여집니다.
            </p>
          </div>

          <div className="bg-[#0B0B0B] text-emerald-400 p-5 rounded-2xl font-mono text-sm shadow-xl relative overflow-hidden">
            <h3 className="text-white/50 mb-3 font-semibold text-xs tracking-wider">SYSTEM LOGS</h3>
            <div className="space-y-2 h-[120px] overflow-y-auto">
              {logs.length === 0 && <span className="text-slate-600">대기 중...</span>}
              {logs.map((log, idx) => <div key={idx} className="opacity-90 leading-relaxed">&gt; {log}</div>)}
            </div>
          </div>
        </div>

        {/* 실시간 채팅 패널 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col h-[600px]">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg text-sm">STEP 3</span>
            초저지연 채팅 (Subcollection)
          </h2>
          <p className="text-sm text-slate-500 mb-4 break-keep">
            복합 인덱스 설정 없이 `teams/teamId/messages` 경로의 서브컬렉션을 구독(onSnapshot)하여 0.1초의 초저지연 동기화를 체감해 보세요.
          </p>
          
          <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-4 overflow-y-auto space-y-4 flex flex-col">
            {messages.length === 0 && (
              <div className="m-auto text-slate-400 text-sm text-center">
                메시지가 없습니다.<br/>첫 메시지를 보내 테스트를 시작하세요!
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-[15px] ${m.senderId === userId ? 'bg-[#FEE500] text-black/90 self-end rounded-tr-sm' : 'bg-white border text-slate-800 self-start rounded-tl-sm'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 bg-slate-100 border-none rounded-xl px-5 focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 transition-all"
              placeholder="메시지를 입력하세요"
            />
            <button type="submit" className="bg-[#FEE500] text-black/90 px-6 py-3 rounded-xl font-bold hover:bg-[#F4DC00] transition-colors">
              전송
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
