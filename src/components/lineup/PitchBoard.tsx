import React, { useRef, useState } from 'react';
import type { SportType, LineupPlayer } from '@/types/lineup';

interface PitchBoardProps {
  sportType: SportType;
  players: LineupPlayer[];
  readOnly: boolean;
  selectedPlayerId: string | null;
  onPitchClick: (x: number, y: number) => void;
  onPlayerClick: (playerId: string) => void;
  onPlayerMoveEnd: (playerId: string, x: number, y: number) => void;
}

export function PitchBoard({ 
  sportType, 
  players, 
  readOnly, 
  selectedPlayerId, 
  onPitchClick,
  onPlayerClick,
  onPlayerMoveEnd
}: PitchBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Local state for dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: React.PointerEvent, playerId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(playerId);
    
    // Also trigger select
    onPlayerClick(playerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    setDragPos({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (dragPos) {
      onPlayerMoveEnd(draggingId, dragPos.x, dragPos.y);
    }
    
    setDraggingId(null);
    setDragPos(null);
  };

  const handleBoardClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly || !selectedPlayerId || draggingId) return;
    if (!boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    onPitchClick(x, y);
  };

  const getPitchStyle = () => {
    switch(sportType) {
      case 'soccer':
      case 'futsal':
        return 'bg-emerald-600';
      case 'basketball':
        return 'bg-orange-200'; // wood like
      case 'tennis':
      case 'badminton':
        return 'bg-blue-600';
      case 'volleyball':
        return 'bg-orange-400';
      case 'jokgu':
        return 'bg-green-700';
      case 'baseball':
        return 'bg-[#2e7d32]'; // Grass green for baseball
      case 'empty':
      default:
        return 'bg-slate-800';
    }
  };

  const renderPitchLines = () => {
    // Simplified lines for effect
    if (sportType === 'empty') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none p-4 opacity-50">
        <div className="w-full h-full border-2 border-white/50 relative">
          {/* Center line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/50 -translate-y-1/2" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {(sportType === 'soccer' || sportType === 'futsal') && (
            <>
              {/* Penalty areas */}
              <div className="absolute top-0 left-1/2 w-1/2 h-1/6 border-2 border-white/50 border-t-0 -translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-1/2 h-1/6 border-2 border-white/50 border-b-0 -translate-x-1/2" />
            </>
          )}

          {sportType === 'baseball' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg 
                viewBox="0 0 100 100" 
                className="w-[120%] h-[120%] max-w-none" 
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Infield Dirt (Large circle) */}
                <circle cx="50" cy="60" r="28" fill="#d2a679" />
                
                {/* Infield Grass (Inner Diamond) */}
                <path d="M 50 82 L 72 60 L 50 38 L 28 60 Z" fill="#2e7d32" />
                
                {/* Dirt around bases */}
                <circle cx="50" cy="85" r="5" fill="#d2a679" /> {/* Home */}
                <circle cx="75" cy="60" r="4" fill="#d2a679" /> {/* 1B */}
                <circle cx="50" cy="35" r="4" fill="#d2a679" /> {/* 2B */}
                <circle cx="25" cy="60" r="4" fill="#d2a679" /> {/* 3B */}

                {/* Foul Lines */}
                <path d="M 50 85 L 5 40" stroke="white" strokeWidth="0.5" fill="none" />
                <path d="M 50 85 L 95 40" stroke="white" strokeWidth="0.5" fill="none" />
                
                {/* Outfield Fence */}
                <path d="M 5 40 Q 50 -5 95 40" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />

                {/* Base paths */}
                <path d="M 50 85 L 75 60 L 50 35 L 25 60 Z" stroke="white" strokeWidth="0.5" fill="none" />
                
                {/* Pitcher's Mound */}
                <circle cx="50" cy="60" r="3" fill="#a67c52" />
                <rect x="49" y="59.5" width="2" height="1" fill="white" />
                
                {/* Bases */}
                <polygon points="50,85 51.5,83.5 51.5,82 48.5,82 48.5,83.5" fill="white" />
                <rect x="73.5" y="58.5" width="3" height="3" fill="white" transform="rotate(45 75 60)" />
                <rect x="48.5" y="33.5" width="3" height="3" fill="white" transform="rotate(45 50 35)" />
                <rect x="23.5" y="58.5" width="3" height="3" fill="white" transform="rotate(45 25 60)" />
                
                {/* Batter's boxes */}
                <rect x="46" y="82.5" width="2" height="4" stroke="white" strokeWidth="0.3" fill="none" />
                <rect x="52" y="82.5" width="2" height="4" stroke="white" strokeWidth="0.3" fill="none" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={boardRef}
      className={`relative w-full aspect-[3/4] md:aspect-[4/5] rounded-xl overflow-hidden shadow-inner ${getPitchStyle()} touch-none`}
      onClick={handleBoardClick}
    >
      {renderPitchLines()}
      
      {players.map(player => {
        const isDragging = draggingId === player.id;
        const x = isDragging && dragPos ? dragPos.x : player.coordX;
        const y = isDragging && dragPos ? dragPos.y : player.coordY;
        const isSelected = selectedPlayerId === player.id;
        
        return (
          <div
            key={player.id}
            className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform ${isDragging ? 'scale-110 z-50' : 'z-10'} ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}
            style={{ 
              left: `${x}%`, 
              top: `${y}%`,
              transition: isDragging ? 'none' : 'left 0.3s ease, top 0.3s ease'
            }}
            onPointerDown={(e) => handlePointerDown(e, player.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center text-xs font-bold text-white border-2 border-white ${player.teamColor === 'blue' ? 'bg-blue-500' : player.teamColor === 'red' ? 'bg-rose-500' : 'bg-slate-700'}`}>
              {player.name.substring(0, 2)}
            </div>
            <div className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded mt-1 whitespace-nowrap backdrop-blur-sm font-bold">
              {player.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
