'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageCircle, Plus, Lock, Unlock, User, Shield, Crown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface Answer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  content: string;
  isOfficial: boolean;
  createdAt: string;
}

interface Question {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  title: string;
  content: string;
  isPrivate: boolean;
  answers: Answer[];
  status: 'pending' | 'answered' | 'closed';
  createdAt: string;
}

interface QuestionSectionProps {
  productId: string;
  productName: string;
  forceShowForm?: boolean;
  onFormShown?: () => void;
}

export default function QuestionSection({ productId, productName, forceShowForm, onFormShown }: QuestionSectionProps) {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (forceShowForm) {
      setShowForm(true);
      if (onFormShown) onFormShown();
    }
  }, [forceShowForm]);

  // 문의 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPrivate: false,
  });

  useEffect(() => {
    fetchQuestions();
  }, [productId, page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions?productId=${productId}&page=${page}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        if (page === 1) {
          setQuestions(data.questions || []);
        } else {
          setQuestions(prev => [...prev, ...data.questions]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        console.error('문의 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('문의 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          title: formData.title.trim(),
          content: formData.content.trim(),
          isPrivate: formData.isPrivate,
        }),
      });

      if (response.ok) {
        alert('문의가 등록되었습니다.');
        setFormData({ title: '', content: '', isPrivate: false });
        setShowForm(false);
        setPage(1); // 첫 페이지로 돌아가서 새로고침
        fetchQuestions();
      } else {
        const errorData = await response.json();
        alert(`문의 등록 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('문의 등록 중 오류:', error);
      alert('문의 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">답변 대기</Badge>;
      case 'answered':
        return <Badge className="bg-green-100 text-green-800">답변 완료</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-obsidian">종료</Badge>;
      default:
        return null;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'partner':
        return <Crown className="h-4 w-4 text-primary" />;
      default:
        return <User className="h-4 w-4 text-foreground/70" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'partner':
        return '파트너';
      default:
        return '사용자';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-obsidian flex items-center">
            <MessageCircle className="h-6 w-6 mr-2" />
            상품 문의
          </h2>
          <p className="text-obsidian mt-1">
            {productName}에 대한 문의사항을 남겨주세요
          </p>
        </div>

        {session?.user && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            문의하기
          </Button>
        )}
      </div>

      {/* 문의 작성 폼 */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>상품 문의 작성</CardTitle>
          </CardHeader>
          <CardContent>
            {session?.user ? (
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <Input
                    placeholder="문의 제목을 입력해주세요"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-foreground/70 mt-1">{formData.title.length}/100자</p>
                </div>

                <div>
                  <textarea
                    placeholder="문의 내용을 입력해주세요"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary/30"
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-foreground/70 mt-1">{formData.content.length}/1000자</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-obsidian flex items-center">
                    <Lock className="h-4 w-4 mr-1" />
                    비공개 문의 (관리자와 파트너만 볼 수 있습니다)
                  </label>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ title: '', content: '', isPrivate: false });
                      setShowForm(false);
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                    className="flex-1"
                  >
                    {submitting ? '등록 중...' : '문의 등록'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-obsidian mb-2">
                  로그인이 필요합니다
                </h3>
                <p className="text-obsidian mb-4">
                  상품 문의를 작성하려면 로그인해주세요.
                </p>
                <Button asChild>
                  <a href="/auth/signin">로그인하기</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 문의 목록 */}
      <div className="space-y-4">
        {loading && page === 1 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-foreground/70 mx-auto mb-4" />
              <p className="text-obsidian">아직 등록된 문의가 없습니다.</p>
              <p className="text-sm text-foreground/70 mt-2">
                첫 번째 문의를 작성해보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question._id}>
              <CardContent className="p-6">
                {/* 문의 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {question.userId.avatar ? (
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                          src={question.userId.avatar}
                          alt={question.userId.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-obsidian">
                          {question.userId.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{question.userId.name}</span>
                        {question.isPrivate ? (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            비공개
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Unlock className="h-3 w-3 mr-1" />
                            공개
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-foreground/70">
                          {new Date(question.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        {getStatusBadge(question.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 문의 내용 */}
                <div className="mb-4">
                  <h4 className="font-semibold text-obsidian mb-2">{question.title}</h4>
                  <p className="text-obsidian whitespace-pre-line">{question.content}</p>
                </div>

                {/* 답변들 */}
                {question.answers.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-obsidian">답변</h5>
                    {question.answers.map((answer, index) => (
                      <div key={index} className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          {getRoleIcon(answer.userId.role)}
                          <span className="font-medium text-blue-900">
                            {answer.userId.name}
                          </span>
                          <Badge className={`text-xs ${answer.isOfficial
                              ? 'bg-primary-container text-blue-800'
                              : 'bg-gray-100 text-obsidian'
                            }`}>
                            {answer.isOfficial ? '공식 답변' : '일반 답변'}
                          </Badge>
                          <span className="text-sm text-primary">
                            {new Date(answer.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-blue-800 whitespace-pre-line">{answer.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
            >
              {loading ? '로딩 중...' : '더보기'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
