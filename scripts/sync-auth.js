/**
 * Migration: Sync Appwrite Auth with Profiles Database.
 * This script reads all profiles from the database and ensures they have a matching
 * authentication account with the default password '123456789'.
 * 
 * Run: node scripts/sync-auth.js
 */

const { Client, Users, Databases } = require('node-appwrite');
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

const users = new Users(client);
const databases = new Databases(client);

const DB_ID = "schoolproject_db";
const COLLECTION_ID = "profiles";
const DEFAULT_PASSWORD = "123456789";

async function syncAuth() {
    try {
        console.log("Fetching profiles from database...");
        // Increase limit to fetch up to 100 profiles (default is 25)
        const profiles = await databases.listDocuments(DB_ID, COLLECTION_ID, []);

        console.log(`Found ${profiles.documents.length} profiles. Synchronizing with Auth...`);

        for (const profile of profiles.documents) {
            const { email, full_name, $id: userId } = profile;

            try {
                // Check if user already exists by email
                // Note: userList.users is an array, we'll check by email
                const existing = await users.list([
                    // Query for email if possible, or just check the result
                ]);

                const userExists = existing.users.find(u => u.email === email);

                if (userExists) {
                    console.log(`[PASS] User ${email} already exists in Auth.`);
                } else {
                    console.log(`[CREATING] User ${email} (ID: ${userId}) in Auth...`);
                    await users.create(
                        userId, // Use the SAME ID as the database document
                        email,
                        null,   // no phone
                        DEFAULT_PASSWORD,
                        full_name
                    );
                    console.log(`✅ User ${email} created successfully.`);
                }
            } catch (userErr) {
                console.error(`❌ Failed to process ${email}:`, userErr.message);
            }
        }

        console.log("\n--- Sync Complete ---");
    } catch (e) {
        console.error("Critical Sync Error:", e.message);
    }
}

syncAuth();
