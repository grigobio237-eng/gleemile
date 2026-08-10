import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const teamId = resolvedParams.teamId;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const participantName = session.user.name || session.user.email?.split('@')[0] || 'Unknown User';
    
    // Call Firebase Cloud Function
    const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;
    if (!functionsUrl) {
      console.error('Missing NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL');
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const response = await fetch(`${functionsUrl}/generateVoiceToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        userId: session.user.id,
        userName: participantName
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch token from Cloud Functions');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
