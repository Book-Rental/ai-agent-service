import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";


const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Agent Service is running",
  });
});

// Temporary product API test
app.use("/api/test/products", productRoutes);

// Real Agent API
app.use("/api/agent", agentRoutes);

export default app;