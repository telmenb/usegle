import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from 'cors';
import gameInitializer from "./routes/gameInitializer";
import guessChecker from "./routes/guessChecker";

dotenv.config();

const app: Express = express();
const port: number = process.env.PORT as unknown as number || 3000;

// Enable CORS
const corsOptions: CorsOptions = {
  origin: '*',
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
app.use("/api/init", gameInitializer);
app.use("/api/guessWord", guessChecker);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
