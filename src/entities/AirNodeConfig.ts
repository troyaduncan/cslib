import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('air_node_configs')
export class AirNodeConfig {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  nodeId!: string;

  @Column({ type: 'varchar', length: 255 })
  nodeName!: string;

  @Column({ type: 'varchar', length: 255 })
  host!: string;

  @Column({ type: 'integer', default: 8080 })
  port!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  afType?: string;

  @Column({ type: 'varchar', length: 50, default: 'lab' })
  environment!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'integer', default: 10 })
  maxConnections!: number;

  @Column({ type: 'integer', default: 30000 })
  timeout!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
