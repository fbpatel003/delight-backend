-- FUNCTION: dbo.refemployee_update(integer, integer, text, text, text, text, text, text)

-- DROP FUNCTION IF EXISTS dbo.refemployee_update(integer, integer, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION dbo.refemployee_update(
	adding_refemployeetypeid integer,
	refemployeeid integer,
	permission_codes text,
	employee_type text,
	e_name text,
	e_mobilenumber text,
	email text,
	loginid text)
    RETURNS TABLE(refemployeeid_ integer, name text, employeeloginid text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
	PremissionEnumTypeName TEXT;
BEGIN

	UPDATE dbo."RefEmployee"
	SET "Name" = e_name, 
	"EmployeeLoginId" = loginid, 
	"LastEditedByRefEmployeeId" = adding_refemployeetypeid, 
	"LastEditedOn" = now(), 
	"MobileNumber" = e_mobilenumber, 
	"Email" = email
	WHERE "RefEmployeeId" = refemployeeid;

	IF employee_type = 'DeliveryEmployee' THEN
        PremissionEnumTypeName := 'Delivery Employee Permission Type';
    ELSE
        PremissionEnumTypeName := 'Managing Employee Permission Type';
    END IF;

	CREATE TEMP TABLE permissions (
        code TEXT
    );

    INSERT INTO permissions (code)
	SELECT 
	unnest(string_to_array(permission_codes,',')) ;

	-- DELETE FROM dbo."SecEntityPermision" s
	-- USING dbo."RefEnumValue" v
	-- LEFT JOIN permissions pe ON pe."code" = v."Code"
	-- WHERE v."RefEnumValueId" = s."PermissionRefEnumValueId"
	--   AND s."EntityTypeCode" = 'E'
	--   AND s."EntityId" = refemployeeid
	--   AND pe."code" IS NULL;

	DELETE FROM dbo."SecEntityPermision"
	WHERE "SecEntityPermisionId"
	IN (
		SELECT
		s."SecEntityPermisionId"
		FROM dbo."SecEntityPermision" s
		INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = s."PermissionRefEnumValueId"
	LEFT JOIN permissions pe ON pe."code" = v."Code"
	WHERE s."EntityTypeCode" = 'E'
	  AND s."EntityId" = refemployeeid
	  AND pe."code" IS NULL
	);

	INSERT INTO dbo."SecEntityPermision"(
	"EntityTypeCode", "EntityId", "PermissionRefEnumValueId")
	SELECT
	'E',
	RefEMployeeId,
	en."RefEnumValueId"
	FROM "permissions" pe
	INNER JOIN dbo."RefEnumValue" en ON en."Code" = pe."code"
	LEFT JOIN dbo."SecEntityPermision" ol ON ol."EntityTypeCode" = 'E'
		AND ol."PermissionRefEnumValueId" = en."RefEnumValueId"
		AND ol."EntityId" = RefEMployeeId
	WHERE en."EnumTypeName" = PremissionEnumTypeName
		AND ol."SecEntityPermisionId" IS NULL
	;

	DROP TABLE permissions;

    RETURN QUERY 
	SELECT 
	RefEmployeeId,
	Name,
	EmployeeLoginId
	FROM dbo."RefEmployee"
	WHERE "RefEmployeeId" = RefEMployeeId
	;

END;
$BODY$;

ALTER FUNCTION dbo.refemployee_update(integer, integer, text, text, text, text, text, text)
    OWNER TO postgree_test_0oll_user;
