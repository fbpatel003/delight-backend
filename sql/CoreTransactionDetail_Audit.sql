-- Table: dbo.CoreTransactionDetail_Audit

-- DROP TABLE IF EXISTS dbo."CoreTransactionDetail_Audit";

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