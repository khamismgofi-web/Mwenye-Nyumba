import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RotateCw,
  X,
  Check,
  RefreshCw,
  Upload,
  AlertTriangle,
  Timer,
  Sparkles,
  FlipHorizontal,
  User,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  tenantName?: string;
  currentPhotoUrl?: string | null;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  tenantName,
  currentPhotoUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Helper to generate an avatar data URL from initials
  const generateInitialsAvatar = (name?: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 480, 480);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 480, 480);

    // Initials
    const initials = (name || 'Tenant')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join('');

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 180px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 240, 240);

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Stop current active stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {
        // Safe track stop
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera stream with progressive fallbacks
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      stopStream();

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setErrorMessage(
          'Camera access is not supported by your browser or environment. You can upload an image file or use a standard avatar instead.'
        );
        setIsLoading(false);
        return;
      }

      let stream: MediaStream | null = null;

      // Tier 1: Specified device ID (if available)
      if (deviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { deviceId: { exact: deviceId } },
          });
        } catch {
          // If exact device constraint fails, fallback to loose constraint
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: { deviceId: deviceId },
            });
          } catch {
            stream = null;
          }
        }
      }

      // Tier 2: User-facing front camera
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          });
        } catch {
          stream = null;
        }
      }

      // Tier 3: Basic generic video constraint (any camera)
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        } catch (err: any) {
          // Final failure handling
          const errName = err?.name || '';
          const errMsg = err?.message || '';

          if (
            errName === 'NotFoundError' ||
            errName === 'DevicesNotFoundError' ||
            errMsg.includes('not found')
          ) {
            setErrorMessage(
              'No camera hardware was detected on this system. You can easily upload a photo file or select a generated avatar.'
            );
          } else if (
            errName === 'NotAllowedError' ||
            errName === 'PermissionDeniedError' ||
            errName === 'SecurityError'
          ) {
            setErrorMessage(
              'Camera permission was denied. Please allow camera permissions in your browser or upload a file.'
            );
          } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
            setErrorMessage(
              'The camera is currently busy or in use by another tab/app. Please close other camera apps and retry.'
            );
          } else {
            setErrorMessage(
              'Unable to access camera hardware. You can upload an image file from your device.'
            );
          }
          setIsLoading(false);
          return;
        }
      }

      if (!stream) {
        setErrorMessage('No camera feed available. You can upload an image file instead.');
        setIsLoading(false);
        return;
      }

      try {
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay could be blocked or video unmounted
          }
        }

        // Safely enumerate available video devices
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            const currentTrack = stream.getVideoTracks()[0];
            const currentSettings = currentTrack?.getSettings();
            if (currentSettings?.deviceId) {
              setSelectedDeviceId(currentSettings.deviceId);
            }
          }
        } catch {
          // Device enumeration permission might be restricted
        }

        setIsLoading(false);
      } catch {
        setErrorMessage('Failed to initialize camera video display.');
        setIsLoading(false);
      }
    },
    [stopStream, selectedDeviceId]
  );

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCountdown(null);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Handle device change
  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  // Capture frame to canvas
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Square crop calculation
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const size = Math.min(videoWidth, videoHeight);
    const startX = (videoWidth - size) / 2;
    const startY = (videoHeight - size) / 2;

    const targetSize = 480; // Standard profile avatar dimensions
    canvas.width = targetSize;
    canvas.height = targetSize;

    ctx.save();
    if (isMirrored) {
      ctx.translate(targetSize, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, targetSize, targetSize);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
  }, [isMirrored]);

  // Handle 3-second self timer
  const handleStartTimer = () => {
    if (countdown !== null) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle local image file upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        const targetSize = 480;

        canvas.width = targetSize;
        canvas.height = targetSize;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(dataUrl);
      };
      if (typeof evt.target?.result === 'string') {
        img.src = evt.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (!streamRef.current) {
      startCamera(selectedDeviceId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden File Input Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">
                {capturedPhoto ? 'Review Profile Photo' : 'Capture Tenant Profile Photo'}
              </h3>
              <p className="text-xs text-gray-500">
                {tenantName ? `Recording snapshot for ${tenantName}` : 'Browser Camera Snapshot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera / Preview Area */}
        <div className="mt-5 space-y-4">
          <div className="relative aspect-square w-full max-w-[380px] mx-auto rounded-2xl overflow-hidden bg-gray-950 flex items-center justify-center shadow-inner border border-gray-200">
            {/* White Flash Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs">
                <span className="text-7xl font-extrabold text-white animate-ping">
                  {countdown}
                </span>
              </div>
            )}

            {capturedPhoto ? (
              /* Captured Photo Review */
              <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
                <img
                  src={capturedPhoto}
                  alt="Captured snapshot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-medium text-green-400 flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Snapshot Ready</span>
                </div>
              </div>
            ) : errorMessage ? (
              /* Error State with fallback */
              <div className="p-6 text-center text-white space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-gray-200">No Camera Detected</div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                  {errorMessage}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition inline-flex items-center space-x-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                  </button>
                  <button
                    onClick={() => {
                      const avatarUrl = generateInitialsAvatar(tenantName);
                      setCapturedPhoto(avatarUrl);
                      setErrorMessage(null);
                    }}
                    className="px-3.5 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition inline-flex items-center space-x-1.5 shadow-xs"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Generate Avatar</span>
                  </button>
                  <button
                    onClick={() => startCamera(selectedDeviceId)}
                    className="px-3.5 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition inline-flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Live Camera Stream */
              <>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950 text-white space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-xs text-gray-400 font-medium">Starting camera...</span>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />

                {/* Viewfinder Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Oval/Circle Portrait Guide */}
                  <div className="w-56 h-64 border-2 border-dashed border-white/50 rounded-full flex items-center justify-center relative shadow-sm">
                    <div className="absolute top-2 w-2 h-2 rounded-full bg-white/40" />
                    <div className="text-[10px] uppercase font-bold tracking-widest text-white/60 bg-gray-950/40 px-2 py-0.5 rounded-full mt-48">
                      Align Face Here
                    </div>
                  </div>
                </div>

                {/* Live Camera Badge */}
                <div className="absolute top-3 left-3 bg-gray-950/70 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-medium text-white flex items-center space-x-1.5 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Live Feed</span>
                </div>

                {/* Mirror & Device Controls Top Right */}
                <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className="p-1.5 rounded-full bg-gray-950/70 hover:bg-gray-900 text-white border border-white/10 transition"
                    title={isMirrored ? 'Disable Mirroring' : 'Enable Mirroring'}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Device Selection Bar (if multiple cameras available) */}
          {!capturedPhoto && devices.length > 1 && (
            <div className="flex items-center justify-between px-2 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <RotateCw className="w-3 h-3 text-gray-400" />
                <span>Camera Device:</span>
              </span>
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none max-w-[200px] truncate"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Controls */}
          <div className="pt-2">
            {capturedPhoto ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Photo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    disabled={isLoading || !!errorMessage || countdown !== null}
                    className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition disabled:opacity-50 flex items-center space-x-1"
                    title="3-Second Timer"
                  >
                    <Timer className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">3s Timer</span>
                  </button>

                  <button
                    type="button"
                    onClick={takeSnapshot}
                    disabled={isLoading || !!errorMessage || countdown !== null}
                    className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50 active:scale-98"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const avatarUrl = generateInitialsAvatar(tenantName);
                      setCapturedPhoto(avatarUrl);
                    }}
                    className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition flex items-center space-x-1"
                    title="Generate Initials Avatar"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Avatar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition flex items-center space-x-1"
                    title="Upload image file instead"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                </div>

                <p className="text-center text-[11px] text-gray-400">
                  Tip: Look straight at the camera or upload an image file for the tenancy ID record.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
