-- =============================================================
-- Seed: PRAISEC Awards 2026 (75th Founding Anniversary, MinSU Main Campus)
-- Apply AFTER 001_init.sql
-- =============================================================

insert into public.events
  (id, slug, title, description, welcome_text, opens_at, closes_at, status, primary_color, accent_color)
values (
  '11111111-1111-4111-8111-111111111111',
  'praisec-2026',
  'PRAISEC Awards 2026',
  'As Mindoro State University - Main Campus marks its Diamond Jubilee — its 75th Founding Anniversary — this Recognition Ceremony stands as a prestigious platform to honor the individuals and groups whose unwavering dedication, exceptional performance, and invaluable contributions have propelled our institution to greater heights of excellence and community impact.',
  'Welcome! Nominate a colleague or unit whose service embodies excellence, compassion, and malasakit. Review each award''s criteria below, then submit your nomination with a clear justification and supporting documents.',
  now(),
  '2026-08-31T23:59:59+08:00',
  'open',
  '#1e3a8a',
  '#f59e0b'
);

-- ---------- Categories ----------
insert into public.award_categories (id, event_id, name, type, description, eligible_groups, sort_order) values
('21111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111',
 'The Legacy Builder Award', 'individual',
 'A prestigious individual recognition for a long-serving faculty member, administrative official, or personnel whose profound vision, pioneering leadership, and steadfast dedication have fundamentally shaped the history, growth, and institutional culture of Mindoro State University.',
 null, 1),
('21111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111',
 'The Unsung Hero Award', 'individual',
 'A heartfelt individual recognition dedicated to a rank-and-file or support personnel whose quiet dedication, tireless efforts, and selfless service form the backbone of everyday operations — often behind the scenes, without seeking praise or recognition.',
 array['permanent_non_teaching','job_order_cos']::public.employment_group[], 2),
('21111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111',
 'The Most Courteous Award', 'individual',
 'Recognizes frontline, office, or rank-and-file personnel who consistently embody the highest standards of professional etiquette, warmth, and respect — a welcoming face of the university for students, colleagues, and external stakeholders.',
 null, 3),
('21111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111111',
 'The Synergistic Excellence Award', 'team',
 'A prestigious unit or team recognition for a department, office, unit, or cross-functional committee whose exceptional collaboration, seamless coordination, and collective ingenuity have produced extraordinary outcomes for the university.',
 null, 4),
('21111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111111',
 'Serbisyong May Malasakit Award', 'individual',
 'A distinguished individual recognition for an employee who consistently goes beyond the call of duty, demonstrating deep compassion, genuine empathy, and wholehearted dedication to public service — proof that true service is rooted in care and sincerity.',
 null, 5),
('21111111-1111-4111-8111-111111111106', '11111111-1111-4111-8111-111111111111',
 'Best in Attendance Award', 'individual',
 'A specialized individual recognition for an employee whose unwavering dependability, strict punctuality, and exemplary attendance record serve as a gold standard for the institution.',
 null, 6);

-- ---------- Criteria ----------
insert into public.criteria (category_id, name, description, weight, sort_order) values
-- Legacy Builder
('21111111-1111-4111-8111-111111111101', 'Longevity and Sustained Contribution', 'Substantial years of dedicated service with a consistent record of exemplary performance, loyalty, and institutional commitment.', 30, 1),
('21111111-1111-4111-8111-111111111101', 'Pioneering Leadership and Impact', 'Visionary leadership through initiation, development, or institutionalization of major programs, policies, projects, or structural advancements.', 30, 2),
('21111111-1111-4111-8111-111111111101', 'Culture Building and Mentorship', 'Fostered a positive institutional culture, mentored colleagues, and modeled integrity, professionalism, and core values.', 20, 3),
('21111111-1111-4111-8111-111111111101', 'Transformative Legacy', 'Enduring positive impact on academic standing, community relations, or operational efficiency that continues to benefit the institution.', 20, 4),
-- Unsung Hero
('21111111-1111-4111-8111-111111111102', 'Exceptional Dedication and Reliability', 'Unwavering dependability, punctuality, and strong work ethic in daily duties, often under challenging conditions or tight deadlines.', 35, 1),
('21111111-1111-4111-8111-111111111102', 'Going Above and Beyond', 'Voluntarily takes on extra tasks and helps other offices or colleagues beyond the formal job description, without expecting praise.', 30, 2),
('21111111-1111-4111-8111-111111111102', 'Operational Impact and Resourcefulness', 'Resourcefulness, problem-solving, and efficiency in keeping day-to-day operations running smoothly, safely, and seamlessly.', 20, 3),
('21111111-1111-4111-8111-111111111102', 'Exemplary Attitude and Core Values', 'Humility, compassion, teamwork, and a positive attitude — a quiet pillar of inspiration embodying the university''s core values.', 15, 4),
-- Most Courteous
('21111111-1111-4111-8111-111111111103', 'Exceptional Professional Etiquette and Warmth', 'Polite, welcoming, approachable demeanor; greets every stakeholder, student, and colleague with genuine warmth and respect.', 35, 1),
('21111111-1111-4111-8111-111111111103', 'Patience and Effective De-escalation', 'Remarkable patience, emotional intelligence, and composure with difficult inquiries or high-stress situations.', 30, 2),
('21111111-1111-4111-8111-111111111103', 'Inclusivity and Respect for Diversity', 'Treats everyone fairly and equitably regardless of status, background, or identity.', 20, 3),
('21111111-1111-4111-8111-111111111103', 'Positive Institutional Representation', 'A commendable ambassador of the university, leaving a lasting positive impression of public service excellence.', 15, 4),
-- Synergistic Excellence
('21111111-1111-4111-8111-111111111104', 'Collaborative Impact and Teamwork', 'Exceptional cross-functional collaboration and synergy, breaking down operational silos to achieve shared milestones.', 35, 1),
('21111111-1111-4111-8111-111111111104', 'Operational Efficiency and Innovation', 'Streamlined processes, optimized resources, or introduced innovative systems that significantly improved productivity.', 30, 2),
('21111111-1111-4111-8111-111111111104', 'Quality of Output and Shared Success', 'Outstanding, high-impact collective results proving combined efforts produced far greater outcomes than individual capacities.', 20, 3),
('21111111-1111-4111-8111-111111111104', 'Cohesive Culture and Morale', 'A supportive, communicative, positive work environment marked by mutual trust, accountability, and alignment with core values.', 15, 4),
-- Serbisyong May Malasakit
('21111111-1111-4111-8111-111111111105', 'Genuine Compassion (Malasakit) and Empathy', 'Deep concern and understanding for the needs and well-being of students, colleagues, and stakeholders — people first, always.', 35, 1),
('21111111-1111-4111-8111-111111111105', 'Proactive Assistance (Malasakit in Action)', 'Voluntarily steps up to address problems and provide solutions even outside formal responsibilities, anticipating needs.', 30, 2),
('21111111-1111-4111-8111-111111111105', 'Selfless Dedication', 'Unwavering commitment to public service without expecting personal gain, praise, or reward.', 20, 3),
('21111111-1111-4111-8111-111111111105', 'Positive Human Impact', 'Leaves a lasting, comforting, and inspiring impression, fostering trust, warmth, and a strong sense of community.', 15, 4),
-- Best in Attendance
('21111111-1111-4111-8111-111111111106', 'PRAISEC Attendance Metrics', 'Selection and evaluation strictly based on the existing guidelines, metrics, and parameters of the MinSU PRAISEC.', 100, 1);

