import { useEffect, useRef, useState } from 'react';
import { ref, onChildAdded, onValue, push, set, off } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { Stroke } from './useCanvas';
import { SportType } from './TacticalBackground';

export function useLiveSync(teamId: string) {
  const [syncedSport, setSyncedSport] = useState<SportType>('soccer');
  const [remoteStrokes, setRemoteStrokes] = useState<Stroke[]>([]);
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    if (!teamId) return;

    const strokesRef = ref(rtdb, `tactics/${teamId}/strokes`);
    const sportRef = ref(rtdb, `tactics/${teamId}/sport`);
    const clearRef = ref(rtdb, `tactics/${teamId}/lastCleared`);

    // Listen for new strokes
    const onStrokeAdded = onChildAdded(strokesRef, (snapshot) => {
      const stroke = snapshot.val() as Stroke;
      if (stroke) {
        setRemoteStrokes(prev => {
          // 중복 방지 (자신이 보낸 stroke도 child_added로 다시 들어옴)
          if (prev.some(s => s.id === stroke.id)) return prev;
          return [...prev, stroke];
        });
      }
    });

    // Listen for sport changes
    const onSportChanged = onValue(sportRef, (snapshot) => {
      const sport = snapshot.val() as SportType;
      if (sport) {
        setSyncedSport(sport);
      }
    });

    // Listen for clear events
    const onCleared = onValue(clearRef, (snapshot) => {
      const timestamp = snapshot.val();
      if (timestamp) {
        setRemoteStrokes([]);
      }
    });

    // Time-Lock 자동 휘발 로직 (10분 동안 활동이 없으면 데이터 날림)
    const AUTO_EXPIRE_MS = 10 * 60 * 1000; // 10분
    const activityRef = ref(rtdb, `tactics/${teamId}/lastActivity`);
    let lastKnownActivity = Date.now();

    const checkExpiration = (lastActivityTime: number) => {
      if (Date.now() - lastActivityTime > AUTO_EXPIRE_MS) {
        set(clearRef, Date.now());
        set(strokesRef, null); // 데이터 날림
      }
    };

    const onActivityUpdate = onValue(activityRef, (snapshot) => {
      const timestamp = snapshot.val();
      if (timestamp) {
        lastKnownActivity = timestamp;
        checkExpiration(timestamp);
      }
    });

    // 방을 열어둔 상태로 방치하는 경우 대비 (1분마다 체크)
    const expireTimer = setInterval(() => {
      checkExpiration(lastKnownActivity);
    }, 60000);

    return () => {
      off(strokesRef, 'child_added', onStrokeAdded);
      off(sportRef, 'value', onSportChanged);
      off(clearRef, 'value', onCleared);
      off(activityRef, 'value', onActivityUpdate);
      clearInterval(expireTimer);
    };
  }, [teamId]);

  const pushStroke = (stroke: Stroke) => {
    if (!teamId) return;
    const strokesRef = ref(rtdb, `tactics/${teamId}/strokes`);
    push(strokesRef, stroke);
    
    // 로컬 상태에도 즉시 반영
    setRemoteStrokes(prev => {
      if (prev.some(s => s.id === stroke.id)) return prev;
      return [...prev, stroke];
    });

    // 드로잉 활동 기록
    const activityRef = ref(rtdb, `tactics/${teamId}/lastActivity`);
    set(activityRef, Date.now());
  };

  const updateSport = (sport: SportType) => {
    if (!teamId) return;
    const sportRef = ref(rtdb, `tactics/${teamId}/sport`);
    set(sportRef, sport);
    setSyncedSport(sport);
    
    // 배경을 바꾼 것도 활동으로 간주
    const activityRef = ref(rtdb, `tactics/${teamId}/lastActivity`);
    set(activityRef, Date.now());
  };

  const syncClear = () => {
    if (!teamId) return;
    const clearRef = ref(rtdb, `tactics/${teamId}/lastCleared`);
    set(clearRef, Date.now());
    // 또한 공간 확보를 위해 strokes 삭제
    const strokesRef = ref(rtdb, `tactics/${teamId}/strokes`);
    set(strokesRef, null);
    
    const activityRef = ref(rtdb, `tactics/${teamId}/lastActivity`);
    set(activityRef, Date.now());
    
    setRemoteStrokes([]);
  };

  return {
    syncedSport,
    remoteStrokes,
    pushStroke,
    updateSport,
    syncClear
  };
}
