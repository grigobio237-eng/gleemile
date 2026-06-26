'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Session } from 'next-auth';
import { io, Socket } from 'socket.io-client';
import { Send, Lock } from 'lucide-react';
import Image from 'next/image';


interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
    type: 'text' | 'image';
}

interface ChatInterfaceProps {
    session: Session | null;
    subscriptionActive: boolean;
    onSubscribe: () => void;
}

export default function ChatInterface({ session, subscriptionActive, onSubscribe }: ChatInterfaceProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Initialize Socket
    useEffect(() => {
        if (!session?.user || !subscriptionActive) return;

        fetch('/api/socket'); // Ensure socket server is ready

        // Use dynamic origin if on client, or fallbacks
        const socketUrl = process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

        console.log('Connecting to socket at:', socketUrl);

        const socketInstance = io(socketUrl, {
            path: '/api/socket',
            addTrailingSlash: false,
            transports: ['polling', 'websocket'], // Force polling first for better compatibility
            auth: {
                token: (session as any).accessToken // Or handle extraction logic if token not in session props directly
            }
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            socketInstance.emit('join_chat');
        });

        socketInstance.on('receive_chat_message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        socketInstance.on('chat_message_sent', (message: Message) => {
            // Avoid duplicates if we optimistically added it? 
            // For now, simpler to just use this or optimistic. 
            // Let's rely on this for confirmation or just push locall immediately.
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [session, subscriptionActive]);

    // Fetch initial history
    useEffect(() => {
        if (subscriptionActive) {
            fetch('/api/chat')
                .then((res) => res.json())
                .then((data) => {
                    if (data.messages) {
                        setMessages(data.messages);
                    }
                })
                .catch(console.error);
        }
    }, [subscriptionActive]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const content = inputMessage;
        setInputMessage(''); // Clear input immediately

        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticMsg: any = {
            _id: tempId,
            senderId: (session?.user as any).id || (session?.user as any)._id,
            content: content,
            createdAt: new Date().toISOString(),
            type: 'text'
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            // Send via REST API for reliability (especially for AI response)
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                const data = await res.json();

                // If AI responded, append it
                if (data.aiMessage) {
                    setMessages(prev => [...prev, data.aiMessage]);
                } else if (data.message) {
                    // Fallback for just user message confirmation (replace optimistic? not strictly needed unless ID needed)
                }
            } else {
                console.error('Failed to send message via API');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }

        // Also emit to socket for real-time updates to admins (if connected)
        if (socket && isConnected) {
            socket.emit('send_chat_message', { content });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!session) {
        return (
            <Card className="w-full h-[600px] flex items-center justify-center bg-surface">
                <div className="text-center">
                    <p className="mb-4 text-foreground/70">로그인이 필요한 서비스입니다.</p>
                    <Button onClick={() => window.location.href = '/auth/signin'}>로그인 하러 가기</Button>
                </div>
            </Card>
        );
    }

    if (!subscriptionActive) {
        return (
            <Card className="w-full h-[600px] relative overflow-hidden border-2 border-primary/20">
                {/* Blurred Background with Fake Chat */}
                <div className="absolute inset-0 bg-white/50 blur-sm pointer-events-none p-4 space-y-4">
                    <div className="flex justify-end"><div className="bg-primary-container p-3 rounded-lg max-w-[80%]">안녕하세요 원장님! 상담 문의드려요.</div></div>
                    <div className="flex justify-start"><div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">네 안녕하세요! 어떤 점이 궁금하신가요?</div></div>
                </div>

                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-6 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md border border-line">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">프라이빗 라운지 입장하기</h3>
                        <p className="text-obsidian mb-6">
                            김미정 원장님과 실시간 1:1 상담을 원하시나요?<br />
                            멤버십 구독을 통해 더 깊은 회복의 솔루션을 만나보세요.
                        </p>
                        <div className="bg-surface p-4 rounded-lg mb-6 text-sm text-left space-y-2">
                            <p>✓ 1:1 실시간 채팅 상담</p>
                            <p>✓ 시크릿 건강 정보 열람</p>
                            <p>✓ 우선 예약 서비스</p>
                        </div>
                        <Button size="lg" className="w-full font-bold text-lg h-12" onClick={onSubscribe}>
                            월 9,900원으로 시작하기
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full h-[600px] flex flex-col shadow-xl border-t-4 border-t-primary">
            <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden border">
                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src="/images/kim-mijeong-profile.jpg" alt="김미정 원장" className="object-cover w-full h-full" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <div className="font-bold">김미정 원장</div>
                        <div className="text-xs text-foreground/70 flex items-center">
                            {isConnected ? <span className="text-green-600">● 온라인</span> : '오프라인'}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 relative bg-[#bacee0]/30">
                {/* Using a background color similar to Kakaotalk or generic chat */}

                <div className="h-full overflow-y-auto p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {/* Welcome Message */}
                        <div className="flex justify-center my-4">
                            <span className="text-xs bg-black/10 text-obsidian px-3 py-1 rounded-full">
                                채팅방에 입장하셨습니다.
                            </span>
                        </div>

                        {messages.map((msg, idx) => {
                            // Robust ID comparison
                            const currentUserId = (session?.user as any)?.id || (session?.user as any)?._id;
                            const isMe = msg.senderId.toString() === currentUserId?.toString();

                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 mt-1 flex-shrink-0">
                                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src="/images/kim-mijeong-profile.jpg" alt="원장" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm whitespace-pre-wrap ${isMe
                                            ? 'bg-yellow-100 text-black rounded-tr-none' // User: Yellow, Right
                                            : 'bg-white text-black border border-line rounded-tl-none' // AI/Admin: White, Left
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {/* Timestamp could go here */}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </CardContent>

            <div className="p-4 bg-white border-t">
                <div className="flex space-x-2">
                    <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
