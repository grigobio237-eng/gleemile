const admin = require('firebase-admin');

async function testWebhook() {
  console.log('1. Starting Next.js mock webhook test...');
  
  // To test the API route, we need the dev server running. 
  // Let's assume it's running on port 3000. If not, this fetch will fail.
  const teamId = 'test_team_' + Date.now();
  const orderId = 'test_order_' + Date.now();

  // We can just initialize admin here and create a fake doc
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  const db = admin.firestore();
  
  console.log(`2. Creating mock noshow_booking for orderId: ${orderId} in team: ${teamId}`);
  const docRef = await db.collection(`teams/${teamId}/noshow_bookings`).add({
    orderId,
    clientName: 'Test Client',
    serviceName: 'Test Service',
    depositAmount: 10000,
    status: 'pending',
    paymentLinkUrl: 'http://mock.link',
    createdAt: new Date(),
  });
  console.log(`-> Created doc: ${docRef.id}`);

  console.log('3. Sending mock webhook payload to local API Route...');
  try {
    const res = await fetch('http://localhost:3000/api/merchant/webhook/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PAID',
        orderId,
        paymentId: 'pay_test_' + Date.now(),
        customData: { teamId }
      })
    });
    
    const data = await res.json();
    console.log('-> Webhook Response:', data);

    console.log('4. Verifying DB update...');
    const updatedDoc = await docRef.get();
    const docData = updatedDoc.data();
    if (docData.status === 'paid' && docData.paymentId) {
      console.log('✅ Success: Document successfully updated to PAID state!');
    } else {
      console.log('❌ Failed: Document state was not updated correctly.', docData);
    }
  } catch (err) {
    console.error('Error calling webhook API (Make sure server is running):', err.message);
  }
}

testWebhook().catch(console.error);
