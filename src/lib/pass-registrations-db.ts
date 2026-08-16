import { getSupabase } from "./supabase";
import type { DraftItem } from "./checkout-drafts-db";

/** One traveller's registration/insurance record, as stored — one row per pass. */
export type StoredPassRegistration = {
  id: number;
  orderSessionId: string;
  userId: string | null;
  passKey: string;
  passName: string;
  unitAmountCents: number;
  fullName: string;
  nationality: string;
  arrivalDate: string;
  departureDate: string;
  travelDocumentType: string;
  travelDocumentNumber: string;
  address: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  termsAcceptedAt: string;
  createdAt: string;
};

type PassRegistrationRow = {
  id: number;
  order_session_id: string;
  user_id: string | null;
  pass_key: string;
  pass_name: string;
  unit_amount_cents: number;
  full_name: string;
  nationality: string;
  arrival_date: string;
  departure_date: string;
  travel_document_type: string;
  travel_document_number: string;
  address: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  terms_accepted_at: string;
  created_at: string;
};

function toStoredPassRegistration(row: PassRegistrationRow): StoredPassRegistration {
  return {
    id: row.id,
    orderSessionId: row.order_session_id,
    userId: row.user_id,
    passKey: row.pass_key,
    passName: row.pass_name,
    unitAmountCents: row.unit_amount_cents,
    fullName: row.full_name,
    nationality: row.nationality,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    travelDocumentType: row.travel_document_type,
    travelDocumentNumber: row.travel_document_number,
    address: row.address,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    termsAcceptedAt: row.terms_accepted_at,
    createdAt: row.created_at,
  };
}

/** Inserts one registration row per pass in the order — the itemised breakdown of a purchase. */
export async function insertPassRegistrations(
  orderSessionId: string,
  userId: string | null,
  items: DraftItem[]
): Promise<void> {
  const db = getSupabase();

  const { error } = await db.from("pass_registrations").insert(
    items.map((item) => ({
      order_session_id: orderSessionId,
      user_id: userId,
      pass_key: item.passKey,
      pass_name: item.passName,
      unit_amount_cents: item.unitAmountCents,
      full_name: item.registration.fullName,
      nationality: item.registration.nationality,
      arrival_date: item.registration.arrivalDate,
      departure_date: item.registration.departureDate,
      travel_document_type: item.registration.travelDocumentType,
      travel_document_number: item.registration.travelDocumentNumber,
      address: item.registration.address,
      emergency_contact_name: item.registration.emergencyContactName,
      emergency_contact_phone: item.registration.emergencyContactPhone,
      emergency_contact_relationship: item.registration.emergencyContactRelationship,
      terms_accepted_at: item.registration.termsAcceptedAt,
    }))
  );

  if (error) {
    throw new Error(`Failed to save pass registrations for order ${orderSessionId}: ${error.message}`);
  }
}

export async function getPassRegistrationsByOrder(sessionId: string): Promise<StoredPassRegistration[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from("pass_registrations")
    .select()
    .eq("order_session_id", sessionId)
    .order("id", { ascending: true })
    .returns<PassRegistrationRow[]>();

  if (error) {
    throw new Error(`Failed to list pass registrations for order ${sessionId}: ${error.message}`);
  }

  return (data ?? []).map(toStoredPassRegistration);
}

/** All of a customer's registrations across every order, most recent first — powers /account. */
export async function getPassRegistrationsByUserId(userId: string): Promise<StoredPassRegistration[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from("pass_registrations")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<PassRegistrationRow[]>();

  if (error) {
    throw new Error(`Failed to list pass registrations for user ${userId}: ${error.message}`);
  }

  return (data ?? []).map(toStoredPassRegistration);
}
