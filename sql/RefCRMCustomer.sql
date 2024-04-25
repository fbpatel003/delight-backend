-- Table: dbo.RefCRMCustomer

-- DROP TABLE IF EXISTS dbo."RefCRMCustomer";

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