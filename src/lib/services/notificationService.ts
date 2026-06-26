import { adminDb, adminMessaging } from '../firebase/admin';

/**
 * 💡 FCM 알림 발송 서비스 (서버사이드)
 * 대상 팀 멤버들에게 멀티캐스트 푸시 알림을 발송하고, 만료된 토큰을 정리합니다.
 */
export async function sendPushNotification(
  teamId: string, 
  senderId: string, 
  title: string, 
  body: string, 
  urlData?: string,
  type?: 'chat' | 'announcement'
) {
  try {
    // 1. 발송 대상 유저 ID 조회 (발송자 본인은 제외)
    const membersSnap = await adminDb.collection('team_members')
      .where('teamId', '==', teamId)
      .where('status', '==', 'active')
      .get();

    const targetUserIds: string[] = [];
    membersSnap.forEach(doc => {
      const data = doc.data();
      if (data.userId !== senderId) {
        targetUserIds.push(data.userId);
      }
    });

    if (targetUserIds.length === 0) return { success: 0, failure: 0 };

    // 2. 유저별 알림 설정 확인 및 FCM 토큰 수집
    const tokens: string[] = [];
    const tokenToUserMap = new Map<string, string>(); // token 삭제를 위해 유저ID 매핑 기억

    // 유저 수가 매우 많을 경우를 대비해 병렬 처리(Promise.all)
    await Promise.all(targetUserIds.map(async (uid) => {
      // (1) 유저 알림 설정 룩업
      const userSnap = await adminDb.collection('users').doc(uid).get();
      if (userSnap.exists) {
        const settings = userSnap.data()?.notificationSettings;
        if (settings) {
          // 전체 알림이 꺼져있으면 제외
          if (settings.isAllEnabled === false) return;
          // 타입별 알림이 꺼져있으면 제외
          if (type === 'chat' && settings.chatEnabled === false) return;
          if (type === 'announcement' && settings.announcementEnabled === false) return;
        }
      }

      // (2) 조건 통과 시 활성 토큰 수집
      const tokensSnap = await adminDb.collection(`users/${uid}/fcmTokens`).get();
      tokensSnap.forEach(tokenDoc => {
        const t = tokenDoc.data().token;
        if (t) {
          tokens.push(t);
          tokenToUserMap.set(t, uid);
        }
      });
    }));

    if (tokens.length === 0) return { success: 0, failure: 0, skipped: targetUserIds.length };

    // 3. 메시지 페이로드 구성
    const message = {
      notification: { title, body },
      data: {
        url: urlData || `/mile/team/${teamId}`,
        teamId: teamId
      },
      tokens: tokens // sendMulticast는 최대 500개까지 지원
    };

    // 4. 발송 및 결과 처리 (Multicast)
    const response = await adminMessaging.sendEachForMulticast(message);
    let failureCount = 0;

    // 5. 실패한(만료된) 토큰 자동 청소 (Self-cleanup)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          failureCount++;
        }
      });

      // DB에서 토큰 지우기
      await Promise.all(failedTokens.map(async (failedToken) => {
        const uid = tokenToUserMap.get(failedToken);
        if (uid) {
          await adminDb.collection(`users/${uid}/fcmTokens`).doc(failedToken).delete();
        }
      }));
    }

    return { 
      success: response.successCount, 
      failure: failureCount 
    };

  } catch (error) {
    console.error('Push Notification Error:', error);
    throw error;
  }
}
