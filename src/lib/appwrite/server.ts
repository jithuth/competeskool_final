import { Client, Storage, Databases, Users } from 'node-appwrite';

/**
 * Gets the Appwrite server client with validation and consistent configuration.
 */
export function getAppwriteServerClient() {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
    const apiKey = process.env.APPWRITE_API_KEY || "";

    if (!projectId) {
        console.warn("⚠️ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID environment variable.");
    }

    if (!apiKey) {
        console.error("⚠️ Missing APPWRITE_API_KEY environment variable. Server-side administration will fail.");
    }

    return new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
}

/**
 * Gets the Appwrite storage instance for server-side operations.
 */
export function getAppwriteServerStorage() {
    return new Storage(getAppwriteServerClient());
}

/**
 * Gets the Appwrite administrative services (Databases, Users, Storage).
 */
export function getAppwriteAdmin() {
    const client = getAppwriteServerClient();
    return {
        databases: new Databases(client),
        users: new Users(client),
        storage: new Storage(client)
    };
}

export const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "";
export const APPWRITE_DATABASE_ID = "schoolproject_db";
