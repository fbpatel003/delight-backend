-- Table: dbo.RefEmployeeType

-- DROP TABLE IF EXISTS dbo."RefEmployeeType";

CREATE TABLE IF NOT EXISTS dbo."RefEmployeeType"
(
    "RefEmployeeTypeId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "Code" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "RefEmployeeType_pkey" PRIMARY KEY ("RefEmployeeTypeId")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefEmployeeType"
    OWNER to postgree_test_0oll_user;


INSERT INTO dbo."RefEmployeeType"(
	"Name", "Code")
	VALUES ('Admin', 'Admin'),('Managing Employee', 'ManagingEmployee'), ('Delivery Employee', 'DeliveryEmployee');