import { type ReactNode } from 'react';

interface FeedOverlayProps {
  handle: string;
  caption: string;
  isActive: boolean;
  isVideo?: boolean;
  children?: ReactNode;
  socialActions?: ReactNode;
}

export function FeedOverlay({ handle, caption, isActive, isVideo = true, children, socialActions }: FeedOverlayProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none safe-area-bottom">
      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32 pb-20 px-4">
        <div className="max-w-[calc(100%-80px)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-base pointer-events-auto">
              {handle}
            </h3>
          </div>
          {socialActions && (
            <div className="mb-3 pointer-events-auto">
              {socialActions}
            </div>
          )}
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
