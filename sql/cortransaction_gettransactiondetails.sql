-- FUNCTION: dbo.cortransaction_gettransactiondetails(date, date)

-- DROP FUNCTION IF EXISTS dbo.cortransaction_gettransactiondetails(date, date);

CREATE OR REPLACE FUNCTION dbo.cortransaction_gettransactiondetails(
  fromdate date,
  todate date)
    RETURNS TABLE(coretransactiondetailid bigint, fromentitycode text, fromentityid integer, fromentityname text, toentitycode text, toentityid integer, toentityname text, amount double precision, comission double precision, charges double precision, notes text, isdelivery boolean, deliveryemployeename text, acceptedbycustomer boolean, acceptedbyemployee boolean, addedemployeename text, addedon timestamp with time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
  BankEnumValueId integer;
  AgentEnumValueId integer;
  CustomerEnumValueId integer;
BEGIN

  SELECT "RefEnumValueId" INTO BankEnumValueId
  FROM dbo."RefEnumValue" WHERE "EnumTypeName" = 'EntityType' AND "Code" = 'Bank';

  SELECT "RefEnumValueId" INTO AgentEnumValueId
  FROM dbo."RefEnumValue" WHERE "EnumTypeName" = 'EntityType' AND "Code" = 'Agent';

  SELECT "RefEnumValueId" INTO CustomerEnumValueId
  FROM dbo."RefEnumValue" WHERE "EnumTypeName" = 'EntityType' AND "Code" = 'Customer';

  DROP TABLE IF EXISTS entityTypeWithNames;

    CREATE TEMP TABLE entityTypeWithNames (
        RefEntityTypeId INT,
    EntityCode TEXT,
    EntityId INT,
    EntityName TEXT
    );

  INSERT INTO entityTypeWithNames(RefEntityTypeId,EntityCode,EntityId,EntityName)
  SELECT
  ac."EntityTypeRefEnumValueId",
  enu."Code",
  ac."EntityId",
  CASE
    WHEN ac."EntityTypeRefEnumValueId" = CustomerEnumValueId THEN cust."Name"
    WHEN ac."EntityTypeRefEnumValueId" = BankEnumValueId THEN bank."Name"
    ELSE agent."Name"
  END AS EntityName
  FROM dbo."RefEntityAccount" ac
  INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
  LEFT JOIN dbo."RefCRMCustomer" cust ON cust."RefCRMCustomerId" = ac."EntityId"
  LEFT JOIN dbo."RefBank" bank ON bank."RefBankId" = ac."EntityId"
  LEFT JOIN dbo."RefAgent" agent ON agent."RefAgentId" = ac."EntityId";	

  RETURN QUERY 
  SELECT
  tran."CoreTransactionDetailId",
  fromName.EntityCode AS FromEntityCode,
  fromName.EntityId AS FromEntityId,
  fromName.EntityName AS FromEntityName,
  toName.EntityCode AS ToEntityCode,
  toName.EntityId AS ToEntityId,
  toName.EntityName AS ToEntityName,
  tran."Amount",
  tran."Comission",
  tran."Charges",
  tran."Notes",
  tran."IsDelivery",
  deli."Name" AS DeliveryEmployeeName,
  tran."AcceptedByCustomer",
  tran."AcceptedByEmployee",
  added."Name" AS AddedEmployeeName,
  tran."AddedOn"
  FROM dbo."CoreTransactionDetail" tran
  INNER JOIN entityTypeWithNames fromName ON fromName.RefEntityTypeId = tran."FromEntityTypeRefEnumValueId" AND fromName.EntityId = tran."FromEntityId"
  INNER JOIN entityTypeWithNames toName ON toName.RefEntityTypeId = tran."ToEntityTypeRefEnumValueId" AND toName.EntityId = tran."ToEntityId"
  INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
  LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
  WHERE date(tran."AddedOn") BETWEEN fromdate AND todate;
END;
$BODY$;

ALTER FUNCTION dbo.cortransaction_gettransactiondetails(date, date)
    OWNER TO postgree_test_0oll_user;
