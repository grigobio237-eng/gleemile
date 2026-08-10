import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = (req: any, ctx: any) => NextAuth(getAuthOptions())(req, ctx);

export { handler as GET, handler as POST };

