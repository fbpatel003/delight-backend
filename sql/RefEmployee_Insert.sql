-- FUNCTION: dbo.refemployee_insert(integer, text, text, text, text, text, text, text)

-- DROP FUNCTION IF EXISTS dbo.refemployee_insert(integer, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION dbo.refemployee_insert(
	adding_refemployeetypeid integer,
	permission_codes text,
	employee_type text,
	e_name text,
	e_mobilenumber text,
	email text,
	loginid text,
	e_password text)
    RETURNS TABLE(refemployeeid integer, name text, employeeloginid text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    EmployeeTypeId INT;
	RefEMployeeId INT;
	PremissionEnumTypeName TEXT;
BEGIN

	--BEGIN
	
	SELECT
	"RefEmployeeTypeId" INTO EmployeeTypeId
	FROM dbo."RefEmployeeType"
	WHERE "Code" = employee_type;
	
    CREATE TEMP TABLE permissions (
        code TEXT
    );

    INSERT INTO permissions (code)
	SELECT 
	unnest(string_to_array(permission_codes,',')) ;

	INSERT INTO dbo."RefEmployee"(
	"Name", 
	"RefEmployeeTypeId", 
	"EmployeeLoginId", 
	"Password", 
	"AddedByRefEmployeeId", 
	"AddedOn", 
	"LastEditedByRefEmployeeId", 
	"LastEditedOn", 
	"MobileNumber", 
	"Email")
	VALUES 
	(
	e_name,
	EmployeeTypeId,
	loginid,
	e_password,
	adding_refemployeetypeid,
	now(),
	adding_refemployeetypeid,
	now(),
	e_mobilenumber,
	email
	)
	;

	SELECT
	"RefEmployeeId" INTO RefEMployeeId
	FROM dbo."RefEmployee"
	WHERE "EmployeeLoginId" = loginid;

	IF employee_type = 'DeliveryEmployee' THEN
        PremissionEnumTypeName := 'Delivery Employee Permission Type';
    ELSE
        PremissionEnumTypeName := 'Managing Employee Permission Type';
    END IF;

	INSERT INTO dbo."SecEntityPermision"(
	"EntityTypeCode", "EntityId", "PermissionRefEnumValueId")
	SELECT
	'E',
	RefEMployeeId,
	en."RefEnumValueId"
	FROM "permissions" pe
	INNER JOIN dbo."RefEnumValue" en ON en."Code" = pe."code"
	WHERE en."EnumTypeName" = PremissionEnumTypeName
	;

	-- EXCEPTION
 --        -- Rollback the transaction in case of an error
 --        WHEN others THEN
 --            RAISE NOTICE 'An error occurred: %', SQLERRM;
 --            ROLLBACK;

    RETURN QUERY 
	SELECT 
	RefEmployeeId,
	Name,
	EmployeeLoginId
	FROM dbo."RefEmployee"
	WHERE "RefEmployeeId" = RefEMployeeId
	;

		-- COMMIT;
  --   END;

END;
$BODY$;

ALTER FUNCTION dbo.refemployee_insert(integer, text, text, text, text, text, text, text)
    OWNER TO postgree_test_0oll_user;
