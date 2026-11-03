-- CommunityReactionButton.tsx now offers 20 reactions:
--   bullish, bearish, fire, love, thumbs_up, thumbs_down, strong_hold, insightful,
--   watch, laugh, celebrate, trophy, heartbreak, shocked, thinking, cant_look,
--   hopeful, mind_blown, cool, shark
-- plus 3 legacy ids still rendered for historical data: cautious, support, disagree.
--
-- The CHECK constraint added in 20260806090000 only allowed:
--   insightful, bullish, bearish, strong_hold, watch, fire, laugh, love,
--   cautious, support, disagree
--
-- That means thumbs_up and thumbs_down were never actually allowed (despite being
-- in the UI since that migration), and none of the 10 new finance reactions added
-- since (celebrate, trophy, heartbreak, shocked, thinking, cant_look, hopeful,
-- mind_blown, cool, shark) can be saved either — every one of them fails with
-- "violates check constraint post_reactions_reaction_check" / "comment_reactions_reaction_check".
--
-- Same fix as before: find whatever CHECK constraint currently exists on the
-- "reaction" column (regardless of its exact name) and replace it with one that
-- allows every reaction id the frontend can actually send.

DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.post_reactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%reaction%'
  LOOP
    EXECUTE format('ALTER TABLE public.post_reactions DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_reaction_check
  CHECK (reaction IN (
    'insightful','bullish','bearish','strong_hold','watch','fire','laugh','love',
    'thumbs_up','thumbs_down',
    'celebrate','trophy','heartbreak','shocked','thinking','cant_look','hopeful','mind_blown','cool','shark',
    'cautious','support','disagree'
  ));

DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.comment_reactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%reaction%'
  LOOP
    EXECUTE format('ALTER TABLE public.comment_reactions DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE public.comment_reactions ADD CONSTRAINT comment_reactions_reaction_check
  CHECK (reaction IN (
    'insightful','bullish','bearish','strong_hold','watch','fire','laugh','love',
    'thumbs_up','thumbs_down',
    'celebrate','trophy','heartbreak','shocked','thinking','cant_look','hopeful','mind_blown','cool','shark',
    'cautious','support','disagree'
  ));