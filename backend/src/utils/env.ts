import { logger } from "./logger";

interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS?: string | undefined;
}

export const validateEnv = (): EnvConfig => {
  const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "GEMINI_API_KEY"];

  const optionalEnvVars = ["PORT", "NODE_ENV", "ALLOWED_ORIGINS"];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Fail fast if required variables are missing
  if (missing.length > 0) {
    logger.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("\n=================================");
    console.error("❌ CONFIGURATION ERROR");
    console.error("=================================");
    console.error("Missing required environment variables:");
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error("\nPlease set these variables in your .env file");
    console.error("=================================\n");
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.error(
      "❌ JWT_SECRET must be at least 32 characters long for security"
    );
    console.error("\n=================================");
    console.error("❌ SECURITY ERROR");
    console.error("=================================");
    console.error("JWT_SECRET is too weak (less than 32 characters)");
    console.error("Generate a strong secret:");
    console.error(
      "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
    console.error("=================================\n");
    process.exit(1);
  }

  // Warn about optional variables
  if (warnings.length > 0) {
    logger.warn(
      `⚠️  Optional environment variables not set (using defaults): ${warnings.join(
        ", "
      )}`
    );
  }

  // Validate NODE_ENV
  const validEnvs = ["development", "production", "test"];
  const nodeEnv = process.env.NODE_ENV || "development";

  if (!validEnvs.includes(nodeEnv)) {
    logger.warn(`⚠️  Invalid NODE_ENV: ${nodeEnv}. Using 'development'`);
    process.env.NODE_ENV = "development";
  }

  // Log successful validation
  logger.info("✅ Environment variables validated successfully");
  logger.info(`   Environment: ${process.env.NODE_ENV}`);
  logger.info(`   Port: ${process.env.PORT || "3001"}`);

  return {
    PORT: process.env.PORT || "3001",
    NODE_ENV: nodeEnv,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };
};

// Export validated config
export const env = validateEnv();
