-- =============================================================
-- Tagalog wording revisions requested by the client (PRAISEC committee)
--   "Maayos at tiyak naman po ang pagkakasalin sa bawat pamantayan sa 4 na
--    kategorya" — only these four criterion names were revised.
--   Touches i18n -> tl -> name only; descriptions and the English source text
--   are left as they are.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

-- ---------- The Most Courteous Award ----------
-- 2: "Pasensya at Mahusay na Pagpapakalma" -> requested wording
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Pasensya at Kahusayan sa Pakikitungo"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 2;

-- 4: "Positibong Representasyon ng Institusyon" -> requested wording
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Huwarang Representasyon ng Institusyon"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 4;

-- ---------- The Synergistic Excellence Award ----------
-- 1: "Epekto ng Pagtutulungan at Pangkatang Gawa" -> requested wording
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Kolektibong Ambag at Kahusayan sa Pagtutulungan"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 1;

-- 2: "Kahusayan sa Operasyon at Inobasyon" -> requested wording
update public.criteria
set i18n = jsonb_set(i18n, '{tl,name}', '"Kahusayan sa Pagpapatupad at Inobasyon"'::jsonb, true)
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 2;

-- Sanity check:
-- select sort_order, name, i18n -> 'tl' ->> 'name' as tagalog
-- from public.criteria
-- where category_id in ('21111111-1111-4111-8111-111111111103',
--                       '21111111-1111-4111-8111-111111111104')
-- order by category_id, sort_order;
