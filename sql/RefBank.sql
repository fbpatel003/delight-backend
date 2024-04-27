-- Table: dbo.RefBank

-- DROP TABLE IF EXISTS dbo."RefBank";

CREATE TABLE IF NOT EXISTS dbo."RefBank"
(
    "RefBankId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "IsActive" boolean NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    CONSTRAINT "RefBank_pkey" PRIMARY KEY ("RefBankId"),
    CONSTRAINT "UQ_RefBank_Name" UNIQUE ("Name"),
    CONSTRAINT "FK_RefBank_AddedByRefEmployeeId" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_RefBank_LasteEditedByEmployeeId" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefBank"
    OWNER to postgree_test_0oll_user;