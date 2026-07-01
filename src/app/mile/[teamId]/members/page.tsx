'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Users, ArrowLeft, Loader2, Phone, UserCircle2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { normalizeRole, isManagerOrHigher } from '@/types/role';
import { Badge } from '@/components/ui/badge';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';

interface MemberSummary {
  id: string;
  name: string;
  gender?: string;
  ageGroup?: string;
  phoneNumber?: string;
  recommender?: string;
  role: string;
  joinedAt?: Timestamp;
}

export default function MembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('guest');
  const [roleLoading, setRoleLoading] = useState(true);
  const [teamOwnerId, setTeamOwnerId] = useState('');
  
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!teamId || status === 'loading') return;
    if (!session?.user?.id) {
      router.replace('/');
      return;
    }

    const initPage = async () => {
      try {
        let fetchedRole = 'guest';
        let currentOwnerId = '';
        
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        if (teamSnap.exists()) {
          currentOwnerId = teamSnap.data().ownerId;
          setTeamOwnerId(currentOwnerId);
        }

        const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
        const mySnap = await getDoc(myMemberRef);
        
        if (currentOwnerId === session.user.id) {
          fetchedRole = 'owner';
        } else if (mySnap.exists()) {
          fetchedRole = mySnap.data().role;
        }
        
        const normalized = normalizeRole(fetchedRole);
        if (normalized === 'guest') {
          alert('접근 권한이 없습니다.');
          router.replace(`/mile/${teamId}/dashboard`);
          return;
        }
        setUserRole(normalized);
        setRoleLoading(false);

        // Update lastReadPlayersAt
        const metadataRef = doc(db, `users/${session.user.id}/team_metadata`, teamId);
        setDoc(metadataRef, { lastReadPlayersAt: serverTimestamp() }, { merge: true });
        
        // Listen to member_summaries
        const q = query(collection(db, `teams/${teamId}/member_summaries`), orderBy('joinedAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched: MemberSummary[] = [];
          snapshot.forEach(docSnap => {
            fetched.push({ id: docSnap.id, ...docSnap.data() } as MemberSummary);
          });
          setMembers(fetched);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to initialize members page', error);
        setLoading(false);
        setRoleLoading(false);
      }
    };

    initPage();
  }, [teamId, session, status, router]);

  if (loading || roleLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const canSeePrivateInfo = isManagerOrHigher(userRole);

  const getRoleBadge = (role: string, memberId: string) => {
    let norm = normalizeRole(role);
    if (memberId === teamOwnerId) norm = 'owner';
    if (norm === 'owner') return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">관리자</Badge>;
    if (norm === 'manager') return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">운영진</Badge>;
    return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">팀원</Badge>;
  };

  const formatPhoneNumber = (phone: string | undefined, mask: boolean) => {
    if (!phone) return '-';
    if (mask) {
      // 010-1234-5678 -> 010-****-****
      const parts = phone.split('-');
      if (parts.length === 3) {
        return `${parts[0]}-****-****`;
      }
      return '010-****-****';
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24">
      <div className="max-w-4xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold w-fit">
            <ArrowLeft className="w-4 h-4" /> 대시보드
          </Link>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" /> 회원 명단
            </h1>
            <div className="text-sm font-bold text-slate-500">
              총 <span className="text-emerald-600 text-lg">{members.length}</span>명
            </div>
          </div>
        </div>

        {/* Simple Member List */}
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div 
              key={member.id} 
              onClick={() => {
                if (canSeePrivateInfo) {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }
              }}
              className={`bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100 shadow-sm transition-all ${canSeePrivateInfo ? 'cursor-pointer hover:shadow-md hover:bg-slate-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                  <UserCircle2 className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[17px] text-slate-800">{member.name}</span>
                  <span className="text-xs font-medium text-slate-400 mt-0.5">
                    가입일: {member.joinedAt?.toDate ? member.joinedAt.toDate().toLocaleDateString('ko-KR') : '-'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getRoleBadge(member.role, member.id)}
              </div>
            </div>
          ))}
        </div>

        <MemberDetailModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          roleBadge={selectedMember ? getRoleBadge(selectedMember.role, selectedMember.id) : null}
        />

      </div>
    </div>
  );
}
