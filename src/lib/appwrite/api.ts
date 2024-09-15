import { INewUser } from "@/types";
import { ID, Query } from 'appwrite';
import { account, appWriteConfig, avatars, databases } from "./config";

export async function createUserAccount(user: INewUser) {
    try {
        // Check if there's already an active session
        const existingSession = await account.getSession('current');
        if (existingSession) {
            console.log('Session already active:', existingSession);
            return existingSession;
        }

        // If no active session, create a new user account
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );
        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrl: avatarUrl,
        });

        return newUser;

    } catch (error) {
        console.log("Error creating user account:", error);
        return error;
    }
}

export async function saveUserToDB(user: {
    accountId: string,
    email: string;
    name: string;
    imageUrl: URL;
    username?: string;
}) {
    try {
        const newUser = await databases.createDocument(
            appWriteConfig.databaseId,
            appWriteConfig.userCollectionId,
            ID.unique(),
            user
        );
        return newUser;

    } catch (error) {
        console.log('Error saving user to database:', error);
    }
}

export async function signInToAccount(user: { email: string; password: string; }) {
    try {
        // Check if there's already an active session
        const existingSession = await account.getSession('current');

        if (existingSession) {
            console.log('Session already active:', existingSession);
            return existingSession;
        }

    } catch (sessionError) {
        // No active session, proceed to create one
        console.log('No active session, creating a new one.');
    }

    try {
        const session = await account.createEmailPasswordSession(user.email, user.password);
        return session;
    } catch (error) {
        console.log('Error during sign-in:', error);
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appWriteConfig.databaseId,
            appWriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        );

        if (!currentUser) throw Error;
        return currentUser.documents[0];
    } catch (error) {
        console.log('Error fetching current user:', error);
    }
}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current")
        return session
    } catch (error) {
        console.log(error);
        
    }
    
}