import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CoinInfo } from "./coinInfo";

@Entity("cetusPool")
export class CetusPool {
  @Column({ type: "varchar", length: 100 })
  txDigest!: string;

  @PrimaryColumn({ type: "varchar", length: 250 })
  poolId!: string;

  @ManyToOne(() => CoinInfo)
  @JoinColumn({ name: "coinTypeA" })
  coinTypeA!: CoinInfo;

  @ManyToOne(() => CoinInfo)
  @JoinColumn({ name: "coinTypeB" })
  coinTypeB!: CoinInfo;

  @Column({ type: "int" })
  tickSpacing!: number;

  @Column({ type: "timestamp" })
  timestampMs!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

@Entity("cetusLiquidity")
export class CetusLiquidity {
  @PrimaryColumn({ type: "varchar", length: 100 })
  txDigest!: string;

  @Column({ type: "varchar", length: 100 })
  liquidityProviderAddress!: string;

  @Column({ type: "varchar", length: 255 })
  afterLiquidity!: string;

  @Column({ type: "varchar", length: 255 })
  amountA!: string;

  @Column({ type: "varchar", length: 255 })
  amountB!: string;

  @Column({ type: "float" })
  convertedAmountA!: number;

  @Column({ type: "float" })
  convertedAmountB!: number;

  @Column({ type: "float" })
  amountAUsd!: number;

  @Column({ type: "float" })
  amountBUsd!: number;

  @Column({ type: "varchar", length: 255 })
  liquidity!: string;

  @Column({ type: "varchar", length: 255 })
  pool!: string;

  @Column({ type: "varchar", length: 255 })
  position!: string;

  @Column({ type: "bigint" })
  tickLowerBits!: string;

  @Column({ type: "bigint" })
  tickUpperBits!: string;

  @Column({ type: "timestamp" })
  timestampMs!: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  swapperAddress!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

@Entity("cetusSwap")
export class CetusSwap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 70, nullable: false })
  txDigest!: string;

  @Column({ type: "float" })
  afterSqrtPrice!: number;

  @Column({ type: "boolean" })
  aToB!: boolean;

  @Column({ type: "float" })
  beforeSqrtPrice!: number;

  @Column({ type: "varchar", length: 300, nullable: true })
  feeAmount!: string;

  @Column({ type: "varchar", length: 100 })
  poolId!: string;

  @ManyToOne(() => CetusPool)
  @JoinColumn({ name: "poolId" })
  cetusPoolId!: CetusPool;

  @Column({ type: "varchar", length: 30 })
  refAmount!: string;

  @Column({ type: "int" })
  steps!: number;

  @Column({ type: "float" })
  volumeUsd!: number;

  @Column({ type: "int" })
  coinIn!: number;

  @Column({ type: "int" })
  coinOut!: number;

  @ManyToOne(() => CoinInfo)
  @JoinColumn({ name: "coinIn" })
  coinInfoIn!: CoinInfo;

  @ManyToOne(() => CoinInfo)
  @JoinColumn({ name: "coinOut" })
  coinInfoOut!: CoinInfo;

  @Column({ type: "float" })
  amountIn!: number;

  @Column({ type: "float" })
  amountOut!: number;

  @Column({ type: "float" })
  amountInUsd!: number;

  @Column({ type: "float" })
  amountOutUsd!: number;

  @Column({ type: "timestamp" })
  timestampMs!: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  swapperAddress!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
