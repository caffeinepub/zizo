import { useState } from 'react';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { SearchDialog } from './SearchDialog';

export function SearchButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20"
      >
        <Search className="h-5 w-5" />
      </Button>
      <SearchDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
