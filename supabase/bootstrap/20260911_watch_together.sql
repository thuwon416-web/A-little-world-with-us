CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  watched_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_watchlist_couple_position ON public.watchlist(couple_id, position);
CREATE INDEX IF NOT EXISTS idx_watch_history_couple_watched_at ON public.watch_history(couple_id, watched_at DESC);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS couple_watchlist_access ON public.watchlist;
CREATE POLICY couple_watchlist_access ON public.watchlist
  FOR ALL USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

DROP POLICY IF EXISTS couple_watch_history_access ON public.watch_history;
CREATE POLICY couple_watch_history_access ON public.watch_history
  FOR ALL USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));
