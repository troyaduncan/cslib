import { Router, Request, Response } from 'express';
import { AccountLocator } from '../../af';
import { asyncHandler, AppError } from '../middleware/error-handler';
import { getLogger } from '../../utils/logger';

const logger = getLogger('AccountRoutes');
const router = Router();

// Create a default account locator
const accountLocator = new AccountLocator();

/**
 * POST /api/account/locate
 * Locate account by MSISDN
 */
router.post(
  '/locate',
  asyncHandler(async (req: Request, res: Response) => {
    const { msisdn } = req.body;

    if (!msisdn) {
      throw new AppError('msisdn is required', 400);
    }

    logger.info(`Locating account for MSISDN: ${msisdn}`);

    const location = await accountLocator.locateAccount(msisdn);

    res.json({
      success: location.found,
      data: location,
    });
  })
);

/**
 * POST /api/account/locate-batch
 * Locate multiple accounts by MSISDN
 */
router.post(
  '/locate-batch',
  asyncHandler(async (req: Request, res: Response) => {
    const { msisdns } = req.body;

    if (!Array.isArray(msisdns) || msisdns.length === 0) {
      throw new AppError('msisdns array is required', 400);
    }

    logger.info(`Locating accounts for ${msisdns.length} MSISDNs`);

    const locations = await accountLocator.locateAccounts(msisdns);

    // Convert Map to object for JSON response
    const result: Record<string, any> = {};
    locations.forEach((location, msisdn) => {
      result[msisdn] = location;
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/account/config
 * Update account locator configuration
 */
router.post(
  '/config',
  asyncHandler(async (req: Request, res: Response) => {
    const { baseDomain, countryCode } = req.body;

    if (baseDomain) {
      accountLocator.setBaseDomain(baseDomain);
    }

    if (countryCode) {
      accountLocator.setCountryCode(countryCode);
    }

    res.json({
      success: true,
      message: 'Configuration updated',
      data: {
        baseDomain,
        countryCode,
      },
    });
  })
);

export default router;
