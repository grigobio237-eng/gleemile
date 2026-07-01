'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon, KakaoIcon } from '@/components/ui/social-icons';
import { Eye, EyeOff, Mail, Lock, ChevronLeft, ArrowRight } from 'lucide-react';
import { isWebView, handleWebViewOAuth, openExternalBrowser } from '@/utils/webViewDetection';

function SigninContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [isInWebView, setIsInWebView] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    setIsInWebView(isWebView());
  }, []);

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      const handled = await handleWebViewOAuth(provider, callbackUrl);
      if (handled) return;
    }
    signIn(provider, { callbackUrl: callbackUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = callbackUrl;
      } else {
        alert('이메일 또는 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Back Button */}
      <div className="absolute top-8 left-8">
        <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-900">
          <Link href="/"><ChevronLeft className="mr-2 h-4 w-4" /> 홈으로</Link>
        </Button>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter">로그인</h1>
          <p className="text-slate-500 text-sm">
            우리 팀의 인지적 잠재력을 깨우세요
          </p>
        </div>

        {isInWebView && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-sm">
            <p className="font-semibold mb-1">앱 내 브라우저에서 접속 중입니다.</p>
            <p className="opacity-80 mb-3 text-xs">Google 로그인은 기본 브라우저(Safari, Chrome)에서 지원됩니다.</p>
            <Button 
              onClick={() => { if(typeof window !== 'undefined') openExternalBrowser(window.location.href) }} 
              variant="outline" 
              className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              size="sm"
            >
              기본 브라우저로 열기
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="pl-10 h-12 bg-white border-slate-200 text-foreground placeholder:text-slate-400 focus:border-primary rounded-2xl shadow-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">비밀번호</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="pl-10 pr-10 h-12 bg-white border-slate-200 text-foreground placeholder:text-slate-400 focus:border-primary rounded-2xl shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-base mt-6 transition-transform hover:scale-[1.02] shadow-lg shadow-primary/10">
            로그인
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-slate-500">소셜 계정으로 로그인</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-none rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            onClick={() => handleSocialLogin('kakao')}
          >
            <KakaoIcon className="w-5 h-5" /> 카카오로 로그인
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-white hover:bg-slate-100 text-black border-none rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            onClick={() => handleSocialLogin('google')}
          >
            <GoogleIcon className="w-5 h-5" /> Google로 로그인
          </Button>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500">
            아직 계정이 없으신가요?{' '}
            <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary font-bold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>}>
      <SigninContent />
    </Suspense>
  );
}
