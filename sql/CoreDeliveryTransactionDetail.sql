-- Table: dbo.CoreDeliveryTransactionDetail

-- DROP TABLE IF EXISTS dbo."CoreDeliveryTransactionDetail";

CREATE TABLE IF NOT EXISTS dbo."CoreDeliveryTransactionDetail"
(
    "CoreDeliveryTransactionDetailId" bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    "FromEntityTypeRefEnumValueId" integer NOT NULL,
    "FromEntityId" integer NOT NULL,
    "ToEntityTypeRefEnumValueId" integer NOT NULL,
    "ToEntityId" integer NOT NULL,
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
    CONSTRAINT "CoreDeliveryTransactionDetail_pkey" PRIMARY KEY ("CoreDeliveryTransactionDetailId"),
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_AddedByRefEmployee" FOREIGN KEY ("AddedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_DeliveryRefEmployee" FOREIGN KEY ("DeliveryRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_FromEntityTypeRefEnumValue" FOREIGN KEY ("FromEntityTypeRefEnumValueId")
        REFERENCES dbo."RefEnumValue" ("RefEnumValueId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_LastEditedByRefEmployee" FOREIGN KEY ("LastEditedByRefEmployeeId")
        REFERENCES dbo."RefEmployee" ("RefEmployeeId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "FK_CoreDeliveryTransactionDetail_ToEntityTypeRefEnumValue" FOREIGN KEY ("ToEntityTypeRefEnumValueId")
        REFERENCES dbo."RefEnumValue" ("RefEnumValueId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS dbo."CoreDeliveryTransactionDetail"
    OWNER to postgree_test_0oll_user;