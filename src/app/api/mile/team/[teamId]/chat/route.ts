import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import TeamChatMessage from '@/models/TeamChatMessage';
import MileTeamMember from '@/models/MileTeamMember';
import User from '@/models/User';
import { chatEmitter } from '@/lib/chatEmitter';

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const resolvedParams = await params;
    const teamId = resolvedParams.teamId;
    
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      teamId: teamId
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const beforeDate = searchParams.get('before'); // for cursor-based pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const filterType = searchParams.get('type'); // e.g. 'media'

    let query: any = { teamId: teamId };
    
    if (beforeDate) {
      query.createdAt = { $lt: new Date(beforeDate) };
    }
    
    if (filterType === 'media') {
      query.type = { $in: ['image', 'file'] };
    }

    const messages = await TeamChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name image provider') // populate user details
      .lean();

    // The frontend usually expects messages in chronological order (oldest first)
    // Since we sorted by -1 (newest first) for limit, we should reverse it
    messages.reverse();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Team Chat GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const resolvedParams = await params;
    const teamId = resolvedParams.teamId;
    
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      teamId: teamId
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    const body = await req.json();
    const { content, type, fileUrl, fileName, fileSize } = body;

    const newMessage = await TeamChatMessage.create({
      teamId: teamId,
      senderId: session.user.id,
      content,
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      readBy: [session.user.id]
    });

    // Populate sender info for the response so the UI updates cleanly
    await newMessage.populate('senderId', 'name image provider');

    // Emit the event so all connected SSE clients get the message instantly
    chatEmitter.emit('newMessage', teamId, newMessage);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Team Chat POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
