import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useFeedItems } from '../../hooks/useQueries';
import { FeedItem } from './FeedItem';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

export interface VideoFeedHandle {
  scrollToItemId: (id: string) => void;
}

export const VideoFeed = forwardRef<VideoFeedHandle>((_, ref) => {
  const { data: items, isLoading, error, refetch } = useFeedItems();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  useImperativeHandle(ref, () => ({
    scrollToItemId: (id: string) => {
      const element = itemRefsMap.current.get(id);
      if (element && containerRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const index = items?.findIndex(item => item.id.toString() === id) ?? 0;
        setActiveIndex(index);
      }
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !items || items.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setActiveIndex(index);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    );

    const itemElements = containerRef.current.querySelectorAll('[data-feed-item]');
    itemElements.forEach((item) => observerRef.current?.observe(item));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <p className="text-destructive text-lg font-semibold mb-2">Failed to load feed</p>
          <p className="text-muted-foreground text-sm mb-4">
            {error instanceof Error ? error.message : 'Network issue. Please try again.'}
          </p>
          <Button onClick={() => refetch()} variant="default">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <p className="text-foreground text-lg font-semibold mb-2">No content yet</p>
          <p className="text-muted-foreground text-sm">Be the first to upload!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .snap-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {items.map((item, index) => (
        <FeedItem
          key={item.id.toString()}
          item={item}
          isActive={index === activeIndex}
          index={index}
          ref={(el) => {
            if (el) {
              itemRefsMap.current.set(item.id.toString(), el);
            } else {
              itemRefsMap.current.delete(item.id.toString());
            }
          }}
        />
      ))}
    </div>
  );
});

VideoFeed.displayName = 'VideoFeed';
