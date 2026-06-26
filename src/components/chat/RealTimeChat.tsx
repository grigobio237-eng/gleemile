'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'error';
  content: string;
  timestamp: string;
}

export default function RealTimeChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Chat History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data = await res.json();
          const history = data.messages.map((m: any) => ({
            id: m._id,
            type: m.senderId === session.user?.id || m.senderId === session.user?.email ? 'user' : 'ai',
            content: m.content,
            timestamp: m.createdAt
          }));
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };
    fetchHistory();
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !session?.user) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInputMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputMessage })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.aiMessage) {
          setMessages(prev => [...prev, {
            id: data.aiMessage._id,
            type: 'ai',
            content: data.aiMessage.content,
            timestamp: data.aiMessage.createdAt
          }]);
        }
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        type: 'error',
        content: '메시지 전송에 실패했습니다. 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!session) {
    return (
        <Card className="w-full max-w-2xl mx-auto p-12 text-center">
            <p className="text-foreground/70 font-bold">채팅을 이용하시려면 로그인이 필요합니다.</p>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col border-none shadow-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-xl">
      <CardHeader className="bg-obsidian text-white p-6">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">Director Kim</div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Youniqle Recovery Guide
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-mist/20 to-transparent">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[24px] p-4 ${
                  message.type === 'user'
                    ? 'bg-obsidian text-white shadow-lg rounded-tr-none'
                    : message.type === 'ai'
                    ? 'bg-white text-obsidian shadow-md border border-line rounded-tl-none'
                    : 'bg-status-danger/10 text-status-danger text-xs'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'ai' && <span className="text-[10px] font-black uppercase text-primary tracking-widest">Director</span>}
                    {message.type === 'user' && <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">{session.user?.name}</span>}
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                  <p className="text-[9px] opacity-40 mt-2 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-line rounded-[24px] rounded-tl-none p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">분석 중...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-line bg-white">
          <div className="flex gap-3 bg-mist/30 p-2 rounded-[24px] border border-line focus-within:border-primary transition-colors">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="회복에 관해 무엇이든 물어보세요..."
              disabled={isLoading}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm font-medium"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="rounded-full w-10 h-10 p-0 bg-obsidian hover:bg-primary transition-colors"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
