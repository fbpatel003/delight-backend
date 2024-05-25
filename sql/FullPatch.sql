

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

INSERT INTO dbo."RefEnumValue"
("EnumTypeName", "EnumValueName", "Code")
VALUES 
('Delivery Employee Permission Type', 'Can See Pending Delivery', 'CanSeePendingDelivery'),
('Delivery Employee Permission Type', 'Can See Completed Delivery', 'CanSeeCompletedDelivery'),
('Managing Employee Permission Type','Can Add New Employee','CanAddNewEmployee'),
('Managing Employee Permission Type','Can See and Update existing Employee','CanSeeAndUpdateExistingEmployee'),
('Managing Employee Permission Type','Can Add New Customer','CanAddNewCustomer'),
('Managing Employee Permission Type','Can See and Update existing Customer','CanSeeAndUpdateExistingCustomer'),
('Customer Permission Type', 'Can See Notes Added By Transaction Creator', 'CanSeeNotesAddedByTransactionCreator'),
('Customer Permission Type', 'Can See Notes Added By Delivering Employee', 'Can SeeNotesAddedByDeliveingEmployee'),
('Customer Permission Type', 'Can See Added Comission In A Transaction', 'CanSeeAddedComissionInATransaction'),
('Customer Permission Type', 'Can See Added Charges In A Transaction', 'CanSeeAddedChargesInATransaction'),
('EntityType', 'Customer','Customer'),
('EntityType', 'Bank', 'Bank'),
('EntityType', 'Agent', 'Agent'),
('EntityType', 'BankComission', 'BankComission'),
('Managing Employee Permission Type','Can Edit Pending Delivery Transaction','CanEditPendingDeliveryTransaction'),
('Managing Employee Permission Type','Can Delete Pending Delivery Transaction','CanDeletePendingDeliveryTransaction'),
('Managing Employee Permission Type','Can Edit Transaction','CanEditTransaction'),
('Managing Employee Permission Type','Can Delete Transaction','CanDeleteTransaction');




-------------------------------------------------------------------------------





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




---------------------------------------------------------------------------------




