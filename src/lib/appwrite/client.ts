import { Client, Storage, Databases, Account } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const appwriteStorage = new Storage(client);
export const appwriteDatabases = new Databases(client);
export const appwriteAccount = new Account(client);

export const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "";
export const APPWRITE_DATABASE_ID = "schoolproject_db";
