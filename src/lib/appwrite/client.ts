import { Client, Storage, Databases, Account } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!projectId && typeof window !== 'undefined') {
    console.warn("⚠️ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID environment variable. All Appwrite requests will fail with a 'Missing Project Header' error.");
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId || ""); // Default to empty string to avoid crash, but warning will be logged

export const appwriteStorage = new Storage(client);
export const appwriteDatabases = new Databases(client);
export const appwriteAccount = new Account(client);

export const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "";
export const APPWRITE_DATABASE_ID = "schoolproject_db";
