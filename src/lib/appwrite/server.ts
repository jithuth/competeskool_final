import { Client, Storage, Databases, Users } from 'node-appwrite';

export function getAppwriteServerStorage() {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
    const apiKey = process.env.APPWRITE_API_KEY || "";

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    return new Storage(client);
}

export function getAppwriteServerClient() {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
    const apiKey = process.env.APPWRITE_API_KEY || "";

    return new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
}

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
