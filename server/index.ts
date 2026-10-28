import { resolve } from 'node:path';
import { buildApp } from './app';
import { createQloo } from './qloo';

const key = process.env.QLOO_API_KEY?.trim();
const app = await buildApp(
  key ? createQloo({ apiKey: key }) : null,
  process.env.NODE_ENV === 'production' ? resolve('dist') : undefined,
);
const port = Number(process.env.PORT ?? 3195);
await app.listen({ host: '127.0.0.1', port });
console.log(
  `Doorway API on http://127.0.0.1:${port} (Qloo ${key ? 'connected' : 'not connected'})`,
);
