'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';

export interface MemberSummary {
  name: string;
  nickname?: string;
  profileImage?: string;
  role: string;
}

interface TeamMemberContextProps {
  memberMap: Record<string, MemberSummary>;
  loading: boolean;
}

const TeamMemberContext = createContext<TeamMemberContextProps | undefined>(undefined);

export function TeamMemberProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const teamId = params?.teamId as string | undefined;

  const [memberMap, setMemberMap] = useState<Record<string, MemberSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const membersRef = collection(db, `teams/${teamId}/member_summaries`);
    const q = query(membersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMap: Record<string, MemberSummary> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        newMap[docSnap.id] = {
          name: data.name || data.nickname || '이름 없음',
          nickname: data.nickname,
          profileImage: data.profileImage,
          role: data.role || 'member'
        };
      });
      setMemberMap(newMap);
      setLoading(false);
    }, (error) => {
      console.error('Failed to subscribe to member_summaries:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  // 성능 방어: 불필요한 리렌더링 방지를 위해 Context Value 메모이제이션
  const value = useMemo(() => ({
    memberMap,
    loading
  }), [memberMap, loading]);

  return (
    <TeamMemberContext.Provider value={value}>
      {children}
    </TeamMemberContext.Provider>
  );
}

export function useTeamMembers() {
  const context = useContext(TeamMemberContext);
  if (context === undefined) {
    throw new Error('useTeamMembers must be used within a TeamMemberProvider');
  }
  return context;
}
