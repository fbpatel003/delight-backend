-- FUNCTION: dbo.coredeliverytransactiondetail_insert(integer, text, integer, text, integer, double precision, double precision, double precision, text, integer, integer, integer, integer, integer, integer, integer)

-- DROP FUNCTION IF EXISTS dbo.coredeliverytransactiondetail_insert(integer, text, integer, text, integer, double precision, double precision, double precision, text, integer, integer, integer, integer, integer, integer, integer);

CREATE OR REPLACE FUNCTION dbo.coredeliverytransactiondetail_insert(
	adding_refemployeetypeid integer,
	from_entity_code text,
	from_entityid integer,
	to_entity_code text,
	to_entityid integer,
	amount double precision,
	comission double precision,
	charges double precision,
	notes text,
	rupees500notes integer,
	rupees200notes integer,
	rupees100notes integer,
	rupees50notes integer,
	rupees20notes integer,
	rupees10notes integer,
	delivery_employee_id integer,
	depositdate text)
		RETURNS TABLE(coredeliverytransactiondetailid bigint) 
		LANGUAGE 'plpgsql'
		COST 100
		VOLATILE PARALLEL UNSAFE
		ROWS 1000

AS $BODY$
DECLARE
	FromEntityTypeId integer;
	ToEntityTypeId integer;
BEGIN

	SELECT
	"RefEnumValueId" INTO FromEntityTypeId
	FROM dbo."RefEnumValue"
	WHERE "EnumTypeName" = 'EntityType' AND "Code" = from_entity_code;

	SELECT
	"RefEnumValueId" INTO ToEntityTypeId
	FROM dbo."RefEnumValue"
	WHERE "EnumTypeName" = 'EntityType' AND "Code" = to_entity_code;

	INSERT INTO dbo."CoreDeliveryTransactionDetail"(
	"FromEntityTypeRefEnumValueId", 
	"FromEntityId", 
	"ToEntityTypeRefEnumValueId", 
	"ToEntityId", 
	"Amount", 
	"Comission", 
	"Charges", 
	"Notes", 
	"DeliveryRefEmployeeId", 
	"AcceptedByCustomer", 
	"AcceptedByEmployee", 
	"500RupeesNotes", 
	"200RupeesNotes", 
	"100RupeesNotes", 
	"50RupeesNotes", 
	"20RupeesNotes", 
	"10RupeesNotes", 
	"AddedByRefEmployeeId", 
	"AddedOn", 
	"LastEditedByRefEmployeeId", 
	"LastEditedOn",
	"DepositDate"
	)
	VALUES (
		FromEntityTypeId,
		from_entityId,
		ToEntityTypeId,
		to_entityId,
		amount,
		comission,
		charges,
		notes,
		delivery_employee_id,
		false,
		false,
		rupees500notes,
		rupees200notes,
		rupees100notes,
		rupees50notes,
		rupees20notes,
		rupees10notes,
		adding_refemployeetypeid,
		now(),
		adding_refemployeetypeid,
		now(),
		date(to_timestamp(depositdate,'YYYY-MM-DDTHH24:MI:SS.MSZ'))
		);

		RETURN QUERY 
	VALUES (1::BIGINT)
	;

END;
$BODY$;

ALTER FUNCTION dbo.coredeliverytransactiondetail_insert(integer, text, integer, text, integer, double precision, double precision, double precision, text, integer, integer, integer, integer, integer, integer, integer)
		OWNER TO postgree_test_0oll_user;
