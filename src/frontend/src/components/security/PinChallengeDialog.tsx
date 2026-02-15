import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { toast } from 'sonner';
import { useSecuritySetup } from '../../hooks/useSecuritySetup';

interface PinChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PinChallengeDialog({ open, onOpenChange, onSuccess }: PinChallengeDialogProps) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { verifyPin } = useSecuritySetup();

  const handleVerify = () => {
    if (verifyPin(pin)) {
      toast.success('Verification successful');
      onSuccess();
      setPin('');
      setAttempts(0);
    } else {
      setAttempts(attempts + 1);
      toast.error('Incorrect PIN');
      setPin('');
      
      if (attempts >= 2) {
        toast.error('Too many failed attempts. Please try again later.');
        onOpenChange(false);
        setAttempts(0);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Security Verification</DialogTitle>
          <DialogDescription>
            Suspicious activity detected. Please enter your PIN to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <InputOTP maxLength={6} value={pin} onChange={setPin}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {attempts > 0 && (
            <p className="text-sm text-destructive">
              {3 - attempts} attempts remaining
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={pin.length < 4}>
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
