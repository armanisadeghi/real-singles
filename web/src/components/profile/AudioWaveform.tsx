"use client";

import { useRef, useEffect, useCallback } from "react";

interface AudioWaveformProps {
  /** The media stream to visualize */
  stream: MediaStream | null;
  /** Whether the component is actively recording/visualizing */
  isActive: boolean;
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Bar color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Real-time audio waveform visualization component.
 * Uses the Web Audio API's AnalyserNode to display audio levels.
 * Respects prefers-reduced-motion for accessibility.
 */
export function AudioWaveform({
  stream,
  isActive,
  width = 200,
  height = 60,
  color = "#ec4899", // pink-500
  backgroundColor = "transparent",
  className = "",
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Draw static bars for reduced motion or when not active
  const drawStaticBars = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const barWidth = 3;
    const gap = 2;
    const totalWidth = barWidth + gap;
    const numBars = Math.floor(width / totalWidth);
    const centerY = height / 2;

    ctx.fillStyle = color;

    for (let i = 0; i < numBars; i++) {
      // Create a subtle wave pattern
      const barHeight = isActive
        ? Math.max(4, Math.sin(i * 0.5) * 10 + 12)
        : 4;
      
      const x = i * totalWidth;
      const y = centerY - barHeight / 2;

      // Rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    }
  }, [width, height, color, backgroundColor, isActive]);

  // Animate the waveform
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser || !isActive || prefersReducedMotion) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw bars
    const barWidth = 3;
    const gap = 2;
    const totalWidth = barWidth + gap;
    const numBars = Math.floor(width / totalWidth);
    const step = Math.floor(bufferLength / numBars);
    const centerY = height / 2;

    ctx.fillStyle = color;

    for (let i = 0; i < numBars; i++) {
      // Get average of frequency data for this bar
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      const average = sum / step;
      
      // Scale to height (0-255 to 4-height)
      const barHeight = Math.max(4, (average / 255) * (height - 8) + 4);
      
      const x = i * totalWidth;
      const y = centerY - barHeight / 2;

      // Rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isActive, width, height, color, backgroundColor, prefersReducedMotion]);

  // Set up audio analyser when stream changes
  useEffect(() => {
    if (!stream || !isActive || prefersReducedMotion) {
      // Draw static bars when not active or reduced motion
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawStaticBars(ctx);
        }
      }
      return;
    }

    // Create audio context and analyser
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Connect stream to analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    // Start animation
    animate();

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source.disconnect();
      audioContext.close();
    };
  }, [stream, isActive, animate, drawStaticBars, prefersReducedMotion]);

  // Redraw static when not active
  useEffect(() => {
    if (!isActive || prefersReducedMotion) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawStaticBars(ctx);
        }
      }
    }
  }, [isActive, drawStaticBars, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      aria-label="Audio visualization"
      role="img"
    />
  );
}
