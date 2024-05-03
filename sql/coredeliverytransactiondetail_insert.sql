
CREATE OR REPLACE FUNCTION dbo.coredeliverytransactiondetail_insert(
	adding_refemployeetypeid integer,
	from_entity_code text,
	from_entityId integer,
	to_entity_code text,
	to_entityId integer,
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
	delivery_employee_id integer
	)
    RETURNS TABLE(CoreDeliveryTransactionDetailId bigint) 
    LANGUAGE 'plpgsql'

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
	"LastEditedOn"
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
		now()
		);

    RETURN QUERY 
	SELECT 1
	;

END;
$BODY$;