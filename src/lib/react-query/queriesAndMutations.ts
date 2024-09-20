import {
  useQuery,
  UseMutation,
  useQueryClient,
  userInfiniteQuery,
  useMutation,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  createPost,
  createUserAccount,
  deletePost,
  deleteSavedPost,
  followUser,
  getCurrentUser,
  getInfinitePosts,
  getPostById,
  getPostsByLocation,
  getRecentPosts,
  getUserById,
  getUserFollowers,
  getUserFollowing,
  getUserPosts,
  likePost,
  savePost,
  searchPosts,
  signInToAccount,
  signOutAccount,
  unfollowUser,
  updatePost,
  updateUserLocation,
} from "../appwrite/api";
import { INewPost, INewUser, IUpdatePost } from "@/types";
import { QUERY_KEYS } from "./queryKeys";
import { get } from "http";
import { appWriteConfig, databases } from "../appwrite/config";

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInToAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      likesArray,
    }: {
      postId: string;
      likesArray: string[];
    }) => likePost(postId, likesArray),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      savePost(postId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (saveRecordId: string) => deleteSavedPost(saveRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetPostById = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, imageId }: { postId: string; imageId: string }) =>
      deletePost(postId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};



export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS,searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useUpdateUserLocation = () => {
  return useMutation({
    mutationFn: ({
      accountId, 
      latitude,
      longitude,
    }: {
      accountId: string;  
      latitude?: number;
      longitude?: number;
    }) => updateUserLocation({ accountId, latitude, longitude }),  
  });
};

export const useGetPosts = (
  latitude: number,
  longitude: number,
  distanceFilter: number
) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_POSTS, latitude, longitude, distanceFilter],
    queryFn: ({ pageParam }) =>
      getPostsByLocation({
        latitude,
        longitude,
        distanceFilter,
        pageParam: pageParam ?? undefined, // Ensure pageParam is undefined if null
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.documents.length === 0) return undefined; // Ensure undefined if no more pages
      const lastId = lastPage.documents[lastPage.documents.length - 1].$id;
      return lastId ?? undefined; // Ensure undefined if no lastId
    },
    enabled: !!latitude && !!longitude,
    initialPageParam: undefined, // Ensuring the initial page param is undefined
  });
};

export const useGetUserById = (accountId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, accountId],
    queryFn: () => getUserById(accountId),
    enabled: !!accountId, // Only fetch if accountId is provided
  });
};

// Hook for fetching user's followers by accountId
export const useGetUserFollowers = (accountId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_FOLLOWERS, accountId],
    queryFn: () => getUserFollowers(accountId),
    enabled: !!accountId,
  });
};

// Hook for fetching user's following list by accountId
export const useGetUserFollowing = (accountId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_FOLLOWING, accountId],
    queryFn: () => getUserFollowing(accountId),
    enabled: !!accountId,
  });
};

export const useGetUserPosts = (accountId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, accountId],
    queryFn: () => getUserPosts(accountId),
    enabled: !!accountId, 
  });
};

export const useFollowUser = () => {
  return useMutation({
    mutationFn: ({ followerId, followedId }: { followerId: string; followedId: string }) =>
      followUser({ followerId, followedId }),  
  });
};

// Unfollow User Mutation
export const useUnfollowUser = () => {
  return useMutation({
    mutationFn: ({ followerId, followedId }: { followerId: string; followedId: string }) =>
      unfollowUser({ followerId, followedId }),  
  });
};