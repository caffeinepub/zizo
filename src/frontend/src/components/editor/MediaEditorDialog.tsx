import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Crop, Palette, Type, Scissors } from 'lucide-react';
import { applyImageEdits, applyVideoEdits } from '../../utils/mediaEdits';

interface MediaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File;
  onComplete: (editedFile: File) => void;
}

export function MediaEditorDialog({ open, onOpenChange, file, onComplete }: MediaEditorDialogProps) {
  const [filter, setFilter] = useState<string>('none');
  const [textOverlay, setTextOverlay] = useState('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (isImage && imageRef.current) {
      const url = URL.createObjectURL(file);
      imageRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    } else if (isVideo && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage, isVideo]);

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      let editedFile: File;
      
      if (isImage && imageRef.current) {
        editedFile = await applyImageEdits(imageRef.current, {
          filter,
          textOverlay,
          crop: cropArea,
        });
      } else if (isVideo && videoRef.current) {
        // Pass original file to preserve video format and audio
        editedFile = await applyVideoEdits(videoRef.current, file, {
          filter,
          textOverlay,
          trimStart,
          trimEnd,
        });
      } else {
        throw new Error('Invalid media type');
      }

      onComplete(editedFile);
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to apply edits. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
          {isVideo && (
            <DialogDescription className="text-sm text-muted-foreground">
              Note: Video editing preserves the original file to maintain audio and quality. Advanced edits are not yet supported.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isImage && (
              <img
                ref={imageRef}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{
                  filter: filter !== 'none' ? `${filter}(100%)` : 'none',
                }}
              />
            )}
            {isVideo && (
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain"
                style={{
                  filter: filter !== 'none' ? `${filter}(100%)` : 'none',
                }}
              />
            )}
            {textOverlay && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold drop-shadow-lg">
                {textOverlay}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <Tabs defaultValue="filter" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="filter">
                <Palette className="h-4 w-4 mr-1" />
                Filter
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="h-4 w-4 mr-1" />
                Text
              </TabsTrigger>
              {isVideo && (
                <TabsTrigger value="trim">
                  <Scissors className="h-4 w-4 mr-1" />
                  Trim
                </TabsTrigger>
              )}
              {isImage && (
                <TabsTrigger value="crop">
                  <Crop className="h-4 w-4 mr-1" />
                  Crop
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="filter" className="space-y-4">
              <div className="space-y-2">
                <Label>Filter (preview only for videos)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['none', 'grayscale', 'sepia', 'brightness', 'contrast'].map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? 'default' : 'outline'}
                      onClick={() => setFilter(f)}
                      className="capitalize"
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-overlay">Text Overlay (preview only for videos)</Label>
                <Input
                  id="text-overlay"
                  placeholder="Enter text..."
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  maxLength={50}
                />
              </div>
            </TabsContent>

            {isVideo && (
              <TabsContent value="trim" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Video trimming is not yet supported. The original video will be uploaded.
                </p>
                <div className="space-y-2">
                  <Label>Trim Start (%) - Preview only</Label>
                  <Slider
                    value={[trimStart]}
                    onValueChange={(v) => setTrimStart(v[0])}
                    max={100}
                    step={1}
                    disabled
                  />
                  <span className="text-sm text-muted-foreground">{trimStart}%</span>
                </div>
                <div className="space-y-2">
                  <Label>Trim End (%) - Preview only</Label>
                  <Slider
                    value={[trimEnd]}
                    onValueChange={(v) => setTrimEnd(v[0])}
                    max={100}
                    step={1}
                    disabled
                  />
                  <span className="text-sm text-muted-foreground">{trimEnd}%</span>
                </div>
              </TabsContent>
            )}

            {isImage && (
              <TabsContent value="crop" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Crop functionality coming soon
                </p>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
