import { Server } from "socket.io";
import { logger } from "./logger.js";

let io;

const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  logger.info("Socket.io initialized");

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("user:online", (userId) => {
      onlineUsers.set(userId, socket.id);
    });

    socket.on("message:send", async (data) => {
      const { receiverId, message } = data;

      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:receive", message);
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => io;
export const getOnlineUsers = () => onlineUsers;
