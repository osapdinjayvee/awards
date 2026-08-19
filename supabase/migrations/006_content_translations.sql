-- =============================================================
-- Translations for event content (Tagalog + Taglish)
--   Adds an i18n jsonb column to events, award_categories and criteria,
--   shaped { "tl": { "field": "..." }, "taglish": { ... } }, and fills it for
--   PRAISEC Awards 2026. Untranslated fields fall back to the original text.
--   Award titles are left as written — they are proper names.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

alter table public.events           add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.award_categories add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.criteria         add column if not exists i18n jsonb not null default '{}'::jsonb;

-- ---------- Event description + welcome text ----------
update public.events
set i18n = i18n || '{"tl":{"description":"Sa paggunita ng Mindoro State University - Main Campus sa kanyang Diamond Jubilee — ang ika-75 Anibersaryo ng Pagkakatatag — ang Seremonya ng Pagkilalang ito ay isang prestihiyosong plataporma upang parangalan ang mga indibidwal at pangkat na ang matatag na dedikasyon, natatanging pagganap, at napakahalagang ambag ang nagtulak sa ating institusyon tungo sa mas mataas na antas ng kahusayan at epekto sa komunidad.","welcome_text":"Maligayang pagdating! Bumoto para sa kasamahan o yunit na ang paglilingkod ay nagpapakita ng kahusayan, habag, at malasakit. Basahin muna ang pamantayan ng bawat parangal sa ibaba, pagkatapos ay piliin ang inyong nominado sa bawat seksyon."},"taglish":{"description":"Habang minamarkahan ng Mindoro State University - Main Campus ang Diamond Jubilee nito — ang 75th Founding Anniversary — ang Recognition Ceremony na ito ay prestigious na platform para i-honor ang mga individuals at groups na ang dedication, exceptional performance, at invaluable contributions ang nagtulak sa ating institution tungo sa mas mataas na excellence at community impact.","welcome_text":"Welcome! Bumoto para sa colleague o unit na ang service ay nagpapakita ng excellence, compassion, at malasakit. I-review muna ang criteria ng bawat award sa baba, tapos piliin ang inyong nominee kada section."}}'::jsonb
where id = '11111111-1111-4111-8111-111111111111';

-- ---------- Award descriptions ----------
update public.award_categories
set i18n = i18n || '{"tl":{"description":"Isang prestihiyosong pagkilala sa indibidwal na matagal nang naglilingkod bilang guro, opisyal, o kawani, na ang malalim na pananaw, nangungunang pamumuno, at matatag na dedikasyon ay humubog sa kasaysayan, paglago, at kultura ng Mindoro State University."},"taglish":{"description":"Prestigious na individual recognition para sa long-serving na faculty member, official, o personnel na ang vision, pioneering leadership, at steadfast dedication ang humubog sa history, growth, at institutional culture ng Mindoro State University."}}'::jsonb
where id = '21111111-1111-4111-8111-111111111101';
update public.award_categories
set i18n = i18n || '{"tl":{"description":"Isang taos-pusong pagkilala sa rank-and-file o support na kawani na ang tahimik na dedikasyon, walang sawang pagsisikap, at walang pag-iimbot na paglilingkod ang siyang haligi ng pang-araw-araw na operasyon — madalas sa likod ng eksena, nang hindi naghahangad ng papuri o pagkilala."},"taglish":{"description":"Heartfelt na recognition para sa rank-and-file o support personnel na ang tahimik na dedication, tireless na effort, at selfless service ang backbone ng daily operations — madalas behind the scenes, walang hinihinging papuri o recognition."}}'::jsonb
where id = '21111111-1111-4111-8111-111111111102';
update public.award_categories
set i18n = i18n || '{"tl":{"description":"Kinikilala ang frontline, opisina, o rank-and-file na kawani na palagiang nagpapakita ng pinakamataas na antas ng propesyonal na asal, init ng pakikitungo, at paggalang — ang malugod na mukha ng unibersidad para sa mga mag-aaral, kasamahan, at panlabas na stakeholder."},"taglish":{"description":"Kinikilala ang frontline, office, o rank-and-file personnel na consistent na nagpapakita ng highest standards ng professional etiquette, warmth, at respect — ang welcoming face ng university para sa students, colleagues, at external stakeholders."}}'::jsonb
where id = '21111111-1111-4111-8111-111111111103';
update public.award_categories
set i18n = i18n || '{"tl":{"description":"Isang prestihiyosong pagkilala sa yunit o pangkat — departamento, opisina, yunit, o cross-functional na komite — na ang natatanging pagtutulungan, maayos na koordinasyon, at sama-samang katalinuhan ay nagbunga ng pambihirang resulta para sa unibersidad."},"taglish":{"description":"Prestigious na unit o team recognition para sa department, office, unit, o cross-functional committee na ang exceptional collaboration, seamless coordination, at collective ingenuity ang nag-produce ng extraordinary outcomes para sa university."}}'::jsonb
where id = '21111111-1111-4111-8111-111111111104';
update public.award_categories
set i18n = i18n || '{"tl":{"description":"Isang natatanging pagkilala sa kawani na palagiang humihigit sa itinakdang tungkulin, nagpapakita ng malalim na malasakit, tunay na pag-unawa, at buong pusong dedikasyon sa paglilingkod sa bayan — patunay na ang tunay na serbisyo ay nag-uugat sa pagmamalasakit at katapatan."},"taglish":{"description":"Distinguished na individual recognition para sa employee na consistent na lumalampas sa call of duty, may deep compassion, genuine empathy, at wholehearted dedication sa public service — proof na ang tunay na serbisyo ay nakaugat sa malasakit at sincerity."}}'::jsonb
where id = '21111111-1111-4111-8111-111111111105';

