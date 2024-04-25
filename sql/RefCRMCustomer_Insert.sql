
CREATE OR REPLACE FUNCTION dbo.refcrmcustomer_insert(
	adding_refemployeetypeid integer,
	permission_codes text,
	default_profile text,
	c_name text,
	c_mobilenumber text,
	c_email text,
	c_loginid text,
	c_password text
	)
    RETURNS TABLE(RefCRMCustomerId integer) 
    LANGUAGE 'plpgsql'

AS $BODY$
DECLARE
	RefCRMCustomerId integer;
	EntityTypeRefEnumValueId integer;
BEGIN

	DROP TABLE IF EXISTS permissions;
	
    CREATE TEMP TABLE permissions (
        code TEXT
    );

    INSERT INTO permissions (code)
	SELECT 
	unnest(string_to_array(permission_codes,',')) ;

	INSERT INTO dbo."RefCRMCustomer"(
	"Name", 
	"MobileNumber", 
	"Email", 
	"CustomerLoginId", 
	"Password", 
	"DefaultComissionProfileName", 
	"IsActive", 
	"AddedByRefEmployeeId", 
	"AddedOn", 
	"LastEditedByRefEmployeeId", 
	"LastEditedOn"
	)
	VALUES (
		c_name,
		c_mobilenumber,
		c_email,
		c_loginid,
		c_password,
		default_profile,
		true,
		adding_refemployeetypeid,
		now(),
		adding_refemployeetypeid,
		now()
		);

	SELECT
	"RefCRMCustomerId" INTO RefCRMCustomerId
	FROM dbo."RefCRMCustomer"
	WHERE "CustomerLoginId" = c_loginid;

	INSERT INTO dbo."SecEntityPermision"(
	"EntityTypeCode", "EntityId", "PermissionRefEnumValueId")
	SELECT
	'C',
	RefCRMCustomerId,
	en."RefEnumValueId"
	FROM "permissions" pe
	INNER JOIN dbo."RefEnumValue" en ON en."Code" = pe."code"
	WHERE en."EnumTypeName" = 'Customer Permission Type'
	;

	SELECT
	"RefEnumValueId" INTO EntityTypeRefEnumValueId
	FROM dbo."RefEnumValue"
	WHERE "EnumTypeName" = 'EntityType' AND "Code" = 'Customer';

	INSERT INTO dbo."RefEntityAccount"(
		"EntityTypeRefEnumValueId", 
		"EntityId", 
		"CurrentBalance", 
		"AddedByRefEmployeeId", 
		"AddedOn", 
		"LastEditedByRefEmployeeId", 
		"LastEditedOn")
	VALUES 
		(
		EntityTypeRefEnumValueId,
		RefCRMCustomerId,
		0.0,
		adding_refemployeetypeid,
		now(),
		adding_refemployeetypeid,
		now()
		);

    RETURN QUERY 
	SELECT 
	RefCRMCustomerId
	FROM dbo."RefCRMCustomer"
	WHERE "RefCRMCustomerId" = RefCRMCustomerId
	;

END;
$BODY$;