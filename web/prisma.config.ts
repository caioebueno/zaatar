import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma", // Location of the schema file
  migrations: {
    path: "prisma/migrations", // Location for migration files
  },
  datasource: {
    // url: env("DATABASE_URL"), // Reference to the DATABASE_URL environment variable
    url: "postgresql://postgres:mEytvhMcyBqCFUFSTKLbpwsCsznXziFr@yamabiko.proxy.rlwy.net:31210/railway",
  },
});
