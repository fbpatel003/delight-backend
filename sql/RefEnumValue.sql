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

INSERT INTO dbo."RefEnumValue"(
	"EnumTypeName", "EnumValueName", "Code")
	VALUES ('Managing Employee Permission Type','Can Add New Employee','CanAddNewEmployee'),
	('Managing Employee Permission Type','Can See and Update existing Employee','CanSeeAndUpdateExistingEmployee');


INSERT INTO dbo."RefEnumValue"
("EnumTypeName", "EnumValueName", "Code")
VALUES('Managing Employee Permission Type','Can Add New Customer','CanAddNewCustomer'),
('Managing Employee Permission Type','Can See and Update existing Customer','CanSeeAndUpdateExistingCustomer');

INSERT INTO dbo."RefEnumValue"
("EnumTypeName", "EnumValueName", "Code")
VALUES ('Customer Permission Type', 'Can See Notes Added By Transaction Creator', 'CanSeeNotesAddedByTransactionCreator'),
('Customer Permission Type', 'Can See Notes Added By Delivering Employee', 'Can SeeNotesAddedByDeliveingEmployee'),
('Customer Permission Type', 'Can See Added Comission In A Transaction', 'CanSeeAddedComissionInATransaction'),
('Customer Permission Type', 'Can See Added Charges In A Transaction', 'CanSeeAddedChargesInATransaction');

INSERT INTO dbo."RefEnumValue" ("EnumTypeName", "EnumValueName", "Code")
VALUES ('EntityType', 'Customer','Customer'),
('EntityType', 'Bank', 'Bank'),
('EntityType', 'Agent', 'Agent'),
('EntityType','Managing Agent','ManagingAgent');

INSERT INTO dbo."RefEnumValue"("EnTypeName","EnumValueName","Code") VALUES
('Managing Employee Permission Type','Can Edit Pending Delivery Transaction','CanEditPendingDeliveryTransaction'),
('Managing Employee Permission Type','Can Delete Pending Delivery Transaction','CanDeletePendingDeliveryTransaction'),
('Managing Employee Permission Type','Can Edit Transaction','CanEditTransaction'),
('Managing Employee Permission Type','Can Delete Transaction','CanDeleteTransaction');