import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { CoinInfo } from "./coinInfo";

@Entity({ name: "wormholeTransfers" })
export class WormholeTransfer {
  @PrimaryColumn({ type: "varchar", length: 60 })
  digest!: string;

  @Column({ type: "int" })
  sourceChainId!: number;

  @Column({ type: "varchar", length: 100 })
  sourceChain!: string;

  @Column({ type: "int" })
  destinationChainId!: number;

  @Column({ type: "varchar", length: 100 })
  destinationChain!: string;

  @Column({ type: "timestamp" })
  timestampMs!: Date;

  @Column({ type: "varchar", length: 80 })
  checkpoint!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

@Entity("wormholeBalanceChange")
export class WormholeBalanceChange {
  @PrimaryGeneratedColumn({ type: "int4" })
  id!: number;

  @Column({ type: "varchar", name: "ownerAddress", length: 100 })
  ownerAddress!: string;

  @Column({ type: "varchar", length: 100 })
  amount!: string;

  @Column({ type: "float" })
  convertedAmount!: number;

  @Column({ type: "float" })
  convertedAmountGasAdjusted!: number;

  @Column({ type: "float", default: 0, nullable: true })
  amountUsd!: number;

  @Column({ type: "varchar", name: "wormholeTransferId", length: 66 })
  wormholeTransferId!: string;

  @ManyToOne(() => WormholeTransfer)
  @JoinColumn({ name: "wormholeTransferId" })
  wormholeTransfer!: WormholeTransfer;

  @ManyToOne(() => CoinInfo)
  @JoinColumn({ name: "coinInfoId" })
  coinInfo!: CoinInfo;

  @Column({ type: "int4", name: "coinInfoId" })
  coinInfoId!: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
