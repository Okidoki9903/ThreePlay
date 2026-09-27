-- =============================================================================
-- ThreePlay — seed data
-- Categories, 3 demo users, 10 real public Three.js games/demos,
-- a week of synthetic plays and a handful of reviews.
-- Safe to re-run: everything is upserted / cleared first.
-- =============================================================================

-- Categories -------------------------------------------------------------------
insert into public.categories (slug, name, description, icon, sort_order) values
  ('racing',       'Racing',       'Speed, drifting and time trials.',                 'car',           1),
  ('fps',          'FPS',          'First-person shooters and arenas.',                'crosshair',     2),
  ('puzzle',       'Puzzle',       'Brain teasers in three dimensions.',               'puzzle',        3),
  ('platformer',   'Platformer',   'Run, jump and climb.',                             'footprints',    4),
  ('arcade',       'Arcade',       'Quick sessions, high scores.',                     'joystick',      5),
  ('simulation',   'Simulation',   'Physics toys and systems to poke at.',             'atom',          6),
  ('sandbox',      'Sandbox',      'Build, paint and create.',                         'boxes',         7),
  ('horror',       'Horror',       'Dark corridors and things that go bump.',          'ghost',         8),
  ('multiplayer',  'Multiplayer',  'Play with (or against) other people.',             'users',         9),
  ('experimental', 'Experimental', 'Shaders, tech demos and the weird stuff.',         'flask-conical', 10)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  icon = excluded.icon, sort_order = excluded.sort_order;

-- Demo users (local development only; they have no password and cannot log in) --
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'ada@threeplay.dev', '', now(), '{"provider":"email","providers":["email"]}',
   '{"user_name":"ada_voxel","full_name":"Ada Voxel"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'linus@threeplay.dev', '', now(), '{"provider":"email","providers":["email"]}',
   '{"user_name":"linus_shader","full_name":"Linus Shader"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
   'grace@threeplay.dev', '', now(), '{"provider":"email","providers":["email"]}',
   '{"user_name":"grace_mesh","full_name":"Grace Mesh"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- Games --------------------------------------------------------------------------