-- ---------- Criteria names + descriptions ----------
update public.criteria
set i18n = i18n || '{"tl":{"name":"Haba ng Paglilingkod at Tuloy-tuloy na Ambag","description":"Maraming taon ng dedikadong paglilingkod na may tuloy-tuloy na talaan ng huwarang pagganap, katapatan, at pangako sa institusyon."},"taglish":{"name":"Longevity at Sustained Contribution","description":"Substantial na years ng dedicated service na may consistent na record ng exemplary performance, loyalty, at institutional commitment."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111101' and sort_order = 1;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Nangungunang Pamumuno at Epekto","description":"Mapanuring pamumuno sa pagsisimula, pagpapaunlad, o pag-institusyonalisa ng mahahalagang programa, patakaran, proyekto, o pagbabagong pang-istruktura."},"taglish":{"name":"Pioneering Leadership at Impact","description":"Visionary leadership sa pag-initiate, pag-develop, o pag-institutionalize ng major programs, policies, projects, o structural advancements."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111101' and sort_order = 2;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Paghubog ng Kultura at Paggabay","description":"Nagpalaganap ng positibong kultura sa institusyon, gumabay sa mga kasamahan, at naging huwaran ng integridad, propesyonalismo, at pangunahing pagpapahalaga."},"taglish":{"name":"Culture Building at Mentorship","description":"Nag-foster ng positive institutional culture, nag-mentor sa colleagues, at naging model ng integrity, professionalism, at core values."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111101' and sort_order = 3;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Nagbabagong Pamana","description":"Pangmatagalang positibong epekto sa katayuang pang-akademiko, ugnayan sa komunidad, o kahusayan sa operasyon na patuloy na nakikinabangan ng institusyon."},"taglish":{"name":"Transformative Legacy","description":"Enduring na positive impact sa academic standing, community relations, o operational efficiency na patuloy na nakakatulong sa institution."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111101' and sort_order = 4;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Natatanging Dedikasyon at Pagiging Maaasahan","description":"Matatag na pagiging maaasahan, pagiging maagap, at masipag na pagtatrabaho sa pang-araw-araw na tungkulin, kadalasan sa mahihirap na kondisyon o masikip na deadline."},"taglish":{"name":"Exceptional Dedication at Reliability","description":"Unwavering na dependability, punctuality, at strong work ethic sa daily duties, kadalasan under challenging conditions o tight deadlines."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 1;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Higit sa Inaasahan","description":"Kusang-loob na tumatanggap ng dagdag na gawain at tumutulong sa ibang opisina o kasamahan lampas sa nakatakdang tungkulin, nang hindi naghihintay ng papuri."},"taglish":{"name":"Going Above and Beyond","description":"Voluntarily na tumatanggap ng extra tasks at tumutulong sa ibang offices o colleagues lampas sa formal job description, walang hinihintay na papuri."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 2;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Epekto sa Operasyon at Pagiging Maparaan","description":"Pagiging maparaan, mahusay sa paglutas ng suliranin, at episyente upang manatiling maayos, ligtas, at walang patid ang pang-araw-araw na operasyon."},"taglish":{"name":"Operational Impact at Resourcefulness","description":"Resourcefulness, problem-solving, at efficiency para manatiling smooth, safe, at seamless ang day-to-day operations."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 3;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Huwarang Pag-uugali at Pangunahing Pagpapahalaga","description":"Kababaang-loob, malasakit, pagtutulungan, at positibong pag-uugali — isang tahimik na haligi ng inspirasyon na nagtataglay ng pagpapahalaga ng unibersidad."},"taglish":{"name":"Exemplary Attitude at Core Values","description":"Humility, compassion, teamwork, at positive attitude — tahimik na pillar ng inspiration na nag-e-embody sa core values ng university."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111102' and sort_order = 4;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Natatanging Propesyonal na Asal at Init ng Pakikitungo","description":"Magalang, malugod, at madaling lapitan; binabati ang bawat stakeholder, mag-aaral, at kasamahan nang may tunay na init at paggalang."},"taglish":{"name":"Exceptional Professional Etiquette at Warmth","description":"Polite, welcoming, at approachable; binabati ang bawat stakeholder, student, at colleague nang may genuine warmth at respect."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 1;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Pasensya at Mahusay na Pagpapakalma","description":"Kahanga-hangang pasensya, emosyonal na katalinuhan, at kahinahunan sa mahihirap na katanungan o mataas na tensyong sitwasyon."},"taglish":{"name":"Patience at Effective De-escalation","description":"Remarkable na patience, emotional intelligence, at composure sa difficult inquiries o high-stress na situations."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 2;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Pagiging Bukas at Paggalang sa Pagkakaiba-iba","description":"Pantay at patas ang pakikitungo sa lahat anuman ang katayuan, pinagmulan, o pagkakakilanlan."},"taglish":{"name":"Inclusivity at Respect for Diversity","description":"Fair at equitable ang treatment sa lahat regardless ng status, background, o identity."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 3;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Positibong Representasyon ng Institusyon","description":"Kapuri-puring embahador ng unibersidad na nag-iiwan ng pangmatagalang positibong impresyon ng kahusayan sa paglilingkod."},"taglish":{"name":"Positive Institutional Representation","description":"Commendable na ambassador ng university, nag-iiwan ng lasting positive impression ng public service excellence."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111103' and sort_order = 4;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Epekto ng Pagtutulungan at Pangkatang Gawa","description":"Natatanging cross-functional na pagtutulungan at sinergiya, binabasag ang mga hadlang sa operasyon upang makamit ang magkakatuwang na layunin."},"taglish":{"name":"Collaborative Impact at Teamwork","description":"Exceptional na cross-functional collaboration at synergy, binabasag ang operational silos para ma-achieve ang shared milestones."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 1;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Kahusayan sa Operasyon at Inobasyon","description":"Pinasimple ang mga proseso, pinakinabangan nang husto ang yaman, o nagpakilala ng makabagong sistema na malaki ang naitulong sa produktibidad."},"taglish":{"name":"Operational Efficiency at Innovation","description":"Nag-streamline ng processes, nag-optimize ng resources, o nag-introduce ng innovative systems na malaki ang na-improve sa productivity."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 2;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Kalidad ng Produkto at Sama-samang Tagumpay","description":"Namumukod-tanging sama-samang resulta na nagpapatunay na higit ang nagagawa ng pinagsamang pagsisikap kaysa sa indibidwal na kakayahan."},"taglish":{"name":"Quality of Output at Shared Success","description":"Outstanding at high-impact na collective results na nagpapatunay na mas malaki ang naa-achieve ng combined efforts kaysa individual capacities."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 3;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Magkakaugnay na Kultura at Sigla","description":"Mapagkalinga, bukas sa komunikasyon, at positibong kapaligiran sa trabaho na may tiwala, pananagutan, at pagkakatugma sa pagpapahalaga ng institusyon."},"taglish":{"name":"Cohesive Culture at Morale","description":"Supportive, communicative, at positive na work environment na may mutual trust, accountability, at alignment sa core values."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111104' and sort_order = 4;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Tunay na Malasakit at Pag-unawa","description":"Malalim na pagmamalasakit at pag-unawa sa pangangailangan at kapakanan ng mga mag-aaral, kasamahan, at stakeholder — tao muna, palagi."},"taglish":{"name":"Genuine Compassion (Malasakit) at Empathy","description":"Deep na concern at understanding sa needs at well-being ng students, colleagues, at stakeholders — people first, palagi."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 1;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Maagap na Pagtulong (Malasakit sa Gawa)","description":"Kusang kumikilos upang tugunan ang suliranin at magbigay ng solusyon kahit labas sa pormal na tungkulin, nauunawaan ang pangangailangan bago pa hingin."},"taglish":{"name":"Proactive Assistance (Malasakit in Action)","description":"Voluntarily na kumikilos para i-address ang problems at magbigay ng solutions kahit outside ng formal responsibilities, na-a-anticipate ang needs."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 2;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Walang Pag-iimbot na Dedikasyon","description":"Matatag na pangako sa paglilingkod sa bayan nang hindi naghahangad ng personal na pakinabang, papuri, o gantimpala."},"taglish":{"name":"Selfless Dedication","description":"Unwavering na commitment sa public service na walang hinihintay na personal gain, papuri, o reward."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 3;
update public.criteria
set i18n = i18n || '{"tl":{"name":"Positibong Epekto sa Kapwa","description":"Nag-iiwan ng pangmatagalan, nakaaaliw, at nakasisiglang impresyon na nagpapatibay ng tiwala, init, at diwa ng pagkakaisa."},"taglish":{"name":"Positive Human Impact","description":"Nag-iiwan ng lasting, comforting, at inspiring na impression, nagpapatibay ng trust, warmth, at strong sense of community."}}'::jsonb
where category_id = '21111111-1111-4111-8111-111111111105' and sort_order = 4;

-- Sanity check:
-- select name, i18n -> 'tl' ->> 'description' from public.award_categories
--   where event_id = '11111111-1111-4111-8111-111111111111' order by sort_order;
-- select count(*) from public.criteria where i18n ? 'tl';  -- expect 20
