import postgres from "postgres";

export const sql = postgres({
  host: "localhost",
  port: 5432,
  database: "webui",
  username: "postgres",
  password: "",
  ssl: false,
}); // will use psql environment variables
