
-- Add CampusCred ID (short unique handle) to profiles
CREATE OR REPLACE FUNCTION public.gen_campuscred_id()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
  exists_count int;
BEGIN
  LOOP
    result := 'CC';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.profiles WHERE campuscred_id = result;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN result;
END; $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campuscred_id text UNIQUE;

UPDATE public.profiles SET campuscred_id = public.gen_campuscred_id() WHERE campuscred_id IS NULL;

ALTER TABLE public.profiles ALTER COLUMN campuscred_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN campuscred_id SET DEFAULT public.gen_campuscred_id();

-- Update new-user handler to set campuscred_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, campuscred_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    public.gen_campuscred_id()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
