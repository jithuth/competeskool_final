import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Superbase URL or Service Role Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleNews = [
    {
        title: "National AI Olympiad 2026 Finals Conclude in Bangalore",
        content: "The grand finale of the National AI Olympiad wrapped up today in Bangalore, featuring over 500 finalists from 200 schools across India. Students showcased groundbreaking projects ranging from predictive agricultural models to automated accessibility tools. The top 3 winners will represent India at the International AI Summit next month.",
        image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Ministry of Education Announces Regional Creative Arts Festivals",
        content: "In a bid to foster holistic educational environments, the Ministry has rolled out a new initiative to host regional Creative Arts Festivals. CompeteEdu will serve as the premier digital partner, helping schools manage submissions across painting, digital art, and classical performance categories. Registrations open early next week.",
        image_url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "250+ Schools Register for the CompeteEdu Pan-India Debate",
        content: "The annual Pan-India Debate Championship has shattered its previous records, with over 250 institutions confirming their participation for the upcoming season. Topics this year will heavily focus on climate change policy, artificial intelligence regulation, and global economic shifts. The preliminary rounds begin in two weeks.",
        image_url: "https://images.unsplash.com/photo-1577960309193-41bbdcf60b86?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "TechGuru Hackathon 2026: Inspiring the Next Gen of Coders",
        content: "A 48-hour coding marathon designed exclusively for high school students took place virtually this weekend. Over 1,200 participants from across the subcontinent collaborated on open-source projects. Winning prototypes included a carbon-footprint tracker for schools and a decentralized peer-tutoring network.",
        image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Top 50 Student Innovators Selected for Space Camp",
        content: "Following a rigorous selection process, the top 50 student innovators have been chosen to attend the prestigious ISRO-partnered Space Camp. These bright minds developed comprehensive blueprints for miniature satellites (CubeSats) and sustainable rover designs. They will undergo a 10-day immersive training program starting in October.",
        image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Registration Opens for the Classical Music & Dance Festival",
        content: "The cultural committee is thrilled to announce that registration is now open for the Annual Indian Classical Music & Dance Festival. Students can submit their pre-recorded routines in Khatak, Bharatanatyam, Hindustani, and Carnatic vocal categories directly through the CompeteEdu portal.",
        image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Environmental Policy Essay Contest Winners Announced",
        content: "After reviewing over 5,000 essays on the topic 'Sustainable Urbanization in India,' our panel of renowned environmentalists and educators have selected the top three laureates. Their essays will be published in the National Geographic Student Review, and each winner receives a full scholarship for the upcoming eco-summit.",
        image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "CBSE Board Partners with CompeteEdu for Heritage Quiz",
        content: "In an exciting development, the CBSE Board has officially partnered with CompeteEdu to digitize the National Heritage Quiz. This collaboration will allow schools in tier-2 and tier-3 cities to participate seamlessly, democratizing access to national-level trivia competitions.",
        image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "The Rise of ESports in Indian Schools: National Finals Next Month",
        content: "Recognizing the growing importance of strategic gaming, the first official National Inter-School ESports League is approaching its climax. Teams will compete in titles that require high-level coordination and critical thinking. The grand finals will be broadcast live from the CompeteEdu platform.",
        image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Young Writers Award 2026: Submission Deadline Approaching",
        content: "A gentle reminder for all aspiring novelists and poets: the deadline for the Young Writers Award 2026 is rapidly approaching. Ensure your manuscripts and anthologies are submitted via the portal by midnight this Friday. Late entries will not be accepted.",
        image_url: "https://images.unsplash.com/photo-1455390582262-044cdead27d8?auto=format&fit=crop&q=80&w=800",
    }
];

async function seedNews() {
    console.log("Seeding 10 news items...");

    // Try to find a super_admin or school_admin to set as created_by (optional, but good for foreign key)
    const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["super_admin", "school_admin"])
        .limit(1);

    let adminId = null;
    if (admins && admins.length > 0) {
        adminId = admins[0].id;
    }

    // To make the published_at dates look realistic (staggered over the last 30 days)
    const itemsWithMeta = sampleNews.map((item, index) => {
        const publishDate = new Date();
        publishDate.setDate(publishDate.getDate() - (index * 2)); // Spread them back in time

        return {
            ...item,
            published_at: publishDate.toISOString(),
            created_by: adminId,
        };
    });

    const { data, error } = await supabase
        .from("news")
        .insert(itemsWithMeta)
        .select();

    if (error) {
        console.error("Error inserting news items:", error);
    } else {
        console.log(`Successfully seeded ${data.length} news items.`);
    }
}

seedNews();
