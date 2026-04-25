import { Server } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../models/auth/auth.js";
import * as realtimeMessageService from "../models/message/realtime.service.js";
import { logger } from "./logger.js";

let io;

const onlineUsers = new Map();

export const getOnlineUsers = () => onlineUsers;

export const getSocketByUserId = (userId) => {
  return onlineUsers.get(userId) ?? null;
};

export const emitToUser = (userId, event, payload) => {
  const socketId = getSocketByUserId(userId);

  if (!io || !socketId) {
    return false;
  }

  io.to(socketId).emit(event, payload);
  return true;
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const cookieHeader = socket.handshake.headers?.cookie;

      const headers = {
        ...(typeof token === "string" && token.trim().length > 0
          ? { authorization: `Bearer ${token}` }
          : {}),
        ...(typeof cookieHeader === "string" && cookieHeader.length > 0
          ? { cookie: cookieHeader }
          : {})
      };

      const session = await auth.api.getSession({
        headers: fromNodeHeaders(headers)
      });

      const userId = session?.user?.id;

      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = userId;
      return next();
    } catch (err) {
      logger.warn({ err }, "Socket authentication failed");
      return next(new Error("Unauthorized"));
    }
  });

  logger.info("Socket.io initialized");

  io.on("connection", (socket) => {
    const userId = socket.userId;

    onlineUsers.set(userId, socket.id);

    logger.info(`Socket connected: ${socket.id}`);

    socket.on("user:online", () => {
      onlineUsers.set(userId, socket.id);
    });

    socket.on("message:send", async (data, ack) => {
      const acknowledge = typeof ack === "function" ? ack : () => undefined;

      try {
        const senderId = socket.userId;

        if (!senderId) {
          const message = "Unauthorized sender";
          socket.emit("message:error", { message });
          acknowledge({ ok: false, error: message });
          return;
        }

        const {
          conversationId,
          receiverId,
          listingId,
          propertyId,
          content,
          messageType
        } = data ?? {};

        const result = await realtimeMessageService.sendRealtimeMessage({
          senderId,
          receiverId,
          listingId,
          propertyId,
          conversationId,
          content,
          messageType
        });

        const { message, notification } = result;

        const receiverSocketId = getSocketByUserId(result.receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message:receive", message);
          emitToUser(result.receiverId, "notification:receive", notification);
        }

        emitToUser(senderId, "message:receive", message);

        acknowledge({
          ok: true,
          conversationId: String(result.conversationId),
          message,
          receiverOnline: !!receiverSocketId
        });
      } catch (err) {
        logger.error({ err }, "message:send failed");

        const errorMessage = err?.message || "Failed to send message";

        socket.emit("message:error", {
          message: errorMessage
        });

        acknowledge({ ok: false, error: errorMessage });
      }
    });

    socket.on("disconnect", () => {
      const activeSocketId = onlineUsers.get(userId);

      if (activeSocketId === socket.id) {
        onlineUsers.delete(userId);
      }

      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => io;
