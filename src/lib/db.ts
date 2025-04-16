import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let client: MongoClient;
let db: any; // Use 'any' or define a proper type for your DB

export async function connectToDatabase() {
    if (client && db) {
        return { client, db };
    }
    client = new MongoClient(MONGODB_URI!);
    await client.connect();
    db = client.db(); // Use your database name if needed, otherwise uses the default from URI
    console.log('Connected to MongoDB for saving upload.');
    return { client, db };
}
