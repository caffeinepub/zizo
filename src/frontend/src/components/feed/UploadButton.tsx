import { useState } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { UploadDialog } from './UploadDialog';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface UploadButtonProps {
  onVerificationRequired?: (action: () => void) => void;
}

export function UploadButton({ onVerificationRequired }: UploadButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { identity } = useInternetIdentity();

  const handleClick = () => {
    if (!identity) {
      toast.error('Please log in to upload content');
      return;
    }
    setDialogOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <UploadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
