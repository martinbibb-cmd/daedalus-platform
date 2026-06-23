import type { PropertyCreateInput } from "../../types/property";

const forbiddenOwnershipRootFields = [
  "userId",
  "user_id",
  "userRef",
  "user_ref",
  "organisationId",
  "organisation_id",
  "organizationId",
  "organization_id",
  "workspaceId",
  "workspace_id",
  "billingId",
  "billing_id",
  "subscriptionId",
  "subscription_id"
] as const;

export type PropertyRootValidationResult =
  | {
      success: true;
      propertyIdentity: {
        kind: "PropertyIdentity";
        property_id: string;
        property_ref: string;
        root_entity: "property";
        can_exist_without_users: true;
      };
    }
  | {
      success: false;
      message: string;
    };

export function validatePropertyCreateAgainstPropertyRootContract(
  input: PropertyCreateInput
): PropertyRootValidationResult {
  const payload = input as Record<string, unknown>;
  const forbiddenField = forbiddenOwnershipRootFields.find(
    (field) => payload[field] !== undefined
  );

  if (forbiddenField) {
    return {
      success: false,
      message:
        "Property is the ownership root; users, organisations, workspaces, billing, and subscriptions cannot root a Property."
    };
  }

  const propertyId = input.propertyId?.trim();
  if (!propertyId) {
    return { success: false, message: "propertyId is required." };
  }

  const propertyName = input.propertyName?.trim();
  if (!propertyName) {
    return { success: false, message: "propertyName is required." };
  }

  return {
    success: true,
    propertyIdentity: {
      kind: "PropertyIdentity",
      property_id: propertyId,
      property_ref: propertyId,
      root_entity: "property",
      can_exist_without_users: true
    }
  };
}
