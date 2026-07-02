'use client';

import { useEffect, useState } from 'react';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function VerifyMagicLinkPage() {
  const [status, setStatus] = useState('매직 링크를 확인 중입니다...');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      
      if (!email) {
        email = window.prompt('보안 확인을 위해 이메일 주소를 다시 입력해 주세요.');
      }
      
      if (email) {
        setStatus('인증 처리 중입니다. 잠시만 기다려주세요...');
        
        setPersistence(auth, browserLocalPersistence)
          .then(() => signInWithEmailLink(auth, email!, window.location.href))
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            
            // Firebase Auth 로그인 성공 -> ID 토큰 추출
            const idToken = await result.user.getIdToken();
            
            // NextAuth Credentials Provider로 토큰 전달하여 브릿지 로그인
            const signInResult = await signIn('credentials', {
              token: idToken,
              redirect: false,
            });
            
            if (signInResult?.ok) {
              setStatus('로그인이 완료되었습니다! 이동 중입니다...');
              router.push('/');
            } else {
              setStatus('인증 연동 중 오류가 발생했습니다.');
            }
          })
          .catch((error) => {
            console.error('Magic link sign-in error:', error);
            setStatus('로그인 링크가 만료되었거나 유효하지 않습니다.');
          });
      } else {
        setStatus('이메일 확인이 취소되었습니다.');
      }
    } else {
      setStatus('유효하지 않은 접근입니다.');
      router.push('/auth/signin');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFFDF9] to-[#FDF4E3] p-4">
      <div className="animate-[bounce_3s_infinite_ease-in-out] mb-8">
        <img src="/images/confused.webp" alt="Mascot" width={120} height={120} className="drop-shadow-lg" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">인증 진행 중</h2>
      <p className="text-slate-600 font-medium">{status}</p>
    </div>
  );
}
