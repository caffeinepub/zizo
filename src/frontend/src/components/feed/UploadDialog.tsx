import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Loader2, Upload, Image as ImageIcon, Video as VideoIcon, Camera, Edit } from 'lucide-react';
import { useUploadMedia } from '../../hooks/useQueries';
import { Progress } from '../ui/progress';
import { VideoCapturePanel } from '../capture/VideoCapturePanel';
import { MediaEditorDialog } from '../editor/MediaEditorDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCapture, setShowCapture] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMedia();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      const isVideo = selectedFile.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setUploadError('Please select an image or video file');
        return;
      }

      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setUploadError('File size must be less than 100MB');
        return;
      }

      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handleCaptureComplete = (capturedFile: File) => {
    setFile(capturedFile);
    setShowCapture(false);
  };

  const handleEditComplete = (editedFile: File) => {
    setFile(editedFile);
    setShowEditor(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file');
      return;
    }

    try {
      setUploadProgress(0);
      setUploadError(null);
      await uploadMutation.mutateAsync({ file, caption: caption.trim(), onProgress: setUploadProgress });
      
      setFile(null);
      setCaption('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
    }
  };

  const handleCancel = () => {
    if (!uploadMutation.isPending) {
      setFile(null);
      setCaption('');
      setUploadProgress(0);
      setUploadError(null);
      setShowCapture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  const isUploading = uploadMutation.isPending;
  const fileType = file?.type.startsWith('image/') ? 'image' : file?.type.startsWith('video/') ? 'video' : null;

  if (showCapture) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Video</DialogTitle>
            <DialogDescription>
              Record a video using your camera
            </DialogDescription>
          </DialogHeader>
          <VideoCapturePanel 
            onComplete={handleCaptureComplete}
            onCancel={() => setShowCapture(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (showEditor && file) {
    return (
      <MediaEditorDialog
        open={showEditor}
        onOpenChange={setShowEditor}
        file={file}
        onComplete={handleEditComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Content</DialogTitle>
          <DialogDescription>
            Share an image or video with the community
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Choose File</TabsTrigger>
            <TabsTrigger value="record">Record Video</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Media File</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
              {file && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {fileType === 'image' && <ImageIcon className="h-4 w-4" />}
                    {fileType === 'video' && <VideoIcon className="h-4 w-4" />}
                    <span className="truncate">{file.name}</span>
                    <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditor(true)}
                    disabled={isUploading}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="record" className="space-y-4 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowCapture(true)}
              disabled={isUploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption (optional)</Label>
          <Textarea
            id="caption"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isUploading}
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {caption.length}/500
          </div>
        </div>

        {uploadError && (
          <div className="text-sm text-destructive">
            {uploadError}
          </div>
        )}

        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
