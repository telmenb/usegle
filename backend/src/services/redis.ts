import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_PORT: number = process.env.REDIS_PORT as unknown as number || 6379;
const REDIS_HOST: string = process.env.REDIS_HOST as string || 'localhost';
const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD as string || '';

let client: RedisClientType;

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({
      password: REDIS_PASSWORD,
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    }) as RedisClientType;
    client.on('connect', () => console.log('Redis Client Connected'));
    client.on('error', (err) => console.log('Redis Client Error', err));
    client.connect();
  }
  return client;
}
