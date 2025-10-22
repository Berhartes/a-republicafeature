import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { createFornecedoresRouter } from './routes/fornecedores.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (env.useUnifiedBackend) {
  app.use('/gastos/fornecedores', createFornecedoresRouter());
} else {
  app.use('/gastos/fornecedores', (_req, res) => {
    res.status(503).json({
      error: {
        code: 'legacy_backend_disabled',
        message: 'O backend legado não está disponível nesta reconstrução. Ative USE_UNIFIED_BACKEND=true.'
      }
    });
  });
}

const port = env.port;

app.listen(port, () => {
  console.log(`[backend] API ouvindo em http://127.0.0.1:${port}`);
});

export { app };
