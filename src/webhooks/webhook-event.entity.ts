import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "webhook_events" })
@Index("uq_webhook_events_provider_event", ["provider", "eventId"], {
  unique: true,
})
export class WebhookEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  provider!: string;

  @Column({ name: "event_id" })
  eventId!: string;

  @CreateDateColumn({ name: "received_at" })
  receivedAt!: Date;

  @Column({ name: "processed_at", type: "timestamptz", nullable: true })
  processedAt!: Date | null;
}
