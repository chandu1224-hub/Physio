import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const COLORS = ["peach", "blue", "lilac", "sage", "rose"];
const EMOJIS = ["👩🏻‍⚕️", "👨🏽‍⚕️", "👩🏽‍⚕️", "👨🏻‍⚕️", "👩🏼‍⚕️"];

const pick = (row, ...keys) => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  return undefined;
};

const initialsOf = (name = "") =>
  name.replace(/^dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// Maps a Supabase row to the shape the site's cards expect.
export function normalizeDoctor(row, i) {
  const name = pick(row, "name", "full_name", "doctor_name") || "Physiotherapist";
  let specialties = pick(row, "specialties", "specialities", "specialty", "speciality") || [];
  if (typeof specialties === "string") {
    try { const p = JSON.parse(specialties); specialties = Array.isArray(p) ? p : specialties.split(","); }
    catch { specialties = specialties.split(","); }
  }
  specialties = specialties.map((s) => String(s).trim()).filter(Boolean);

  let experience = pick(row, "experience", "experience_years", "years_experience", "years");
  if (typeof experience === "number" || /^\d+$/.test(String(experience ?? ""))) experience = `${experience} years`;

  return {
    id: row.id ?? i,
    name,
    initials: pick(row, "initials") || initialsOf(name),
    title: pick(row, "title", "designation", "role") || "Physiotherapist",
    degree: pick(row, "degree", "qualification", "qualifications") || "",
    experience: experience || "",
    rating: String(pick(row, "rating") ?? "4.8"),
    reviews: Number(pick(row, "reviews", "review_count", "reviews_count") ?? 0),
    price: Number(pick(row, "price", "fee", "session_fee", "session_price") ?? 0),
    availability: pick(row, "availability", "available") === true ? "Available today"
      : typeof pick(row, "availability", "available") === "string" ? pick(row, "availability", "available")
      : "Available today",
    specialties,
    emoji: pick(row, "emoji", "avatar") || EMOJIS[i % EMOJIS.length],
    color: pick(row, "color", "colour") || COLORS[i % COLORS.length],
    distance: pick(row, "distance") || "Nearby",
    bio: pick(row, "bio", "about", "description") || "",
  };
}

// Returns doctors from Supabase; falls back to the built-in sample list on error or empty table.
export function useDoctors(fallback) {
  const [doctors, setDoctors] = useState(fallback);
  const [source, setSource] = useState("fallback");

  useEffect(() => {
    let active = true;
    supabase.from("physiotherapists").select("*").then(({ data, error }) => {
      if (!active || error || !data || data.length === 0) return;
      const visible = data.filter((r) => r.is_active !== false && r.active !== false && r.published !== false);
      if (visible.length === 0) return;
      setDoctors(visible.map(normalizeDoctor));
      setSource("supabase");
    });
    return () => { active = false; };
  }, []);

  return { doctors, source };
}
