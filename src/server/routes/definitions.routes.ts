import { Router, Request, Response } from 'express';
import { INResourceDefinitions } from '../../defs';
import { asyncHandler, AppError } from '../middleware/error-handler';
import { getLogger } from '../../utils/logger';

const logger = getLogger('DefinitionsRoutes');
const router = Router();

/**
 * GET /api/definitions/offers
 * Get all offers
 */
router.get(
  '/offers',
  asyncHandler(async (req: Request, res: Response) => {
    const inDefs = INResourceDefinitions.getInstance();
    const offers = inDefs.getAllOffers();

    res.json({
      success: true,
      data: offers,
    });
  })
);

/**
 * GET /api/definitions/offers/active
 * Get active offers
 */
router.get(
  '/offers/active',
  asyncHandler(async (req: Request, res: Response) => {
    const inDefs = INResourceDefinitions.getInstance();
    const offers = inDefs.getActiveOffers();

    res.json({
      success: true,
      data: offers,
    });
  })
);

/**
 * GET /api/definitions/offers/:offerId
 * Get offer by ID
 */
router.get(
  '/offers/:offerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;
    const inDefs = INResourceDefinitions.getInstance();
    const offer = inDefs.getOffer(offerId);

    if (!offer) {
      throw new AppError(`Offer not found: ${offerId}`, 404);
    }

    res.json({
      success: true,
      data: offer,
    });
  })
);

/**
 * GET /api/definitions/counters
 * Get all counters
 */
router.get(
  '/counters',
  asyncHandler(async (req: Request, res: Response) => {
    const inDefs = INResourceDefinitions.getInstance();
    const counters = inDefs.getAllCounters();

    res.json({
      success: true,
      data: counters,
    });
  })
);

/**
 * GET /api/definitions/counters/:counterId
 * Get counter by ID
 */
router.get(
  '/counters/:counterId',
  asyncHandler(async (req: Request, res: Response) => {
    const { counterId } = req.params;
    const inDefs = INResourceDefinitions.getInstance();
    const counter = inDefs.getCounter(counterId);

    if (!counter) {
      throw new AppError(`Counter not found: ${counterId}`, 404);
    }

    res.json({
      success: true,
      data: counter,
    });
  })
);

/**
 * GET /api/definitions/service-classes
 * Get all service classes
 */
router.get(
  '/service-classes',
  asyncHandler(async (req: Request, res: Response) => {
    const inDefs = INResourceDefinitions.getInstance();
    const serviceClasses = inDefs.getAllServiceClasses();

    res.json({
      success: true,
      data: serviceClasses,
    });
  })
);

/**
 * GET /api/definitions/air-nodes
 * Get all AIR nodes
 */
router.get(
  '/air-nodes',
  asyncHandler(async (req: Request, res: Response) => {
    const inDefs = INResourceDefinitions.getInstance();
    const airNodes = inDefs.getAllAirNodes();

    res.json({
      success: true,
      data: airNodes,
    });
  })
);

/**
 * GET /api/definitions/air-nodes/:nodeId
 * Get AIR node by ID
 */
router.get(
  '/air-nodes/:nodeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;
    const inDefs = INResourceDefinitions.getInstance();
    const airNode = inDefs.getAirNode(nodeId);

    if (!airNode) {
      throw new AppError(`AIR node not found: ${nodeId}`, 404);
    }

    res.json({
      success: true,
      data: airNode,
    });
  })
);

/**
 * GET /api/definitions/stats
 * Get cache statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const inDefs = INResourceDefinitions.getInstance();
    const stats = inDefs.getCacheStats();

    res.json({
      success: true,
      data: {
        ...stats,
        loaded: inDefs.isCacheLoaded(),
      },
    });
  })
);

/**
 * POST /api/definitions/reload
 * Reload definitions from database
 */
router.post(
  '/reload',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Reloading IN resource definitions');

    const inDefs = INResourceDefinitions.getInstance();
    await inDefs.reloadDefinitions();

    res.json({
      success: true,
      message: 'Definitions reloaded successfully',
      data: inDefs.getCacheStats(),
    });
  })
);

export default router;
