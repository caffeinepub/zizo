import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';

interface VideoOverlayControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
}

export function VideoOverlayControls({
  isPlaying,
  isMuted,
  onPlayPause,
  onMuteToggle,
}: VideoOverlayControlsProps) {
  return (
    <div className="absolute bottom-24 left-4 flex flex-col gap-2 z-30">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPlayPause}
        className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20"
      >
        {isMuted ? (
          <VolumeX className="h-6 w-6" />
        ) : (
          <Volume2 className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
