import { memo, useEffect, useRef } from 'react';
import type { PoseLandmarks } from '@/types';

export interface PoseVisualizerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: PoseLandmarks | null;
  analysisOverlay: boolean;
}

/**
 * Renderiza el video en vivo con un overlay de esqueleto sobre un canvas.
 * Optimizado para CPU: redibuja cuando cambian `landmarks`.
 * @param props Props del componente
 * @example
 * <PoseVisualizer videoRef={videoRef} landmarks={analysis?.landmarks} analysisOverlay />
 */
function PoseVisualizerBase({ videoRef, landmarks, analysisOverlay }: PoseVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = video.clientWidth || video.videoWidth;
      canvas.height = video.clientHeight || video.videoHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(video);
    return () => ro.disconnect();
  }, [videoRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!analysisOverlay || !landmarks) return;

    const points = landmarks.points;
    const w = canvas.width, h = canvas.height;
    const px = (x: number) => x * w;
    const py = (y: number) => y * h;

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(59,130,246,0.9)';
    ctx.fillStyle = 'rgba(59,130,246,0.9)';

    // Dibujo simple: puntos y algunas conexiones típicas
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(px(p.x), py(p.y), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const connect = (a: number, b: number) => {
      if (!points[a] || !points[b]) return;
      ctx.beginPath();
      ctx.moveTo(px(points[a].x), py(points[a].y));
      ctx.lineTo(px(points[b].x), py(points[b].y));
      ctx.stroke();
    };

    // Conexiones básicas: hombros, caderas, brazos
    connect(11, 12); // hombros
    connect(23, 24); // caderas
    connect(11, 13); connect(13, 15); // brazo izq
    connect(12, 14); connect(14, 16); // brazo der
    connect(11, 23); connect(12, 24); // tronco
  }, [landmarks, analysisOverlay]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover opacity-80" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

export const PoseVisualizer = memo(PoseVisualizerBase);


