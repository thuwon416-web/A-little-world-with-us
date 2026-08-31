
---

### `supabase-schema.sql`

```sql
-- Memories table for the photo timeline
CREATE TABLE memories (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT NOT NULL,
  caption TEXT,
  date DATE NOT NULL
);

-- Messages table for real-time chat
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sender TEXT NOT NULL CHECK (sender IN ('me', 'her')),
  text TEXT NOT NULL
);

-- Cycle tracking data for Care Mode
CREATE TABLE IF NOT EXISTS cycle_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  start_date DATE NOT NULL,
  end_date DATE,
  phase TEXT,
  energy_level INT,
  mood TEXT,
  symptoms TEXT[],
  note TEXT
);

-- Time capsules for future messages
CREATE TABLE IF NOT EXISTS time_capsules (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reveal_at TIMESTAMPTZ NOT NULL
);

-- Secret letters vault
CREATE TABLE secret_letters (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT true
);

-- Enable Realtime for messages (run this or toggle in Dashboard)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Secure memory ownership migration
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS user_id UUID
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS memories_user_id_idx
  ON public.memories(user_id);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their memories" ON public.memories;
CREATE POLICY "Users can view their memories"
  ON public.memories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their memories" ON public.memories;
CREATE POLICY "Users can create their memories"
  ON public.memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their memories" ON public.memories;
CREATE POLICY "Users can update their memories"
  ON public.memories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their memories" ON public.memories;
CREATE POLICY "Users can delete their memories"
  ON public.memories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Private Storage bucket for uploaded memory images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memories',
  'memories',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload memory images" ON storage.objects;
CREATE POLICY "Users can upload memory images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view memory images" ON storage.objects;
CREATE POLICY "Users can view memory images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update memory images" ON storage.objects;
CREATE POLICY "Users can update memory images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete memory images" ON storage.objects;
CREATE POLICY "Users can delete memory images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Profiles and shared couple data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_not_own_partner CHECK (partner_id IS NULL OR partner_id <> id)
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'plan'
    CHECK (event_type IN ('anniversary', 'plan', 'reminder')),
  mood TEXT
    CHECK (mood IS NULL OR mood IN ('sweet', 'adventure', 'quiet', 'special')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bucket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
  link TEXT,
  reserved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  secret BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  board_key TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx
  ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS bucket_items_user_id_idx
  ON public.bucket_items(user_id);
CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx
  ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS wellness_entries_user_id_idx
  ON public.wellness_entries(user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS calendar_events_set_updated_at ON public.calendar_events;
CREATE TRIGGER calendar_events_set_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS bucket_items_set_updated_at ON public.bucket_items;
CREATE TRIGGER bucket_items_set_updated_at
  BEFORE UPDATE ON public.bucket_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS wishlist_items_set_updated_at ON public.wishlist_items;
CREATE TRIGGER wishlist_items_set_updated_at
  BEFORE UPDATE ON public.wishlist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS wellness_entries_set_updated_at ON public.wellness_entries;
CREATE TRIGGER wellness_entries_set_updated_at
  BEFORE UPDATE ON public.wellness_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_couple_member(record_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (id = record_user_id OR partner_id = record_user_id)
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view profiles" ON public.profiles;
CREATE POLICY "Couple members can view profiles"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR partner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Couple members can view calendar events" ON public.calendar_events;
CREATE POLICY "Couple members can view calendar events"
  ON public.calendar_events FOR SELECT
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Users can create calendar events" ON public.calendar_events;
CREATE POLICY "Users can create calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Couple members can update calendar events" ON public.calendar_events;
CREATE POLICY "Couple members can update calendar events"
  ON public.calendar_events FOR UPDATE
  USING (public.is_couple_member(user_id))
  WITH CHECK (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can delete calendar events" ON public.calendar_events;
CREATE POLICY "Couple members can delete calendar events"
  ON public.calendar_events FOR DELETE
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can view bucket items" ON public.bucket_items;
CREATE POLICY "Couple members can view bucket items"
  ON public.bucket_items FOR SELECT
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Users can create bucket items" ON public.bucket_items;
CREATE POLICY "Users can create bucket items"
  ON public.bucket_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Couple members can update bucket items" ON public.bucket_items;
CREATE POLICY "Couple members can update bucket items"
  ON public.bucket_items FOR UPDATE
  USING (public.is_couple_member(user_id))
  WITH CHECK (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can delete bucket items" ON public.bucket_items;
CREATE POLICY "Couple members can delete bucket items"
  ON public.bucket_items FOR DELETE
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can view wishlist items" ON public.wishlist_items;
CREATE POLICY "Couple members can view wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Users can create wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can create wishlist items"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Couple members can update wishlist items" ON public.wishlist_items;
CREATE POLICY "Couple members can update wishlist items"
  ON public.wishlist_items FOR UPDATE
  USING (public.is_couple_member(user_id))
  WITH CHECK (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can delete wishlist items" ON public.wishlist_items;
CREATE POLICY "Couple members can delete wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can view wellness entries" ON public.wellness_entries;
CREATE POLICY "Couple members can view wellness entries"
  ON public.wellness_entries FOR SELECT
  USING (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Users can create wellness entries" ON public.wellness_entries;
CREATE POLICY "Users can create wellness entries"
  ON public.wellness_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Couple members can update wellness entries" ON public.wellness_entries;
CREATE POLICY "Couple members can update wellness entries"
  ON public.wellness_entries FOR UPDATE
  USING (public.is_couple_member(user_id))
  WITH CHECK (public.is_couple_member(user_id));

DROP POLICY IF EXISTS "Couple members can delete wellness entries" ON public.wellness_entries;
CREATE POLICY "Couple members can delete wellness entries"
  ON public.wellness_entries FOR DELETE
  USING (public.is_couple_member(user_id));