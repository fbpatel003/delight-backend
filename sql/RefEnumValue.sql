-- Table: dbo.RefEnumValue

-- DROP TABLE IF EXISTS dbo."RefEnumValue";

CREATE TABLE IF NOT EXISTS dbo."RefEnumValue"
(
    "RefEnumValueId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "EnumTypeName" text COLLATE pg_catalog."default" NOT NULL,
    "EnumValueName" text COLLATE pg_catalog."default" NOT NULL,
    "Code" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "RefEnumValue_pkey" PRIMARY KEY ("RefEnumValueId"),
    CONSTRAINT "UQ_RefEnumValue_EnumTypeName_Code" UNIQUE ("EnumTypeName", "Code")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefEnumValue"
    OWNER to postgree_test_0oll_user;



INSERT INTO dbo."RefEnumValue"(
	"EnumTypeName", "EnumValueName", "Code")
	VALUES ('Delivery Employee Permission Type', 'Can See Pending Delivery', 'CanSeePendingDelivery'),
	('Delivery Employee Permission Type', 'Can See Completed Delivery', 'CanSeeCompletedDelivery');