-- Table: dbo.SecEntityPermision

-- DROP TABLE IF EXISTS dbo."SecEntityPermision";

CREATE TABLE IF NOT EXISTS dbo."SecEntityPermision"
(
    "SecEntityPermisionId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "EntityTypeCode" text COLLATE pg_catalog."default" NOT NULL,
    "EntityId" integer NOT NULL,
    "PermissionRefEnumValueId" integer NOT NULL,
    CONSTRAINT "SecEntityPermision_pkey" PRIMARY KEY ("SecEntityPermisionId"),
    CONSTRAINT "FK_SecEntityPermission_RefEnumValue" FOREIGN KEY ("PermissionRefEnumValueId")
        REFERENCES dbo."RefEnumValue" ("RefEnumValueId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."SecEntityPermision"
    OWNER to postgree_test_0oll_user;