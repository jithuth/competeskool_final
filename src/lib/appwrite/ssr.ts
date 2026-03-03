import { Client, Account, Databases } from 'node-appwrite';
import { cookies } from 'next/headers';

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
export const APPWRITE_DATABASE_ID = "schoolproject_db";

export const SESSION_COOKIE = 'appwrite-session';

/**
 * Creates an Appwrite Server Client that identifies via the user's Session Cookie.
 * This should be used for all authenticated SSR data fetching/mutations.
 */
export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

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
        }
    };
}

/**
 * Creates an Admin level Appwrite Server Client that executes operations with full permissions.
 * Useful for bypassing RLS / Collection-level permissions securely inside server actions.
 */
export async function createAdminClient() {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}
