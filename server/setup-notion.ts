import { getOrCreateHighScoresDatabase } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

if (!process.env.NOTION_PAGE_URL) {
    throw new Error("NOTION_PAGE_URL is not defined. Please add it to your environment variables.");
}

// Test the high scores database connection
async function testNotionConnection() {
    console.log("Testing Notion database connection...");
    
    try {
        const database = await getOrCreateHighScoresDatabase();
        console.log("Successfully connected to Notion database:", database.id);
        console.log("Database properties:", Object.keys((database as any).properties || {}));
    } catch (error) {
        console.error("Failed to connect to database:", error);
        throw error;
    }
}

// Run the test
testNotionConnection().then(() => {
    console.log("Notion connection test complete!");
    process.exit(0);
}).catch(error => {
    console.error("Connection test failed:", error);
    process.exit(1);
});