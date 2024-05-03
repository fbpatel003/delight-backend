
CREATE OR REPLACE FUNCTION dbo.coretransactiondetail_insert(
	adding_refemployeetypeid integer,
	from_entity_code text,
	from_entityId integer,
	to_entity_code text,
	to_entityId integer,
	amount double precision,
	comission double precision,
	charges double precision,
	total_amount double precision,
	notes text,
	rupees500notes integer,
	rupees200notes integer,
	rupees100notes integer,
	rupees50notes integer,
	rupees20notes integer,
	rupees10notes integer
	)
    RETURNS TABLE(CoreTransactionDetailId bigint) 
    LANGUAGE 'plpgsql'

AS $BODY$
DECLARE
	FromEntityTypeId integer;
	ToEntityTypeId integer;
	FromEntityUpdatedBalance double precision;
	ToEntityUpdatedBalance double precision;
BEGIN

	SELECT
	"RefEnumValueId" INTO FromEntityTypeId
	FROM dbo."RefEnumValue"
	WHERE "EnumTypeName" = 'EntityType' AND "Code" = from_entity_code;

	SELECT
	"RefEnumValueId" INTO ToEntityTypeId
	FROM dbo."RefEnumValue"
	WHERE "EnumTypeName" = 'EntityType' AND "Code" = to_entity_code;

	SELECT
	"CurrentBalance" - total_amount INTO FromEntityUpdatedBalance
	FROM dbo."RefEntityAccount"
	WHERE "EntityTypeRefEnumValueId" = FromEntityTypeId AND "EntityId" = from_entityId;

	SELECT
	"CurrentBalance" + total_amount INTO ToEntityUpdatedBalance
	FROM dbo."RefEntityAccount"
	WHERE "EntityTypeRefEnumValueId" = ToEntityTypeId AND "EntityId" = to_entityId;

	INSERT INTO dbo."CoreTransactionDetail"(
		"FromEntityTypeRefEnumValueId", 
		"FromEntityId", 
		"ToEntityTypeRefEnumValueId", 
		"ToEntityId", 
		"Amount", 
		"Comission", 
		"Charges", 
		"Notes", 
		"IsDelivery", 
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
		"FromEntityUpdatedBalance", 
		"ToEntityUpdatedBalance")
	VALUES (
		FromEntityTypeId,
		from_entityId,
		ToEntityTypeId,
		to_entityId,
		amount,
		comission,
		charges,
		notes,
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
		FromEntityUpdatedBalance,
		ToEntityUpdatedBalance
		);

	UPDATE dbo."RefEntityAccount"
	SET "CurrentBalance" = FromEntityUpdatedBalance,
		"LastEditedByRefEmployeeId" = adding_refemployeetypeid,
		"LastEditedOn" = now()
	WHERE "EntityTypeRefEnumValueId" = FromEntityTypeId AND "EntityId" = from_entityId;

	UPDATE dbo."RefEntityAccount"
	SET "CurrentBalance" = ToEntityUpdatedBalance,
		"LastEditedByRefEmployeeId" = adding_refemployeetypeid,
		"LastEditedOn" = now()
	WHERE "EntityTypeRefEnumValueId" = ToEntityTypeId AND "EntityId" = to_entityId;

    RETURN QUERY 
	SELECT 1
	;

END;
$BODY$;