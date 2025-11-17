import { Router } from 'express';
import airRoutes from './air.routes';
import accountRoutes from './account.routes';
import definitionsRoutes from './definitions.routes';

const router = Router();

// Mount route modules
router.use('/air', airRoutes);
router.use('/account', accountRoutes);
router.use('/definitions', definitionsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
