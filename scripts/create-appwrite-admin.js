require('dotenv').config({ path: '.env.local' });
const { Client, Users, Databases, ID } = require('node-appwrite');

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

const DB_ID = "schoolproject_db"; // As created in setup script

async function createAdmin() {
    try {
        console.log("Creating admin user in Auth...");
        const user = await users.create(
            ID.unique(),
            'admin@admin.com',
            null, // phone
            '123456789', // password
            'System Admin' // name
        );
        console.log(`✅ Auth user created with ID: ${user.$id}`);

        console.log("Creating Super Admin Profile in Database...");
        await databases.createDocument(
            DB_ID,
            "profiles",
            user.$id, // Document ID = Auth User ID
            {
                email: 'admin@admin.com',
                full_name: 'System Admin',
                role: 'super_admin',
                status: 'approved',
                created_at: new Date().toISOString()
            }
        );
        console.log("✅ Admin profile successfully created!");

    } catch (e) {
        if (e.code === 409) {
            console.log("User already exists. Fetching...");
            const userList = await users.list();
            const existingAdmin = userList.users.find(u => u.email === 'admin@admin.com');

            if (existingAdmin) {
                console.log(`Ensuring Profile exists for ${existingAdmin.$id}...`);
                try {
                    await databases.createDocument(
                        DB_ID,
                        "profiles",
                        existingAdmin.$id,
                        {
                            email: 'admin@admin.com',
                            full_name: 'System Admin',
                            role: 'super_admin',
                            status: 'approved',
                            created_at: new Date().toISOString()
                        }
                    );
                    console.log("✅ Profile created for existing user!");
                } catch (docErr) {
                    if (docErr.code === 409) {
                        console.log("✅ Admin profile already exists in Database too.");
                    } else {
                        console.error("DB Error:", docErr.message);
                    }
                }
            }
        } else {
            console.error("Error creating admin:", e.message);
        }
    }
}

createAdmin();
