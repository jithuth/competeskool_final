/**
 * Migration: Add `results_status` attribute to the `events` collection.
 * Run: node scripts/add-results-status.js
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'schoolproject_db';

async function run() {
    console.log('Adding results_status attribute to events collection...');
    try {
        await databases.createStringAttribute(
            DB_ID,
            'events',
            'results_status',
            50,        // max length
            false,     // not required
            'not_started'  // default value
        );
        console.log('✅ results_status attribute created.');
        console.log('⏳ Appwrite creates attributes asynchronously — wait ~10 seconds before using it.');
    } catch (e) {
        if (e.code === 409) {
            console.log('✅ results_status attribute already exists.');
        } else {
            console.error('❌ Error:', e.message);
            process.exit(1);
        }
    }
}

run();
