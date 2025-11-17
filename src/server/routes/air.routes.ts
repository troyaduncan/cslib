import { Router, Request, Response } from 'express';
import { AIRService } from '../../air';
import { asyncHandler, AppError } from '../middleware/error-handler';
import { getLogger } from '../../utils/logger';

const logger = getLogger('AIRRoutes');
const router = Router();

/**
 * GET /api/air/stats
 * Get AIR service statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const airService = AIRService.getInstance();

    if (!airService.isInitialized()) {
      throw new AppError('AIR service not initialized', 503);
    }

    const stats = airService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * POST /api/air/balance
 * Get subscriber balance
 */
router.post(
  '/balance',
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriberNumber, requestedInformationFlags, afType } = req.body;

    if (!subscriberNumber) {
      throw new AppError('subscriberNumber is required', 400);
    }

    logger.info(`Getting balance for subscriber: ${subscriberNumber}`);

    const airService = AIRService.getInstance();
    const response = await airService.getBalance(
      {
        subscriberNumber,
        requestedInformationFlags,
      },
      afType
    );

    res.json({
      success: response.responseCode === 0,
      data: response,
    });
  })
);

/**
 * POST /api/air/refill
 * Refill subscriber account
 */
router.post(
  '/refill',
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriberNumber, refillAmount, transactionId, transactionCurrency, profileId, afType } = req.body;

    if (!subscriberNumber || refillAmount === undefined) {
      throw new AppError('subscriberNumber and refillAmount are required', 400);
    }

    logger.info(`Refilling ${refillAmount} for subscriber: ${subscriberNumber}`);

    const airService = AIRService.getInstance();
    const response = await airService.refill(
      {
        subscriberNumber,
        refillAmount,
        transactionId,
        transactionCurrency,
        profileId,
      },
      afType
    );

    res.json({
      success: response.responseCode === 0,
      data: response,
    });
  })
);

/**
 * POST /api/air/update-balance
 * Update subscriber balance
 */
router.post(
  '/update-balance',
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriberNumber, adjustmentAmount, transactionId, transactionType, afType } = req.body;

    if (!subscriberNumber || adjustmentAmount === undefined) {
      throw new AppError('subscriberNumber and adjustmentAmount are required', 400);
    }

    logger.info(`Updating balance by ${adjustmentAmount} for subscriber: ${subscriberNumber}`);

    const airService = AIRService.getInstance();
    const response = await airService.updateBalance(
      {
        subscriberNumber,
        adjustmentAmount,
        transactionId,
        transactionType,
      },
      afType
    );

    res.json({
      success: response.responseCode === 0,
      data: response,
    });
  })
);

/**
 * POST /api/air/account-details
 * Get account details
 */
router.post(
  '/account-details',
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriberNumber, requestedInformationFlags, afType } = req.body;

    if (!subscriberNumber) {
      throw new AppError('subscriberNumber is required', 400);
    }

    logger.info(`Getting account details for subscriber: ${subscriberNumber}`);

    const airService = AIRService.getInstance();
    const response = await airService.getAccountDetails(
      {
        subscriberNumber,
        requestedInformationFlags,
      },
      afType
    );

    res.json({
      success: response.responseCode === 0,
      data: response,
    });
  })
);

export default router;
