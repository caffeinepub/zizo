import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Search, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { useSearchFeed } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { FeedItem } from '../../backend';
import { Button } from '../ui/button';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<FeedItem[]>([]);
  const searchMutation = useSearchFeed();
  const { identity } = useInternetIdentity();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [debouncedSearch]);

  const handleSearch = async () => {
    if (!identity) {
      toast.error('Please log in to search');
      return;
    }

    try {
      const searchResults = await searchMutation.mutateAsync(debouncedSearch);
      setResults(searchResults);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Search failed');
      setResults([]);
    }
  };

  const handleResultClick = (itemId: string) => {
    // This would trigger scroll to item in feed
    // For now, just close dialog and show toast
    toast.info(`Navigating to post ${itemId}`);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSearchText('');
    setResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search captions and creators..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {searchMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!searchMutation.isPending && searchText.trim().length > 0 && searchText.trim().length < 2 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Type at least 2 characters to search
            </div>
          )}

          {!searchMutation.isPending && debouncedSearch.trim().length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No results found
            </div>
          )}

          {results.length > 0 && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((item) => {
                  const isVideo = item.media.__kind__ === 'video';
                  const mediaUrl = isVideo
                    ? (item.media.__kind__ === 'video' ? item.media.video.getDirectURL() : '')
                    : (item.media.__kind__ === 'image' ? item.media.image.getDirectURL() : '');

                  return (
                    <Button
                      key={item.id.toString()}
                      variant="ghost"
                      className="w-full h-auto p-3 justify-start"
                      onClick={() => handleResultClick(item.id.toString())}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {isVideo ? (
                            <video src={mediaUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute top-1 right-1">
                            {isVideo ? (
                              <VideoIcon className="h-3 w-3 text-white drop-shadow" />
                            ) : (
                              <ImageIcon className="h-3 w-3 text-white drop-shadow" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm truncate">{item.handle}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
