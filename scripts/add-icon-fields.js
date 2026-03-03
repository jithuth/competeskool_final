/**
 * Migration: Add `is_icon` and `icon_approved` to `submission_results`
 * Run: node scripts/add-icon-fields.js
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'schoolproject_db';

async function safeCreate(fn, label) {
    try {
        await fn();
        console.log(`✅ ${label} created`);
    } catch (e) {
        if (e.code === 409) console.log(`✅ ${label} already exists`);
        else { console.error(`❌ ${label}:`, e.message); }
    }
}

async function run() {
    console.log('Adding icon fields to submission_results...');

    await safeCreate(
        () => databases.createBooleanAttribute(DB_ID, 'submission_results', 'is_icon', false, false),
        'submission_results.is_icon'
    );
    await safeCreate(
        () => databases.createBooleanAttribute(DB_ID, 'submission_results', 'icon_approved', false, false),
        'submission_results.icon_approved'
    );

    console.log('Done. Wait ~10s for Appwrite to activate the attributes.');
}

run().catch(console.error);
