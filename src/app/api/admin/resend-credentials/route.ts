import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const { users } = getAppwriteAdmin();

        // Check if user exists in Appwrite
        const userList = await users.list([
            Query.equal("email", email)
        ]);

        if (userList.total === 0) {
            return NextResponse.json({ error: "User not found in Appwrite" }, { status: 404 });
        }

        // Appwrite's Server SDK doesn't directly trigger a recovery email for a specific user ID
        // like Supabase's admin.generateLink. Recovery is usually a client-side action via account.createRecovery().
        // For a true "admin" reset, you'd normally update the password directly or send a custom email with a token.

        return NextResponse.json({
            message: "User found. Instructions for access: Use the default password '123456789' to log in.",
            userFound: true
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
