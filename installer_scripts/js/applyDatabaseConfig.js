const fs = require("fs");
const { resolve } = require("path");
const { displayMessage } = require("./displayMessage.js");
const { $sh } = require("./shell.js");

async function applyDatabaseConfig() {
  const db_conf = {
    // location: "data/postgres",
    location: resolve(__dirname, "..", "..", "data", "postgres"),
    port: 5432,
    database: "webui",
    username: "postgres",
    password: "",
    ssl: false,
  };

  const initializeDatabase = async () => {
    if (fs.existsSync(db_conf.location)) {
      displayMessage("Database already initialized, skipping...");
      return;
    }
    displayMessage("Initializing database...");
    await $sh(`initdb -D ${db_conf.location} -U ${db_conf.username}`);
    displayMessage("Successfully initialized database");
  };

  await initializeDatabase();

  const withDatabase = async (func) => {
    const startDatabase = async () => {
      displayMessage("Starting database...");
      await $sh(`pg_ctl start -D ${db_conf.location}`);
      displayMessage("Successfully started database");
    };

    const stopDatabase = async () => {
      displayMessage("Stopping database...");
      await $sh(`pg_ctl stop -D ${db_conf.location} -m fast`);
      displayMessage("Successfully stopped database");
    };

    const awaitDatabase = async (counter = 0) => {
      try {
        await $sh(`pg_isready -U ${db_conf.username}`);
      } catch (error) {
        displayMessage(`Database is not ready, retrying... ${counter}/10`);
        if (counter < 10) {
          await awaitDatabase(counter + 1);
        } else {
          displayMessage("Database is not ready, aborting...");
          throw error;
        }
      }
    };
    await startDatabase();
    await awaitDatabase();
    try {
      await func();
    } catch (error) {
      throw error;
    } finally {
      await stopDatabase();
    }
  };

  const db_version = "1";
  const db_version_file = resolve(__dirname, "..", ".db_version");

  const withDatabaseVersioning = async (func) => {
    if (fs.existsSync(db_version_file)) {
      const version = fs.readFileSync(db_version_file, "utf8");
      if (version === db_version) {
        displayMessage(
          `Database is already up to date with version=${version}, skipping...`
        );
        return;
      } else {
        displayMessage(
          `Database is not up to date, current version=${version}, version=${db_version}, upgrading...`
        );
        await func();
        fs.writeFileSync(db_version_file, db_version);
      }
    }
  };

  await withDatabaseVersioning(() =>
    withDatabase(async () => {
      const createDB = async () => {
        displayMessage(`Creating database ${db_conf.database}`);
        // create a database, error if it already exists
        try {
          await $sh(`createdb -U ${db_conf.username} ${db_conf.database}`);
        } catch (error) {
          displayMessage("Database already exists, skipping...");
          return;
        }
        displayMessage("Successfully created database");
      };
      const applyMigrations = async () => {
        const sql = async (strings) => {
          // Since we're assuming no interpolated values, we can directly use the string
          const query = strings[0];
          const psqlCommand = `psql -U ${db_conf.username} -d ${
            db_conf.database
          } -c "${query.replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
          $sh(psqlCommand);
        };

        await sql`CREATE TABLE IF NOT EXISTS generations (
      id SERIAL PRIMARY KEY,
      metadata JSONB
    );`;
      };
      await createDB();
      await applyMigrations();
    })
  );
}

exports.applyDatabaseConfig = applyDatabaseConfig;
