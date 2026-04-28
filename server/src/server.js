import "dotenv/config";
import "./lib/cloudinary.js";
import app from "./config/app.js";
import { logger } from "./config/logger.js";
import connectDB from "./config/db.js";
import { env } from "./config/evnironments.js";
import { createServer } from "http";
import { initSocket } from "./config/socket.js";
import {
  purgeExpiredReservations,
  purgeExpiredLeases
} from "./models/contract/contract.service.js";

const PORT = Number(env.PORT) || 8000;

const startServer = async () => {
  try {
    await connectDB();
    logger.info("Database connected");

    const httpServer = createServer(app);

    initSocket(httpServer);

    void purgeExpiredReservations().catch((error) => {
      logger.error({ error }, "Expired reservation sweep failed on startup");
    });

    void purgeExpiredLeases().catch((error) => {
      logger.error({ error }, "Expired lease sweep failed on startup");
    });

    const reservationSweep = setInterval(
      () => {
        void purgeExpiredReservations().catch((error) => {
          logger.error({ error }, "Expired reservation sweep failed");
        });
      },
      15 * 60 * 1000
    );

    const leaseSweep = setInterval(
      () => {
        void purgeExpiredLeases().catch((error) => {
          logger.error({ error }, "Expired lease sweep failed");
        });
      },
      60 * 60 * 1000
    );

    leaseSweep.unref?.();

    reservationSweep.unref?.();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error("Database connection failed");
    process.exit(1);
  }
};

startServer();
