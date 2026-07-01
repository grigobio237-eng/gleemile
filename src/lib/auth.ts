import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/lib/firebase/admin';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
          access_type: 'online',
          response_type: 'code',
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ['none'],
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const usersRef = adminDb.collection('users');
          const snapshot = await usersRef.where('email', '==', credentials.email).limit(1).get();

          if (snapshot.empty) {
            return null;
          }

          const userDoc = snapshot.docs[0];
          const user = userDoc.data();

          if (!user.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          if (user.provider !== 'local') {
            throw new Error(`${user.provider} 계정으로 가입된 이메일입니다. 소셜 로그인을 이용해주세요.`);
          }

          return {
            id: userDoc.id,
            email: user.email,
            name: user.name,
            image: user.avatar || '',
            provider: user.provider,
            globalRole: user.globalRole || 'member',
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      if (account?.provider === 'google' || account?.provider === 'kakao') {
        try {
          const email = user.email || (profile as any)?.kakao_account?.email || `${account.providerAccountId}@${account.provider}.placeholder.com`;
          let name = user.name || (profile as any)?.properties?.nickname || (profile as any)?.kakao_account?.profile?.nickname || 'New User';
          let avatar = user.image || (profile as any)?.properties?.profile_image || (profile as any)?.kakao_account?.profile?.profile_image_url || '';

          const usersRef = adminDb.collection('users');
          const snapshot = await usersRef.where('email', '==', email).limit(1).get();

          if (snapshot.empty) {
            // Create new user
            const newUserRef = usersRef.doc();
            await newUserRef.set({
              email,
              name,
              avatar,
              provider: account.provider,
              providerId: account.providerAccountId,
              globalRole: 'member',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            user.id = newUserRef.id;
          } else {
            // Update existing user
            const existingUserRef = snapshot.docs[0].ref;
            await existingUserRef.update({
              name,
              avatar,
              provider: account.provider,
              providerId: account.providerAccountId,
              updatedAt: new Date()
            });
            user.id = snapshot.docs[0].id;
          }

          return true;
        } catch (error) {
          console.error('[SignIn] Critical Error:', error);
          return true; // fail open for debugging
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (account) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
      }

      if (account?.provider === 'google' && profile) {
        const googleProfile = profile as any;
        token.name = googleProfile.name || user.name;
        token.email = googleProfile.email || user.email;
        token.image = googleProfile.picture || user.image;
      }

      if (user) {
        token.id = user.id;
        token.name = token.name || user.name;
        token.email = token.email || user.email;
        token.image = token.image || user.image;
        token.globalRole = (user as any).globalRole || 'member';
      }

      if (token.id) {
        try {
          const userDoc = await adminDb.collection('users').doc(token.id as string).get();
          if (userDoc.exists) {
            const dbUser = userDoc.data()!;
            token.globalRole = dbUser.globalRole;
            token.name = dbUser.name;
            token.image = dbUser.avatar;
          }

          // 🔥 session.update() 트리거 대응 (새로운 팀 가입 시)
          if (trigger === 'update' && session?.activeTeamId) {
            token.activeTeamId = session.activeTeamId;
          }

          // 🔥 Firestore 실시간 권한 룩업 (Session Sync)
          if (token.activeTeamId && token.id) {
            try {
              const memberRef = adminDb.collection('team_members').doc(`${token.activeTeamId}_${token.id}`);
              const memberSnap = await memberRef.get();
              if (memberSnap.exists) {
                const memberData = memberSnap.data();
                if (memberData?.status === 'active') {
                  token.mileRole = memberData.role;
                }
              }
            } catch (fsErr) {
              console.error('[Auth JWT] Firestore team_members lookup failed:', fsErr);
            }
          }
        } catch (error) {
          console.error('[Auth JWT Callback] DB lookup error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).name = token.name as string;
        (session.user as any).email = token.email as string;
        (session.user as any).image = token.image as string;
        (session.user as any).provider = token.provider as string;
        (session.user as any).providerId = token.providerId as string;
        (session.user as any).globalRole = token.globalRole as string;
        // 모임 플랫폼 연동
        (session.user as any).mileRole = token.mileRole || null;
        (session.user as any).activeTeamId = token.activeTeamId || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 비밀번호 검증 함수
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// 통합 인증 검증 함수 (일반 사용자 토큰 확인)
export async function verifyAuth(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
        if (decoded && decoded.id) {
          const userDoc = await adminDb.collection('users').doc(decoded.id).get();
          if (userDoc.exists) {
            const user = userDoc.data()!;
            return {
              id: userDoc.id,
              email: user.email,
              name: user.name,
              globalRole: user.globalRole || 'member',
            };
          }
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 null 반환
      }
    }
    return null;
  } catch (error) {
    console.error('인증 검증 오류:', error);
    return null;
  }
}

export default NextAuth(authOptions);