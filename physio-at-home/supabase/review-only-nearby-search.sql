-- REVIEW-ONLY proposal for Physio at Home nearby search.
-- Do not run in production until the RLS/grant review is complete and this has
-- been tested against a staging project with the exact production schema.
-- Returns an explicit public-field allowlist; never returns p.* or to_jsonb(p).

create or replace function public.physios_near(p_lat double precision, p_lng double precision)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90
     or p_lng < -180 or p_lng > 180 then
    raise exception 'Invalid latitude or longitude'
      using errcode = '22023';
  end if;

  return query
  with candidates as (
    select
      p.id,
      p.name,
      p.initials,
      p.title,
      p.degree,
      p.experience_years,
      p.specialties,
      p.conditions,
      p.services,
      p.service_areas,
      p.languages,
      p.bio,
      p.price,
      p.availability,
      p.rating,
      p.reviews,
      p.emoji,
      p.color,
      p.photo_path,
      p.gallery_paths,
      p.display_order,
      p.featured,
      p.service_location,
      p.service_lat,
      p.service_lng,
      coalesce(p.service_radius_km, 10)::double precision as radius_km,
      6371.0 * acos(
        least(1.0, greatest(-1.0,
          sin(radians(p.service_lat)) * sin(radians(p_lat))
          + cos(radians(p.service_lat)) * cos(radians(p_lat))
          * cos(radians(p.service_lng - p_lng))
        ))
      ) as distance_km
    from public.physiotherapists as p
    where p.status = 'published'
      and p.service_lat is not null
      and p.service_lng is not null
  )
  select jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'initials', c.initials,
    'title', c.title,
    'degree', c.degree,
    'experience_years', c.experience_years,
    'specialties', c.specialties,
    'conditions', c.conditions,
    'services', c.services,
    'service_areas', c.service_areas,
    'languages', c.languages,
    'bio', c.bio,
    'price', c.price,
    'availability', c.availability,
    'rating', c.rating,
    'reviews', c.reviews,
    'emoji', c.emoji,
    'color', c.color,
    'photo_path', c.photo_path,
    'gallery_paths', c.gallery_paths,
    'display_order', c.display_order,
    'featured', c.featured,
    'service_location', c.service_location,
    'distance_km', round(c.distance_km::numeric, 1),
    'service_radius_km', c.radius_km
  )
  from candidates as c
  where c.distance_km <= c.radius_km
  order by c.distance_km, c.display_order nulls last;
end;
$function$;

revoke all on function public.physios_near(double precision, double precision) from public;
grant execute on function public.physios_near(double precision, double precision) to anon, authenticated;
