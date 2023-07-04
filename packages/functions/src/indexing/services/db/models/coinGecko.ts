import {
  Entity,
  PrimaryColumn,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("coinGeckoTokens")
export class CoinGeckoToken {
  @PrimaryColumn({ type: "varchar", length: 250 })
  id!: string;

  @Column({ type: "varchar", length: 250 })
  symbol!: string;

  @Column({ type: "varchar", length: 250 })
  name!: string;

  @Column("jsonb")
  platforms!: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

@Entity("coinGeckoPriceAtDate")
export class CoinGeckoPriceAtDate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("float")
  price!: number;

  @Column("date")
  date!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  coinGeckoTokenId!: string;

  @ManyToOne(() => CoinGeckoToken)
  @JoinColumn({ name: "coinGeckoTokenId" })
  coinGeckoTokens!: CoinGeckoToken;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
