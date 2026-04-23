process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "0";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/nestjs_template_test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "test-jwt-secret-at-least-32-chars-long-xxxxx";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  "test-jwt-refresh-secret-at-least-32-chars-xxx";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "error";
