import { useState } from 'react';
import { Button } from '../ui/button';
import { Shield } from 'lucide-react';
import { SecuritySetupDialog } from './SecuritySetupDialog';

export function SecurityButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
      >
        <Shield className="h-5 w-5" />
      </Button>
      <SecuritySetupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
