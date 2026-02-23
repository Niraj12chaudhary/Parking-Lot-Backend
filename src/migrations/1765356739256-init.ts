import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1765356739256 implements MigrationInterface {
  name = 'Init1765356739256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "floor" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_16a0823530c5b0dd226b8a96ee1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."spot_type_enum" AS ENUM('compact', 'large', 'bike', 'handicapped')`,
    );
    await queryRunner.query(
      `CREATE TABLE "spot" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "spotNumber" character varying NOT NULL, "type" "public"."spot_type_enum" NOT NULL, "isOccupied" boolean NOT NULL DEFAULT false, "floorId" integer, CONSTRAINT "PK_f2a0a47e5ae78713daf83a5f7b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."gate_gatetype_enum" AS ENUM('entry', 'exit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "gate" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "gateType" "public"."gate_gatetype_enum" NOT NULL, CONSTRAINT "PK_f8d4ea65058f6177925357d1311" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_method_enum" AS ENUM('cash', 'card', 'upi')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "amount" integer NOT NULL, "paidAt" TIMESTAMP NOT NULL, "method" "public"."payment_method_enum" NOT NULL, "ticketId" integer, CONSTRAINT "REL_49b4a839e33590d1f711489597" UNIQUE ("ticketId"), CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_status_enum" AS ENUM('active', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "entryTime" TIMESTAMP NOT NULL, "exitTime" TIMESTAMP, "status" "public"."ticket_status_enum" NOT NULL DEFAULT 'active', "vehicleId" integer, "spotId" integer, "entryGateId" integer, "exitGateId" integer, CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vehicle_type_enum" AS ENUM('car', 'bike', 'truck')`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "vehicleNumber" character varying NOT NULL, "type" "public"."vehicle_type_enum" NOT NULL, CONSTRAINT "UQ_6e05814513cf949a4c4833c1a3b" UNIQUE ("vehicleNumber"), CONSTRAINT "PK_187fa17ba39d367e5604b3d1ec9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "spot" ADD CONSTRAINT "FK_a3b37c77a3a9f4c9760415dea43" FOREIGN KEY ("floorId") REFERENCES "floor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_49b4a839e33590d1f711489597b" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_bd8f40acca2bd412ce5b4af71ea" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_bb9aa0dde84162ecaa01127a61d" FOREIGN KEY ("spotId") REFERENCES "spot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_177be70903624e637d0dd2b4e4f" FOREIGN KEY ("entryGateId") REFERENCES "gate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_d03f25d5c5c1626783899b1de0a" FOREIGN KEY ("exitGateId") REFERENCES "gate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_d03f25d5c5c1626783899b1de0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_177be70903624e637d0dd2b4e4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_bb9aa0dde84162ecaa01127a61d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_bd8f40acca2bd412ce5b4af71ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_49b4a839e33590d1f711489597b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "spot" DROP CONSTRAINT "FK_a3b37c77a3a9f4c9760415dea43"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle"`);
    await queryRunner.query(`DROP TYPE "public"."vehicle_type_enum"`);
    await queryRunner.query(`DROP TABLE "ticket"`);
    await queryRunner.query(`DROP TYPE "public"."ticket_status_enum"`);
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TYPE "public"."payment_method_enum"`);
    await queryRunner.query(`DROP TABLE "gate"`);
    await queryRunner.query(`DROP TYPE "public"."gate_gatetype_enum"`);
    await queryRunner.query(`DROP TABLE "spot"`);
    await queryRunner.query(`DROP TYPE "public"."spot_type_enum"`);
    await queryRunner.query(`DROP TABLE "floor"`);
  }
}