CREATE TABLE IF NOT EXISTS dbo."RefEmployee"
(
    "RefEmployeeId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "RefEmployeeTypeId" integer NOT NULL,
    "EmployeeLoginId" text COLLATE pg_catalog."default" NOT NULL,
    "Password" text COLLATE pg_catalog."default" NOT NULL,
    "AddedByRefEmployeeId" integer,
    "AddedOn" timestamp with time zone,
    "LastEditedByRefEmployeeId" integer,
    "LastEditedOn" timestamp with time zone,
    "MobileNumber" text COLLATE pg_catalog."default",
    "Email" text COLLATE pg_catalog."default",
    CONSTRAINT "RefEmployee_pkey" PRIMARY KEY ("RefEmployeeId"),
    CONSTRAINT "UQ_RefEmployee_EmployeeLoginId" UNIQUE ("EmployeeLoginId"),
    CONSTRAINT "FK_RefEmployee_RefEmployeeType" FOREIGN KEY ("RefEmployeeTypeId")
        REFERENCES dbo."RefEmployeeType" ("RefEmployeeTypeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefEmployee"
    OWNER to postgree_test_0oll_user;


INSERT INTO dbo."RefEmployee"(
	"Name", "RefEmployeeTypeId", "EmployeeLoginId", "Password", "AddedByRefEmployeeId", "AddedOn", "LastEditedByRefEmployeeId", "LastEditedOn")
	VALUES ('Nimesh Vasoya', 1, 'Admin', '$2b$11$xVIBj4zTlXutOWXFC/6Wnwa9GEXj3nAZDQWMv8s8n.Dqnizgfui', 1, now(), 1, now());






----------------------------------------------------------------------------------





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




--------------------------------------------------------------------------------





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




--------------------------------------------------------------------------------------




CREATE TABLE IF NOT EXISTS dbo."RefCRMCustomer"
(
    "RefCRMCustomerId" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "MobileNumber" text COLLATE pg_catalog."default",
    "Email" text COLLATE pg_catalog."default",
    "CustomerLoginId" text COLLATE pg_catalog."default" NOT NULL,
    "Password" text COLLATE pg_catalog."default" NOT NULL,
    "DefaultComissionProfileName" text COLLATE pg_catalog."default",
    "IsActive" boolean NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    CONSTRAINT "RefCRMCustomer_pkey" PRIMARY KEY ("RefCRMCustomerId"),
    CONSTRAINT "UQ_RefCRMCustomer_LoginId" UNIQUE ("CustomerLoginId"),
    CONSTRAINT "FK_RefCRMCustomer_RefEmployee_AddedOn" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_RefCRMCustomer_RefEmployee_EditedOn" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."RefCRMCustomer"
    OWNER to postgree_test_0oll_user;




---------------------------------------------------------------------------------




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




------------------------------------------------------------------------------------




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





-----------------------------------------------------------------------------------




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



-------------------------------------------------------------------------------------





CREATE TABLE IF NOT EXISTS dbo."CoreTransactionDetail"
(
    "CoreTransactionDetailId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "Amount" double precision NOT NULL,
    "Comission" double precision,
    "Charges" double precision,
    "Notes" text COLLATE pg_catalog."default",
    "IsDelivery" boolean NOT NULL,
    "DeliveryRefEmployeeId" integer,
    "AcceptedByCustomer" boolean,
    "CustomerNotes" text COLLATE pg_catalog."default",
    "AcceptedByEmployee" boolean,
    "EmployeeNotes" text COLLATE pg_catalog."default",
    "500RupeesNotes" integer,
    "200RupeesNotes" integer,
    "100RupeesNotes" integer,
    "50RupeesNotes" integer,
    "20RupeesNotes" integer,
    "10RupeesNotes" integer,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    "FromEntityUpdatedBalance" double precision NOT NULL,
    "ToEntityUpdatedBalance" double precision NOT NULL,
    "DepositDate" timestamp with time zone NOT NULL,
    "CoreDeliveryTransactionDetailId" bigint,
    "FromAccountId" integer NOT NULL,
    "ToAccountId" integer NOT NULL,
    "UTRNumber" text COLLATE pg_catalog."default",
    "BranchName" text COLLATE pg_catalog."default",
    "BranchCode" text COLLATE pg_catalog."default",
    CONSTRAINT "CoreTransactionDetail_pkey" PRIMARY KEY ("CoreTransactionDetailId"),
    CONSTRAINT "FK_CoreTransactionDetail_AddedByRefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_DeliveryRefEmployee" FOREIGN KEY ("DeliveryRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_FromAccountId" FOREIGN KEY ("FromAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "FK_CoreTransactionDetail_LastEditedByRefEmployee" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_ToAccountId" FOREIGN KEY ("ToAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CoreTransactionDetail"
    OWNER to postgree_test_0oll_user;






----------------------------------------------------------






CREATE TABLE IF NOT EXISTS dbo."CoreDeliveryTransactionDetail"
(
    "CoreDeliveryTransactionDetailId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "Amount" double precision NOT NULL,
    "Comission" double precision,
    "Charges" double precision,
    "Notes" text COLLATE pg_catalog."default",
    "DeliveryRefEmployeeId" integer,
    "AcceptedByCustomer" boolean,
    "CustomerNotes" text COLLATE pg_catalog."default",
    "AcceptedByEmployee" boolean,
    "EmployeeNotes" text COLLATE pg_catalog."default",
    "500RupeesNotes" integer NOT NULL,
    "200RupeesNotes" integer NOT NULL,
    "100RupeesNotes" integer NOT NULL,
    "50RupeesNotes" integer NOT NULL,
    "20RupeesNotes" integer NOT NULL,
    "10RupeesNotes" integer NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    "DepositDate" timestamp with time zone NOT NULL,
    "FromAccountId" integer NOT NULL,
    "ToAccountId" integer NOT NULL,
    "UTRNumber" text COLLATE pg_catalog."default",
    "BranchName" text COLLATE pg_catalog."default",
    "BranchCode" text COLLATE pg_catalog."default",
    CONSTRAINT "CoreDeliveryTransactionDetail_pkey" PRIMARY KEY ("CoreDeliveryTransactionDetailId"),
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_AddedByRefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_DeliveryRefEmployee" FOREIGN KEY ("DeliveryRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_FromAccountId" FOREIGN KEY ("FromAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_LastEditedByRefEmployee" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_ToAccountId" FOREIGN KEY ("ToAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CoreDeliveryTransactionDetail"
    OWNER to postgree_test_0oll_user;






-----------------------------------------------------------------------------------------------------






CREATE TABLE IF NOT EXISTS dbo."CoreTransactionDetail_Audit"
(
    "AuditId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "CoreTransactionDetailId" bigint NOT NULL,
    "Amount" double precision NOT NULL,
    "Comission" double precision,
    "Charges" double precision,
    "Notes" text COLLATE pg_catalog."default",
    "IsDelivery" boolean NOT NULL,
    "DeliveryRefEmployeeId" integer,
    "AcceptedByCustomer" boolean,
    "CustomerNotes" text COLLATE pg_catalog."default",
    "AcceptedByEmployee" boolean,
    "EmployeeNotes" text COLLATE pg_catalog."default",
    "500RupeesNotes" integer,
    "200RupeesNotes" integer,
    "100RupeesNotes" integer,
    "50RupeesNotes" integer,
    "20RupeesNotes" integer,
    "10RupeesNotes" integer,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    "FromEntityUpdatedBalance" double precision NOT NULL,
    "ToEntityUpdatedBalance" double precision NOT NULL,
    "AuditDMLActionId" integer NOT NULL,
    "AuditDateTime" timestamp with time zone NOT NULL,
    "DepositDate" timestamp with time zone NOT NULL,
    "CoreDeliveryTransactionDetailId" bigint,
    "FromAccountId" integer NOT NULL,
    "ToAccountId" integer NOT NULL,
    "UTRNumber" text COLLATE pg_catalog."default",
    "BranchName" text COLLATE pg_catalog."default",
    "BranchCode" text COLLATE pg_catalog."default",
    CONSTRAINT "CoreTransactionDetail_Audit_pkey" PRIMARY KEY ("AuditId"),
    CONSTRAINT "FK_CoreTransactionDetail_AddedByRefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_DeliveryRefEmployee" FOREIGN KEY ("DeliveryRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_FromAccountId" FOREIGN KEY ("FromAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_LastEditedByRefEmployee" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreTransactionDetail_ToAccountId" FOREIGN KEY ("ToAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CoreTransactionDetail_Audit"
    OWNER to postgree_test_0oll_user;



---------------------------------------------------------------------------------------------------------------





CREATE TABLE IF NOT EXISTS dbo."CoreDeliveryTransactionDetail_Audit"
(
    "AuditId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "CoreDeliveryTransactionDetailId" bigint NOT NULL,
    "Amount" double precision NOT NULL,
    "Comission" double precision,
    "Charges" double precision,
    "Notes" text COLLATE pg_catalog."default",
    "DeliveryRefEmployeeId" integer,
    "AcceptedByCustomer" boolean,
    "CustomerNotes" text COLLATE pg_catalog."default",
    "AcceptedByEmployee" boolean,
    "EmployeeNotes" text COLLATE pg_catalog."default",
    "500RupeesNotes" integer NOT NULL,
    "200RupeesNotes" integer NOT NULL,
    "100RupeesNotes" integer NOT NULL,
    "50RupeesNotes" integer NOT NULL,
    "20RupeesNotes" integer NOT NULL,
    "10RupeesNotes" integer NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    "DepositDate" timestamp with time zone NOT NULL,
    "FromAccountId" integer NOT NULL,
    "ToAccountId" integer NOT NULL,
    "UTRNumber" text COLLATE pg_catalog."default",
    "BranchName" text COLLATE pg_catalog."default",
    "BranchCode" text COLLATE pg_catalog."default",
    "AuditDMLActionId" integer NOT NULL,
    "AuditDateTime" timestamp with time zone NOT NULL,
    CONSTRAINT "CoreDeliveryTransactionDetail_audit_pkey" PRIMARY KEY ("AuditId"),
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_AddedByRefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_DeliveryRefEmployee" FOREIGN KEY ("DeliveryRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_FromAccountId" FOREIGN KEY ("FromAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_LastEditedByRefEmployee" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_ToAccountId" FOREIGN KEY ("ToAccountId")
        REFERENCES dbo."RefEntityAccount" ("RefEntityAccountId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CoreDeliveryTransactionDetail_Audit"
    OWNER to postgree_test_0oll_user;