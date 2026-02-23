import { Suspense } from 'react';
import { Loader2 } from "lucide-react";
import { getSiteSettings } from "@/lib/cms";
import { AuthContent } from "@/components/auth/AuthContent";

export default async function AuthPage() {
    const siteSettings = await getSiteSettings();

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <AuthContent siteSettings={siteSettings} />
        </Suspense>
    );
}
