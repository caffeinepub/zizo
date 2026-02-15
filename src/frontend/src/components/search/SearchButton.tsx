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
        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
      >
        <Search className="h-5 w-5" />
      </Button>
      <SearchDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
