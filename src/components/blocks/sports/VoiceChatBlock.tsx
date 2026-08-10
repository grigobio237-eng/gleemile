'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneCall, PhoneOff, Users, Loader2 } from 'lucide-react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ParticipantName,
  useParticipants,
  ConnectionStateToast
} from '@livekit/components-react';
import '@livekit/components-styles';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceChatBlockProps {
  teamId: string;
}

export default function VoiceChatBlock({ teamId }: VoiceChatBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch token when opening the modal
  const handleOpen = async () => {
    setIsOpen(true);
    if (token) return; // Already have a token

    setIsConnecting(true);
    try {
      const res = await fetch(`/api/mile/${teamId}/voice-token`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to connect');

      setToken(data.token);
      setWsUrl(data.wsUrl);
    } catch (err: any) {
      toast.error('통신 연결에 실패했습니다.', {
        description: err.message
      });
      setIsOpen(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    // When closing the dialog, we might want to keep it running in the background, 
    // or we disconnect. Let's just disconnect for simplicity of this version.
    setToken('');
    setIsOpen(false);
  };

  // Prevent screen from sleeping while the Voice modal is open (Wake Lock API)
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (err) {
          console.warn('Wake Lock release failed:', err);
        }
      }
    };

    if (isOpen) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire lock if visibility changes (e.g. user switches tabs and comes back)
    const handleVisibilityChange = () => {
      if (isOpen && wakeLock === null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isOpen]);


  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden border-zinc-800 bg-zinc-900/50"
        onClick={handleOpen}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              실시간 무전기 (Voice)
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
            세나, 에어팟 등 블루투스 기기와 연동하여 동호회 멤버들과 실시간 다자간 통화를 시작합니다.
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              보이스 채널
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              라이딩이나 활동 중에 멤버들과 자유롭게 소통하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[300px] flex flex-col items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 p-4">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-sm">보이스 서버에 연결 중...</p>
              </div>
            ) : token && wsUrl ? (
              <LiveKitRoom
                video={false}
                audio={true}
                token={token}
                serverUrl={wsUrl}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
                onDisconnected={handleClose}
              >
                <div className="flex-1 overflow-y-auto mb-4 w-full">
                  <ParticipantsList />
                </div>
                <RoomAudioRenderer />
                
                {/* Standard LiveKit ControlBar for Mic and Leave */}
                <div className="mt-auto bg-zinc-950/50 p-2 rounded-xl flex justify-center w-full">
                  <ControlBar controls={{ microphone: true, camera: false, screenShare: false, chat: false }} />
                </div>
                <ConnectionStateToast />
              </LiveKitRoom>
            ) : (
              <p className="text-zinc-500 text-sm">연결을 준비할 수 없습니다.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Custom component to show participants
function ParticipantsList() {
  const participants = useParticipants();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Users className="w-4 h-4 text-zinc-400" />
        <span className="text-sm text-zinc-300 font-medium">참여자 ({participants.length}명)</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {participants.map((participant) => (
          <div key={participant.identity} className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-md border border-zinc-700/50">
            <div className={cn(
              "w-2 h-2 rounded-full",
              participant.isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
            )} />
            <ParticipantName participant={participant} className="text-sm font-medium text-zinc-200 truncate" />
          </div>
        ))}
      </div>
    </div>
  );
}
