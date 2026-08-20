-- =============================================================
-- Official Tagalog translation supplied by the client
-- Source: "The Unsung Hero Award - for merge ADD (1).docx" (2026-08-20)
--   Replaces the Tagalog award titles, award descriptions and criterion names
--   for four awards. Supersedes 007 where the two disagree — that migration
--   captured chat feedback from 2026-08-19, this file is the merged document
--   sent a day later.
--   Not covered by the docx, so left untouched: The Legacy Builder Award, all
--   criterion descriptions, and every Taglish string.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

-- ---------- The Unsung Hero Award -> Tahimik na Bayani Award ----------
update public.award_categories
set i18n = jsonb_set(
  i18n, '{tl}', coalesce(i18n -> 'tl', '{}'::jsonb) || '{"name":"Tahimik na Bayani Award","description":"Isang espesyal na pagkilala para sa rank-and-file o support personnel na tahimik pero buong pusong ginagawa ang kanilang trabaho. Para ito sa empleyadong masipag, maaasahan, at laging handang tumulong para maging maayos ang araw-araw na paggawa—kahit madalas ay nasa likod lang sila at hindi naghihintay ng anumang papuri o pagkilala."}'::jsonb, true
)
where id = '21111111-1111-4111-8111-111111111102';
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Sipag, Dedikasyon, at Pagiging Maaasahan"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 1;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Paggawa nang Higit pa sa Inaasahan"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 2;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Implikasyon sa Pamamahala at Pagiging Madiskarte sa Trabaho"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 3;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Magandang Asal at Pagpapakita ng Mabuting Halimbawa"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 4;

-- ---------- The Most Courteous Award -> Huwarang Asal Award ----------
update public.award_categories
set i18n = jsonb_set(
  i18n, '{tl}', coalesce(i18n -> 'tl', '{}'::jsonb) || '{"name":"Huwarang Asal Award","description":"Kinikilala ang mga frontline, office, o rank-and-file personnel na nagbibigay ng magandang pakikitungo sa mga estudyante, kapwa empleyado, bisita, at iba pang nakikipag-ugnayan sa institusyon. Sa kanilang maayos at magiliw na pakikitungo, naipakikita nila ang magandang imahe ng Pamantasan."}'::jsonb, true
)
where id = '21111111-1111-4111-8111-111111111103';
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Magalang, Magiliw, at Marubdob na Pakikitungo"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 1;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Pagtitiyaga at Epektibong Pamamahala"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 2;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Pantay at Magalang na Pakikitungo sa Lahat"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 3;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Huwarang Kinatawan ng Institusyon"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 4;

-- ---------- The Synergistic Excellence Award -> Lakas ng Pagtutulungan Award ----------
update public.award_categories
set i18n = jsonb_set(
  i18n, '{tl}', coalesce(i18n -> 'tl', '{}'::jsonb) || '{"name":"Lakas ng Pagtutulungan Award","description":"Para ito sa departamento, opisina, yunit, o komite na nagpapakita ng mahusay na teamwork at maayos na koordinasyon. Sa pamamagitan ng kanilang pagkakaisa, magandang ideya, at pagtutulungan, nakagagawa sila ng mga resulta o proyekto na may malaking kontribusyon sa Pamantasan."}'::jsonb, true
)
where id = '21111111-1111-4111-8111-111111111104';
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Kolektibo at Husay sa Pagtutulungan"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 1;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Kahusayan sa Pagpapatupad at Inobasyon"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 2;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Kalidad ng Kinalabasan at Pinagsamang Tagumpay"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 3;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Magkakaugnay na Kultura at Moral"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 4;

-- ---------- Serbisyong May Malasakit Award ----------
update public.award_categories
set i18n = jsonb_set(
  i18n, '{tl}', coalesce(i18n -> 'tl', '{}'::jsonb) || '{"description":"Para ito sa empleyadong laging handang gumawa nang may higit pa sa kanyang tungkulin para makatulong sa iba. Sa kanyang malasakit, pag-unawa, at buong pusong serbisyo, ipinakikita niya na ang tunay na paglilingkod ay ginagawa nang may puso at sinseridad."}'::jsonb, true
)
where id = '21111111-1111-4111-8111-111111111105';
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Tunay na Malasakit at Pag-unawa sa Damdamin ng Iba"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 1;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Maagap na Pagtulong (Malasakit sa Gawa)"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 2;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Buong-Pusong Dedikasyon"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 3;
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Positibong Epekto ng Paggawa sa Kapwa"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 4;

-- Sanity check:
-- select c.sort_order, c.name, c.i18n -> 'tl' ->> 'name' as tagalog
-- from public.criteria c
-- join public.award_categories a on a.id = c.category_id
-- where a.event_id = '11111111-1111-4111-8111-111111111111'
-- order by a.sort_order, c.sort_order;
-- select name, i18n -> 'tl' ->> 'name' from public.award_categories
-- where event_id = '11111111-1111-4111-8111-111111111111' order by sort_order;
