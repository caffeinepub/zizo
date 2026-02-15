import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useFeedItems } from '../../hooks/useQueries';
import { FeedItem } from './FeedItem';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { getUrlParameter, removeUrlParameter } from '../../utils/urlParams';
import { toast } from 'sonner';

export interface VideoFeedHandle {
  scrollToItemId: (id: string) => void;
}

export const VideoFeed = forwardRef<VideoFeedHandle>((_, ref) => {
  const { data: items, isLoading, error, refetch } = useFeedItems();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const deepLinkHandledRef = useRef(false);

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

  // Handle deep link on initial load
  useEffect(() => {
    if (!items || items.length === 0 || deepLinkHandledRef.current) return;

    const postId = getUrlParameter('postId');
    if (postId) {
      deepLinkHandledRef.current = true;

      // Find the post
      const postIndex = items.findIndex(item => item.id.toString() === postId);
      
      if (postIndex !== -1) {
        // Scroll to the post
        setTimeout(() => {
          const element = itemRefsMap.current.get(postId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveIndex(postIndex);
          }
        }, 100);
      } else {
        toast.error('Post not found', {
          description: 'The post you are looking for could not be found.',
        });
      }

      // Remove the postId parameter from URL
      removeUrlParameter('postId');
    }
  }, [items]);

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
      <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">Failed to load feed</p>
          <p className="text-sm text-muted-foreground mb-6">
            Please check your connection and try again
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-2">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            Be the first to share something!
          </p>
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
      {items.map((item, index) => (
        <FeedItem
          key={item.id.toString()}
          ref={(el) => {
            if (el) {
              itemRefsMap.current.set(item.id.toString(), el);
            }
          }}
          item={item}
          isActive={index === activeIndex}
          index={index}
        />
      ))}
    </div>
  );
});

VideoFeed.displayName = 'VideoFeed';
