import {
  type ReactNode,
  type PropsWithChildren,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { AuthClient, type AuthClientCreateOptions, type AuthClientLoginOptions } from '@dfinity/auth-client';
import type { Identity } from '@icp-sdk/core/agent';
import { DelegationIdentity, isDelegationValid } from '@icp-sdk/core/identity';
import { loadConfig } from '../config';
import { isEmbeddedBrowser, supportsExternalBrowser } from '../utils/embeddedBrowser';
import {
  storeExternalLoginState,
  getExternalLoginState,
  clearExternalLoginState,
  isReturningFromExternalLogin,
  cleanupCallbackUrl
} from '../utils/iiExternalReturn';
import { toast } from 'sonner';

export type Status = 'initializing' | 'idle' | 'logging-in' | 'success' | 'loginError' | 'finalizing';

export type InternetIdentityContext = {
  identity?: Identity;
  login: () => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: boolean;
  isLoginIdle: boolean;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
  loginError?: Error;
};

const ONE_HOUR_IN_NANOSECONDS = BigInt(3_600_000_000_000);
const DEFAULT_IDENTITY_PROVIDER = process.env.II_URL;

type ProviderValue = InternetIdentityContext;
const InternetIdentityReactContext = createContext<ProviderValue | undefined>(undefined);

async function createAuthClient(createOptions?: AuthClientCreateOptions): Promise<AuthClient> {
  const config = await loadConfig();
  const options: AuthClientCreateOptions = {
    idleOptions: {
      disableDefaultIdleCallback: true,
      disableIdle: true,
      ...createOptions?.idleOptions
    },
    loginOptions: {
      derivationOrigin: config.ii_derivation_origin
    },
    ...createOptions
  };
  const authClient = await AuthClient.create(options);
  return authClient;
}

function assertProviderPresent(context: ProviderValue | undefined): asserts context is ProviderValue {
  if (!context) {
    throw new Error('InternetIdentityProvider is not present. Wrap your component tree with it.');
  }
}

export const useInternetIdentity = (): InternetIdentityContext => {
  const context = useContext(InternetIdentityReactContext);
  assertProviderPresent(context);
  return context;
};

export function InternetIdentityProvider({
  children,
  createOptions
}: PropsWithChildren<{
  children: ReactNode;
  createOptions?: AuthClientCreateOptions;
}>) {
  const [authClient, setAuthClient] = useState<AuthClient | undefined>(undefined);
  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setStatus] = useState<Status>('initializing');
  const [loginError, setError] = useState<Error | undefined>(undefined);
  const [isExternalBrowserFlow, setIsExternalBrowserFlow] = useState(false);

  const setErrorMessage = useCallback((message: string) => {
    setStatus('loginError');
    setError(new Error(message));
  }, []);

  const handleLoginSuccess = useCallback(() => {
    const latestIdentity = authClient?.getIdentity();
    if (!latestIdentity) {
      setErrorMessage('Identity not found after successful login');
      return;
    }
    setIdentity(latestIdentity);
    setStatus('success');
    setIsExternalBrowserFlow(false);
    
    // Clear external login state
    clearExternalLoginState();
    cleanupCallbackUrl();
  }, [authClient, setErrorMessage]);

  const handleLoginError = useCallback(
    (maybeError?: string) => {
      setErrorMessage(maybeError ?? 'Login failed');
      setIsExternalBrowserFlow(false);
      clearExternalLoginState();
    },
    [setErrorMessage]
  );

  // External browser login flow
  const loginWithExternalBrowser = useCallback(async () => {
    if (!authClient) {
      setErrorMessage('AuthClient is not initialized yet');
      return;
    }

    try {
      // Store state before redirecting
      const nonce = storeExternalLoginState();
      
      // Show user feedback
      toast.info('Opening browser for login', {
        description: 'Please complete login in your browser and return to this app.',
        duration: 5000
      });

      setStatus('logging-in');
      setIsExternalBrowserFlow(true);

      // Build the return URL with callback marker
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set('ii_callback', '1');
      returnUrl.searchParams.set('state', nonce);

      const options: AuthClientLoginOptions = {
        identityProvider: DEFAULT_IDENTITY_PROVIDER,
        onSuccess: handleLoginSuccess,
        onError: handleLoginError,
        maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30),
        // Force external window for embedded browsers
        windowOpenerFeatures: '_blank'
      };

      // Attempt to open in external browser
      await authClient.login(options);
    } catch (error: any) {
      console.error('External browser login error:', error);
      handleLoginError(error.message || 'Failed to open external browser for login');
    }
  }, [authClient, handleLoginError, handleLoginSuccess, setErrorMessage]);

  // Standard in-browser login flow
  const loginInBrowser = useCallback(() => {
    if (!authClient) {
      setErrorMessage('AuthClient is not initialized yet');
      return;
    }

    const currentIdentity = authClient.getIdentity();
    if (
      !currentIdentity.getPrincipal().isAnonymous() &&
      currentIdentity instanceof DelegationIdentity &&
      isDelegationValid(currentIdentity.getDelegation())
    ) {
      setErrorMessage('User is already authenticated');
      return;
    }

    const options: AuthClientLoginOptions = {
      identityProvider: DEFAULT_IDENTITY_PROVIDER,
      onSuccess: handleLoginSuccess,
      onError: handleLoginError,
      maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30)
    };

    setStatus('logging-in');
    void authClient.login(options);
  }, [authClient, handleLoginError, handleLoginSuccess, setErrorMessage]);

  // Main login function that chooses the appropriate flow
  const login = useCallback(() => {
    if (supportsExternalBrowser()) {
      loginWithExternalBrowser();
    } else {
      loginInBrowser();
    }
  }, [loginWithExternalBrowser, loginInBrowser]);

  const clear = useCallback(() => {
    if (!authClient) {
      setErrorMessage('Auth client not initialized');
      return;
    }

    void authClient
      .logout()
      .then(() => {
        setIdentity(undefined);
        setAuthClient(undefined);
        setStatus('idle');
        setError(undefined);
        setIsExternalBrowserFlow(false);
        clearExternalLoginState();
      })
      .catch((unknownError: unknown) => {
        setStatus('loginError');
        setError(unknownError instanceof Error ? unknownError : new Error('Logout failed'));
      });
  }, [authClient, setErrorMessage]);

  // Handle return from external browser
  useEffect(() => {
    let cancelled = false;

    const handleExternalReturn = async () => {
      if (!isReturningFromExternalLogin()) {
        return;
      }

      try {
        setStatus('finalizing');
        
        const state = getExternalLoginState();
        if (!state) {
          throw new Error('Login state not found. Please try logging in again.');
        }

        // Wait a bit for AuthClient to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (cancelled) return;

        // Check if we're now authenticated
        let client = authClient;
        if (!client) {
          client = await createAuthClient(createOptions);
          if (cancelled) return;
          setAuthClient(client);
        }

        const isAuthenticated = await client.isAuthenticated();
        if (cancelled) return;

        if (isAuthenticated) {
          const loadedIdentity = client.getIdentity();
          setIdentity(loadedIdentity);
          setStatus('success');
          toast.success('Login successful!');
        } else {
          throw new Error('Authentication not completed. Please try again.');
        }

        // Cleanup
        clearExternalLoginState();
        cleanupCallbackUrl();
      } catch (error: any) {
        if (!cancelled) {
          console.error('External return error:', error);
          setErrorMessage(error.message || 'Failed to complete login');
          toast.error('Login failed', {
            description: 'Please try logging in again.',
            action: {
              label: 'Retry',
              onClick: login
            }
          });
          clearExternalLoginState();
          cleanupCallbackUrl();
        }
      }
    };

    handleExternalReturn();

    return () => {
      cancelled = true;
    };
  }, [authClient, createOptions, login, setErrorMessage]);

  // Initialize auth client and check for existing session
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        // Skip initialization if we're handling external return
        if (isReturningFromExternalLogin()) {
          return;
        }

        setStatus('initializing');
        let existingClient = authClient;
        if (!existingClient) {
          existingClient = await createAuthClient(createOptions);
          if (cancelled) return;
          setAuthClient(existingClient);
        }
        const isAuthenticated = await existingClient.isAuthenticated();
        if (cancelled) return;
        if (isAuthenticated) {
          const loadedIdentity = existingClient.getIdentity();
          setIdentity(loadedIdentity);
        }
      } catch (unknownError) {
        setStatus('loginError');
        setError(unknownError instanceof Error ? unknownError : new Error('Initialization failed'));
      } finally {
        if (!cancelled) setStatus('idle');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [createOptions, authClient]);

  const value = useMemo<ProviderValue>(
    () => ({
      identity,
      login,
      clear,
      loginStatus,
      isInitializing: loginStatus === 'initializing',
      isLoginIdle: loginStatus === 'idle',
      isLoggingIn: loginStatus === 'logging-in' || loginStatus === 'finalizing',
      isLoginSuccess: loginStatus === 'success',
      isLoginError: loginStatus === 'loginError',
      loginError
    }),
    [identity, login, clear, loginStatus, loginError]
  );

  return createElement(InternetIdentityReactContext.Provider, { value, children });
}
