import { useInternetIdentity } from '../../hooks/useInternetIdentityExternalBrowser';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in' || loginStatus === 'finalizing';

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Clear all cached data on logout
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        // Handle edge case where user is already authenticated
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      variant="ghost"
      size="sm"
      className="bg-black/60 hover:bg-black/80 text-white border border-white/20"
    >
      {isLoggingIn ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loginStatus === 'finalizing' ? 'Completing...' : 'Logging in...'}
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </>
      )}
    </Button>
  );
}
