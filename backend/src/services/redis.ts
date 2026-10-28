import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

// Tests supply an isolated connection explicitly; never load application secrets.
if (process.env.NODE_ENV !== 'test') dotenv.config();

let client: RedisClientType;

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({
      username: process.env.REDIS_USER || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }) as RedisClientType;
    client.on('connect', () => console.log('Redis Client Connected'));
    client.on('error', (err) => console.log('Redis Client Error', err));
    client.connect();
  }
  return client;
}
