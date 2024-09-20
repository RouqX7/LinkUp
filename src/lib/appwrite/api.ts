import { INewPost, INewUser, IUpdatePost } from "@/types";
import { ID, Query } from "appwrite";
import { account, appWriteConfig, avatars, databases, storage } from "./config";
import { haversine } from "../utils";

export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error("Account creation failed");

    const avatarUrl = avatars.getInitials(user.name);

    // Include latitude and longitude when saving to DB
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      imageUrl: avatarUrl,
      latitude: user.latitude,   
      longitude: user.longitude, 
    });

    return newUser;
  } catch (error) {
    console.log("Error creating user account:", error);
    return error;
  }
}


export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  latitude?: number;  
  longitude?: number; 
}) {
  try {
    const newUser = await databases.createDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      ID.unique(),
      user
    );
    console.log("User saved to DB:", newUser); // Add logging here
    return newUser;
  } catch (error) {
    console.log("Error saving user to database:", error); // Log the error
    throw new Error("Failed to save user to the database");
  }
}


export async function signInToAccount(user: {
  email: string;
  password: string;
}) {
  try {
    // Check if there's already an active session
    const existingSession = await account.getSession("current");

    if (existingSession) {
      console.log("Session already active. Deleting the current session...");
      await account.deleteSession("current"); // Delete the existing session
    }
  } catch (sessionError) {
    console.log("No active session found, proceeding with sign-in.");
  }

  try {
    // Now create a new session
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password
    );
    console.log("Session created successfully:", session);
    return session;
  } catch (error) {
    console.log("Error during sign-up:", error);
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;
    return currentUser.documents[0];
  } catch (error) {
    console.log("Error fetching current user:", error);
  }
}

export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.log(error);
  }
}

export async function createPost(post: INewPost) {
  try {
    // Upload file to appwrite storage
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw Error;

    // Get file url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Create post
    const newPost = await databases.createDocument(
      appWriteConfig.databaseId,
      appWriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        ImageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    return newPost;
  } catch (error) {
    console.log(error);
  }
}

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appWriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appWriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100
    );

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appWriteConfig.storageId, fileId);

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      }
    );
    if (!updatedPost) throw Error;
    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

export async function savePost(postId: string, userId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appWriteConfig.databaseId,
      appWriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    );
    if (!updatedPost) throw Error;
    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appWriteConfig.databaseId,
      appWriteConfig.savesCollectionId,
      savedRecordId
    );
    if (!statusCode) throw Error;

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

export async function getPostById(postId: string) {

  try {
    const post = await databases.getDocument(
      appWriteConfig.databaseId,
      appWriteConfig.postCollectionId,
      postId
    );

    return post;
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

export async function deletePost(postId:string, imageId:string){
  if(!postId || !imageId) throw Error;

    try {
      await databases.deleteDocument(
        appWriteConfig.databaseId,
        appWriteConfig.postCollectionId,
        postId
      )
      return {status: 'ok'}
    } catch (error) {
      console.log(error)
    }
}

export async function getInfinitePosts({pageParam}: {pageParam:
  number}) {
  const queries:any[] = [Query.orderDesc('$updatedAt'),Query.limit(10)]

  if(pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }
  try {
   const posts =await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.postCollectionId,
    queries
   )
   if(!posts) throw Error; 
   return posts;
  } catch (error) {
    console.log(error);
    
  }
}

export async function searchPosts(searchTerm:string) {
  try {
   const posts = await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.postCollectionId,
    [Query.search('caption',searchTerm)]
   )
   if(!posts) throw Error; 
   return posts;
  } catch (error) {
    console.log(error);
  }
}
export async function updateUserLocation({
  accountId,
  latitude,
  longitude,
}: {
  accountId: string;
  latitude?: number;
  longitude?: number;
}) {
  try {
    const userDocument = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal("accountId", accountId)]
    );

    if (userDocument.documents.length === 0) {
      throw new Error("User not found");
    }

    const userDocId = userDocument.documents[0].$id;

    const updatedUser = await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      userDocId,
      { latitude, longitude }
    );

    return updatedUser;
  } catch (error) {
    console.error("Error updating user location:", error);
  }
}


