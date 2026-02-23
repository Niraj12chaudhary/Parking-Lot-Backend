import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionUpgrade1768600000000 implements MigrationInterface {
  name = 'ProductionUpgrade1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'manager', 'gate_operator')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP, CONSTRAINT "UQ_user_username" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."spot_status_enum" AS ENUM('available', 'occupied', 'reserved', 'out_of_service')`,
    );
    await queryRunner.query(
      `ALTER TABLE "spot" ADD "status" "public"."spot_status_enum"`,
    );
    await queryRunner.query(
      `UPDATE "spot" SET "status" = CASE WHEN "isOccupied" = true THEN 'occupied'::"public"."spot_status_enum" ELSE 'available'::"public"."spot_status_enum" END`,
    );
    await queryRunner.query(
      `ALTER TABLE "spot" ALTER COLUMN "status" SET DEFAULT 'available'`,
    );
    await queryRunner.query(
      `ALTER TABLE "spot" ALTER COLUMN "status" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'succeeded', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `UPDATE "payment" SET "status" = 'succeeded' WHERE "id" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "payment" ADD "breakdown" jsonb`);

    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "ticketNumber" character varying`,
    );
    await queryRunner.query(
      `UPDATE "ticket" SET "ticketNumber" = CONCAT('LEGACY-', "id") WHERE "ticketNumber" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "ticketNumber" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "UQ_ticket_ticket_number" UNIQUE ("ticketNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "durationMinutes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "calculatedAmount" numeric(10,2)`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_entitytype_enum" AS ENUM('ticket', 'payment', 'spot')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "entityType" "public"."audit_log_entitytype_enum" NOT NULL, "entityId" integer NOT NULL, "eventType" character varying NOT NULL, "actorId" integer, "previousState" jsonb, "nextState" jsonb, "metadata" jsonb, CONSTRAINT "PK_1f18e84a1d94f130dc89a6467e7" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_floor_number_unique" ON "floor" ("number")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_gate_name_unique" ON "gate" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_spot_status_type" ON "spot" ("status", "type")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_spot_floor_spotNumber_unique" ON "spot" ("floorId", "spotNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_status_paidAt" ON "payment" ("status", "paidAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_status_entryTime" ON "ticket" ("status", "entryTime")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_entity" ON "audit_log" ("entityType", "entityId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_entity"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ticket_status_entryTime"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_status_paidAt"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_spot_floor_spotNumber_unique"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_spot_status_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_gate_name_unique"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_floor_number_unique"`);

    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TYPE "public"."audit_log_entitytype_enum"`);

    await queryRunner.query(
      `ALTER TABLE "ticket" DROP COLUMN "calculatedAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP COLUMN "durationMinutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "UQ_ticket_ticket_number"`,
    );
    await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "ticketNumber"`);

    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "breakdown"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);

    await queryRunner.query(`ALTER TABLE "spot" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."spot_status_enum"`);

    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
