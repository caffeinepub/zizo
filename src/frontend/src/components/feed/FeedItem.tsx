import { useEffect, useRef, useState, forwardRef } from 'react';
import type { FeedItem as FeedItemType } from '../../backend';
import { FeedOverlay } from './FeedOverlay';
import { InteractionRail } from './InteractionRail';
import { SpeedControl } from './SpeedControl';
import { useDoubleTap } from '../../hooks/useDoubleTap';
import { useToggleLike, useUserLikes } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Heart } from 'lucide-react';

interface FeedItemProps {
  item: FeedItemType;
  isActive: boolean;
  index: number;
}

export const FeedItem = forwardRef<HTMLDivElement, FeedItemProps>(({ item, isActive, index }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const toggleLikeMutation = useToggleLike();
  const { identity } = useInternetIdentity();
  const { data: userLikes } = useUserLikes();

  const itemId = item.id.toString();
  const isLiked = userLikes?.has(itemId) || false;
  const isVideo = item.media.__kind__ === 'video';
  
  const mediaUrl = isVideo 
    ? (item.media.__kind__ === 'video' ? item.media.video.getDirectURL() : '')
    : (item.media.__kind__ === 'image' ? item.media.image.getDirectURL() : '');

  const handleLike = () => {
    if (!identity) {
      return;
    }
    
    if (!isLiked) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    
    toggleLikeMutation.mutate({ itemId, currentlyLiked: isLiked });
  };

  const doubleTapRef = useDoubleTap(handleLike);

  useEffect(() => {
    if (!isVideo) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch((err) => {
        console.error('Video play error:', err);
      });
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, [isActive, isVideo]);

  useEffect(() => {
    if (!isVideo) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.playbackRate = playbackRate;
  }, [playbackRate, isVideo]);

  return (
    <div
      ref={ref}
      data-feed-item
      data-index={index}
      className="relative h-screen w-screen snap-start snap-always bg-black flex items-center justify-center"
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          preload={isActive ? 'auto' : 'metadata'}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={item.caption}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      
      <div
        ref={doubleTapRef}
        className="absolute inset-0 z-10"
        style={{ touchAction: 'pan-y' }}
      />

      {showHeartAnimation && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <Heart 
            className="h-32 w-32 text-white fill-white animate-ping opacity-80"
            style={{ animationDuration: '0.6s', animationIterationCount: '1' }}
          />
        </div>
      )}

      <FeedOverlay
        handle={item.handle}
        caption={item.caption}
        isActive={isActive}
        isVideo={isVideo}
      >
        {isActive && isVideo && (
          <SpeedControl
            currentSpeed={playbackRate}
            onSpeedChange={setPlaybackRate}
          />
        )}
      </FeedOverlay>

      <InteractionRail
        likeCount={Number(item.likeCount)}
        isLiked={isLiked}
        onLike={handleLike}
        isAuthenticated={!!identity}
        isLoading={toggleLikeMutation.isPending}
        mediaUrl={mediaUrl}
        itemId={itemId}
        mediaType={isVideo ? 'video' : 'image'}
      />
    </div>
  );
});

FeedItem.displayName = 'FeedItem';
