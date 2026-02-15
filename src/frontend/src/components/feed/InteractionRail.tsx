import { Heart, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface InteractionRailProps {
  likeCount: number;
  isLiked: boolean;
  onLike: () => void;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

export function InteractionRail({ likeCount, isLiked, onLike, isAuthenticated, isLoading }: InteractionRailProps) {
  const handleLikeClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like posts');
      return;
    }
    onLike();
  };

  const handleCommentClick = () => {
    toast.info('Comments coming soon!');
  };

  const handleShareClick = () => {
    toast.info('Share feature coming soon!');
  };

  return (
    <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-6 safe-area-bottom">
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-full transition-all ${
            isLiked
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
              : 'bg-black/40 hover:bg-black/60 text-white'
          }`}
          onClick={handleLikeClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Heart className={`h-7 w-7 ${isLiked ? 'fill-current' : ''}`} />
          )}
        </Button>
        <span className="text-white text-xs font-semibold drop-shadow-lg">
          {likeCount.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white"
          onClick={handleCommentClick}
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
        <span className="text-white text-xs font-semibold drop-shadow-lg">0</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white"
          onClick={handleShareClick}
        >
          <Share2 className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
