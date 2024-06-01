-- Table: dbo.CoreCustomerTransactionsChangeLogActionable

-- DROP TABLE IF EXISTS dbo."CoreCustomerTransactionsChangeLogActionable";

CREATE TABLE IF NOT EXISTS dbo."CoreCustomerTransactionsChangeLogActionable"
(
    "CoreCustomerTransactionsChangeLogActionableId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "CoreTransactionDetailId" bigint NOT NULL,
    "FromAmount" double precision NOT NULL,
    "ToAmount" double precision NOT NULL,
    "FromComission" double precision,
    "ToComission" double precision,
    "FromCharges" double precision,
    "ToCharges" double precision,
    "From500RupeesNotes" integer,
    "To500RupeesNotes" integer,
    "From200RupeesNotes" integer,
    "To200RupeesNotes" integer,
    "From100RupeesNotes" integer,
    "To100RupeesNotes" integer,
    "From50RupeesNotes" integer,
    "To50RupeesNotes" integer,
    "From20RupeesNotes" integer,
    "To20RupeesNotes" integer,
    "From10RupeesNotes" integer,
    "To10RupeesNotes" integer,
    "RefCRMCustomerId" integer NOT NULL,
    "StatusUpdatedByCustomer" integer NOT NULL,
    "AddedByRefEmployeeId" integer NOT NULL,
    "AddedOn" timestamp with time zone NOT NULL,
    "LastEditedByRefEmployeeId" integer NOT NULL,
    "LastEditedOn" timestamp with time zone NOT NULL,
    CONSTRAINT "CoreCustomerTransactionsChangeLogActionable_pkey" PRIMARY KEY ("CoreCustomerTransactionsChangeLogActionableId"),
    CONSTRAINT "FK_CoreCustomerTransactionsChangeLogActionable_AddedByRefEmploy" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreCustomerTransactionsChangeLogActionable_CoreTransactionD" FOREIGN KEY ("CoreTransactionDetailId")
        REFERENCES dbo."CoreTransactionDetail" ("CoreTransactionDetailId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreCustomerTransactionsChangeLogActionable_LastEditedByRefE" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreCustomerTransactionsChangeLogActionable_RefCRMCustomerId" FOREIGN KEY ("RefCRMCustomerId")
        REFERENCES dbo."RefCRMCustomer" ("RefCRMCustomerId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CoreCustomerTransactionsChangeLogActionable"
    OWNER to postgree_test_0oll_user;