-- ---------- Sample roster (from client checklist; admin will import the full list) ----------
insert into public.roster_people (event_id, full_name, position, classification) values
('11111111-1111-4111-8111-111111111111', 'Abog, Darius Mabuyog', 'Instructor III', 'permanent_teaching'),
('11111111-1111-4111-8111-111111111111', 'Aclan, Ryan R.', 'Instructor I', 'permanent_teaching'),
('11111111-1111-4111-8111-111111111111', 'Agoncillo, Edgardo Soretes', 'Associate Professor IV', 'permanent_teaching'),
('11111111-1111-4111-8111-111111111111', 'Anthony, John Edgar Sualog', 'Associate Professor IV / Dean, College of Computer Studies', 'permanent_teaching'),
('11111111-1111-4111-8111-111111111111', 'Apostol, Christian Buñag', 'Associate Professor II', 'permanent_teaching'),
('11111111-1111-4111-8111-111111111111', 'Abog, Portia Angelica Bueno', 'Administrative Officer V (Quality Assurance Director)', 'permanent_non_teaching'),
('11111111-1111-4111-8111-111111111111', 'Advincula, Caryl Audrey King', 'Legal Assistant III', 'permanent_non_teaching'),
('11111111-1111-4111-8111-111111111111', 'Apostol, Enya Marie D.', 'SUC President III', 'permanent_non_teaching'),
('11111111-1111-4111-8111-111111111111', 'Arago, Jessa Sumague', 'Administrative Assistant III', 'permanent_non_teaching'),
('11111111-1111-4111-8111-111111111111', 'Atienza, Romualdo Arsanan', 'Security Guard I', 'permanent_non_teaching'),
('11111111-1111-4111-8111-111111111111', 'Aducon, Jenna Mae Boncato', 'Administrative Aide', 'job_order_cos'),
('11111111-1111-4111-8111-111111111111', 'Arcon, Lee-Mar M.', 'Programmer', 'job_order_cos'),
('11111111-1111-4111-8111-111111111111', 'Almeniana, Malyn Gandia', 'Emergency Laborer', 'job_order_cos'),
('11111111-1111-4111-8111-111111111111', 'Bautista, Maria Althea T.', 'Research Specialist', 'job_order_cos'),
('11111111-1111-4111-8111-111111111111', 'Braña, Jolly O.', null, 'job_order_cos');

-- ---------- Sample units for team awards ----------
insert into public.units (event_id, name) values
('11111111-1111-4111-8111-111111111111', 'Office of the University Registrar'),
('11111111-1111-4111-8111-111111111111', 'Human Resource Management Office'),
('11111111-1111-4111-8111-111111111111', 'Quality Assurance Office'),
('11111111-1111-4111-8111-111111111111', 'College of Computer Studies'),
('11111111-1111-4111-8111-111111111111', 'University Library'),
('11111111-1111-4111-8111-111111111111', 'Security Services Unit'),
('11111111-1111-4111-8111-111111111111', 'Supply and Property Management Office');
