export default () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  database: { url: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(",") ?? [],
  },
});
