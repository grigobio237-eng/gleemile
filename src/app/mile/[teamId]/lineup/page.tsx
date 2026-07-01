'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Loader2, Save, Users, Settings2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { normalizeRole, isManagerOrHigher } from '@/types/role';
import { PitchBoard } from '@/components/lineup/PitchBoard';
import type { SportType, LineupPlayer, LineupData } from '@/types/lineup';

interface MemberSummary {
  id: string;
  name: string;
  role: string;
}

const SPORT_TYPES = [
  { id: 'soccer', label: '축구' },
  { id: 'futsal', label: '풋살' },
  { id: 'basketball', label: '농구' },
  { id: 'volleyball', label: '배구' },
  { id: 'tennis', label: '테니스' },
  { id: 'badminton', label: '배드민턴' },
  { id: 'jokgu', label: '족구' },
  { id: 'baseball', label: '야구' },
  { id: 'empty', label: '빈 칠판' }
];

export default function LineupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('guest');
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [lineup, setLineup] = useState<LineupData>({
    sportType: 'soccer',
    players: [],
    updatedAt: null,
    updatedBy: ''
  });
  
  const [selectedSidebarMemberId, setSelectedSidebarMemberId] = useState<string | null>(null);
  const [selectedPitchPlayerId, setSelectedPitchPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId || status === 'loading') return;
    if (!session?.user?.id) {
      router.replace('/');
      return;
    }

    const initPage = async () => {
      try {
        // Update lastReadLineupAt on mount
        const metaRef = doc(db, `teams/${teamId}/memberMeta`, session.user.id);
        await setDoc(metaRef, {
          lastReadLineupAt: serverTimestamp()
        }, { merge: true });

        let fetchedRole = 'guest';
        let currentOwnerId = '';
        
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        if (teamSnap.exists()) {
          currentOwnerId = teamSnap.data().ownerId;
        }

        const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
        const mySnap = await getDoc(myMemberRef);
        
        if (currentOwnerId === session.user.id) {
          fetchedRole = 'owner';
        } else if (mySnap.exists()) {
          fetchedRole = mySnap.data().role;
        }
        
        setUserRole(normalizeRole(fetchedRole));

        // Fetch members list
        const qMembers = query(collection(db, `teams/${teamId}/member_summaries`), orderBy('joinedAt', 'asc'));
        const unsubMembers = onSnapshot(qMembers, (snap) => {
          const list: MemberSummary[] = [];
          snap.forEach(docSnap => {
            const data = docSnap.data();
            list.push({ id: docSnap.id, name: data.name, role: data.role });
          });
          // Add owner if not in list
          if (teamSnap.exists() && !list.find(m => m.id === currentOwnerId)) {
            list.unshift({ id: currentOwnerId, name: '운영자', role: 'owner' });
          }
          setMembers(list);
        });

        // Fetch lineup
        const lineupRef = doc(db, `teams/${teamId}/lineups`, 'current');
        const unsubLineup = onSnapshot(lineupRef, (docSnap) => {
          if (docSnap.exists()) {
            setLineup(docSnap.data() as LineupData);
          } else {
            // Initial empty lineup
            setLineup({ sportType: 'soccer', players: [], updatedAt: null, updatedBy: '' });
          }
          setLoading(false);
        });

        return () => {
          unsubMembers();
          unsubLineup();
          // Update lastReadLineupAt on unmount
          setDoc(metaRef, {
            lastReadLineupAt: serverTimestamp()
          }, { merge: true }).catch(console.error);
        };
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    initPage();
  }, [teamId, session, status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isEditor = isManagerOrHigher(userRole);

  const saveLineup = async (newData: Partial<LineupData>) => {
    if (!isEditor) return;
    try {
      const lineupRef = doc(db, `teams/${teamId}/lineups`, 'current');
      await setDoc(lineupRef, {
        ...lineup,
        ...newData,
        updatedAt: serverTimestamp(),
        updatedBy: session?.user?.id || 'unknown'
      }, { merge: false });
    } catch (e) {
      console.error('Error saving lineup:', e);
    }
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSport = e.target.value as SportType;
    saveLineup({ sportType: newSport });
  };

  const handlePitchClick = (x: number, y: number) => {
    if (!isEditor) return;
    
    // Tap & Place logic
    if (selectedSidebarMemberId) {
      const member = members.find(m => m.id === selectedSidebarMemberId);
      if (!member) return;

      const newPlayers = [...lineup.players];
      const existingIdx = newPlayers.findIndex(p => p.id === member.id);
      
      if (existingIdx >= 0) {
        newPlayers[existingIdx].coordX = x;
        newPlayers[existingIdx].coordY = y;
      } else {
        newPlayers.push({
          id: member.id,
          name: member.name,
          coordX: x,
          coordY: y,
          teamColor: 'blue' // default
        });
      }
      
      saveLineup({ players: newPlayers });
      setSelectedSidebarMemberId(null);
    }
  };

  const handlePlayerMoveEnd = (playerId: string, x: number, y: number) => {
    if (!isEditor) return;
    const newPlayers = [...lineup.players];
    const idx = newPlayers.findIndex(p => p.id === playerId);
    if (idx >= 0) {
      newPlayers[idx].coordX = x;
      newPlayers[idx].coordY = y;
      saveLineup({ players: newPlayers });
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!isEditor) return;
    const newPlayers = lineup.players.filter(p => p.id !== playerId);
    saveLineup({ players: newPlayers });
    setSelectedPitchPlayerId(null);
  };

  const handleColorChange = (playerId: string, color: 'red' | 'blue') => {
    if (!isEditor) return;
    const newPlayers = [...lineup.players];
    const idx = newPlayers.findIndex(p => p.id === playerId);
    if (idx >= 0) {
      newPlayers[idx].teamColor = color;
      saveLineup({ players: newPlayers });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24 md:h-screen md:overflow-hidden md:flex md:flex-col">
      <div className="max-w-6xl mx-auto w-full pt-4 md:pt-6 md:flex-1 md:flex md:flex-col">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold w-fit">
            <ArrowLeft className="w-4 h-4" /> 대시보드
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-800">
              전술 보드 및 라인업
            </h1>
            {!isEditor && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full animate-pulse">
                실시간 관람 모드
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:flex-1 md:min-h-0">
          
          {/* Main Pitch Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {isEditor && (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-slate-400" />
                  <select 
                    value={lineup.sportType} 
                    onChange={handleSportChange}
                    className="font-bold text-slate-700 bg-slate-50 border-none rounded-lg p-1 text-sm outline-none cursor-pointer"
                  >
                    {SPORT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                {selectedPitchPlayerId && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleColorChange(selectedPitchPlayerId, 'blue')} className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                    <button onClick={() => handleColorChange(selectedPitchPlayerId, 'red')} className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button onClick={() => handleRemovePlayer(selectedPitchPlayerId)} className="p-1 text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-white rounded-3xl p-4 shadow-md border border-slate-100 flex-1 flex items-center justify-center overflow-hidden">
              <PitchBoard 
                sportType={lineup.sportType}
                players={lineup.players}
                readOnly={!isEditor}
                selectedPlayerId={selectedSidebarMemberId || selectedPitchPlayerId}
                onPitchClick={handlePitchClick}
                onPlayerClick={(pid) => {
                  if (isEditor) {
                    setSelectedSidebarMemberId(null);
                    setSelectedPitchPlayerId(pid === selectedPitchPlayerId ? null : pid);
                  }
                }}
                onPlayerMoveEnd={handlePlayerMoveEnd}
              />
            </div>
            
            {isEditor && (
              <div className="mt-4 text-center text-xs text-slate-500 font-medium">
                명단에서 선수를 <strong>선택</strong> 후 구장을 <strong>터치</strong>하거나 <strong>직접 드래그</strong>하세요.
              </div>
            )}
          </div>
          
          {/* Sidebar / Waiting List */}
          <div className="w-full md:w-72 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[300px] md:h-auto">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" /> 출전 대기 명단
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {members.map(member => {
                  const isPlaced = lineup.players.some(p => p.id === member.id);
                  const isSelected = selectedSidebarMemberId === member.id;
                  
                  return (
                    <div 
                      key={member.id}
                      onClick={() => {
                        if (isEditor) {
                          setSelectedPitchPlayerId(null);
                          setSelectedSidebarMemberId(isSelected ? null : member.id);
                        }
                      }}
                      className={`p-3 rounded-xl border flex flex-col transition-all ${isPlaced ? 'opacity-50 border-slate-100 bg-slate-50' : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm cursor-pointer'} ${isSelected ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50' : ''}`}
                    >
                      <span className="font-bold text-slate-700">{member.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{isPlaced ? '배치 완료' : '대기 중'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
