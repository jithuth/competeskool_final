import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // We use recovery link as standard for "activation" if user already exists
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${new URL(req.url).origin}/auth/callback?next=/dashboard/settings`
            }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // In a real APP, you might want to send a custom email here using the link
        // But generateLink by default doesn't send the email automatically, it just returns the link.
        // To send the email automatically, we can use resetPasswordForEmail

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${new URL(req.url).origin}/auth/callback?next=/dashboard/settings`,
        });

        if (resetError) {
            return NextResponse.json({ error: resetError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Password reset/activation email sent successfully!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
