import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from 'cors';
import gameController from "./routes/game";

dotenv.config();

const app: Express = express();
const port: number = parseInt(process.env.PORT as string) || 3000;

// Enable CORS
const corsOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.PUBLIC_USEGLE_FRONTEND_HOST as string]
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use((req: Request, res: Response, next) => {
  console.log(req.method, req.path);
  next();
})

// Routes
app.use("/api/game", gameController);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
