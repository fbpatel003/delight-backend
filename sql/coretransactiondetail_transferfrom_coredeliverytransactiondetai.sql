-- FUNCTION: dbo.coretransactiondetail_transferfrom_coredeliverytransactiondetai(integer, text, text, integer, integer, integer, integer, integer, integer)

-- DROP FUNCTION IF EXISTS dbo.coretransactiondetail_transferfrom_coredeliverytransactiondetai(integer, text, text, integer, integer, integer, integer, integer, integer);

CREATE OR REPLACE FUNCTION dbo.coretransactiondetail_transferfrom_coredeliverytransactiondetai(
  addingrefemployeetypeid integer,
  customernotes text,
  employeenotes text,
  totalamount integer,
  fromentitytypeid integer,
  fromentityid integer,
  toentitytypeid integer,
  toentityid integer,
  transactiondetailid integer)
    RETURNS TABLE(coretransactiondetailid bigint) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
  FromEntityUpdatedBalance double precision;
  ToEntityUpdatedBalance double precision;
BEGIN

  SELECT
  acc."CurrentBalance" - totalamount INTO FromEntityUpdatedBalance
  FROM dbo."RefEntityAccount" acc
  WHERE acc."EntityTypeRefEnumValueId" = fromentitytypeid AND acc."EntityId" = fromentityid;

  SELECT
  acc."CurrentBalance" + totalamount INTO ToEntityUpdatedBalance
  FROM dbo."RefEntityAccount" acc
  WHERE acc."EntityTypeRefEnumValueId" = toentitytypeid AND acc."EntityId" = toentityid;

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
    "DeliveryRefEmployeeId", 
    "AcceptedByCustomer", 
    "CustomerNotes", 
    "AcceptedByEmployee", 
    "EmployeeNotes", 
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
    "ToEntityUpdatedBalance",
  "DepositDate",
  "CoreDeliveryTransactionDetailId"
    )
  SELECT
    "FromEntityTypeRefEnumValueId", 
    "FromEntityId", 
    "ToEntityTypeRefEnumValueId", 
    "ToEntityId", 
    "Amount", 
    "Comission", 
    "Charges", 
    "Notes",
    true,
    "DeliveryRefEmployeeId", 
    true, 
    customernotes, 
    true, 
    employeenotes,
    "500RupeesNotes", 
    "200RupeesNotes", 
    "100RupeesNotes", 
    "50RupeesNotes", 
    "20RupeesNotes", 
    "10RupeesNotes", 
    addingrefemployeetypeid, 
    now(), 
    addingrefemployeetypeid, 
    now(), 
    FromEntityUpdatedBalance,
    ToEntityUpdatedBalance,
  "DepositDate",
  transactiondetailid
  FROM dbo."CoreDeliveryTransactionDetail"
  WHERE "CoreDeliveryTransactionDetailId" = transactiondetailid;

  UPDATE dbo."RefEntityAccount"
  SET "CurrentBalance" = FromEntityUpdatedBalance,
    "LastEditedByRefEmployeeId" = addingrefemployeetypeid,
    "LastEditedOn" = now()
  WHERE "EntityTypeRefEnumValueId" = fromentitytypeid AND "EntityId" = fromentityid;

  UPDATE dbo."RefEntityAccount"
  SET "CurrentBalance" = ToEntityUpdatedBalance,
    "LastEditedByRefEmployeeId" = addingrefemployeetypeid,
    "LastEditedOn" = now()
  WHERE "EntityTypeRefEnumValueId" = toentitytypeid AND "EntityId" = toentityid;

  DELETE FROM dbo."CoreDeliveryTransactionDetail"
  WHERE "CoreDeliveryTransactionDetailId" = transactiondetailid;

    RETURN QUERY 
  VALUES (1 :: BIGINT)
  ;

END;
$BODY$;

ALTER FUNCTION dbo.coretransactiondetail_transferfrom_coredeliverytransactiondetai(integer, text, text, integer, integer, integer, integer, integer, integer)
    OWNER TO postgree_test_0oll_user;
