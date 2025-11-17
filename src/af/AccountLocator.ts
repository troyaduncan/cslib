import dns from 'dns';
import { promisify } from 'util';
import { getLogger } from '../utils/logger';
import { config } from '../config';

const logger = getLogger('AccountLocator');
const resolveTxt = promisify(dns.resolveTxt);

export interface AccountLocation {
  sdpId?: string;
  ipAddress?: string;
  found: boolean;
}

/**
 * DNS-based account locator
 * Resolves subscriber account location using DNS TXT records
 * Format: {country_code}{msisdn}.msisdn.sub.cs
 */
export class AccountLocator {
  private baseDomain: string;
  private countryCode: string;
  private timeout: number;
  private retries: number;

  constructor(baseDomain: string = 'msisdn.sub.cs', countryCode: string = '1') {
    this.baseDomain = baseDomain;
    this.countryCode = countryCode;
    this.timeout = config.dns.timeout;
    this.retries = config.dns.retries;
  }

  /**
   * Locate account by MSISDN using DNS lookup
   */
  async locateAccount(msisdn: string): Promise<AccountLocation> {
    const dnsName = this.buildDnsName(msisdn);

    logger.debug(`Performing DNS lookup for: ${dnsName}`);

    try {
      const records = await this.resolveTxtWithRetry(dnsName);

      if (records && records.length > 0) {
        const location = this.parseTxtRecord(records[0]);
        logger.info(`Account located for ${msisdn}: SDP ID=${location.sdpId}, IP=${location.ipAddress}`);
        return location;
      }

      logger.warn(`No DNS records found for ${msisdn}`);
      return { found: false };
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        logger.debug(`Account not found in DNS for ${msisdn}`);
        return { found: false };
      }

      logger.error(`DNS lookup error for ${msisdn}`, error);
      throw error;
    }
  }

  /**
   * Build DNS name from MSISDN
   * Format: {country_code}{msisdn}.msisdn.sub.cs
   */
  private buildDnsName(msisdn: string): string {
    // Remove any non-digit characters
    const cleanMsisdn = msisdn.replace(/\D/g, '');

    // If MSISDN already has country code, use it as is
    // Otherwise prepend the configured country code
    let fullNumber = cleanMsisdn;
    if (!cleanMsisdn.startsWith(this.countryCode)) {
      fullNumber = this.countryCode + cleanMsisdn;
    }

    return `${fullNumber}.${this.baseDomain}`;
  }

  /**
   * Parse TXT record to extract SDP ID and IP address
   * Expected format: "sdp_id=123;ip=10.0.0.1" or similar
   */
  private parseTxtRecord(record: string | string[]): AccountLocation {
    const recordStr = Array.isArray(record) ? record.join('') : record;

    const location: AccountLocation = { found: true };

    // Parse key=value pairs separated by semicolon
    const pairs = recordStr.split(';');
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(s => s.trim());

      if (key && value) {
        if (key.toLowerCase() === 'sdp_id' || key.toLowerCase() === 'sdpid') {
          location.sdpId = value;
        } else if (key.toLowerCase() === 'ip' || key.toLowerCase() === 'ipaddress') {
          location.ipAddress = value;
        }
      }
    }

    // If no structured data found, try to parse as simple format
    if (!location.sdpId && !location.ipAddress) {
      // Try to extract IP address pattern
      const ipPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;
      const ipMatch = recordStr.match(ipPattern);
      if (ipMatch) {
        location.ipAddress = ipMatch[1];
      }

      // Try to extract SDP ID pattern
      const sdpPattern = /\b(sdp[-_]?\d+)\b/i;
      const sdpMatch = recordStr.match(sdpPattern);
      if (sdpMatch) {
        location.sdpId = sdpMatch[1];
      }
    }

    return location;
  }

  /**
   * Resolve TXT record with retry logic
   */
  private async resolveTxtWithRetry(hostname: string, attempt: number = 1): Promise<string[][] | null> {
    try {
      const records = await resolveTxt(hostname);
      return records;
    } catch (error: any) {
      if (attempt < this.retries && error.code !== 'ENOTFOUND') {
        logger.debug(`DNS lookup retry ${attempt}/${this.retries} for ${hostname}`);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.resolveTxtWithRetry(hostname, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch locate multiple accounts
   */
  async locateAccounts(msisdns: string[]): Promise<Map<string, AccountLocation>> {
    const results = new Map<string, AccountLocation>();

    const promises = msisdns.map(async msisdn => {
      try {
        const location = await this.locateAccount(msisdn);
        results.set(msisdn, location);
      } catch (error) {
        logger.error(`Error locating account for ${msisdn}`, error);
        results.set(msisdn, { found: false });
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Set base domain for DNS lookups
   */
  setBaseDomain(domain: string): void {
    this.baseDomain = domain;
    logger.info(`Base domain set to: ${domain}`);
  }

  /**
   * Set country code
   */
  setCountryCode(code: string): void {
    this.countryCode = code;
    logger.info(`Country code set to: ${code}`);
  }
}

export default AccountLocator;
