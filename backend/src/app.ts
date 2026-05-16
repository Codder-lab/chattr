import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.route";
import chatRoutes from "./routes/chat.route";
import messageRoutes from "./routes/message.route";
import userRoutes from "./routes/user.route";

const app = express();

app.use(express.json()); // parse the incoming json request bodies and makes them available as request body in your route handlers.

// Every request to the backend will first go through the clerkMiddleware
// It will check for a valid JWT token in the request headers and validate it.
// If the token is valid, it will attach the user object to the request object.
// If the token is invalid, it will send an error response.
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/user", userRoutes);

// error handler must come after all the routes and middlewares so they catch errors passed with next(err) or thrown inside async handlers
app.use(errorHandler);

export default app;
