import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the database ID from the Notion URL
function extractDatabaseIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract database ID");
}

export const NOTION_DATABASE_ID = extractDatabaseIdFromUrl(process.env.NOTION_PAGE_URL!);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    // Array to store the child databases
    const childDatabases = [];

    try {
        // Query all child blocks in the specified page
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: extractPageIdFromUrl(process.env.NOTION_PAGE_URL!),
                start_cursor: startCursor,
            });

            // Process the results
            for (const block of response.results) {
                // Check if the block is a child database
                if ('type' in block && block.type === "child_database") {
                    const databaseId = block.id;

                    // Retrieve the database title
                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        // Add the database to our list
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            // Check if there are more results to fetch
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if ('title' in db && db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Use the existing database from the URL
export async function getOrCreateHighScoresDatabase() {
    try {
        // Try to retrieve the database using the provided URL
        const database = await notion.databases.retrieve({
            database_id: NOTION_DATABASE_ID,
        });
        return database;
    } catch (error: any) {
        console.error("Error accessing database:", error);
        throw new Error("Failed to access the Notion database. Please ensure the integration has access to the database.");
    }
}

// Get all high scores from the Notion database
export async function getHighScores(databaseId: string) {
    try {
        const response = await notion.databases.query({
            database_id: databaseId
        });

        return response.results
            .map((page: any) => {
                const properties = page.properties;

                // Handle null scores from old entries that were created before Score column existed

                return {
                    notionId: page.id,
                    name: properties.Name?.title?.[0]?.plain_text || "???",
                    score: properties.Score?.number ?? properties.score?.number ?? 0,
                    level: 1, // Don't track level anymore
                    date: properties.Date?.date?.start ? new Date(properties.Date.date.start).toLocaleDateString() : 
                          properties.date?.date?.start ? new Date(properties.date.date.start).toLocaleDateString() :
                          new Date().toLocaleDateString(),
                };
            })
            .sort((a, b) => b.score - a.score); // Sort in memory by score descending
    } catch (error) {
        console.error("Error fetching high scores from Notion:", error);
        throw new Error("Failed to fetch high scores from Notion");
    }
}

// Add a new high score to the Notion database
export async function addHighScore(databaseId: string, name: string, score: number, level: number) {
    try {
        // Create properties object dynamically based on what exists in the database
        const properties: any = {
            Name: {
                title: [
                    {
                        text: {
                            content: name  // Just store the name, not score info
                        }
                    }
                ]
            }
        };

        // Add other properties only if they exist in the database
        const db = await notion.databases.retrieve({ database_id: databaseId });
        const dbProps = (db as any).properties || {};
        
        // Always try to add Score property
        properties.Score = { number: score };
        if (dbProps.Date || dbProps.date) {
            properties.Date = {
                date: {
                    start: new Date().toISOString().split('T')[0]
                }
            };
        }

        await notion.pages.create({
            parent: {
                database_id: databaseId
            },
            properties
        });
    } catch (error) {
        console.error("Error adding high score to Notion:", error);
        throw new Error("Failed to add high score to Notion");
    }
}