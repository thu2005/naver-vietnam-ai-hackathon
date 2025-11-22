// Load dotenv only in development
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import userRoutes from "./routes/user.route.js";
import weatherRoutes from "./routes/weather.route.js";
import productRoutes from "./routes/product.route.js";
import routineRoutes from "./routes/routine.route.js";
import ingredientRoutes from "./routes/ingredient.route.js";
import chatbotRoutes from "./routes/chatbot.route.js";
import imageRoutes from "./routes/image.route.js";

const app = express();

// Increase timeout for long-running requests (3 minutes - within Cloud Functions limits)
app.use((req, res, next) => {
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000);
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["*"];

app.use(
  cors({
    origin: allowedOrigins.length === 1 && allowedOrigins[0] === "*"
      ? "*"
      : allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Use appropriate logging format based on environment
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Security middleware - enabled for production
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production" // Skip in development
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/ingredient", ingredientRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api", imageRoutes);

app.get("/", (req, res) => res.send("Backend alive"));

// Health check endpoint for Cloud Functions
app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/skincare-app";

// MongoDB connection with optimizations for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      maxPoolSize: 10, // Connection pool for serverless
      minPoolSize: 1,
    });
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

// Connect to MongoDB on startup
connectDB();

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing MongoDB connection");
  await mongoose.connection.close();
  process.exit(0);
});

// Start server only in development or when not in Cloud Functions
const PORT = process.env.PORT || 5731;

if (process.env.NODE_ENV !== "production" || process.env.START_SERVER === "true") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Cloud Functions
export default app;
export { connectDB };
