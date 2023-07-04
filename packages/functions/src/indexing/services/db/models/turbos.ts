import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity({ name: "turbosPool" })
export class TurbosPool {
  @Column({ type: "varchar", length: 100, nullable: true })
  txDigest?: string;

  @PrimaryColumn({ type: "varchar", length: 100 })
  poolId!: string;

  @Column({ type: "int", nullable: true })
  coinTypeA?: number;

  @Column({ type: "int", nullable: true })
  coinTypeB?: number;

  @Column({ type: "integer", nullable: true })
  tickSpacing?: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  account?: string;

  @Column({ type: "integer", nullable: true })
  fee?: number;

  @Column({ type: "integer", nullable: true })
  feeProtocol?: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  sqrtPrice?: string;

  @Column({ type: "timestamp", nullable: true })
  timestampMs?: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

@Entity({ name: "turbosLiquidity" })
export class TurbosLiquidity {
  @PrimaryColumn({ type: "varchar", length: 100 })
  txDigest!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  amountA?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  amountB?: string;

  @Column({ nullable: true, type: "float" })
  convertedAmountA?: number;

  @Column({ nullable: true, type: "float" })
  convertedAmountB?: number;

  @Column({ nullable: true, type: "float" })
  amountAUsd?: number;

  @Column({ nullable: true, type: "float" })
  amountBUsd?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  liquidityDelta?: string;

  @Column({ type: "varchar", length: 255 })
  pool!: string;

  @ManyToOne(() => TurbosPool)
  @JoinColumn({ name: "pool" })
  turbosPool!: TurbosPool;

  @Column({ type: "bigint" })
  tickLowerBits!: number;

  @Column({ type: "bigint" })
  tickUpperBits!: number;

  @Column({ type: "timestamp" })
  timestampMs!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
