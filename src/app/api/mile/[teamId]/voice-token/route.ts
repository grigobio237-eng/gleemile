import { AccessToken } from 'livekit-server-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params since it's a Promise in Next.js 15
    const resolvedParams = await params;
    const teamId = resolvedParams.teamId;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'LiveKit server configuration missing' },
        { status: 500 }
      );
    }

    // Room name is the teamId to ensure each club has their own voice channel
    const roomName = `voice-room-${teamId}`;
    const participantName = session.user.name || session.user.email?.split('@')[0] || 'Unknown User';
    
    // Create an access token for this user
    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: participantName,
    });
    
    // Set permissions: they can join this specific room, and publish/subscribe to audio
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    

    const token = await at.toJwt();
    
    return NextResponse.json({ token, wsUrl, roomName });
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
