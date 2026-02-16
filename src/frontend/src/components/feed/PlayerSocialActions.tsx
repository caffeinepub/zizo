import { useState } from 'react';
import { Button } from '../ui/button';
import { UserPlus, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerSocialActionsProps {
  handle: string;
}

export function PlayerSocialActions({ handle }: PlayerSocialActionsProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? `Unfollowed ${handle}` : `Following ${handle}`);
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    toast.success(isSubscribed ? `Unsubscribed from ${handle}` : `Subscribed to ${handle}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleFollow}
        size="sm"
        variant="ghost"
        className="bg-white hover:bg-white/90 text-black font-semibold px-4 py-2 h-9 rounded-lg"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      <Button
        onClick={handleSubscribe}
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 h-9 rounded-lg"
      >
        <Bell className="h-4 w-4 mr-2" />
        {isSubscribed ? 'Subscribed' : 'Subscribe'}
      </Button>
    </div>
  );
}
