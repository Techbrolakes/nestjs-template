import type { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";

export async function truncateTables(
  app: INestApplication,
  tables: string[],
): Promise<void> {
  if (tables.length === 0) return;
  const ds = app.get(DataSource);
  const list = tables.map((t) => `"${t}"`).join(", ");
  await ds.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function resetDb(app: INestApplication): Promise<void> {
  await truncateTables(app, ["sessions", "users"]);
}