export async function getUserLocation(accountId: string) {
  try {
    const user = await databases.getDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      accountId
    );
    const { latitude, longitude } = user;
    return { latitude, longitude };
  } catch (error) {
    console.log("Error fetching user location:", error);
    return null;
  }
}
export async function getPostsByLocation({
  latitude,
  longitude,
  distanceFilter,
  pageParam,
}: {
  latitude: number;
  longitude: number;
  distanceFilter: number;
  pageParam?: string;
}) {
  try {
    // Fetch all posts from the database
    const queries = [
      Query.orderDesc('$createdAt'),
      Query.limit(20),
      pageParam ? Query.cursorAfter(pageParam) : null,  // 'null' needs to be removed later
    ].filter(Boolean); // Filter out 'null' values from the array

    const posts = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.postCollectionId,
      queries as string[]  // Cast the filtered result as 'string[]'
    );

    // Filter posts based on the distance
    const filteredPosts = posts.documents.filter(post => {
      const postCreator = post.creator;
      if (postCreator && postCreator.latitude && postCreator.longitude) {
        const distance = haversine(latitude, longitude, postCreator.latitude, postCreator.longitude);
        return distance <= distanceFilter;  // Only posts within the specified range
      }
      return false;
    });

    return {
      ...posts,
      documents: filteredPosts,  // Replace documents with filtered posts
    };
  } catch (error) {
    console.error('Error fetching posts by location:', error);
    throw new Error('Failed to fetch posts by location');
  }
}

export async function getUserById(accountId: string) {
  const user = await databases.getDocument(
    appWriteConfig.databaseId,
    appWriteConfig.userCollectionId,
    accountId
  );
  return user;
}

export async function getUserFollowers(accountId: string) {
  const userDoc = await databases.getDocument(
    appWriteConfig.databaseId,
    appWriteConfig.userCollectionId, // Fetch the user's document
    accountId
  );
  
  // Return the followers array or an empty array if not available
  return userDoc.followers || [];
}

export async function getUserFollowing(accountId: string) {
  const userDoc = await databases.getDocument(
    appWriteConfig.databaseId,
    appWriteConfig.userCollectionId, // Fetch the user's document
    accountId
  );
  
  // Return the following array or an empty array if not available
  return userDoc.following || [];
}

export async function getUserPosts(accountId: string) {
  const posts = await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.postCollectionId, // Posts collection
    [Query.equal("creator", accountId)] // Get all posts created by this account
  );
  return posts;
}

export async function followUser({ followerId, followedId }: { followerId: string; followedId: string }) {
  try {
    // Fetch the current follower's document
    const followerDoc = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal('$id', followerId)]
    );

    if (followerDoc.documents.length === 0) {
      throw new Error('Follower document not found');
    }

    const followerDocumentId = followerDoc.documents[0].$id;

    // Fetch the followed user's document
    const followedDoc = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal('$id', followedId)]
    );

    if (followedDoc.documents.length === 0) {
      throw new Error('Followed document not found');
    }

    const followedDocumentId = followedDoc.documents[0].$id;

    // Update the follower's "following" list
    const updatedFollowing = [...(followerDoc.documents[0].followedId || []), followedId];
    await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      followerDocumentId,
      { followedId: updatedFollowing }
    );

    // Update the followed user's "followers" list
    const updatedFollowers = [...(followedDoc.documents[0].followerId || []), followerId];
    await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      followedDocumentId,
      { followerId: updatedFollowers }
    );

    return { success: true };
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
}



export async function unfollowUser({ followerId, followedId }: { followerId: string; followedId: string }) {
  try {
    // Fetch the current follower's document
    const followerDoc = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal('$id', followerId)]
    );

    if (followerDoc.documents.length === 0) {
      throw new Error('Follower document not found');
    }

    const followerDocumentId = followerDoc.documents[0].$id;

    // Fetch the followed user's document
    const followedDoc = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal('$id', followedId)]
    );

    if (followedDoc.documents.length === 0) {
      throw new Error('Followed document not found');
    }

    const followedDocumentId = followedDoc.documents[0].$id;

    // Remove the followedId from the follower's "following" list
    const updatedFollowing = followerDoc.documents[0].followedId.filter((id: string) => id !== followedId);
    await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      followerDocumentId,
      { followedId: updatedFollowing }
    );

    // Remove the followerId from the followed user's "followers" list
    const updatedFollowers = followedDoc.documents[0].followerId.filter((id: string) => id !== followerId);
    await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      followedDocumentId,
      { followerId: updatedFollowers }
    );

    return { success: true };
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
}

