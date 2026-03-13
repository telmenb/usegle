import { Request, Response, NextFunction } from 'express';

export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    res.status(500).json({ errorMessage: 'Admin API key not configured' });
    return;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ errorMessage: 'Missing or malformed Authorization header' });
    return;
  }

  const providedKey = authHeader.slice('Bearer '.length);
  if (providedKey !== adminKey) {
    res.status(401).json({ errorMessage: 'Invalid admin API key' });
    return;
  }

  next();
}
