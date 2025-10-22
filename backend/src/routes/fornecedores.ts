import { Router, type Request, type Response } from 'express';
import {
  getFornecedores,
  getFornecedoresStats,
  normalizeFornecedoresQuery,
  DatabaseUnavailableError
} from '../services/fornecedores-service.js';

function handleError(error: unknown, res: Response): void {
  if (error instanceof DatabaseUnavailableError) {
    res.status(503).json({
      error: {
        code: 'database_unavailable',
        message: 'Banco SQLite não encontrado. Execute o materializador do ETL antes de continuar.'
      }
    });
    return;
  }

  console.error('[fornecedores] erro inesperado', error);
  res.status(500).json({
    error: {
      code: 'internal_server_error',
      message: 'Erro interno ao consultar fornecedores.'
    }
  });
}

export function createFornecedoresRouter(): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    try {
      const filters = normalizeFornecedoresQuery(req.query);
      const result = getFornecedores(filters);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  router.get('/stats', (req: Request, res: Response) => {
    try {
      const filters = normalizeFornecedoresQuery(req.query);
      const result = getFornecedoresStats(filters);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
}
