import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Copy, Share2, Check } from 'lucide-react';
import { copyToClipboard, isNativeShareSupported, nativeShare } from '../../utils/shareLinks';
import { toast } from 'sonner';

interface ShareMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  title?: string;
  text?: string;
}

export function ShareMenu({ 
  open, 
  onOpenChange, 
  shareUrl,
  title = 'Check out this post on ZIZO',
  text = 'Check out this post!'
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const showNativeShare = isNativeShareSupported();

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const handleNativeShare = async () => {
    const success = await nativeShare({
      title,
      text,
      url: shareUrl,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </Button>

          {showNativeShare && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleNativeShare}
            >
              <Share2 className="h-5 w-5" />
              <span>Share via...</span>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground px-1">
          Anyone with this link can view this post
        </div>
      </DialogContent>
    </Dialog>
  );
}
