import { config } from 'dotenv';
import { parseEnv, port, z } from 'znv';

config();

const env = parseEnv(process.env, {
  PORT: port().default(3000),
  CACHE_TTL_SECONDS: port().default(300), // 5 minutos
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export { env };
