'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Ring {
  radius: number;
  text: string;
  fontSize: number;
  angle: number;
  baseSpeed: number;
  dir: number;
  color: string;
  baseAlpha: number;
  t: number;
  numChars: number;
}

const RING_TEXTS = [
  'SENTIO · ',
  'REAL-TIME SENTIMENT · ',
  'APACHE KAFKA · ',
  'SPRING WEBFLUX · ',
  'REDIS CACHE · ',
  'VADER NLP · ',
  'BULLISH · ',
  'BEARISH · ',
  'SSE STREAM · ',
  'JAVA 17 · ',
  'DOCKER · ',
  '~5240 EVENTS/SEC · ',
];

const NUM_RINGS = 12;
const CANVAS_SIZE = 700;
const MIN_RADIUS = 18;
const MAX_RADIUS = 310;

function getRingColor(t: number): { color: string; baseAlpha: number } {
  if (t < 0.25) {
    return { color: '74, 126, 255', baseAlpha: 0.55 };
  } else if (t < 0.5) {
    return { color: '34, 197, 94', baseAlpha: 0.18 + (0.5 - t) * 0.35 };
  } else {
    return { color: '74, 126, 255', baseAlpha: 0.05 + (1 - t) * 0.13 };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function useSpiralAnimation(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  panelRef: React.RefObject<HTMLDivElement | null>
) {
  const ringsRef = useRef<Ring[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  const isClickedRef = useRef(false);
  const tiltXRef = useRef(0);
  const tiltYRef = useRef(0);
  const speedBoostRef = useRef(1);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const initRings = useCallback(() => {
    const rings: Ring[] = [];
    for (let i = 0; i < NUM_RINGS; i++) {
      const t = i / (NUM_RINGS - 1);
      const radius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
      const fontSize = 7 + t * 6;
      const dir = i % 2 === 0 ? 1 : -1;
      const baseSpeed = dir * (0.0005 + (1 - t) * 0.0009);
      const { color, baseAlpha } = getRingColor(t);
      const text = RING_TEXTS[i];

      // Calculate how many characters fit around the circumference
      const circumference = 2 * Math.PI * radius;
      const charWidth = fontSize * 0.6; // monospace approximate width
      const charsPerLoop = Math.max(1, Math.floor(circumference / charWidth));
      const repeats = Math.max(1, Math.ceil(charsPerLoop / text.length));
      const fullText = text.repeat(repeats);

      rings.push({
        radius,
        text: fullText,
        fontSize,
        angle: Math.random() * Math.PI * 2,
        baseSpeed,
        dir,
        color,
        baseAlpha,
        t,
        numChars: fullText.length,
      });
    }
    ringsRef.current = rings;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    if (!canvas || !panel) return;

    // Set up high-DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    initRings();

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseRef.current = {
        x: ((e.clientX - cx) / (rect.width / 2)),
        y: ((e.clientY - cy) / (rect.height / 2)),
      };
      isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
      mouseRef.current = { x: 0, y: 0 };
    };

    const handleMouseDown = () => {
      isClickedRef.current = true;
    };

    const handleMouseUp = () => {
      isClickedRef.current = false;
    };

    panel.addEventListener('mousemove', handleMouseMove);
    panel.addEventListener('mouseleave', handleMouseLeave);
    panel.addEventListener('mousedown', handleMouseDown);
    panel.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation loop
    lastTimeRef.current = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;

      const isHovering = isHoveringRef.current;
      const isClicked = isClickedRef.current;
      const mouse = mouseRef.current;

      // Lerp targets
      const targetTiltX = isHovering ? mouse.x * 0.04 : 0;
      const targetTiltY = isHovering ? mouse.y * 0.04 : 0;
      const targetSpeedBoost = isClicked ? 7 : isHovering ? 2.5 : 1;

      tiltXRef.current = lerp(tiltXRef.current, targetTiltX, 0.06);
      tiltYRef.current = lerp(tiltYRef.current, targetTiltY, 0.06);
      speedBoostRef.current = lerp(speedBoostRef.current, targetSpeedBoost, 0.055);

      const tiltX = tiltXRef.current;
      const tiltY = tiltYRef.current;
      const speedBoost = speedBoostRef.current;

      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;

      // Clear
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw cursor glow
      if (isHovering) {
        const glowX = cx + mouse.x * 80;
        const glowY = cy + mouse.y * 80;
        const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 120);
        glowGrad.addColorStop(0, 'rgba(74, 126, 255, 0.07)');
        glowGrad.addColorStop(1, 'rgba(74, 126, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }

      // Draw rings
      const rings = ringsRef.current;
      for (let ri = 0; ri < rings.length; ri++) {
        const ring = rings[ri];

        // Calculate proximity-based speed boost
        let proximityBoost: number;
        if (isHovering) {
          // Rings closer to center (lower t) get more boost when cursor is near
          const mouseDist = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
          const proximityFactor = 0.5 + 0.5 * Math.min(1, mouseDist);
          proximityBoost = 1 + (1 - ring.t) * (speedBoost - 1) * proximityFactor;
        } else {
          proximityBoost = speedBoost;
        }

        ring.angle += ring.baseSpeed * proximityBoost * dt;

        ctx.save();
        ctx.translate(cx, cy);

        // Apply perspective tilt transform
        ctx.transform(
          1 + tiltX * 0.15,
          tiltY * 0.1,
          tiltX * 0.1,
          1 + tiltY * 0.15,
          0,
          0
        );

        ctx.font = `${ring.fontSize}px "JetBrains Mono", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const angleStep = (Math.PI * 2) / ring.numChars;

        for (let ci = 0; ci < ring.numChars; ci++) {
          const charAngle = ring.angle + ci * angleStep;
          const x = Math.cos(charAngle) * ring.radius;
          const y = Math.sin(charAngle) * ring.radius;

          // Calculate facing boost
          let facingBoost = 0;
          if (isHovering) {
            facingBoost = Math.max(
              0,
              Math.cos(charAngle) * mouse.x + Math.sin(charAngle) * mouse.y
            );
          }

          const alpha = Math.min(1, ring.baseAlpha + facingBoost * 0.25);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(charAngle + Math.PI / 2);
          ctx.fillStyle = `rgba(${ring.color}, ${alpha})`;
          ctx.fillText(ring.text[ci], 0, 0);
          ctx.restore();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      panel.removeEventListener('mousemove', handleMouseMove);
      panel.removeEventListener('mouseleave', handleMouseLeave);
      panel.removeEventListener('mousedown', handleMouseDown);
      panel.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, panelRef, initRings]);
}
