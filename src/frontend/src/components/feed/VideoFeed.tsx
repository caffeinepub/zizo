import { useEffect, useRef, useState } from 'react';
import { useFeedItems } from '../../hooks/useQueries';
import { FeedItem } from './FeedItem';
import { Loader2 } from 'lucide-react';

export function VideoFeed() {
  const { data: items, isLoading, error } = useFeedItems();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current || !items || items.length === 0) return;

    // Create intersection observer to detect active item
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

    // Observe all feed items
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
          <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
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
        />
      ))}
    </div>
  );
}
