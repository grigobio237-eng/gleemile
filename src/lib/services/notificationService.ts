export async function sendPushNotification(
  teamId: string, 
  senderId: string, 
  title: string, 
  body: string, 
  urlData?: string,
  type?: 'chat' | 'announcement'
) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/sendPushNotification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, senderId, title, body, urlData, type })
    });
    return await res.json();
  } catch (error) {
    console.error('Push Notification Error:', error);
    return { success: 0, failure: 0 };
  }
}
