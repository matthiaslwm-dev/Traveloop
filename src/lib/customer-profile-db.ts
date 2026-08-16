import { getSupabase } from "./supabase";
import type { PassRegistration } from "./registration";

export type CustomerProfile = {
  fullName: string | null;
  nationality: string | null;
  travelDocumentType: string | null;
  travelDocumentNumber: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  termsAcceptedAt: string | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  nationality: string | null;
  travel_document_type: string | null;
  travel_document_number: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  terms_accepted_at: string | null;
};

function toCustomerProfile(row: ProfileRow): CustomerProfile {
  return {
    fullName: row.full_name,
    nationality: row.nationality,
    travelDocumentType: row.travel_document_type,
    travelDocumentNumber: row.travel_document_number,
    address: row.address,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    termsAcceptedAt: row.terms_accepted_at,
  };
}

/**
 * Writes the registration collected at checkout onto the buyer's account,
 * replacing whatever was there before — a repeat purchase updates the single
 * profile row rather than creating a second one.
 *
 * Trip dates are intentionally not stored here; they belong to the order.
 */
export async function upsertCustomerProfile(
  userId: string,
  registration: PassRegistration
): Promise<void> {
  const db = getSupabase();

  const { error } = await db.from("customer_profiles").upsert(
    {
      user_id: userId,
      full_name: registration.fullName,
      nationality: registration.nationality,
      travel_document_type: registration.travelDocumentType,
      travel_document_number: registration.travelDocumentNumber,
      address: registration.address,
      emergency_contact_name: registration.emergencyContactName,
      emergency_contact_phone: registration.emergencyContactPhone,
      emergency_contact_relationship: registration.emergencyContactRelationship,
      terms_accepted_at: registration.termsAcceptedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`Failed to save profile for user ${userId}: ${error.message}`);
  }
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const db = getSupabase();

  const { data, error } = await db
    .from("customer_profiles")
    .select()
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`Failed to load profile for user ${userId}: ${error.message}`);
  }

  return data ? toCustomerProfile(data) : null;
}

/** Portal edit: writes only the customer-editable fields, never the consent timestamp. */
export async function updateCustomerProfile(
  userId: string,
  fields: Omit<CustomerProfile, "termsAcceptedAt">
): Promise<void> {
  const db = getSupabase();

  const { error } = await db.from("customer_profiles").upsert(
    {
      user_id: userId,
      full_name: fields.fullName,
      nationality: fields.nationality,
      travel_document_type: fields.travelDocumentType,
      travel_document_number: fields.travelDocumentNumber,
      address: fields.address,
      emergency_contact_name: fields.emergencyContactName,
      emergency_contact_phone: fields.emergencyContactPhone,
      emergency_contact_relationship: fields.emergencyContactRelationship,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`Failed to update profile for user ${userId}: ${error.message}`);
  }
}
