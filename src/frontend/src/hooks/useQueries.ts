import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentityExternalBrowser';
import type { FeedItem, UserProfile, MediaType, Comment, ThreadedCommentView } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useFeedItems() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<FeedItem[]>({
    queryKey: ['feedItems'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.fetchFeedItems();
      } catch (error: any) {
        console.error('Feed fetch error:', error);
        throw new Error('Failed to load feed. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
  };
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

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      const isImage = file.type.startsWith('image/');
      const mediaType: MediaType = isImage
        ? { __kind__: 'image', image: blob }
        : { __kind__: 'video', video: blob };

      const normalizedCaption = caption.trim() || '';
      return actor.addMedia(mediaType, normalizedCaption || null);
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<FeedItem[]>(['feedItems'], (old) => {
        if (!old) return [newItem];
        return [newItem, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['feedItems'] });
      toast.success('Upload successful!');
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('Please log in to upload content');
      } else if (error.message?.includes('verification')) {
        throw error;
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
      await queryClient.cancelQueries({ queryKey: ['feedItems'] });
      await queryClient.cancelQueries({ queryKey: ['userLikes', identity?.getPrincipal().toString()] });

      const previousItems = queryClient.getQueryData<FeedItem[]>(['feedItems']);
      const previousLikes = queryClient.getQueryData<Set<string>>(['userLikes', identity?.getPrincipal().toString()]);

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
      queryClient.invalidateQueries({ queryKey: ['feedItems'] });
    },
  });
}

export function useUserLikes() {
  const { identity } = useInternetIdentity();

  return useQuery<Set<string>>({
    queryKey: ['userLikes', identity?.getPrincipal().toString()],
    queryFn: async () => {
      return new Set<string>();
    },
    enabled: !!identity,
    staleTime: Infinity,
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

export function useSearchFeed() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (searchText: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.searchByKeyword(searchText);
      } catch (error: any) {
        console.error('Search error:', error);
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Please log in to search');
        }
        throw new Error('Search failed. Please try again.');
      }
    },
  });
}

export function useGetComments(feedItemId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', feedItemId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getComments(feedItemId);
      } catch (error: any) {
        console.error('Get comments error:', error);
        throw new Error('Failed to load comments. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 30,
  });
}

export function useGetThreadedComments(feedItemId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ThreadedCommentView[]>({
    queryKey: ['threadedComments', feedItemId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getThreadedComments(feedItemId);
      } catch (error: any) {
        console.error('Get threaded comments error:', error);
        throw new Error('Failed to load comments. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 30,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      feedItemId, 
      text, 
      media 
    }: { 
      feedItemId: bigint; 
      text: string; 
      media?: { file: File; onProgress?: (percentage: number) => void };
    }) => {
      if (!actor) throw new Error('Actor not available');

      let mediaType: MediaType | null = null;

      if (media) {
        const arrayBuffer = await media.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let blob = ExternalBlob.fromBytes(bytes);
        if (media.onProgress) {
          blob = blob.withUploadProgress(media.onProgress);
        }

        const isImage = media.file.type.startsWith('image/');
        mediaType = isImage
          ? { __kind__: 'image', image: blob }
          : { __kind__: 'video', video: blob };
      }

      return actor.addComment(feedItemId, text, mediaType);
    },
    onSuccess: (newComment, variables) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', variables.feedItemId.toString()],
        (old) => {
          if (!old) return [newComment];
          return [...old, newComment];
        }
      );
      queryClient.invalidateQueries({ 
        queryKey: ['comments', variables.feedItemId.toString()] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['threadedComments', variables.feedItemId.toString()] 
      });
      toast.success('Comment posted!');
    },
    onError: (error: any) => {
      console.error('Add comment error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('Please log in to comment');
      } else {
        toast.error('Failed to post comment. Please try again.');
      }
    },
  });
}

export function useLikeComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedItemId, commentId }: { feedItemId: bigint; commentId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.likeComment(feedItemId, commentId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['threadedComments', variables.feedItemId.toString()] 
      });
    },
    onError: (error: any) => {
      console.error('Like comment error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('Please log in to like comments');
      } else {
        toast.error('Failed to like comment. Please try again.');
      }
    },
  });
}

export function useAddReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      feedItemId, 
      parentCommentId,
      text, 
      media 
    }: { 
      feedItemId: bigint; 
      parentCommentId: bigint;
      text: string; 
      media?: { file: File; onProgress?: (percentage: number) => void };
    }) => {
      if (!actor) throw new Error('Actor not available');

      let mediaType: MediaType | null = null;

      if (media) {
        const arrayBuffer = await media.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let blob = ExternalBlob.fromBytes(bytes);
        if (media.onProgress) {
          blob = blob.withUploadProgress(media.onProgress);
        }

        const isImage = media.file.type.startsWith('image/');
        mediaType = isImage
          ? { __kind__: 'image', image: blob }
          : { __kind__: 'video', video: blob };
      }

      return actor.addReply(feedItemId, parentCommentId, text, mediaType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['threadedComments', variables.feedItemId.toString()] 
      });
      toast.success('Reply posted!');
    },
    onError: (error: any) => {
      console.error('Add reply error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('Please log in to reply');
      } else {
        toast.error('Failed to post reply. Please try again.');
      }
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedItemId, commentId }: { feedItemId: bigint; commentId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteComment(feedItemId, commentId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['threadedComments', variables.feedItemId.toString()] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['comments', variables.feedItemId.toString()] 
      });
      toast.success('Comment deleted');
    },
    onError: (error: any) => {
      console.error('Delete comment error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('You can only delete your own comments');
      } else {
        toast.error('Failed to delete comment. Please try again.');
      }
    },
  });
}

export function useDeleteReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      feedItemId, 
      parentCommentId, 
      replyId 
    }: { 
      feedItemId: bigint; 
      parentCommentId: bigint; 
      replyId: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteReply(feedItemId, parentCommentId, replyId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['threadedComments', variables.feedItemId.toString()] 
      });
      toast.success('Reply deleted');
    },
    onError: (error: any) => {
      console.error('Delete reply error:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('You can only delete your own replies');
      } else {
        toast.error('Failed to delete reply. Please try again.');
      }
    },
  });
}
