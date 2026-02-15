import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { FeedItem, UserProfile, MediaType } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useFeedItems() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FeedItem[]>({
    queryKey: ['feedItems'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.fetchFeedItems();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUploadMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      caption, 
      onProgress 
    }: { 
      file: File; 
      caption: string; 
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');

      // Read file as bytes
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      // Determine media type
      const isImage = file.type.startsWith('image/');
      const mediaType: MediaType = isImage
        ? { __kind__: 'image', image: blob }
        : { __kind__: 'video', video: blob };

      // Upload to backend
      return actor.addMedia(mediaType, caption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedItems'] });
      toast.success('Upload successful!');
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('Please log in to upload content');
      } else {
        toast.error('Upload failed. Please try again.');
      }
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ itemId, currentlyLiked }: { itemId: string; currentlyLiked: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.toggleLike(itemId);
      return { itemId, wasLiked: currentlyLiked };
    },
    onMutate: async ({ itemId, currentlyLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feedItems'] });
      await queryClient.cancelQueries({ queryKey: ['userLikes', identity?.getPrincipal().toString()] });

      // Snapshot previous values
      const previousItems = queryClient.getQueryData<FeedItem[]>(['feedItems']);
      const previousLikes = queryClient.getQueryData<Set<string>>(['userLikes', identity?.getPrincipal().toString()]);

      // Optimistically update items
      queryClient.setQueryData<FeedItem[]>(['feedItems'], (old) => {
        if (!old) return old;
        return old.map((item) => {
          if (item.id.toString() === itemId) {
            return {
              ...item,
              likeCount: currentlyLiked 
                ? item.likeCount - BigInt(1)
                : item.likeCount + BigInt(1),
            };
          }
          return item;
        });
      });

      // Optimistically update user likes
      queryClient.setQueryData<Set<string>>(['userLikes', identity?.getPrincipal().toString()], (old) => {
        const newSet = new Set(old || []);
        if (currentlyLiked) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });

      return { previousItems, previousLikes };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['feedItems'], context.previousItems);
      }
      if (context?.previousLikes) {
        queryClient.setQueryData(['userLikes', identity?.getPrincipal().toString()], context.previousLikes);
      }
      toast.error('Failed to update like. Please try again.');
      console.error('Toggle like error:', error);
    },
    onSuccess: () => {
      // Refetch to ensure consistency with backend
      queryClient.invalidateQueries({ queryKey: ['feedItems'] });
    },
  });
}

export function useUserLikes() {
  const { identity } = useInternetIdentity();

  return useQuery<Set<string>>({
    queryKey: ['userLikes', identity?.getPrincipal().toString()],
    queryFn: async () => {
      // Initialize empty set - likes will be tracked through mutations
      return new Set<string>();
    },
    enabled: !!identity,
    staleTime: Infinity, // Keep in cache indefinitely
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully!');
    },
    onError: (error) => {
      toast.error('Failed to save profile. Please try again.');
      console.error('Save profile error:', error);
    },
  });
}
