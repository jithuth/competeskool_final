/**
 * Script to export all users' Name, Email, and Role to a CSV file.
 * 
 * Run: node scripts/export-users-csv.js
 */

const fs = require('fs');
const path = require('path');
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

async function exportUsers() {
    console.log("🚀 Starting user export...");

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!projectId || !apiKey) {
        console.error("❌ Error: Missing environment variables. Check .env.local");
        return;
    }

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);
    const DB_ID = "schoolproject_db";
    const COLLECTION_ID = "profiles";

    try {
        console.log("Fetching profiles...");
        // Fetch up to 1000 users (Appwrite default limit is 25)
        const response = await databases.listDocuments(DB_ID, COLLECTION_ID, [
            // No queries = fetch all
        ]);

        const profiles = response.documents;
        console.log(`Found ${profiles.length} users.`);

        // Header
        let csvContent = "Name,Email,Role,Status,School ID\n";

        // Row Generation
        profiles.forEach(p => {
            const name = p.full_name || "N/A";
            const email = p.email || "N/A";
            const role = p.role || "N/A";
            const status = p.status || "N/A";
            const schoolId = p.school_id || "N/A";

            // Basic CSV escaping (wrapping in quotes)
            csvContent += `"${name}","${email}","${role}","${status}","${schoolId}"\n`;
        });

        const outputPath = path.join(process.cwd(), 'users_export.csv');
        fs.writeFileSync(outputPath, csvContent);

        console.log(`✅ Success! User list exported to: ${outputPath}`);
        console.log("You can now open this file in Excel.");

    } catch (error) {
        console.error("❌ Export failed:", error.message);
    }
}

exportUsers();
