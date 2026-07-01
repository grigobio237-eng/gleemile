import { useRef, useState, useCallback, useEffect } from 'react';

export type ToolMode = 'draw' | 'pan' | 'eraser';

export type Point = { x: number; y: number };

export type Stroke = {
  id: string;
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
};

export function useCanvas(
  isPortrait: boolean,
  remoteStrokes: Stroke[] = [],
  pushStroke?: (stroke: Stroke) => void,
  syncClear?: () => void
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<ToolMode>('draw');
  const [color, setColor] = useState<string>('#fcd34d');
  const [lineWidth, setLineWidth] = useState<number>(4);
  
  // Transform State
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  
  // Drawing State
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<Point | null>(null);

  // Sync remote strokes to local ref
  useEffect(() => {
    strokesRef.current = [...remoteStrokes];
    redraw();
  }, [remoteStrokes]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      
      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 3;
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      const getLocalPoint = (p: Point) => {
        if (isPortrait) {
          // Canonical (2400x1600) -> Portrait local (1600x2400)
          return {
            x: 1600 - p.y,
            y: p.x
          };
        }
        return p;
      };

      const p0 = getLocalPoint(stroke.points[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = getLocalPoint(stroke.points[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };

    strokesRef.current.forEach(drawStroke);
    
    if (currentStrokeRef.current) {
      drawStroke(currentStrokeRef.current);
    }
  }, [isPortrait]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = isPortrait ? 1600 : 2400;
    canvas.height = isPortrait ? 2400 : 1600;
    
    const rect = container.getBoundingClientRect();
    const fitScale = (rect.width * 0.95) / canvas.width;
    setScale(fitScale);

    setPosition({
      x: (rect.width - (canvas.width * fitScale)) / 2,
      y: (rect.height - (canvas.height * fitScale)) / 2
    });

    redraw();
  }, [redraw, isPortrait]);

  // Pointer Events
  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    const localY = (e.clientY - rect.top) / scale;
    
    if (isPortrait) {
      // Portrait local (1600x2400) -> Canonical (2400x1600)
      return {
        x: localY,
        y: 1600 - localX
      };
    }
    
    return {
      x: localX,
      y: localY
    };
  };

  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const lastMidpointRef = useRef<Point | null>(null);

  const getDistance = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const getMidpoint = (p1: Point, p2: Point) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

  const onPointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      // 제스처 모드 진입 (드로잉 취소)
      isDrawingRef.current = false;
      isPanningRef.current = false;
      currentStrokeRef.current = null;
      redraw();

      const pts = Array.from(activePointersRef.current.values());
      initialPinchDistanceRef.current = getDistance(pts[0], pts[1]);
      initialScaleRef.current = scale;
      lastMidpointRef.current = getMidpoint(pts[0], pts[1]);
      return;
    }

    if (activePointersRef.current.size === 1) {
      if (mode === 'pan' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanningRef.current = true;
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      isDrawingRef.current = true;
      const pos = getPointerPos(e);
      currentStrokeRef.current = {
        id: Date.now().toString(),
        points: [pos],
        color: mode === 'eraser' ? 'rgba(0,0,0,1)' : color,
        width: lineWidth,
        isEraser: mode === 'eraser'
      };
      redraw();
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    
    // Update pointer position
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 멀티 터치 제스처 (2 손가락)
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = getDistance(pts[0], pts[1]);
      const currentMidpoint = getMidpoint(pts[0], pts[1]);

      if (initialPinchDistanceRef.current && lastMidpointRef.current) {
        // Zoom
        const zoomRatio = currentDist / initialPinchDistanceRef.current;
        const newScale = Math.min(Math.max(0.2, initialScaleRef.current * zoomRatio), 4);
        
        // Pan
        const dx = currentMidpoint.x - lastMidpointRef.current.x;
        const dy = currentMidpoint.y - lastMidpointRef.current.y;
        
        setScale(newScale);
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        
        lastMidpointRef.current = currentMidpoint;
      }
      return;
    }

    // 1 손가락 처리
    if (activePointersRef.current.size === 1) {
      if (isPanningRef.current && lastPanPointRef.current) {
        const dx = e.clientX - lastPanPointRef.current.x;
        const dy = e.clientY - lastPanPointRef.current.y;
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (isDrawingRef.current && currentStrokeRef.current) {
        currentStrokeRef.current.points.push(getPointerPos(e));
        redraw();
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      initialPinchDistanceRef.current = null;
      lastMidpointRef.current = null;
    }

    if (activePointersRef.current.size === 0) {
      isPanningRef.current = false;
      lastPanPointRef.current = null;

      if (isDrawingRef.current && currentStrokeRef.current) {
        // 로컬에 추가
        strokesRef.current.push(currentStrokeRef.current);
        
        // Firebase로 실시간 전송
        if (pushStroke) {
          pushStroke(currentStrokeRef.current);
        }

        currentStrokeRef.current = null;
        isDrawingRef.current = false;
        redraw();
      }
    }
  };

  // Wheel event for zoom
  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || mode === 'pan') {
      e.preventDefault();
      const zoomFactor = 0.05;
      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = Math.min(Math.max(0.2, scale + direction * zoomFactor), 3);
      
      // Calculate pan adjustment to zoom into mouse center
      // (Simplified for this version)
      setScale(newScale);
    } else {
      // Pan with trackpad
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const undo = useCallback(() => {
    // Note: Undo in live sync can be tricky, typically it removes the last stroke.
    // For now, we only undo local strokes (if not fully synced yet) or we might need a sync mechanism.
    strokesRef.current.pop();
    redraw();
  }, [redraw]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    if (syncClear) {
      syncClear();
    }
    redraw();
  }, [redraw, syncClear]);

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => {
      const factor = direction === 'in' ? 1.2 : 0.8;
      return Math.min(Math.max(0.2, prev * factor), 3);
    });
  };

  return {
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
  };
}
