import React from 'react';
import { TacticalBoard } from '@/components/tactics/TacticalBoard';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TacticsPage({ params }: PageProps) {
  const { teamId } = await params;
  
  return (
    <main className="w-full h-screen bg-[#111] overflow-hidden overscroll-none touch-none">
      <TacticalBoard teamId={teamId} />
    </main>
  );
}
