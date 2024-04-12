CREATE TABLE dbo."RefComissionProfile"
(
    "RefComissionProfileId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "FromValue" bigint NOT NULL,
    "ToValue" bigint NOT NULL,
    "InPercent" bigint,
    "InRupees" bigint,
    "AddedOn" timestamp with time zone,
    "AddedByRefEmployeeId" integer NOT NULL,
    PRIMARY KEY ("RefComissionProfileId"),
    CONSTRAINT "FK_RefComissionProfile_RefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployeeType" ("RefEmployeeTypeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefComissionProfile"
    OWNER to postgree_test_0oll_user;