import { Database } from "bun:sqlite";

const dbPath = new URL("../jokes.sqlite", import.meta.url).pathname;
const db = new Database(dbPath);

db.run(`
  CREATE TABLE IF NOT EXISTS related_jokes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    joke TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic, joke)
  );
`);

const insertRelatedJoke = db.prepare(`
  INSERT OR IGNORE INTO related_jokes (topic, joke)
  VALUES (?, ?)
`);

export function saveRelatedJokes(topic: string, jokes: string[]) {
    const insertMany = db.transaction((items: string[]) => {
        for (const joke of items) {
            if (joke.trim().length === 0) {
                continue;
            }

            insertRelatedJoke.run(topic, joke);
        }
    });

    insertMany(jokes);
}

export function getAllRelatedJokes() {
    return db
        .query(`
      SELECT id, topic, joke, created_at
      FROM related_jokes
      ORDER BY id DESC
    `)
        .all() as Array<{
        id: number;
        topic: string;
        joke: string;
        created_at: string;
    }>;
}
