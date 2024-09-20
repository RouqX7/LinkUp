import { useUserContext } from '@/context/AuthContext';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Loader from '@/components/ui/shared/Loader';
import GridPostList from '@/components/ui/shared/GridPostList';
import { 
  useGetUserById, 
  useGetUserPosts,
  useFollowUser, 
  useUnfollowUser
} from '@/lib/react-query/queriesAndMutations';

const Profile = () => {
  const { user } = useUserContext();  // Current authenticated user
  const { id } = useParams<{ id: string }>(); // Fetching the profile user ID from the URL
  const isOwnProfile = user.id === id;  // Corrected to check id
  
  // State to track whether the current user is following this profile user
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch profile user data
  const { data: profileUser, isLoading: isProfileLoading } = useGetUserById(id || '');
  const { data: posts, isLoading: isPostsLoading } = useGetUserPosts(id || '');

  const postsArray = posts?.documents || [];

  // Hooks for follow and unfollow mutations
  const { mutateAsync: followUser } = useFollowUser();
  const { mutateAsync: unfollowUser } = useUnfollowUser();

  // Extract followerId and followedId arrays from the user document
  const followersArray = profileUser?.followerId || [];
  const followingArray = profileUser?.followedId || [];

  // Check if the current user is already following the profile user
  useEffect(() => {
    if (followersArray.includes(user.id)) {
      setIsFollowing(true);
    } else {
      setIsFollowing(false);
    }
  }, [followersArray, user.id]);

  // Function to handle follow/unfollow button click
  const handleFollowClick = async () => {
    // Ensure both `user.id` and `id` are valid strings before proceeding
    if (user.id && id) {
      if (isFollowing) {
        // Unfollow user
        await unfollowUser({ followerId: user.id, followedId: id });
        setIsFollowing(false); // Update the state
      } else {
        // Follow user
        await followUser({ followerId: user.id, followedId: id });
        setIsFollowing(true); // Update the state
      }
    }
  };

  if (isProfileLoading || isPostsLoading) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <img
            src={profileUser?.imageUrl}
            alt={`${profileUser?.name}'s profile picture`}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{profileUser?.name}</h1>
            <p className="text-gray-300">{profileUser?.bio}</p>
          </div>
        </div>
        {isOwnProfile ? (
          <button className="p-6">
            <img src='/assets/icons/edit.svg'/>
            Edit Profile
          </button>
        ) : (
          <button
          className={`px-4 py-2 rounded-lg ${isFollowing ? 'bg-purple-400' : 'bg-red-400'} text-white`}
          onClick={handleFollowClick}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
        )}
      </div>

      {/* Profile Stats */}
      <div className="flex space-x-8 mb-8 text-gray-400">
        <p className="font-semibold">
          <span className="text-white">{postsArray.length || 0}</span> Posts
        </p>
        <p className="font-semibold">
          <span className="text-white">{followersArray.length || 0}</span> Followers
        </p>
        <p className="font-semibold">
          <span className="text-white">{followingArray.length || 0}</span> Following
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-600 mb-8">
        <button className="py-2 px-4 text-white border-b-2 border-purple-500">Posts</button>
        <button className="py-2 px-4 text-gray-400">Liked Posts</button>
      </div>

      {/* User Posts */}
      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {postsArray.length > 0 ? (
          <GridPostList posts={postsArray} showUser={false} />
        ) : (
          <p className="text-center text-gray-500 col-span-3">No posts yet</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
