import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Camera, StopCircle, RotateCcw, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface VideoCapturePanelProps {
  onComplete: (file: File) => void;
  onCancel: () => void;
}

export function VideoCapturePanel({ onComplete, onCancel }: VideoCapturePanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    startCamera();
  };

  const handleUseVideo = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'video/webm',
      });
      onComplete(file);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startCamera} className="flex-1">
            Try Again
          </Button>
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Use File Upload
          </Button>
        </div>
      </div>
    );
  }

  if (recordedBlob) {
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={URL.createObjectURL(recordedBlob)}
            controls
            className="w-full h-full"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRetake} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake
          </Button>
          <Button onClick={handleUseVideo} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            Use Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCancel} disabled={isRecording || isInitializing}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        {!isRecording ? (
          <Button onClick={startRecording} className="flex-1" disabled={!stream || isInitializing}>
            <Camera className="mr-2 h-4 w-4" />
            {isInitializing ? 'Initializing...' : 'Start Recording'}
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive" className="flex-1">
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  );
}
