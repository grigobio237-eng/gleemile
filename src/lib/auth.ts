import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import CredentialsProvider from 'next-auth/providers/credentials';

// Cloud Functions helper for DB operations
async function proxyAuthRequest(action: string, payload: any) {
  const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL');
  
  const res = await fetch(`${url}/authProxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  
  if (!res.ok) {
    throw new Error(`Auth Proxy Error: ${res.statusText}`);
  }
  return await res.json();
}

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
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' }
      },
      async authorize(credentials) {
        if (credentials?.token) {
          try {
            const { decodedToken } = await proxyAuthRequest('verifyIdToken', { token: credentials.token });
            const email = decodedToken.email;
            if (!email) return null;

            const { user } = await proxyAuthRequest('getUserByEmail', { email });

            let userDoc = user;
            if (!userDoc) {
              const newUserData = {
                email,
                name: decodedToken.name || email.split('@')[0],
                avatar: decodedToken.picture || '',
                provider: 'magic-link',
                providerId: decodedToken.uid,
                globalRole: 'member',
              };
              const { id } = await proxyAuthRequest('createUser', { userData: newUserData });
              userDoc = { id, ...newUserData };
            }

            return {
              id: userDoc.id,
              email: userDoc.email,
              name: userDoc.name,
              image: userDoc.avatar || userDoc.image || '',
              provider: userDoc.provider,
              globalRole: userDoc.globalRole || 'member',
            };
          } catch (error) {
            console.error('Magic link token error:', error);
            return null;
          }
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { user } = await proxyAuthRequest('getUserByEmail', { email: credentials.email });

          if (!user || !user.passwordHash) {
            return null;
          }

          const { isValid } = await proxyAuthRequest('verifyPassword', {
            password: credentials.password,
            hashedPassword: user.passwordHash
          });

          if (!isValid) {
            return null;
          }

          if (user.provider !== 'local') {
            throw new Error(`${user.provider} 계정으로 가입된 이메일입니다. 소셜 로그인을 이용해주세요.`);
          }

          return {
            id: user.id,
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

          const { user: existingUser } = await proxyAuthRequest('getUserByEmail', { email });

          if (!existingUser) {
            const newUserData = {
              email,
              name,
              avatar,
              provider: account.provider,
              providerId: account.providerAccountId,
              globalRole: 'member',
            };
            const { id } = await proxyAuthRequest('createUser', { userData: newUserData });
            user.id = id;
          } else {
            await proxyAuthRequest('updateUser', {
              id: existingUser.id,
              userData: {
                name,
                avatar,
                provider: account.provider,
                providerId: account.providerAccountId,
              }
            });
            user.id = existingUser.id;
          }

          return true;
        } catch (error) {
          console.error('[SignIn] Critical Error:', error);
          return true;
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
          const { user: dbUser } = await proxyAuthRequest('getUserById', { id: token.id });
          if (dbUser) {
            token.globalRole = dbUser.globalRole;
            token.name = dbUser.name;
            token.image = dbUser.avatar;
          }

          if (trigger === 'update' && session?.activeTeamId) {
            token.activeTeamId = session.activeTeamId;
          }

          if (token.activeTeamId && token.id) {
            try {
              const { data: memberData } = await proxyAuthRequest('getTeamMemberRole', {
                teamId: token.activeTeamId,
                userId: token.id
              });
              if (memberData?.status === 'active') {
                token.mileRole = memberData.role;
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
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);