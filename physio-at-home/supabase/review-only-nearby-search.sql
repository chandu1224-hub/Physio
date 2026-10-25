-- REVIEW-ONLY proposal for Physio at Home nearby search.
-- Do not run in production until the RLS/grant review is complete and this has
-- been tested against a staging project with the exact production schema.
-- Returns only provider IDs and rounded distances, matching the frontend RPC contract.
-- Public profile fields are fetched separately through explicit column selection and RLS.

create or replace function public.physios_near(p_lat double precision, p_lng double precision)
returns table (physio_id text, distance_km double precision)
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
      coalesce(p.service_radius_km, 10)::double precision as radius_km,
      6371.0 * acos(
        least(1.0, greatest(-1.0,
          sin(radians(p.service_lat)) * sin(radians(p_lat))
          + cos(radians(p.service_lat)) * cos(radians(p_lat))
          * cos(radians(p.service_lng - p_lng))
        ))
      ) as calculated_distance_km
    from public.physiotherapists as p
    where p.status = 'published'
      and p.service_lat is not null
      and p.service_lng is not null
  )
  select
    c.id::text as physio_id,
    round(c.calculated_distance_km::numeric, 1)::double precision as distance_km
  from candidates as c
  where c.calculated_distance_km <= c.radius_km
  order by c.calculated_distance_km;
end;
$function$;

revoke all on function public.physios_near(double precision, double precision) from public;
grant execute on function public.physios_near(double precision, double precision) to anon, authenticated;
