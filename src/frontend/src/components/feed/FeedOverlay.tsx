import { type ReactNode } from 'react';

interface FeedOverlayProps {
  handle: string;
  caption: string;
  isActive: boolean;
  isVideo?: boolean;
  children?: ReactNode;
}

export function FeedOverlay({ handle, caption, isActive, isVideo = true, children }: FeedOverlayProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none safe-area-bottom">
      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32 pb-20 px-4">
        <div className="max-w-[calc(100%-80px)]">
          <h3 className="text-white font-semibold text-base mb-2 pointer-events-auto">
            {handle}
          </h3>
          <p className="text-white text-sm leading-relaxed line-clamp-3 pointer-events-auto">
            {caption}
          </p>
        </div>
        {isActive && isVideo && children && (
          <div className="mt-4 pointer-events-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
