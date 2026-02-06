import { z } from "zod";

export const partnerEventSchema = z.object({
  // Required fields
  title: z.string()
    .min(5, "Titel muss mindestens 5 Zeichen haben")
    .max(200, "Titel darf maximal 200 Zeichen haben"),

  address_street: z.string()
    .min(3, "Strassenadresse ist erforderlich")
    .max(300, "Strassenadresse zu lang"),

  start_date: z.string()
    .min(1, "Startdatum ist erforderlich")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, "Startdatum muss in der Zukunft liegen"),

  category_main_id: z.number({
    required_error: "Bitte wählen Sie eine Hauptkategorie",
  }).positive("Bitte wählen Sie eine Hauptkategorie"),

  // Coordinates validation - optional but if provided must be valid
  latitude: z.string()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= -90 && num <= 90;
    }, "Breitengrad muss zwischen -90 und 90 liegen")
    .optional(),

  longitude: z.string()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= -180 && num <= 180;
    }, "Längengrad muss zwischen -180 und 180 liegen")
    .optional(),

  // Optional fields with validation
  description: z.string().max(5000, "Beschreibung zu lang").optional(),
  short_description: z.string().max(200, "Kurzbeschreibung zu lang").optional(),
  image_url: z.string()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, "Ungültige Bild-URL")
    .optional(),
  category_sub_id: z.number().positive().optional().nullable(),
  end_date: z.string().optional(),
  venue_name: z.string().max(200, "Venuename zu lang").optional(),
  address_city: z.string().max(100, "Stadt zu lang").optional(),
  address_zip: z.string().max(20, "PLZ zu lang").optional(),
  address_country: z.string().default("CH"),
  price_from: z.number().min(0, "Preis darf nicht negativ sein").optional().nullable(),
  price_to: z.number().min(0, "Preis darf nicht negativ sein").optional().nullable(),
  price_label: z.string().optional().nullable(), // Auto-generated from price_from
  url: z.string()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, "Ungültige Website-URL")
    .optional(),
  ticket_link: z.string()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, "Ungültiger Ticket-Link")
    .optional(),
});

export type PartnerEventFormData = z.infer<typeof partnerEventSchema>;
