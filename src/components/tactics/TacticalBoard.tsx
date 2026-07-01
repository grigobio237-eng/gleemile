"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isManagerOrHigher } from '@/types/role';
import { useCanvas, ToolMode } from './useCanvas';
import { TacticalBackground, SportType, SPORTS } from './TacticalBackground';
import { useLiveSync } from './useLiveSync';
import { 
  PenTool, Eraser, Move, Undo, Trash2,
  ZoomIn, ZoomOut, Save, ChevronLeft, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TacticalBoardProps {
  teamId: string;
}

const COLORS = ['#fcd34d', '#ef4444', '#3b82f6', '#10b981', '#ffffff', '#000000'];
const WIDTHS = [2, 4, 8, 16];

export function TacticalBoard({ teamId }: TacticalBoardProps) {
  const router = useRouter();
  const [sport, setSport] = useState<SportType>('soccer');
  const [showPalette, setShowPalette] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // Live Sync Hook
  const { 
    syncedSport, 
    remoteStrokes, 
    pushStroke, 
    updateSport, 
    syncClear 
  } = useLiveSync(teamId);

  const { data: session } = useSession();
  const [userRole, setUserRole] = useState('guest');
  const isEditor = isManagerOrHigher(userRole);

  // RTDB 배경 동기화 수신
  React.useEffect(() => {
    if (syncedSport && syncedSport !== sport) {
      setSport(syncedSport);
    }
  }, [syncedSport]);

  React.useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user?.id) return;
      try {
        let fetchedRole = 'guest';
        let currentOwnerId = '';
        
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        if (teamSnap.exists()) {
          currentOwnerId = teamSnap.data().ownerId;
        }

        const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
        const mySnap = await getDoc(myMemberRef);
        
        if (mySnap.exists()) {
          fetchedRole = mySnap.data().role || 'member';
        }
        
        if (session.user.id === currentOwnerId) {
          fetchedRole = 'owner';
        }
        setUserRole(fetchedRole);
      } catch (error) {
        console.error('Failed to fetch role:', error);
      }
    };
    fetchRole();
  }, [session?.user?.id, teamId]);

  React.useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)');
    setIsPortrait(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const {
    canvasRef,
    containerRef,
    mode,
    setMode,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    scale,
    position,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    undo,
    clear,
    handleZoom
  } = useCanvas(isPortrait, remoteStrokes, pushStroke, syncClear);

  const handleSportChange = (newSport: SportType) => {
    setSport(newSport);
    updateSport(newSport);
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col touch-none select-none overflow-hidden overscroll-none">
      
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-300 hover:text-white p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white font-black leading-none truncate max-w-[120px] sm:max-w-none">전술 보드</h1>
            <span className="text-[10px] text-slate-400 font-bold mt-1">Live Sync (Volatile Session)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sport Selector */}
          {isEditor ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold border border-slate-700 transition-colors">
                  <span>{SPORTS.find(s => s.type === sport)?.label}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-white">
                <DropdownMenuLabel className="text-slate-400 text-xs">배경 템플릿 변경</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                {SPORTS.map(s => (
                  <DropdownMenuItem 
                    key={s.type} 
                    onClick={() => handleSportChange(s.type)}
                    className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer text-sm font-medium"
                  >
                    {s.label}
                    {sport === s.type && <span className="ml-auto text-blue-400">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-lg text-sm font-bold border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{SPORTS.find(s => s.type === sport)?.label}</span>
            </div>
          )}

          <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block" />

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center">
            <button onClick={() => handleZoom('out')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-slate-300 text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => handleZoom('in')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className={`flex-1 relative overflow-hidden bg-[#111] ${isEditor ? 'cursor-crosshair' : 'cursor-default'}`}
        onPointerDown={isEditor ? onPointerDown : undefined}
        onPointerMove={isEditor ? onPointerMove : undefined}
        onPointerUp={isEditor ? onPointerUp : undefined}
        onPointerLeave={isEditor ? onPointerUp : undefined}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
      >
        <div 
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: isPortrait ? '1600px' : '2400px',
            height: isPortrait ? '2400px' : '1600px',
            position: 'absolute'
          }}
        >
          {/* Background Layer */}
          <TacticalBackground type={sport} isPortrait={isPortrait} />
          
          {/* Drawing Layer */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Toolbar (Floating) */}
      {isEditor && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2 z-50">
          
          {/* Tools */}
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
            <ToolButton icon={<PenTool />} active={mode === 'draw'} onClick={() => setMode('draw')} label="펜" />
            <ToolButton icon={<Eraser />} active={mode === 'eraser'} onClick={() => setMode('eraser')} label="지우개" />
            <ToolButton icon={<Move />} active={mode === 'pan'} onClick={() => setMode('pan')} label="이동" />
          </div>

          <div className="w-px h-8 bg-slate-700 mx-2" />

          {/* Properties */}
          <div className="relative">
            <button 
              onClick={() => setShowPalette(!showPalette)}
              className="w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ borderColor: color }}
            >
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: color }} />
          </button>

          {/* Popover Palette */}
          {showPalette && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900 p-3 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-4 min-w-[200px]">
              
              {/* Colors */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">색상</p>
                <div className="flex gap-2 justify-between">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); setShowPalette(false); setMode('draw'); }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white' : 'border-slate-700'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="h-px bg-slate-800 w-full" />
              
              {/* Thickness */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">굵기</p>
                <div className="flex items-center gap-3 justify-between">
                  {WIDTHS.map(w => (
                    <button
                      key={w}
                      onClick={() => { setLineWidth(w); setShowPalette(false); setMode('draw'); }}
                      className={`flex-1 h-8 rounded-lg flex items-center justify-center border transition-colors ${lineWidth === w ? 'bg-slate-700 border-slate-500' : 'border-transparent hover:bg-slate-800'}`}
                    >
                      <div className="bg-slate-300 rounded-full" style={{ width: w, height: w }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-slate-700 mx-2" />

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={undo} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <Undo className="w-5 h-5" />
          </button>
          <button onClick={clear} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-xl transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

      </div>
      )}
    </div>
  );
}

function ToolButton({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-inner shadow-blue-900' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
      }`}
      title={label}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    </button>
  );
}
