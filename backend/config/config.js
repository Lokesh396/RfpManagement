import { config as envConfig } from "dotenv";

envConfig();

const config = {
  PORT: process.env.PORT || 4040,

  OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,

  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/AERCHAIN",

  EMAIL_ID: process.env.EMAIL_ID,
  EMAIL_PSSWD: process.env.EMAIL_PSSWD,
};

export default config;
