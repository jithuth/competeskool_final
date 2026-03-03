import { NextResponse, type NextRequest } from 'next/server';
import { Client, Account } from 'node-appwrite';

export const SESSION_COOKIE = 'appwrite-session';

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    let isAuthenticated = false;

    if (sessionCookie && sessionCookie.value) {
        try {
            const client = new Client()
                .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
                .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
                .setSession(sessionCookie.value);

            const account = new Account(client);
            // Verify session is actually valid by grabbing the user
            await account.get();
            isAuthenticated = true;
        } catch (error) {
            // Session expired or invalid
            isAuthenticated = false;
        }
    }

    const { pathname } = request.nextUrl;
    const isAuthRoute = pathname.startsWith('/login');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (!isAuthenticated && isDashboardRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (isAuthenticated && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return response;
}
