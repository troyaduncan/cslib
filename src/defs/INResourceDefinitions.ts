import { OfferDefinition, CounterDefinition, ServiceClassDefinition, AirNodeConfig } from '../entities';
import { OfferRepository } from '../dao';
import { getLogger } from '../utils/logger';
import { AppDataSource } from '../config/database';
import { Repository } from 'typeorm';

const logger = getLogger('INResourceDefinitions');

/**
 * Singleton manager for IN (Intelligent Network) Resource Definitions
 * Provides centralized management and caching of all IN resources
 */
export class INResourceDefinitions {
  private static instance: INResourceDefinitions;

  private offerRepository: OfferRepository;
  private counterRepository: Repository<CounterDefinition>;
  private serviceClassRepository: Repository<ServiceClassDefinition>;
  private airNodeRepository: Repository<AirNodeConfig>;

  // Caches
  private offerCache: Map<string, OfferDefinition> = new Map();
  private counterCache: Map<string, CounterDefinition> = new Map();
  private serviceClassCache: Map<string, ServiceClassDefinition> = new Map();
  private airNodeCache: Map<string, AirNodeConfig> = new Map();

  private cacheLoaded: boolean = false;

  private constructor() {
    this.offerRepository = new OfferRepository();
    this.counterRepository = AppDataSource.getRepository(CounterDefinition);
    this.serviceClassRepository = AppDataSource.getRepository(ServiceClassDefinition);
    this.airNodeRepository = AppDataSource.getRepository(AirNodeConfig);
  }

  public static getInstance(): INResourceDefinitions {
    if (!INResourceDefinitions.instance) {
      INResourceDefinitions.instance = new INResourceDefinitions();
    }
    return INResourceDefinitions.instance;
  }

  /**
   * Load all definitions into cache
   */
  async loadDefinitions(): Promise<void> {
    try {
      logger.info('Loading IN resource definitions...');

      // Load offers
      const offers = await this.offerRepository.findAll();
      offers.forEach(offer => this.offerCache.set(offer.offerId, offer));
      logger.info(`Loaded ${offers.length} offer definitions`);

      // Load counters
      const counters = await this.counterRepository.find();
      counters.forEach(counter => this.counterCache.set(counter.counterId, counter));
      logger.info(`Loaded ${counters.length} counter definitions`);

      // Load service classes
      const serviceClasses = await this.serviceClassRepository.find();
      serviceClasses.forEach(sc => this.serviceClassCache.set(sc.serviceClassId, sc));
      logger.info(`Loaded ${serviceClasses.length} service class definitions`);

      // Load AIR nodes
      const airNodes = await this.airNodeRepository.find();
      airNodes.forEach(node => this.airNodeCache.set(node.nodeId, node));
      logger.info(`Loaded ${airNodes.length} AIR node configurations`);

      this.cacheLoaded = true;
      logger.info('IN resource definitions loaded successfully');
    } catch (error) {
      logger.error('Error loading IN resource definitions', error);
      throw error;
    }
  }

  /**
   * Reload definitions from database
   */
  async reloadDefinitions(): Promise<void> {
    this.offerCache.clear();
    this.counterCache.clear();
    this.serviceClassCache.clear();
    this.airNodeCache.clear();
    this.cacheLoaded = false;
    await this.loadDefinitions();
  }

  // Offer Definition methods
  getOffer(offerId: string): OfferDefinition | undefined {
    return this.offerCache.get(offerId);
  }

  getAllOffers(): OfferDefinition[] {
    return Array.from(this.offerCache.values());
  }

  getActiveOffers(): OfferDefinition[] {
    return Array.from(this.offerCache.values()).filter(offer => offer.active);
  }

  async addOffer(offer: Partial<OfferDefinition>): Promise<OfferDefinition> {
    const newOffer = await this.offerRepository.create(offer);
    this.offerCache.set(newOffer.offerId, newOffer);
    logger.info(`Added offer: ${newOffer.offerId}`);
    return newOffer;
  }

  async updateOffer(offerId: string, offer: Partial<OfferDefinition>): Promise<OfferDefinition | null> {
    const updated = await this.offerRepository.update(offerId, offer);
    if (updated) {
      this.offerCache.set(offerId, updated);
      logger.info(`Updated offer: ${offerId}`);
    }
    return updated;
  }

  async deleteOffer(offerId: string): Promise<boolean> {
    const deleted = await this.offerRepository.delete(offerId);
    if (deleted) {
      this.offerCache.delete(offerId);
      logger.info(`Deleted offer: ${offerId}`);
    }
    return deleted;
  }

  // Counter Definition methods
  getCounter(counterId: string): CounterDefinition | undefined {
    return this.counterCache.get(counterId);
  }

  getAllCounters(): CounterDefinition[] {
    return Array.from(this.counterCache.values());
  }

  getActiveCounters(): CounterDefinition[] {
    return Array.from(this.counterCache.values()).filter(counter => counter.active);
  }

  // Service Class Definition methods
  getServiceClass(serviceClassId: string): ServiceClassDefinition | undefined {
    return this.serviceClassCache.get(serviceClassId);
  }

  getAllServiceClasses(): ServiceClassDefinition[] {
    return Array.from(this.serviceClassCache.values());
  }

  getActiveServiceClasses(): ServiceClassDefinition[] {
    return Array.from(this.serviceClassCache.values()).filter(sc => sc.active);
  }

  // AIR Node Configuration methods
  getAirNode(nodeId: string): AirNodeConfig | undefined {
    return this.airNodeCache.get(nodeId);
  }

  getAllAirNodes(): AirNodeConfig[] {
    return Array.from(this.airNodeCache.values());
  }

  getActiveAirNodes(): AirNodeConfig[] {
    return Array.from(this.airNodeCache.values()).filter(node => node.active);
  }

  getAirNodesByEnvironment(environment: string): AirNodeConfig[] {
    return Array.from(this.airNodeCache.values())
      .filter(node => node.active && node.environment === environment);
  }

  getAirNodesByAfType(afType: string): AirNodeConfig[] {
    return Array.from(this.airNodeCache.values())
      .filter(node => node.active && node.afType === afType);
  }

  // Cache status
  isCacheLoaded(): boolean {
    return this.cacheLoaded;
  }

  getCacheStats(): { offers: number; counters: number; serviceClasses: number; airNodes: number } {
    return {
      offers: this.offerCache.size,
      counters: this.counterCache.size,
      serviceClasses: this.serviceClassCache.size,
      airNodes: this.airNodeCache.size,
    };
  }
}

export default INResourceDefinitions;
