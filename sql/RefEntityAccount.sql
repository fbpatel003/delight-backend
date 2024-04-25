-- Table: dbo.RefEntityAccount

-- DROP TABLE IF EXISTS dbo."RefEntityAccount";

CREATE TABLE IF NOT EXISTS dbo."RefEntityAccount"
(
    "RefEntityAccountId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "EntityTypeRefEnumValueId" integer NOT NULL,
    "EntityId" integer NOT NULL,
    "CurrentBalance" double precision NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    CONSTRAINT "RefEntityAccount_pkey" PRIMARY KEY ("RefEntityAccountId"),
    CONSTRAINT "UQ_EntityTypeRefEnumValueId_EntityId" UNIQUE ("EntityTypeRefEnumValueId", "EntityId"),
    CONSTRAINT "IX_RefEntityAccount_EntityTypeRefEnumValue" FOREIGN KEY ("EntityTypeRefEnumValueId")
        REFERENCES dbo."RefEnumValue" ("RefEnumValueId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "IX_RefEntityAccount_RefEmployee_AddedBy" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "IX_RefEntityAccount_RefEmployee_LastEditedBy" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefEntityAccount"
    OWNER to postgree_test_0oll_user;