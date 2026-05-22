import "dotenv/config";
import { createServer } from "http";
import "./lib/cloudinary.js";
import app from "./config/app.js";
import { logger } from "./config/logger.js";
import connectDB from "./config/db.js";
import { env } from "./config/evnironments.js";
import { initSocket } from "./config/socket.js";

const PORT = Number(env.PORT) || 8000;

const startServer = async () => {
  try {
    await connectDB();
    logger.info("Database connected");

    const httpServer = createServer(app);

    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error("Database connection failed");
    process.exit(1);
  }
};

startServer();
