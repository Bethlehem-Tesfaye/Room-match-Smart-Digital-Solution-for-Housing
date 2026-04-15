import express from "express";
import cors from "cors";
import helmet from "helmet";
import { httpLogger } from "./httpLogger.js";
import { router } from "../routes/routes.js";
import { notFound } from "../middlewares/notFound.middleware.js";
import { errorHandler } from "../middlewares/error.middleware.js";
import authRouter from "../models/auth/auth.routes.js";
import emailRouter from "../routes/emailRoutes.js";
import roommateRoute from "../lib/roommate/roommateRoute.js";

const app = express();

// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Logging
app.use(httpLogger);

// Routes
app.get("/", (req, res) => {
  res.send("server is running");
});

app.use("/api/auth", authRouter);
app.use("/", emailRouter);
app.use("/api", router);
app.use("/api/roommate", roommateRoute);

// Errors
app.use(notFound);
app.use(errorHandler);

export default app;
