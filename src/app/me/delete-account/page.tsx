'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import CharacterImage from '@/components/ui/CharacterImage';
import { 
  AlertTriangle, 
  ArrowLeft,
  Trash2,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

const deleteReasons = [
  { value: 'no_use', label: '사용하지 않음' },
  { value: 'privacy_concern', label: '개인정보 보호 우려' },
  { value: 'poor_service', label: '서비스 불만' },
  { value: 'found_alternative', label: '다른 서비스 이용' },
  { value: 'too_many_emails', label: '이메일/알림 너무 많음' },
  { value: 'other', label: '기타' },
];

export default function DeleteAccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (step === 1) {
      // 1단계: 비밀번호 확인 (로컬 계정만)
      const userProvider = (session?.user as any)?.provider;
      if (userProvider === 'local' && !password) {
        alert('비밀번호를 입력해주세요.');
        return;
      }

      if (!reason) {
        alert('탈퇴 사유를 선택해주세요.');
        return;
      }

      if (reason === 'other' && !reasonDetail.trim()) {
        alert('탈퇴 사유를 상세히 입력해주세요.');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      // 2단계: 최종 확인
      if (confirmText !== '회원탈퇴') {
        alert('"회원탈퇴"를 정확히 입력해주세요.');
        return;
      }

      setLoading(true);
      try {
        const userProvider = (session?.user as any)?.provider;
        const response = await fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: userProvider === 'local' ? password : undefined,
            reason,
            reasonDetail: reason === 'other' ? reasonDetail : '',
          }),
        });

        if (response.ok) {
          alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
          await signOut({ redirect: false });
          router.push('/');
        } else {
          const errorData = await response.json();
          alert(errorData.error || '회원 탈퇴에 실패했습니다.');
          setLoading(false);
        }
      } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        alert('회원 탈퇴 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-obsidian mb-6">
              회원 탈퇴를 하려면 로그인해주세요.
            </p>
            <Button asChild>
              <Link href="/auth/signin">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/me">
              <ArrowLeft className="h-4 w-4 mr-2" />
              마이페이지로 돌아가기
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">회원 탈퇴</h1>
          <p className="text-obsidian">
            회원 탈퇴 전에 안내사항을 확인해주세요
          </p>
        </div>

        {/* 탈퇴 안내 */}
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-2">회원 탈퇴 시 주의사항</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>탈퇴 시 모든 회원 정보가 삭제되며 복구가 불가능합니다.</li>
                  <li>보유 중인 포인트와 쿠폰은 모두 소멸됩니다.</li>
                  <li>진행 중인 주문 및 환불 신청은 탈퇴 후에도 처리됩니다.</li>
                  <li>작성한 리뷰와 Q&A는 삭제되지 않을 수 있습니다.</li>
                  <li>탈퇴 후 30일 이내 재가입이 제한될 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>탈퇴 사유 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 비밀번호 확인 (로컬 계정만) */}
              {(session.user as any)?.provider === 'local' && (
                <div>
                  <Label htmlFor="password">비밀번호 확인 *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="mt-2"
                  />
                </div>
              )}

              {/* 탈퇴 사유 */}
              <div>
                <Label>탈퇴 사유 *</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="mt-3">
                  {deleteReasons.map((item) => (
                    <div key={item.value} className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value={item.value} id={item.value} />
                      <Label htmlFor={item.value} className="cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 상세 사유 (기타 선택 시) */}
              {reason === 'other' && (
                <div>
                  <Label htmlFor="reasonDetail">상세 사유 *</Label>
                  <Textarea
                    id="reasonDetail"
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="탈퇴 사유를 상세히 입력해주세요"
                    rows={4}
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/me')}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  다음 단계
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">최종 확인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  아래에 <strong>&quot;회원탈퇴&quot;</strong>를 입력하여 탈퇴를 확인해주세요.
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="회원탈퇴"
                  className="mt-2"
                />
              </div>

              <div className="bg-surface rounded-lg p-4">
                <p className="text-sm text-obsidian mb-2 font-semibold">선택한 탈퇴 사유:</p>
                <p className="text-sm text-obsidian">
                  {deleteReasons.find(r => r.value === reason)?.label}
                </p>
                {reason === 'other' && reasonDetail && (
                  <p className="text-sm text-obsidian mt-2">{reasonDetail}</p>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={loading}
                >
                  이전
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={loading || confirmText !== '회원탈퇴'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? '처리 중...' : '회원 탈퇴하기'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

