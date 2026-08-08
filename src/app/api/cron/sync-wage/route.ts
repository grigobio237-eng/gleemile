import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/syncWage?key=${key || ''}`, {
      headers: { 'Authorization': authHeader || '' }
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}