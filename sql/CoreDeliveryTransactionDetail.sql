-- Table: dbo.CoreDeliveryTransactionDetail

-- DROP TABLE IF EXISTS dbo."CoreDeliveryTransactionDetail";

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