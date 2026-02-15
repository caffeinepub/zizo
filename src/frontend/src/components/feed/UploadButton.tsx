import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { UploadDialog } from './UploadDialog';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';

export function UploadButton() {
  const [open, setOpen] = useState(false);
  const { identity, login, loginStatus } = useInternetIdentity();

  const handleClick = async () => {
    if (!identity) {
      toast.error('Please log in to upload content');
      try {
        await login();
      } catch (error) {
        console.error('Login error:', error);
      }
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loginStatus === 'logging-in'}
        size="sm"
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Plus className="h-4 w-4 mr-2" />
        Upload
      </Button>
      <UploadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
