import { useState } from 'react';
import { Gauge } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface SpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2×' },
];

export function SpeedControl({ currentSpeed, onSpeedChange }: SpeedControlProps) {
  const [open, setOpen] = useState(false);

  const currentLabel = SPEED_OPTIONS.find((opt) => opt.value === currentSpeed)?.label || '1×';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="bg-black/60 hover:bg-black/80 text-white border border-white/20 gap-2"
        >
          <Gauge className="h-4 w-4" />
          <span className="text-sm font-semibold">{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-black/90 border-white/20 text-white">
        {SPEED_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              onSpeedChange(option.value);
              setOpen(false);
            }}
            className={`cursor-pointer ${
              currentSpeed === option.value
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-white/80'
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
