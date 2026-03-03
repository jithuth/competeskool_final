/**
 * Migration: Add `school_id` to the `events` collection (for private/school-specific events).
 * Run: node scripts/add-event-school-id.js
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
    console.log('Adding school_id to events collection...');
    try {
        await databases.createStringAttribute(DB_ID, 'events', 'school_id', 36, false);
        console.log('✅ events.school_id created. Wait ~10s before using it.');
    } catch (e) {
        if (e.code === 409) console.log('✅ events.school_id already exists.');
        else { console.error('❌', e.message); process.exit(1); }
    }
}

run();
