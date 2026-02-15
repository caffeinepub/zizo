import type { Comment } from '../../backend';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useGetCallerUserProfile } from '../../hooks/useQueries';

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  const { data: currentUserProfile } = useGetCallerUserProfile();

  const getAuthorInitials = (authorPrincipal: string): string => {
    const shortId = authorPrincipal.slice(0, 2).toUpperCase();
    return shortId;
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const authorId = comment.author.toString();
        const mediaUrl = comment.media
          ? comment.media.__kind__ === 'image'
            ? comment.media.image.getDirectURL()
            : comment.media.video.getDirectURL()
          : null;
        const isVideo = comment.media?.__kind__ === 'video';

        return (
          <div key={comment.id.toString()} className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
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

              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {comment.text}
              </p>

              {mediaUrl && (
                <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
