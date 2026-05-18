import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "../packages/database/prisma/schema.prisma", // Shared schema location
  migrations: {
    path: "../packages/database/prisma/migrations", // Shared migrations location
  },
  datasource: {
    url: env("DATABASE_URL"), // Reference to the DATABASE_URL environment variable
    // url: "postgresql://postgres:mEytvhMcyBqCFUFSTKLbpwsCsznXziFr@yamabiko.proxy.rlwy.net:31210/railway",
  },
});
