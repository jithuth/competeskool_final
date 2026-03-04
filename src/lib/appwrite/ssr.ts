import { Client, Account, Databases, Storage, Users } from 'node-appwrite';
import { cookies } from 'next/headers';

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
export const APPWRITE_DATABASE_ID = "schoolproject_db";

export const SESSION_COOKIE = 'appwrite-session';

/**
 * Returns the project ID, with a console warning if missing during server-side execution.
 */
function getValidatedProjectId() {
    if (!APPWRITE_PROJECT_ID) {
        // Not throwing here allows Next.js build to potentially proceed for dynamic pages, 
        // though actual requests will still fail later if the header is missing.
        console.warn("⚠️ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID environment variable.");
    }
    return APPWRITE_PROJECT_ID;
}

/**
 * Creates an Appwrite Server Client that identifies via the user's Session Cookie.
 * This should be used for all authenticated SSR data fetching/mutations.
 */
export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(getValidatedProjectId());

    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);

    if (session && session.value) {
        client.setSession(session.value);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get storage() {
            return new Storage(client);
        }
    };
}

/**
 * Creates an Admin level Appwrite Server Client that executes operations with full permissions.
 * Useful for bypassing RLS / Collection-level permissions securely inside server actions.
 */
export async function createAdminClient() {
    const apiKey = process.env.APPWRITE_API_KEY || "";
    if (!apiKey) {
        // We log a warning instead of a hard throw to prevent build-time crashes on static generation attempts.
        console.error("⚠️ Missing APPWRITE_API_KEY environment variable. Server-side administration will fail.");
    }

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(getValidatedProjectId())
        .setKey(apiKey);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get storage() {
            return new Storage(client);
        },
        get users() {
            return new Users(client);
        }
    };
}
