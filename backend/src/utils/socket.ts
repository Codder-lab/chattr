import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";

interface SocketWithUserId extends Socket {
  userId: string;
}

// Store online users in memory: userId -> socketId
export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:5173", // Vite dev
    "http://localhost:8081", // Expo
    process.env.VITE_CLIENT_URL as string, // Production
  ];

  const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

  // verify the socket connection - if the user is authenticated, we will store the user id in the socket

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // this is what user will send from frontend or client

    if (!token) return next(new Error("Authentication error"));

    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY as string,
      });

      const clerkId = session.sub;

      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found"));

      (socket as SocketWithUserId).userId = user._id.toString();

      next();
    } catch (error: any) {
      next(new Error(error));
    }
  });

  // this "connection" event is special and should be written like this
  // It's the event that is triggered when a new client or user connects to the server
  io.on("connection", (socket) => {
    const userId = (socket as SocketWithUserId).userId;

    // send the list of all the currently online users to the newly connected client
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // store this users to the online users map
    onlineUsers.set(userId, socket.id);

    // notify other that this current user is online
    socket.broadcast.emit("user-online", { userId });

    // join the user's dedicated room for one-to-one chats
    socket.join(`user:${userId}`);

    socket.on("join-chat", async (chatId: string) => {
      const allowed = await Chat.exists({ _id: chatId, participants: userId });
      if (!allowed) {
        socket.emit("socket-error", { message: "Unauthorized chat access" });
        return;
      }
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", async (chatId: string) => {
      const allowed = await Chat.exists({ _id: chatId, participants: userId });
      if (!allowed) return;
      socket.leave(`chat:${chatId}`);
    });

    // handle sending messages
    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;

          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });

          if (!chat) {
            socket.emit("socket-error", { message: "Chat not found" });
            return;
          }

          const message = await Message.create({
            chat: chatId,
            sender: userId,
            text,
          });

          // update last message in chat
          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();

          await chat.save();

          await message.populate("sender", "name email avatar");

          // emit messages to all the members in the chat room
          io.to(`chat:${chatId}`).emit("new-message", message);

          // also emit to participants' personal rooms for realtime updates
          for (const participantId of chat.participants) {
            io.to(`user:${participantId}`).emit("new-message", message);
          }
        } catch (error) {
          socket.emit("socket-error", { message: "Failed to send message" });
        }
      },
    );

    // TODO: implement typing
    socket.on("typing", async (data) => {});

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      // notify others that this user is offline
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
