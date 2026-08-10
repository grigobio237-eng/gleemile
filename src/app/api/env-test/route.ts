import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // To avoid leaking secrets, we only return boolean flags
  return NextResponse.json({
    google_id: !!process.env.GOOGLE_CLIENT_ID,
    google_secret: !!process.env.GOOGLE_CLIENT_SECRET,
    kakao_id: !!process.env.KAKAO_CLIENT_ID,
    nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL || 'NOT_SET',
    env_keys_count: Object.keys(process.env).length
  });
}
