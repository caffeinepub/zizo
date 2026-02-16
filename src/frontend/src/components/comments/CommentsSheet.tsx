import { useEffect, useState } from 'react';
import { X, ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { CommentList } from './CommentList';
import { CommentComposer } from './CommentComposer';
import { useGetThreadedComments } from '../../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedItemId: bigint;
  onCommentCountChange?: (count: number) => void;
}

type SortMode = 'top' | 'newest';

export function CommentsSheet({ 
  open, 
  onOpenChange, 
  feedItemId,
  onCommentCountChange 
}: CommentsSheetProps) {
  const [sortMode, setSortMode] = useState<SortMode>('top');
  const { data: threadedComments, isLoading, error } = useGetThreadedComments(feedItemId);

  // Update parent with comment count when data changes
  useEffect(() => {
    if (threadedComments && onCommentCountChange) {
      // Count total comments including replies
      const countTotal = (comments: typeof threadedComments): number => {
        return comments.reduce((total, comment) => {
          return total + 1 + countTotal(comment.replies);
        }, 0);
      };
      onCommentCountChange(countTotal(threadedComments));
    }
  }, [threadedComments, feedItemId, onCommentCountChange]);

  // Sort comments based on mode
  const sortedComments = threadedComments ? [...threadedComments].sort((a, b) => {
    if (sortMode === 'top') {
      return Number(b.likeCount) - Number(a.likeCount);
    } else {
      return Number(b.id) - Number(a.id);
    }
  }) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border safe-area-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <h2 className="text-base font-semibold">
            {threadedComments ? `${sortedComments.length} Comments` : 'Comments'}
          </h2>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <Button
          variant={sortMode === 'top' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSortMode('top')}
          className="flex items-center gap-1.5"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Top</span>
        </Button>
        <Button
          variant={sortMode === 'newest' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSortMode('newest')}
          className="flex items-center gap-1.5"
        >
          <Clock className="h-4 w-4" />
          <span>Newest</span>
        </Button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 px-6">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load comments</p>
              <p className="text-xs text-muted-foreground">Please try again later</p>
            </div>
          </div>
        ) : sortedComments.length > 0 ? (
          <div className="px-4 py-4">
            <CommentList comments={sortedComments} feedItemId={feedItemId} />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
            </div>
          </div>
        )}
      </div>

      {/* Composer - Sticky at bottom */}
      <div className="border-t border-border bg-background safe-area-bottom">
        <CommentComposer feedItemId={feedItemId} />
      </div>
    </div>
  );
}
