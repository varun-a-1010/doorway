import { resolve } from 'node:path';
import { createAgent } from './agent';
import { buildApp } from './app';
import { createQloo } from './qloo';

const key = process.env.QLOO_API_KEY?.trim();
const qloo = key ? createQloo({ apiKey: key }) : null;
const app = await buildApp(
  qloo,
  process.env.NODE_ENV === 'production' ? resolve('dist') : undefined,
  qloo
    ? createAgent({
        project: process.env.VERTEX_LLM_PROJECT_ID,
        serviceAccount: process.env.VERTEX_LLM_SERVICE_ACCOUNT,
        location: process.env.VERTEX_LLM_REGION,
        backup: {
          project: process.env.VERTEX_LLM_BACKUP_PROJECT_ID,
          serviceAccount: process.env.VERTEX_LLM_BACKUP_SERVICE_ACCOUNT,
        },
        qloo,
      })
    : undefined,
);
const port = Number(process.env.PORT ?? 3195);
await app.listen({ host: '127.0.0.1', port });
console.log(
  `Doorway API on http://127.0.0.1:${port} (Qloo ${key ? 'connected' : 'not connected'})`,
);
