import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    if (!teamId) {
      return NextResponse.json({ success: false, error: 'Team ID required' }, { status: 400 });
    }

    const db = admin.firestore();
    const teamRef = db.collection('teams').doc(teamId);
    
    // Verify Ownership
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }
    
    const ownerId = teamDoc.data()?.ownerId;
    if (ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Only owner can delete the team' }, { status: 403 });
    }

    // recursiveDelete (Firebase Admin 10.1+ supported)
    // Deletes the document and all subcollections recursively.
    await db.recursiveDelete(teamRef);

    return NextResponse.json({ success: true, message: 'Team and all related data deleted recursively.' });
  } catch (error: any) {
    console.error('Failed to recursively delete team:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
