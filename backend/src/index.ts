import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from 'cors';
import gameController from "./routes/game";
import adminController from "./routes/admin";
import healthController from "./routes/health";
import { requireAdminKey } from "./middleware/auth";

dotenv.config();

const app: Express = express();
const port: number = parseInt(process.env.PORT as string) || 3000;

// Enable CORS
const corsOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.PUBLIC_USEGLE_FRONTEND_HOSTS || '').split(',')
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '32kb' }));
app.use((req: Request, res: Response, next) => {
  console.log(req.method, req.path);
  next();
})

// Health check route for Railway
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    message: "Usegle Backend API is running",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/health", healthController);
app.use("/api/game", gameController);
app.use("/api/admin", requireAdminKey, adminController);

// Parser and unexpected request errors must not log private request bodies.
app.use((_err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (req.path.startsWith('/api/admin')) res.setHeader('Cache-Control', 'no-store');
  res.status(400).json({ errorMessage: 'Invalid request.' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
