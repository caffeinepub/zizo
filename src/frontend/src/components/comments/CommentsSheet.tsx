import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { CommentList } from './CommentList';
import { CommentComposer } from './CommentComposer';
import { useGetComments } from '../../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedItemId: bigint;
  onCommentCountChange?: (count: number) => void;
}

export function CommentsSheet({ 
  open, 
  onOpenChange, 
  feedItemId,
  onCommentCountChange 
}: CommentsSheetProps) {
  const { data: comments, isLoading, error } = useGetComments(feedItemId);

  // Update parent with comment count when data changes
  useState(() => {
    if (comments && onCommentCountChange) {
      onCommentCountChange(comments.length);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] flex flex-col p-0 rounded-t-3xl"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-center">
            Comments {comments && `(${comments.length})`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">Failed to load comments</p>
                <p className="text-xs text-muted-foreground">Please try again later</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="px-6 py-4">
                {comments && comments.length > 0 ? (
                  <CommentList comments={comments} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="border-t bg-background">
            <CommentComposer 
              feedItemId={feedItemId}
              onCommentAdded={(newCount) => {
                if (onCommentCountChange) {
                  onCommentCountChange(newCount);
                }
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
