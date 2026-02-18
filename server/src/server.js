import "dotenv/config";
import "./lib/cloudinary.js";
import app from "./config/app.js";
import { logger } from "./config/logger.js";
import connectDB from "./config/db.js";
import { env } from "./config/evnironments.js";

const PORT = Number(env.PORT) || 8000;

const startServer = async () => {
  try {
    await connectDB();
    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error("Database connection failed");
    process.exit(1);
  }
};

startServer();
