import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import blockRoutes from "./routes/blockRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "ParkSys Backend", timestamp: new Date().toISOString() }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ParkSys server running on port ${PORT}`));
