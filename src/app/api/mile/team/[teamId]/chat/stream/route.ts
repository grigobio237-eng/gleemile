import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MileTeamMember from '@/models/MileTeamMember';
import { chatEmitter } from '@/lib/chatEmitter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const resolvedParams = await params;
    const teamId = resolvedParams.teamId;

    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify membership
    const membership = await MileTeamMember.findOne({
      userId: session.user.id,
      teamId: teamId
    });

    if (!membership) {
      return new Response('Not a member of this team', { status: 403 });
    }

    // Set up ReadableStream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Initial connection message to establish stream
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

        // The listener function
        const listener = (eventTeamId: string, message: any) => {
          if (eventTeamId === teamId) {
            // Push message to client with proper SSE format
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'newMessage', message })}\n\n`));
          }
        };

        // Attach listener
        chatEmitter.on('newMessage', listener);

        // Cleanup on connection close
        req.signal.addEventListener('abort', () => {
          chatEmitter.off('newMessage', listener);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('SSE Stream Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
