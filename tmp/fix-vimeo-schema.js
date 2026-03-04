const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);
const DB_ID = "schoolproject_db";

async function fixSchema() {
    console.log("Adding missing vimeo_url attribute to submission_videos...");
    try {
        await databases.createUrlAttribute(DB_ID, "submission_videos", "vimeo_url", false);
        console.log("✅ Attribute 'vimeo_url' added successfully.");
    } catch (e) {
        if (e.code === 409) {
            console.log("ℹ️ Attribute 'vimeo_url' already exists.");
        } else {
            console.error("❌ Failed to add 'vimeo_url':", e.message);
        }
    }
}

fixSchema();
