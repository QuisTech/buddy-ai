
"use client";

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "./ui/button";
import { Camera, RefreshCw } from "lucide-react";

export interface CameraViewHandle {
  capture: () => string | null;
}

const CameraView = forwardRef<CameraViewHandle, { onCapture?: (dataUri: string) => void }>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    }
    setupCamera();
  }, []);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (!videoRef.current || !canvasRef.current) return null;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg");
      }
      return null;
    }
  }));

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-4 border-white shadow-2xl group">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-white backdrop-blur-sm">
          <Camera className="w-12 h-12 mb-4 animate-pulse" />
          <p className="text-lg font-headline">Starting camera...</p>
        </div>
      )}

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="absolute inset-0 pointer-events-none border-2 border-accent/20 rounded-2xl">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-accent" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-accent" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent" />
      </div>
    </div>
  );
});

CameraView.displayName = "CameraView";

export default CameraView;
