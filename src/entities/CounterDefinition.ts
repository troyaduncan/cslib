import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('counter_definitions')
export class CounterDefinition {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  counterId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  counterName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  counterType?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unitType?: string;

  @Column({ type: 'bigint', nullable: true })
  initialValue?: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
