import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// db 인스턴스를 지연 로딩하기 위한 헬퍼
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

/**
 * 팀 메타데이터(team_metadata)의 lastUnreadCount를 증가시키고,
 * 변경된 후 해당 유저의 모든 팀 unreadCount 합산(총합)을 계산하여 FCM 푸시를 보냅니다.
 */
async function incrementAndNotify(
  teamId: string,
  targetUserIds: string[],
  title: string,
  body: string,
  url: string
) {
  for (const userId of targetUserIds) {
    try {
      const db = getDb();
      const teamMetaRef = db.collection('users').doc(userId).collection('team_metadata').doc(teamId);
      
      // 1. lastUnreadCount 증가 트랜잭션
      const totalUnread = await db.runTransaction(async (t) => {
        const metaDoc = await t.get(teamMetaRef);
        let currentUnread = 0;
        if (metaDoc.exists) {
          currentUnread = metaDoc.data()?.lastUnreadCount || 0;
          t.update(teamMetaRef, { lastUnreadCount: currentUnread + 1 });
        } else {
          t.set(teamMetaRef, { lastUnreadCount: 1 }, { merge: true });
        }
        
        // 2. 다른 모든 팀의 unread 카운트를 합산하여 총 배지 숫자 도출
        const allMetas = await t.get(db.collection('users').doc(userId).collection('team_metadata'));
        let total = 0;
        allMetas.forEach(d => {
          if (d.id === teamId) total += (currentUnread + 1);
          else total += (d.data()?.lastUnreadCount || 0);
        });
        return total;
      });

      // 3. 유저의 FCM 토큰 가져와서 Push & Badge 발송
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) continue;
      
      const tokens = userDoc.data()?.fcmTokens || [];
      if (tokens.length > 0) {
        const message = {
          notification: { title, body },
          data: {
            url,
            click_action: url,
            badge: totalUnread.toString(),
          },
          tokens: [...new Set<string>(tokens)], // 중복 제거
        };
        await admin.messaging().sendEachForMulticast(message);
      }
    } catch (e) {
      console.error(`Error notifying user ${userId}:`, e);
    }
  }
}

// ----------------------------------------------------------------------
// Firestore Triggers
// ----------------------------------------------------------------------

// 1. 메시지(채팅) 생성 감지
export const onMessageCreated = functions.region('asia-northeast3').firestore
  .document('teams/{teamId}/messages/{messageId}')
  .onCreate(async (snap: any, context: any) => {
    const { teamId } = context.params;
    const data = snap.data();
    const senderId = data.senderId;
    const text = data.text || '사진/동영상을 보냈습니다.';
    const db = getDb();

    // 발송자 제외한 모든 팀원 목록 조회
    const membersSnap = await db.collection(`teams/${teamId}/member_summaries`).get();
    const targetUserIds = membersSnap.docs
      .map(d => d.id)
      .filter(id => id !== senderId);

    if (targetUserIds.length === 0) return null;

    // 보낸 사람 이름 찾기
    const senderDoc = await db.collection(`teams/${teamId}/member_summaries`).doc(senderId).get();
    const senderName = senderDoc.exists ? senderDoc.data()?.name || '팀원' : '팀원';

    await incrementAndNotify(
      teamId,
      targetUserIds,
      `${senderName}님의 새로운 메시지`,
      text,
      `/mile/${teamId}/dashboard?view=chat`
    );
    
    return null;
  });

// 2. 공지사항 생성 감지
export const onAnnouncementCreated = functions.region('asia-northeast3').firestore
  .document('teams/{teamId}/announcements/{announcementId}')
  .onCreate(async (snap: any, context: any) => {
    const { teamId } = context.params;
    const data = snap.data();
    const senderId = data.authorId;
    const title = data.title || '새로운 공지사항이 등록되었습니다.';
    const db = getDb();

    const membersSnap = await db.collection(`teams/${teamId}/member_summaries`).get();
    const targetUserIds = membersSnap.docs
      .map(d => d.id)
      .filter(id => id !== senderId);

    if (targetUserIds.length === 0) return null;

    await incrementAndNotify(
      teamId,
      targetUserIds,
      `새로운 공지사항`,
      title,
      `/mile/${teamId}/announcements`
    );
    
    return null;
  });
