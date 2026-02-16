import { useState } from 'react';
import type { ThreadedCommentView } from '../../backend';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useInternetIdentity } from '../../hooks/useInternetIdentityExternalBrowser';
import { useLikeComment, useDeleteComment, useDeleteReply } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface CommentListProps {
  comments: ThreadedCommentView[];
  feedItemId: bigint;
}

interface CommentItemProps {
  comment: ThreadedCommentView;
  feedItemId: bigint;
  isReply?: boolean;
  parentCommentId?: bigint;
  onReply?: (commentId: bigint) => void;
}

function CommentItem({ comment, feedItemId, isReply = false, parentCommentId, onReply }: CommentItemProps) {
  const { identity } = useInternetIdentity();
  const likeCommentMutation = useLikeComment();
  const deleteCommentMutation = useDeleteComment();
  const deleteReplyMutation = useDeleteReply();
  const [showReplies, setShowReplies] = useState(true);

  const authorId = comment.author.toString();
  const isOwnComment = identity?.getPrincipal().toString() === authorId;

  const getAuthorInitials = (authorPrincipal: string): string => {
    const shortId = authorPrincipal.slice(0, 2).toUpperCase();
    return shortId;
  };

  const handleLike = () => {
    if (!identity) {
      toast.error('Please log in to like comments');
      return;
    }
    likeCommentMutation.mutate({ feedItemId, commentId: comment.id });
  };

  const handleDelete = () => {
    if (!identity) return;
    
    if (isReply && parentCommentId !== undefined) {
      deleteReplyMutation.mutate({ 
        feedItemId, 
        parentCommentId, 
        replyId: comment.id 
      });
    } else {
      deleteCommentMutation.mutate({ feedItemId, commentId: comment.id });
    }
  };

  const mediaUrl = comment.media
    ? comment.media.__kind__ === 'image'
      ? comment.media.image.getDirectURL()
      : comment.media.video.getDirectURL()
    : null;
  const isVideo = comment.media?.__kind__ === 'video';

  return (
    <div className={isReply ? 'ml-10' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getAuthorInitials(authorId)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold truncate">
              {authorId.slice(0, 8)}...
            </span>
          </div>

          <p className="text-sm text-foreground whitespace-pre-wrap break-words mb-2">
            {comment.text}
          </p>

          {mediaUrl && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-xs mb-2">
              {isVideo ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full h-auto max-h-48 object-cover"
                  playsInline
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Comment attachment"
                  className="w-full h-auto max-h-48 object-cover"
                />
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeCommentMutation.isPending}
              className="h-auto p-0 hover:bg-transparent"
            >
              <Heart 
                className={`h-4 w-4 mr-1 ${Number(comment.likeCount) > 0 ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
              />
              <span className="text-xs text-muted-foreground">
                {Number(comment.likeCount) > 0 ? Number(comment.likeCount) : ''}
              </span>
            </Button>

            {!isReply && onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="h-auto p-0 hover:bg-transparent"
              >
                <MessageCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Reply</span>
              </Button>
            )}

            {isOwnComment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteCommentMutation.isPending || deleteReplyMutation.isPending}
                className="h-auto p-0 hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                <span className="text-xs text-destructive">Delete</span>
              </Button>
            )}
          </div>

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-auto p-0 hover:bg-transparent mb-2"
              >
                <span className="text-xs text-primary font-medium">
                  {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              </Button>

              {showReplies && (
                <div className="space-y-3 mt-2">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id.toString()}
                      comment={reply}
                      feedItemId={feedItemId}
                      isReply={true}
                      parentCommentId={comment.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentList({ comments, feedItemId }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<bigint | null>(null);

  const handleReply = (commentId: bigint) => {
    setReplyingTo(commentId);
    toast.info('Reply feature coming soon!');
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id.toString()}
          comment={comment}
          feedItemId={feedItemId}
          onReply={handleReply}
        />
      ))}
    </div>
  );
}
