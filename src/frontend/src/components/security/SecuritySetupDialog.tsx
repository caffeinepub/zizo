import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useSecuritySetup } from '../../hooks/useSecuritySetup';

interface SecuritySetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecuritySetupDialog({ open, onOpenChange }: SecuritySetupDialogProps) {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');
  
  const { saveSetup, isSetupComplete } = useSecuritySetup();

  const handleNext = () => {
    if (step === 1) {
      if (pin.length < 4) {
        toast.error('PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!question1 || !answer1 || !question2 || !answer2) {
        toast.error('Please fill in all security questions');
        return;
      }
      handleSave();
    }
  };

  const handleSave = () => {
    saveSetup({
      pin,
      securityQuestions: [
        { question: question1, answer: answer1 },
        { question: question2, answer: answer2 },
      ],
    });
    toast.success('Security setup complete!');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setPin('');
    setConfirmPin('');
    setQuestion1('');
    setAnswer1('');
    setQuestion2('');
    setAnswer2('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Security Setup</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Create a PIN for verification' : 'Set up security questions'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN (4+ digits)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirm PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question1">Security Question 1</Label>
              <Input
                id="question1"
                placeholder="e.g., What is your mother's maiden name?"
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
              />
              <Input
                placeholder="Answer"
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question2">Security Question 2</Label>
              <Input
                id="question2"
                placeholder="e.g., What city were you born in?"
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
              />
              <Input
                placeholder="Answer"
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          <Button onClick={handleNext}>
            {step === 1 ? 'Next' : 'Complete Setup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
