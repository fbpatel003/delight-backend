-- Table: dbo.RefComissionProfile

-- DROP TABLE IF EXISTS dbo."RefComissionProfile";

CREATE TABLE IF NOT EXISTS dbo."RefComissionProfile"
(
    "RefComissionProfileId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "FromValue" bigint NOT NULL,
    "ToValue" bigint NOT NULL,
    "InPercent" double precision,
    "InRupees" double precision,
    "AddedOn" timestamp with time zone,
    "AddedByRefEmployeeId" integer NOT NULL,
    "OrderById" integer NOT NULL,
    CONSTRAINT "RefComissionProfile_pkey" PRIMARY KEY ("RefComissionProfileId"),
    CONSTRAINT "FK_RefComissionProfile_RefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployeeType" ("RefEmployeeTypeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefComissionProfile"
    OWNER to postgree_test_0oll_user;