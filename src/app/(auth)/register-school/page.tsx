import { getSiteSettings } from "@/lib/cms";
import { RegisterSchoolContent } from "@/components/auth/RegisterSchoolContent";

export default async function RegisterSchoolPage() {
    const settings = await getSiteSettings();
    return <RegisterSchoolContent siteSettings={settings} />;
}
