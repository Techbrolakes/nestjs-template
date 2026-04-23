import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "../users/user.entity";
import { Session } from "../auth/session.entity";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, Session],
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
};

export default new DataSource(dataSourceOptions);
