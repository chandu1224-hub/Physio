import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const COLORS = ["peach", "blue", "lilac", "sage", "rose"];
const EMOJIS = ["👩🏻‍⚕️", "👨🏽‍⚕️", "👩🏽‍⚕️", "👨🏻‍⚕️", "👩🏼‍⚕️"];
const pick = (row, ...keys) => { for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k]; };
const initialsOf = (name = "") => name.replace(/^dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export function normalizeDoctor(row, i) {
  const name = pick(row, "name", "full_name", "doctor_name") || "Physiotherapist";
  let specialties = pick(row, "specialties", "specialities", "specialty", "speciality") || [];
  if (typeof specialties === "string") { try { const p = JSON.parse(specialties); specialties = Array.isArray(p) ? p : specialties.split(","); } catch { specialties = specialties.split(","); } }
  if (!Array.isArray(specialties)) specialties = [specialties];
  specialties = specialties.map((s) => String(s).trim()).filter(Boolean);
  let experience = pick(row, "experience", "experience_years", "years_experience", "years");
  if (typeof experience === "number" || /^\d+$/.test(String(experience ?? ""))) experience = String(experience) + " years";
  let serviceAreas = pick(row, "service_areas", "serviceAreas") || [];
  if (typeof serviceAreas === "string") {
    try { const parsed = JSON.parse(serviceAreas); serviceAreas = Array.isArray(parsed) ? parsed : serviceAreas.split(","); }
    catch { serviceAreas = serviceAreas.split(","); }
  }
  if (!Array.isArray(serviceAreas)) serviceAreas = [serviceAreas];
  serviceAreas = serviceAreas.map((area) => String(area).trim()).filter(Boolean);
  return {
    id: row.id ?? i, name, initials: pick(row, "initials") || initialsOf(name),
    serviceLocation: String(pick(row, "service_location", "serviceLocation") || "").trim(),
    serviceAreas,
    title: pick(row, "title", "designation", "role") || "Physiotherapist",
    degree: pick(row, "degree", "qualification", "qualifications") || "", experience: experience || "",
    rating: pick(row, "rating") == null ? "" : String(row.rating),
    reviews: Number(pick(row, "reviews", "review_count", "reviews_count") ?? 0),
    price: Number(pick(row, "price", "fee", "session_fee", "session_price") ?? 0),
    availability: typeof pick(row, "availability", "available") === "string" ? pick(row, "availability", "available") : "Availability to be confirmed",
    specialties, emoji: pick(row, "emoji", "avatar") || EMOJIS[i % EMOJIS.length],
    color: pick(row, "color", "colour") || COLORS[i % COLORS.length], distance: pick(row, "distance") || "",
    bio: pick(row, "bio", "about", "description") || "",
  };
}

// In production, never substitute illustrative sample clinicians when the database is empty or unavailable.
export function useDoctors(fallback = []) {
  const [doctors, setDoctors] = useState(import.meta.env.DEV ? fallback : []);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (!active) return;
        setError("Physiotherapist profiles are temporarily unavailable because the service is not configured.");
        setStatus("error");
        if (!import.meta.env.DEV) setDoctors([]);
        return;
      }
      try {
        const { data, error: queryError } = await supabase.from("physiotherapists")
          .select("id,name,initials,title,degree,experience_years,specialties,conditions,services,service_areas,languages,bio,price,availability,rating,reviews,emoji,color,photo_path,gallery_paths,display_order,featured,status,service_location,service_radius_km")
          .eq("status", "published")
          .order("display_order", { ascending: true });
        if (!active) return;
        if (queryError) throw queryError;
        const visible = (data || []).filter((r) => r.is_active !== false && r.active !== false && r.published !== false);
        setDoctors(visible.map(normalizeDoctor));
        setError("");
        setStatus(visible.length ? "ready" : "empty");
      } catch (e) {
        if (!active) return;
        setError("We could not load physiotherapist profiles. Please try again shortly or contact our team.");
        setStatus("error");
        if (!import.meta.env.DEV) setDoctors([]);
      }
    };
    load();
    return () => { active = false; };
  }, []);
  return { doctors, status, error, source: status === "ready" ? "supabase" : "fallback" };
}
