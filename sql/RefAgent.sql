
CREATE TABLE IF NOT EXISTS dbo."RefAgent"
(
    "RefAgentId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "IsActive" boolean NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    CONSTRAINT "RefAgent_pkey" PRIMARY KEY ("RefAgentId"),
    CONSTRAINT "UQ_RefAgent_Name" UNIQUE ("Name"),
    CONSTRAINT "FK_RefAgent_AddedByRefEmployeeId" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_RefAgent_LasteEditedByEmployeeId" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefAgent"
    OWNER to postgree_test_0oll_user;
