import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('service_class_definitions')
export class ServiceClassDefinition {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  serviceClassId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serviceClassName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'integer', nullable: true })
  priority?: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