insert into public.games (
  id, slug, title, short_description, long_description, category_slug, tags,
  cover_url, screenshots, game_url, controls, developer_name, developer_url, source_url,
  status, is_featured, featured_at, threejs_detected, released_at, approved_at
) values
(
  'a0000000-0000-4000-8000-000000000001', 'the-aviator', 'The Aviator',
  'Pilot a tiny low-poly plane over a rolling sea, dodge enemies and collect coins.',
  E'The Aviator is a charming little endless flyer built with Three.js by Karim Maaloul for Codrops.\n\nSteer your plane with the mouse, keep your energy up by collecting blue coins and avoid the red obstacles. Everything — the sea, the clouds, the pilot''s hair blowing in the wind — is built from simple geometries and flat shading, which makes it a great example of how far a stylised look can go.',
  'arcade', array['low-poly', 'flying', 'endless', 'mouse', 'classic'],
  '/seed/the-aviator.svg', array['/seed/the-aviator.svg'],
  'https://tympanus.net/Tutorials/TheAviator/',
  E'Mouse — steer the plane\nClick — replay after game over',
  'Karim Maaloul', 'https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/',
  'https://github.com/yakudoo/TheAviator',
  'approved', true, now(), true, '2016-04-26', now()
),
(
  'a0000000-0000-4000-8000-000000000002', 'octree-arena', 'Octree Arena',
  'The official Three.js FPS example: run, jump and throw spheres around a collision arena.',
  E'A compact first-person playground that ships with Three.js. It demonstrates capsule-vs-octree collision, sphere physics and pointer-lock controls in just a few hundred lines.\n\nHold the mouse button to charge a throw and watch the spheres bounce off the level geometry and each other.',
  'fps', array['first-person', 'physics', 'official-example', 'pointer-lock'],
  'https://threejs.org/examples/screenshots/games_fps.jpg',
  array['https://threejs.org/examples/screenshots/games_fps.jpg'],
  'https://threejs.org/examples/games_fps.html',
  E'Click — lock pointer\nW A S D — move\nSpace — jump\nHold mouse — charge & throw sphere',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/games_fps.html',
  'approved', false, null, true, '2021-08-26', now()
),
(
  'a0000000-0000-4000-8000-000000000003', 'tower-blocks', 'Tower Blocks',
  'Stack sliding blocks as high as you can. Miss the edge and your tower shrinks.',
  E'A beautifully simple stacking game by Steve Gardner. Each block slides in from the side; tap at the right moment to drop it on the tower. Whatever overhangs gets sliced off, so precision is everything.\n\nThe pastel palette and smooth camera make it one of the most loved Three.js pens on CodePen.',
  'puzzle', array['stacking', 'one-button', 'timing', 'mobile-friendly'],
  '/seed/tower-blocks.svg', array['/seed/tower-blocks.svg'],
  'https://codepen.io/ste-vg/embed/ppLQNW?default-tab=result&theme-id=dark',
  E'Click / Tap / Space — drop the block',
  'Steve Gardner', 'https://codepen.io/ste-vg', 'https://codepen.io/ste-vg/pen/ppLQNW',
  'approved', false, null, true, '2017-12-14', now()
),
(
  'a0000000-0000-4000-8000-000000000004', 'crossy-road-3d', 'Crossy Road 3D',
  'Hop a chicken across busy roads in this voxel-style tribute built with Three.js.',
  E'Hunor Márton Borbély''s Three.js take on the classic endless road-crossing game. Every car, tree and lane is generated procedurally, and the orthographic camera nails that toy-box look.\n\nHow far can you get before a truck ends your run?',
  'arcade', array['endless', 'voxel', 'keyboard', 'retro'],
  '/seed/crossy-road.svg', array['/seed/crossy-road.svg'],
  'https://codepen.io/HunorMarton/embed/JwWLJo?default-tab=result&theme-id=dark',
  E'Arrow keys — hop forward / back / left / right',
  'Hunor Márton Borbély', 'https://codepen.io/HunorMarton', 'https://codepen.io/HunorMarton/pen/JwWLJo',
  'approved', false, null, true, '2019-01-08', now()
),
(
  'a0000000-0000-4000-8000-000000000005', 'box-hopper', 'Box Hopper',
  'Pointer-lock first-person platforming across a field of floating coloured boxes.',
  E'Based on the Three.js pointer-lock controls example. Jump from box to box and see how high you can climb.\n\nIt is a minimal but surprisingly addictive platformer that shows off first-person movement with simple ray-based ground detection.',
  'platformer', array['first-person', 'jumping', 'official-example', 'pointer-lock'],
  'https://threejs.org/examples/screenshots/misc_controls_pointerlock.jpg',
  array['https://threejs.org/examples/screenshots/misc_controls_pointerlock.jpg'],
  'https://threejs.org/examples/misc_controls_pointerlock.html',
  E'Click — start\nW A S D / Arrows — move\nSpace — jump\nEsc — release pointer',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/misc_controls_pointerlock.html',
  'approved', false, null, true, '2019-06-01', now()
),
(
  'a0000000-0000-4000-8000-000000000006', 'demolition-lab', 'Demolition Lab',
  'Fire heavy balls at breakable towers and watch them shatter with Ammo.js physics.',
  E'A destruction sandbox built on Three.js and Ammo.js (Bullet physics). Every wall and pillar is convex-breakable: click to launch a ball and see the fragments fly.\n\nGreat for a few minutes of pure physics catharsis.',
  'simulation', array['physics', 'destruction', 'ammo.js', 'official-example'],
  'https://threejs.org/examples/screenshots/physics_ammo_break.jpg',
  array['https://threejs.org/examples/screenshots/physics_ammo_break.jpg'],
  'https://threejs.org/examples/physics_ammo_break.html',
  E'Click — shoot a ball\nDrag — orbit camera',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/physics_ammo_break.html',
  'approved', false, null, true, '2017-06-20', now()
),
(
  'a0000000-0000-4000-8000-000000000007', 'voxel-painter', 'Voxel Painter',
  'Click to place and remove cubes on a grid. A tiny Minecraft-style creative mode.',
  E'The classic Three.js voxel painter: raycast onto a grid, drop cubes, shift-click to delete. It is small, instant and a great sandbox for building little sculptures.',
  'sandbox', array['voxel', 'building', 'creative', 'official-example'],
  'https://threejs.org/examples/screenshots/webgl_interactive_voxelpainter.jpg',
  array['https://threejs.org/examples/screenshots/webgl_interactive_voxelpainter.jpg'],
  'https://threejs.org/examples/webgl_interactive_voxelpainter.html',
  E'Click — place voxel\nShift + Click — remove voxel',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/webgl_interactive_voxelpainter.html',
  'approved', false, null, true, '2013-03-01', now()
),
(
  'a0000000-0000-4000-8000-000000000008', 'gpgpu-flock', 'GPGPU Flock',
  'Thousands of birds simulated on the GPU. Move the mouse to scatter the flock.',
  E'A mesmerising flocking simulation where position and velocity of every bird live in floating-point textures and are updated in fragment shaders.\n\nNot a game in the classic sense — but a perfect showcase of what browser GPUs can do.',
  'experimental', array['gpgpu', 'shaders', 'boids', 'official-example'],
  'https://threejs.org/examples/screenshots/webgl_gpgpu_birds.jpg',
  array['https://threejs.org/examples/screenshots/webgl_gpgpu_birds.jpg'],
  'https://threejs.org/examples/webgl_gpgpu_birds.html',
  E'Mouse — disturb the flock\nPanel — tweak separation, alignment and cohesion',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/webgl_gpgpu_birds.html',
  'approved', false, null, true, '2014-05-01', now()
),
(
  'a0000000-0000-4000-8000-000000000009', 'open-ocean', 'Open Ocean',
  'A realistic ocean and sky shader you can fly around. Pure atmosphere.',
  E'Rolling waves, a physically-based sky and a spinning cube floating on the water. Tweak the sun elevation and watch the lighting shift in real time.',
  'experimental', array['water', 'sky', 'shaders', 'official-example', 'chill'],
  'https://threejs.org/examples/screenshots/webgl_shaders_ocean.jpg',
  array['https://threejs.org/examples/screenshots/webgl_shaders_ocean.jpg'],
  'https://threejs.org/examples/webgl_shaders_ocean.html',
  E'Drag — orbit\nScroll — zoom\nPanel — adjust sun & water',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shaders_ocean.html',
  'approved', false, null, true, '2015-02-01', now()
),
(
  'a0000000-0000-4000-8000-000000000010', 'jelly-physics', 'Jelly Physics',
  'Squishy soft bodies you can bombard with balls. Bullet soft-body physics in the browser.',
  E'Soft volumes simulated with Ammo.js. Click to throw balls at the jelly shapes and watch them deform and wobble.',
  'simulation', array['physics', 'soft-body', 'ammo.js', 'official-example'],
  'https://threejs.org/examples/screenshots/physics_ammo_volume.jpg',
  array['https://threejs.org/examples/screenshots/physics_ammo_volume.jpg'],
  'https://threejs.org/examples/physics_ammo_volume.html',
  E'Click — throw a ball\nDrag — orbit camera',
  'three.js authors', 'https://threejs.org', 'https://github.com/mrdoob/three.js/blob/dev/examples/physics_ammo_volume.html',
  'approved', false, null, true, '2016-10-01', now()
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, short_description = excluded.short_description,
  long_description = excluded.long_description, category_slug = excluded.category_slug,
  tags = excluded.tags, cover_url = excluded.cover_url, screenshots = excluded.screenshots,
  game_url = excluded.game_url, controls = excluded.controls,
  developer_name = excluded.developer_name, developer_url = excluded.developer_url,
  source_url = excluded.source_url, status = excluded.status;

-- Synthetic plays spread over the last 10 days ------------------------------------
delete from public.plays where game_id::text like 'a0000000-%';

insert into public.plays (game_id, created_at)
select g.id, now() - (random() * interval '10 days')
from public.games g
cross join lateral generate_series(1, (
  case g.slug
    when 'the-aviator'    then 180
    when 'octree-arena'   then 140
    when 'tower-blocks'   then 160
    when 'crossy-road-3d' then 120
    when 'box-hopper'     then 60
    when 'demolition-lab' then 90
    when 'voxel-painter'  then 70
    when 'gpgpu-flock'    then 40
    when 'open-ocean'     then 35
    else 50
  end)) as s
where g.id::text like 'a0000000-%';

update public.games g
set play_count = (select count(*) from public.plays p where p.game_id = g.id)
where g.id::text like 'a0000000-%';

-- Reviews (rating aggregates are maintained by trigger) ----------------------------
insert into public.reviews (game_id, user_id, rating, body, created_at) values
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 5, 'Still one of the most charming Three.js games out there. That pilot''s hair!', now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 4, 'Lovely art direction, gets hard fast.', now() - interval '5 days'),
  ('a0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 5, '', now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 4, 'Tiny but the collision feels great. Perfect starting point for an FPS.', now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', 4, 'Throwing spheres never gets old.', now() - interval '6 days'),
  ('a0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 5, 'Dangerously addictive. My record is 31.', now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 5, 'Perfect one-button game.', now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 4, 'Great tribute, the ortho camera is spot on.', now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', 4, 'Pure physics joy.', now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 3, 'Simple, but my kid loved it.', now() - interval '8 days'),
  ('a0000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 5, 'Could watch this for hours.', now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', 4, 'Wobbly!', now() - interval '2 days')
on conflict (game_id, user_id) do nothing;

-- Favorites --------------------------------------------------------------------------
insert into public.favorites (user_id, game_id) values
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001'),
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003'),
  ('22222222-2222-4222-8222-222222222222', 'a0000000-0000-4000-8000-000000000003'),
  ('33333333-3333-4333-8333-333333333333', 'a0000000-0000-4000-8000-000000000002')
on conflict do nothing;
