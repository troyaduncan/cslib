import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OfferDefinition } from '../entities';
import { getLogger } from '../utils/logger';

const logger = getLogger('OfferRepository');

export class OfferRepository {
  private repository: Repository<OfferDefinition>;

  constructor() {
    this.repository = AppDataSource.getRepository(OfferDefinition);
  }

  async findAll(): Promise<OfferDefinition[]> {
    try {
      return await this.repository.find();
    } catch (error) {
      logger.error('Error finding all offers', error);
      throw error;
    }
  }

  async findById(offerId: string): Promise<OfferDefinition | null> {
    try {
      return await this.repository.findOneBy({ offerId });
    } catch (error) {
      logger.error(`Error finding offer by ID: ${offerId}`, error);
      throw error;
    }
  }

  async findActive(): Promise<OfferDefinition[]> {
    try {
      return await this.repository.findBy({ active: true });
    } catch (error) {
      logger.error('Error finding active offers', error);
      throw error;
    }
  }

  async create(offer: Partial<OfferDefinition>): Promise<OfferDefinition> {
    try {
      const newOffer = this.repository.create(offer);
      return await this.repository.save(newOffer);
    } catch (error) {
      logger.error('Error creating offer', error);
      throw error;
    }
  }

  async update(offerId: string, offer: Partial<OfferDefinition>): Promise<OfferDefinition | null> {
    try {
      await this.repository.update({ offerId }, offer);
      return await this.findById(offerId);
    } catch (error) {
      logger.error(`Error updating offer: ${offerId}`, error);
      throw error;
    }
  }

  async delete(offerId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ offerId });
      return (result.affected ?? 0) > 0;
    } catch (error) {
      logger.error(`Error deleting offer: ${offerId}`, error);
      throw error;
    }
  }
}

export default OfferRepository;
