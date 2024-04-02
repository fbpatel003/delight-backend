-- Table: dbo.RefEmployee

-- DROP TABLE IF EXISTS dbo."RefEmployee";

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
	VALUES ('Nimesh Vasoya', 1, 'Admin', '$2b$11$xVIBj4zTlXutOWXFC/6WGOnwa9GEXj3nAZDQWMv8s8n.Dqnizgfui', 1, now(), 1, now());