-- Table: dbo.CorePrivateAccountTransaction

-- DROP TABLE IF EXISTS dbo."CorePrivateAccountTransaction";

CREATE TABLE IF NOT EXISTS dbo."CorePrivateAccountTransaction"
(
    "CorePrivateAccountTransactionId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "EntityType" integer NOT NULL,
    "EntityId" integer,
    "PartyName" text COLLATE pg_catalog."default",
    "IsPaid" boolean NOT NULL,
    "Amount" double precision NOT NULL,
    "Notes" text COLLATE pg_catalog."default",
    "UpdatedBalance" double precision NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    CONSTRAINT "CorePrivateAccountTransaction_pkey" PRIMARY KEY ("CorePrivateAccountTransactionId"),
    CONSTRAINT "FK_CorePrivateAccountTransaction_AddedRefEmployeeId" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CorePrivateAccountTransaction_EditedRefEmployeeId" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CorePrivateAccountTransaction"
    OWNER to postgree_test_0oll_user;