import { VideoFeed } from './components/feed/VideoFeed';
import { LoginButton } from './components/auth/LoginButton';
import { ProfileSetup } from './components/auth/ProfileSetup';
import { UploadButton } from './components/feed/UploadButton';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden bg-background safe-area-container">
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none safe-area-top">
          <h1 className="text-2xl font-bold text-white tracking-tight pointer-events-auto">ZIZO</h1>
          <div className="flex items-center gap-2 pointer-events-auto">
            <UploadButton />
            <LoginButton />
          </div>
        </div>
        <VideoFeed />
      </div>
      <Toaster position="top-center" />
    </>
  );
}
