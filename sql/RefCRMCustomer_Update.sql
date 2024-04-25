-- FUNCTION: dbo.refcrmcustomer_update(integer, text, text, text, text, text, text, boolean, integer)

-- DROP FUNCTION IF EXISTS dbo.refcrmcustomer_update(integer, text, text, text, text, text, text, boolean, integer);

CREATE OR REPLACE FUNCTION dbo.refcrmcustomer_update(
	adding_refemployeetypeid integer,
	permission_codes text,
	default_profile text,
	c_name text,
	c_mobilenumber text,
	c_email text,
	c_loginid text,
	c_isactive boolean,
	refcrmcustomerid integer)
    RETURNS TABLE(refcrmcustomerid_ integer) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
	EntityTypeRefEnumValueId integer;
BEGIN

	UPDATE dbo."RefCRMCustomer"
	SET "Name" = c_name, 
	"CustomerLoginId" = c_loginid, 
	"LastEditedByRefEmployeeId" = adding_refemployeetypeid, 
	"LastEditedOn" = now(), 
	"MobileNumber" = c_mobilenumber, 
	"Email" = c_email,
	"DefaultComissionProfileName" = default_profile,
	"IsActive" = c_isActive
	WHERE "RefCRMCustomer" = refcrmcustomerid;

	DROP TABLE IF EXISTS permissions;

	CREATE TEMP TABLE permissions (
        code TEXT
    );

    INSERT INTO permissions (code)
	SELECT 
	unnest(string_to_array(permission_codes,',')) ;

	DELETE FROM dbo."SecEntityPermision"
	WHERE "SecEntityPermisionId"
	IN (
		SELECT
		s."SecEntityPermisionId"
		FROM dbo."SecEntityPermision" s
		INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = s."PermissionRefEnumValueId"
		LEFT JOIN permissions pe ON pe."code" = v."Code"
		WHERE s."EntityTypeCode" = 'C'
		  AND s."EntityId" = refcrmcustomerid
		  AND pe."code" IS NULL
	);

	INSERT INTO dbo."SecEntityPermision"(
	"EntityTypeCode", "EntityId", "PermissionRefEnumValueId")
	SELECT
	'C',
	refcrmcustomerid,
	en."RefEnumValueId"
	FROM "permissions" pe
	INNER JOIN dbo."RefEnumValue" en ON en."Code" = pe."code"
	LEFT JOIN dbo."SecEntityPermision" ol ON ol."EntityTypeCode" = 'C'
		AND ol."PermissionRefEnumValueId" = en."RefEnumValueId"
		AND ol."EntityId" = refcrmcustomerid
	WHERE en."EnumTypeName" = PremissionEnumTypeName
		AND ol."SecEntityPermisionId" IS NULL
	;

	DROP TABLE permissions;

    RETURN QUERY 
	SELECT 
	RefCRMCustomerId
	FROM dbo."RefCRMCustomer"
	WHERE "RefCRMCustomerId" = refcrmcustomerid
	;

END;
$BODY$;

ALTER FUNCTION dbo.refcrmcustomer_update(integer, text, text, text, text, text, text, boolean, integer)
    OWNER TO postgree_test_0oll_user;
