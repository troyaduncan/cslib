import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('offer_definitions')
export class OfferDefinition {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  offerId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  offerName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  offerType?: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'integer', nullable: true })
  priority?: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
