
CREATE OR REPLACE FUNCTION dbo.coredeliverytransactiondetail_insert_update_delete()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
    BEGIN
        IF (TG_OP = 'DELETE') THEN
      INSERT INTO dbo."CoreDeliveryTransactionDetail_Audit"(
  "CoreDeliveryTransactionDetailId", 
  "Amount", 
  "Comission", 
  "Charges", 
  "Notes", 
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
  "DepositDate", 
    "FromAccountId",
    "ToAccountId",
  "AuditDMLActionId", 
  "AuditDateTime"
  )
      SELECT
      OLD."CoreDeliveryTransactionDetailId", 
      OLD."Amount", 
      OLD."Comission", 
      OLD."Charges", 
      OLD."Notes", 
      OLD."DeliveryRefEmployeeId", 
      OLD."AcceptedByCustomer", 
      OLD."CustomerNotes", 
      OLD."AcceptedByEmployee", 
      OLD."EmployeeNotes", 
      OLD."500RupeesNotes", 
      OLD."200RupeesNotes", 
      OLD."100RupeesNotes", 
      OLD."50RupeesNotes", 
      OLD."20RupeesNotes", 
      OLD."10RupeesNotes", 
      OLD."AddedByRefEmployeeId", 
      OLD."AddedOn", 
      OLD."LastEditedByRefEmployeeId", 
      OLD."LastEditedOn", 
      OLD."DepositDate",
        OLD."FromAccountId",
    OLD."ToAccountId",
      -1, 
      now();
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO dbo."CoreDeliveryTransactionDetail_Audit"(
  "CoreDeliveryTransactionDetailId", 
  "Amount", 
  "Comission", 
  "Charges", 
  "Notes", 
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
  "DepositDate", 
            "FromAccountId",
    "ToAccountId",
  "AuditDMLActionId", 
  "AuditDateTime"
  )
      SELECT
      NEW."CoreDeliveryTransactionDetailId", 
      NEW."Amount", 
      NEW."Comission", 
      NEW."Charges", 
      NEW."Notes", 
      NEW."DeliveryRefEmployeeId", 
      NEW."AcceptedByCustomer", 
      NEW."CustomerNotes", 
      NEW."AcceptedByEmployee", 
      NEW."EmployeeNotes", 
      NEW."500RupeesNotes", 
      NEW."200RupeesNotes", 
      NEW."100RupeesNotes", 
      NEW."50RupeesNotes", 
      NEW."20RupeesNotes", 
      NEW."10RupeesNotes", 
      NEW."AddedByRefEmployeeId", 
      NEW."AddedOn", 
      NEW."LastEditedByRefEmployeeId", 
      NEW."LastEditedOn", 
      NEW."DepositDate",
            NEW."FromAccountId",
    NEW."ToAccountId",
      0, 
      now();
        ELSIF (TG_OP = 'INSERT') THEN
          INSERT INTO dbo."CoreDeliveryTransactionDetail_Audit"(
  "CoreDeliveryTransactionDetailId", 
  "Amount", 
  "Comission", 
  "Charges", 
  "Notes", 
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
  "DepositDate", 
            "FromAccountId",
    "ToAccountId",
  "AuditDMLActionId", 
  "AuditDateTime"
  )
      SELECT
      NEW."CoreDeliveryTransactionDetailId", 
      NEW."Amount", 
      NEW."Comission", 
      NEW."Charges", 
      NEW."Notes", 
      NEW."DeliveryRefEmployeeId", 
      NEW."AcceptedByCustomer", 
      NEW."CustomerNotes", 
      NEW."AcceptedByEmployee", 
      NEW."EmployeeNotes", 
      NEW."500RupeesNotes", 
      NEW."200RupeesNotes", 
      NEW."100RupeesNotes", 
      NEW."50RupeesNotes", 
      NEW."20RupeesNotes", 
      NEW."10RupeesNotes", 
      NEW."AddedByRefEmployeeId", 
      NEW."AddedOn", 
      NEW."LastEditedByRefEmployeeId", 
      NEW."LastEditedOn", 
      NEW."DepositDate",
            NEW."FromAccountId",
    NEW."ToAccountId",
      1, 
      now();
        END IF;
        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$BODY$;

ALTER FUNCTION dbo.coredeliverytransactiondetail_insert_update_delete()
    OWNER TO postgree_test_0oll_user;


CREATE OR REPLACE TRIGGER coredeliverytransactiondetail_audit
AFTER INSERT OR DELETE OR UPDATE 
ON dbo."CoreDeliveryTransactionDetail"
FOR EACH ROW
EXECUTE FUNCTION dbo.coredeliverytransactiondetail_insert_update_delete();