'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { KakaoIcon, GoogleIcon } from '@/components/ui/social-icons';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, ChevronLeft, User, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

const EMOJIS = ['😃', '😎', '🥱', '🥺', '🤯', '😴', '🥳', '🤔'];

function SignupContent() {
  const [mounted, setMounted] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKakaoLogin = () => signIn('kakao', { callbackUrl });
  const handleGoogleLogin = () => signIn('google', { callbackUrl });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return alert('비밀번호가 일치하지 않습니다.');
    }
    if (!formData.termsAccepted) {
      return alert('이용약관 및 개인정보 처리방침에 동의해주세요.');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          // Mandatory fields needed by the old backend logic
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.termsAccepted,
          sensitiveInfoAccepted: formData.termsAccepted,
          thirdPartyAccepted: formData.termsAccepted,
        }),
      });

      if (response.ok) {
        // Automatically log them in after signup
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
        if (result?.ok) {
          router.push(callbackUrl);
        } else {
          router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      } else {
        const data = await response.json();
        alert(data.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[100dvh] bg-[#0B0B0B] flex items-center justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[85vh] sm:max-h-[900px] sm:rounded-[40px] relative bg-[#0B0B0B] sm:border border-white/10 overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/5">
        
        {/* Subtle Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Header */}
        <header className="p-6 flex items-center justify-between z-20">
          <div className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/20"></div>
            gleemile.
          </div>
          {showEmailForm ? (
            <button onClick={() => setShowEmailForm(false)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center">
              <ChevronLeft className="w-4 h-4 mr-1" />
              뒤로가기
            </button>
          ) : (
            <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
              기존 회원 로그인
            </Link>
          )}
        </header>

        <AnimatePresence mode="wait">
          {!showEmailForm ? (
            <motion.div 
              key="main-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col z-10"
            >
              {/* Main Copy Area */}
              <main className="flex-1 flex flex-col justify-center px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 tracking-wider">회원가입하고 모든 기능을 무료로!</span>
                  </div>
                  
                  <h1 className="text-[2.5rem] leading-[1.1] font-black text-white tracking-tighter keep-all">
                    우리 모임이<br/>
                    더 즐거워지는<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">5초 습관.</span>
                  </h1>
                  
                  <p className="mt-6 text-[15px] font-medium text-slate-400 leading-relaxed keep-all pr-4">
                    카톡 단톡방의 피로함은 이제 끝.<br/>
                    함께 걷는 건강한 모임 웰니스 케어, 글리마일과 함께 시작하세요.
                  </p>
                </motion.div>
              </main>

              {/* Floating Emojis */}
              <div className="h-24 relative w-full overflow-hidden pointer-events-none">
                {EMOJIS.map((emoji, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute text-3xl opacity-0"
                    initial={{ x: Math.random() * 300, y: 100 }}
                    animate={{ y: -50, x: Math.random() * 300, opacity: [0, 1, 0] }}
                    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2, ease: "linear" }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              {/* Action Bottom */}
              <div className="p-6 pb-10 space-y-3">
                <button
                  onClick={handleKakaoLogin}
                  className="w-full bg-[#FEE500] text-black/90 font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#F4DC00] transition-colors shadow-lg shadow-[#FEE500]/20"
                >
                  <KakaoIcon className="w-5 h-5" />
                  카카오로 1초 만에 시작하기
                </button>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-slate-800 font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
                >
                  <GoogleIcon className="w-5 h-5" />
                  Google로 시작하기
                </button>
                
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full bg-transparent border border-white/20 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  이메일로 가입하기
                </button>
                
                <p className="text-[11px] text-white/40 pt-4 text-center">
                  계속 진행하면 글리마일의 이용약관 및 개인정보 처리방침에<br/>
                  동의한 것으로 간주됩니다.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="email-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col z-10 px-6 pb-10"
            >
              <div className="mt-4 mb-8">
                <h2 className="text-2xl font-black text-white tracking-tighter mb-2">이메일 회원가입</h2>
                <p className="text-sm text-slate-400">간단한 정보만 입력하고 바로 시작하세요.</p>
              </div>

              <form onSubmit={handleEmailSignup} className="flex-1 flex flex-col space-y-4">
                <div className="space-y-4 flex-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">이름</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <Input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-white/5 border-white/10 text-white pl-10 h-12 rounded-xl focus-visible:ring-emerald-500"
                        placeholder="홍길동"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <Input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-white/5 border-white/10 text-white pl-10 h-12 rounded-xl focus-visible:ring-emerald-500"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <Input
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-white/5 border-white/10 text-white pl-10 h-12 rounded-xl focus-visible:ring-emerald-500"
                        placeholder="비밀번호를 입력하세요"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">비밀번호 확인</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <Input
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="bg-white/5 border-white/10 text-white pl-10 h-12 rounded-xl focus-visible:ring-emerald-500"
                        placeholder="비밀번호를 한 번 더 입력하세요"
                      />
                    </div>
                  </div>

                  <div className="pt-4 pb-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          required
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                        />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                        [필수] 이용약관 및 개인정보 처리방침에 모두 동의합니다.
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors disabled:opacity-50 mt-auto"
                >
                  {isSubmitting ? '처리 중...' : '가입 완료하기'}
                  {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B]" />}>
      <SignupContent />
    </Suspense>
  );
}
