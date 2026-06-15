CREATE OR REPLACE FUNCTION public.gen_campuscred_id()
RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $$
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