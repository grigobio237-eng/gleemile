import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            provider?: string
            providerId?: string
            role?: string
            grade?: string
            tier?: string
            subscription?: any
            mileRole?: 'director' | 'leader' | 'member' | 'supporter' | null
            activeTeamId?: string | null
            pass?: any
        } & DefaultSession["user"]
    }

    interface User {
        role?: string
        grade?: string
        tier?: string
        subscription?: any
        provider?: string
        providerId?: string
        emailVerified?: boolean | null
        mileRole?: 'director' | 'leader' | 'member' | 'supporter' | null
        activeTeamId?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        provider?: string
        providerId?: string
        role?: string
        grade?: string
        tier?: string
        subscription?: any
        mileRole?: 'director' | 'leader' | 'member' | 'supporter' | null
        activeTeamId?: string | null
    }
}
