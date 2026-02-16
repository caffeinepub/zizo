import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useAddComment } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentityExternalBrowser';
import { Loader2, Image as ImageIcon, Video, X } from 'lucide-react';
import { toast } from 'sonner';

interface CommentComposerProps {
  feedItemId: bigint;
  onCommentAdded?: (newCount: number) => void;
}

export function CommentComposer({ feedItemId, onCommentAdded }: CommentComposerProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { identity } = useInternetIdentity();
  const addCommentMutation = useAddComment();

  const isAuthenticated = !!identity;
  const canSubmit = text.trim().length > 0 && !addCommentMutation.isPending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !isAuthenticated) return;

    try {
      const media = selectedFile
        ? {
            file: selectedFile,
            onProgress: (percentage: number) => setUploadProgress(percentage),
          }
        : undefined;

      await addCommentMutation.mutateAsync({
        feedItemId,
        text: text.trim(),
        media,
      });

      setText('');
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onCommentAdded) {
        onCommentAdded(0);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          Please log in to post a comment
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {selectedFile && (
        <div className="relative inline-block">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Video className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {selectedFile.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2"
              onClick={handleRemoveFile}
              disabled={addCommentMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[44px] max-h-[120px] resize-none flex-1"
          disabled={addCommentMutation.isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={addCommentMutation.isPending}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={addCommentMutation.isPending}
            title="Attach image or video"
            className="h-11 w-11"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="icon"
            className="h-11 w-11"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="text-xl">→</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
