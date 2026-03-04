const { Client, Databases } = require('node-appwrite');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
    console.error("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env.local");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);
const DB_NAME = "schoolproject";
const DB_ID = "schoolproject_db";

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function createDatabase() {
    try {
        await databases.get(DB_ID);
        console.log(`✅ Database ${DB_NAME} already exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`Creating database ${DB_NAME}...`);
            await databases.create(DB_ID, DB_NAME);
            console.log(`✅ Database ${DB_NAME} created.`);
        } else {
            throw e;
        }
    }
}

async function createCollection(collectionId, name) {
    try {
        await databases.getCollection(DB_ID, collectionId);
        console.log(`✅ Collection ${name} already exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`Creating collection ${name}...`);
            await databases.createCollection(DB_ID, collectionId, name);
            console.log(`✅ Collection ${name} created.`);
        } else {
            throw e;
        }
    }
}

async function safeCreateAttribute(createFn) {
    try {
        await createFn();
    } catch (e) {
        if (e.code === 409) {
            // Already exists
        } else {
            console.error(e.message);
        }
    }
}

async function setupSchema() {
    await createDatabase();

    const collections = [
        { id: "schools", name: "Schools" },
        { id: "profiles", name: "Profiles" },
        { id: "teachers", name: "Teachers" },
        { id: "students", name: "Students" },
        { id: "judges", name: "Judges" },
        { id: "events", name: "Events" },
        { id: "submissions", name: "Submissions" },
        { id: "submission_videos", name: "Submission Videos" },
        { id: "news", name: "News" },
        { id: "gallery", name: "Gallery" },
        { id: "winners", name: "Winners" },
        { id: "rankings", name: "Rankings" },
        { id: "site_settings", name: "Site Settings" },
        { id: "seo_configs", name: "SEO Configs" },
        { id: "badges", name: "Badges" },
        { id: "submission_results", name: "Submission Results" },
        { id: "event_judges", name: "Event Judges" },
        { id: "evaluation_criteria", name: "Evaluation Criteria" },
        { id: "submission_scores", name: "Submission Scores" },
        { id: "notifications", name: "Notifications" },
        { id: "submission_votes", name: "Submission Votes" }
    ];

    for (const coll of collections) {
        await createCollection(coll.id, coll.name);
    }

    console.log("Creating attributes... (This takes a moment as Appwrite creates them asynchronously)");

    // 1. Schools
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "schools", "name", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "schools", "address", 1000, false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "schools", "logo_url", false));
    await safeCreateAttribute(() => databases.createEnumAttribute(DB_ID, "schools", "status", ["pending", "approved", "rejected"], false, "pending"));
    await safeCreateAttribute(() => databases.createEmailAttribute(DB_ID, "schools", "admin_email", false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "schools", "created_at", false));

    // 2. Profiles
    await safeCreateAttribute(() => databases.createEnumAttribute(DB_ID, "profiles", "role", ["super_admin", "school_admin", "teacher", "student", "judge"], false, "student"));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "profiles", "full_name", 255, false));
    await safeCreateAttribute(() => databases.createEmailAttribute(DB_ID, "profiles", "email", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "profiles", "school_id", 36, false));
    await safeCreateAttribute(() => databases.createEnumAttribute(DB_ID, "profiles", "status", ["pending", "approved", "rejected"], false, "pending"));
    // Note: No password hash mapping, typical apps rely on Appwrite Auth rather than keeping hashes directly in DB
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "profiles", "created_at", false));

    // 3. Teachers
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "teachers", "class_section", 100, false));

    // 4. Students
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "students", "phone", 20, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "students", "father_name", 255, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "students", "mother_name", 255, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "students", "grade_level", 50, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "students", "teacher_id", 36, false));

    // 5. Judges
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "judges", "expertise", 1000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "judges", "bio", 2000, false));

    // 6. Events
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "title", 500, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "description", 5000, false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "events", "start_date", false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "events", "end_date", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "status", 50, false, "upcoming"));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "results_status", 50, false, "not_started"));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "created_by", 36, false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "events", "banner_url", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "media_type", 50, false, "video"));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "full_rules", 10000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "events", "school_id", 36, false));

    // 7. Submissions
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submissions", "event_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submissions", "student_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submissions", "title", 1000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submissions", "description", 5000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submissions", "status", 50, false, "pending"));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "submissions", "score", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submissions", "feedback", 5000, false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "submissions", "created_at", false));

    // 8. Submission Videos
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_videos", "submission_id", 36, true));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "submission_videos", "video_url", false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "submission_videos", "youtube_url", false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "submission_videos", "vimeo_url", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_videos", "storage_path", 2000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_videos", "type", 50, false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "submission_videos", "created_at", false));

    // 9. News
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "news", "title", 500, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "news", "content", 10000, false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "news", "image_url", false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "news", "published_at", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "news", "created_by", 36, false));

    // 10. Gallery
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "gallery", "title", 500, false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "gallery", "image_url", true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "gallery", "category", 100, false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "gallery", "created_at", false));

    // 11. Winners
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "winners", "event_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "winners", "submission_id", 36, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "winners", "student_id", 36, true));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "winners", "rank", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "winners", "prize", 255, false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "winners", "created_at", false));

    // 12. Rankings
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "rankings", "student_id", 36, true));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "rankings", "total_score", false));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "rankings", "rank", false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "rankings", "updated_at", false));

    // 13. Site Settings
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "site_settings", "key", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "site_settings", "value", 1000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "site_settings", "type", 50, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "site_settings", "category", 100, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "site_settings", "description", 500, false));

    // 14. SEO Configs
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "seo_configs", "page_path", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "seo_configs", "title", 255, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "seo_configs", "description", 1000, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "seo_configs", "keywords", 1000, false));
    await safeCreateAttribute(() => databases.createUrlAttribute(DB_ID, "seo_configs", "og_image_url", false));

    // 15. Badges
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "credential_id", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "credential_hash", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "submission_result_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "student_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "event_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "tier", 50, false));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "badges", "rank", false));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "badges", "weighted_score", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "student_name", 255, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "school_name", 255, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "event_name", 500, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "badges", "issued_by", 255, false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "badges", "issued_at", false));
    await safeCreateAttribute(() => databases.createBooleanAttribute(DB_ID, "badges", "is_public", false, false));

    // 16. Submission Results
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_results", "submission_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_results", "event_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_results", "student_id", 36, true));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "submission_results", "raw_score", false));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "submission_results", "weighted_score", false));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "submission_results", "public_vote_score", false));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "submission_results", "public_vote_count", false));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "submission_results", "judge_count", false));
    await safeCreateAttribute(() => databases.createDatetimeAttribute(DB_ID, "submission_results", "computed_at", false));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "submission_results", "rank", false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_results", "tier", 50, false));

    // 17. Event Judges
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "event_judges", "event_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "event_judges", "judge_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "event_judges", "assigned_by", 36, false));

    // 18. Evaluation Criteria
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "evaluation_criteria", "event_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "evaluation_criteria", "title", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "evaluation_criteria", "description", 1000, false));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "evaluation_criteria", "max_score", true));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "evaluation_criteria", "weight", true));
    await safeCreateAttribute(() => databases.createIntegerAttribute(DB_ID, "evaluation_criteria", "display_order", false));

    // 19. Submission Scores
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_scores", "submission_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_scores", "judge_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_scores", "criterion_id", 36, true));
    await safeCreateAttribute(() => databases.createFloatAttribute(DB_ID, "submission_scores", "score", true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_scores", "feedback", 2000, false));

    // 20. Notifications
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "notifications", "title", 255, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "notifications", "message", 2000, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "notifications", "type", 50, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "notifications", "recipient_role", 50, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "notifications", "event_id", 36, false));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "notifications", "sender_id", 36, false));

    // 21. Submission Votes
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_votes", "submission_id", 36, true));
    await safeCreateAttribute(() => databases.createStringAttribute(DB_ID, "submission_votes", "voter_ip", 255, true));

    console.log("Attributes creation requested. Depending on your Appwrite setup, they will be fully available shortly!");
    console.log("Done. Your Collections are ready in Appwrite.");
}

setupSchema().catch(console.error);
