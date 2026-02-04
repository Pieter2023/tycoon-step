import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onBack: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startIdRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    startIdRef.current += 1;
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.oncanplay = null;
      videoRef.current.onplaying = null;
      videoRef.current.onloadeddata = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const startId = startIdRef.current + 1;
      startIdRef.current = startId;
      setIsReady(false);
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported in this browser. Try uploading a photo.');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 720 },
          height: { ideal: 1280 }
        },
        audio: false
      });
      if (startId !== startIdRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          video.play().catch(() => undefined);
        };
        video.onloadeddata = () => setIsReady(true);
        video.oncanplay = () => setIsReady(true);
        video.onplaying = () => setIsReady(true);
        setTimeout(() => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setIsReady(true);
          }
        }, 800);
      }
    } catch (err) {
      setError('Could not access the camera. Try uploading a photo instead.');
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
      return () => stopCamera();
    }
    setIsReady(false);
    stopCamera();
    return undefined;
  }, [mode, startCamera, stopCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!isReady) {
      setError('Camera is still starting. Please wait a moment.');
      return;
    }
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    if (!width || !height) {
      setError('Camera feed is not ready yet. Try again in a second.');
      return;
    }
    const maxSize = 512;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    canvasRef.current.width = targetWidth;
    canvasRef.current.height = targetHeight;
    context.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.82);
    const base64 = dataUrl.split(',')[1];
    if (base64) {
      onCapture(base64);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (!context) return;
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);
        canvasRef.current.width = targetWidth;
        canvasRef.current.height = targetHeight;
        context.drawImage(img, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.82);
        const base64 = dataUrl.split(',')[1];
        if (base64) {
          onCapture(base64);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            mode === 'camera' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Use Camera
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            mode === 'upload' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Upload Photo
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="relative w-full max-w-sm aspect-[9/16] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
          {error ? (
            <div className="flex items-center justify-center h-full p-8 text-center bg-red-900/30">
              <div className="space-y-3">
                <p className="text-red-300 text-sm font-medium">{error}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-full bg-slate-800 text-slate-200 text-xs font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          )}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
            <p className="text-white/80 text-sm mb-4">Center your face, then capture.</p>
            <button
              type="button"
              onClick={capture}
              disabled={!isReady}
              className={`group relative flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-xl ${
                isReady
                  ? 'bg-white hover:scale-105 active:scale-95 shadow-white/20'
                  : 'bg-white/60 cursor-not-allowed'
              }`}
            >
              <div className="w-12 h-12 rounded-full border-2 border-black/10 group-hover:border-black/20 transition-all"></div>
            </button>
            {!isReady && !error && (
              <p className="text-xs text-slate-300 mt-3">Starting camera…</p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-center">
          <p className="text-slate-300 text-sm mb-4">Upload a clear, front-facing photo.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
            className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold"
          >
            Choose File
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="px-6 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
      >
        Cancel
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
