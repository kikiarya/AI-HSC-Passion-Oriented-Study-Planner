-- =============================================
-- Sample Classes Seed
-- =============================================
-- Purpose: Provide initial classes so student registration with classCode works.
-- Notes:
-- - Adjusted to actual schema: code, name, teacher, color, description, location
-- - Uses WHERE NOT EXISTS to avoid duplicates if re-run
-- - If your classes table has additional NOT NULL columns, add defaults here

-- ELEC5620 (USYD)
insert into public.classes (code, name, teacher, color, description, location)
select 'ELEC5620-2025S1-A', 'ELEC5620 Power Systems Analysis', 'TBA', '#1E90FF',
       'Analysis, operation and planning of electric power systems, including load flow, fault analysis, protection and stability concepts.',
       'USYD / Online'
where not exists (
  select 1 from public.classes where code = 'ELEC5620-2025S1-A'
);

-- HSC Mathematics (Advanced)
insert into public.classes (code, name, teacher, color, description, location)
select 'MATH12-ADV-A', 'HSC Mathematics Advanced - A', 'TBA', '#2E8B57',
       'Advanced HSC Mathematics topics: calculus, functions, algebra, and probability. Structured for Year 12 exam preparation.',
       'HSC Campus'
where not exists (
  select 1 from public.classes where code = 'MATH12-ADV-A'
);

-- HSC Physics
insert into public.classes (code, name, teacher, color, description, location)
select 'PHYS12-A', 'HSC Physics - A', 'TBA', '#8A2BE2',
       'Core HSC Physics topics: mechanics, waves, electricity, and modern physics, aligned with Year 12 syllabus.',
       'HSC Campus'
where not exists (
  select 1 from public.classes where code = 'PHYS12-A'
);

-- Optional: Additional HSC samples
insert into public.classes (code, name, teacher, color, description, location)
select 'CHEM12-A', 'HSC Chemistry - A', 'TBA', '#FF8C00',
       'Structure, properties and reactions; quantitative chemistry and organic chemistry, aligned with Year 12 syllabus.',
       'HSC Campus'
where not exists (
  select 1 from public.classes where code = 'CHEM12-A'
);

insert into public.classes (code, name, teacher, color, description, location)
select 'ENGL12-STD-A', 'HSC English Standard - A', 'TBA', '#CD5C5C',
       'Critical reading and writing skills across texts and contexts, aligned with HSC English Standard.',
       'HSC Campus'
where not exists (
  select 1 from public.classes where code = 'ENGL12-STD-A'
);

-- =============================================
-- After running this script, valid class codes include:
--   ELEC5620-2025S1-A
--   MATH12-ADV-A
--   PHYS12-A
--   CHEM12-A
--   ENGL12-STD-A
-- Use one of these when registering a student.
-- =============================================
