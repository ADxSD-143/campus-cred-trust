
-- ENUM
CREATE TYPE public.loan_status AS ENUM ('requested','active','repaid','defaulted','cancelled','disputed');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  score NUMERIC(5,2) NOT NULL DEFAULT 50,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id) WITH CHECK (auth.uid()=id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);

-- LOANS
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL DEFAULT '',
  due_date DATE NOT NULL,
  status public.loan_status NOT NULL DEFAULT 'requested',
  initiator_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  funded_at TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  notes TEXT,
  CHECK (lender_id <> borrower_id)
);
CREATE INDEX ON public.loans (lender_id);
CREATE INDEX ON public.loans (borrower_id);
GRANT SELECT, INSERT, UPDATE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read loans" ON public.loans FOR SELECT TO authenticated USING (auth.uid()=lender_id OR auth.uid()=borrower_id);
CREATE POLICY "parties insert loans" ON public.loans FOR INSERT TO authenticated WITH CHECK (auth.uid()=initiator_id AND (auth.uid()=lender_id OR auth.uid()=borrower_id));
CREATE POLICY "parties update loans" ON public.loans FOR UPDATE TO authenticated USING (auth.uid()=lender_id OR auth.uid()=borrower_id) WITH CHECK (auth.uid()=lender_id OR auth.uid()=borrower_id);

-- SCORE EVENTS
CREATE TABLE public.score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
  delta NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.score_events (user_id);
GRANT SELECT, INSERT ON public.score_events TO authenticated;
GRANT ALL ON public.score_events TO service_role;
ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own score events" ON public.score_events FOR SELECT TO authenticated USING (auth.uid()=user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Score adjustment function
CREATE OR REPLACE FUNCTION public.apply_score(_user UUID, _delta NUMERIC, _reason TEXT, _loan UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.score_events (user_id, delta, reason, loan_id) VALUES (_user, _delta, _reason, _loan);
  UPDATE public.profiles
    SET score = GREATEST(0, LEAST(100, score + _delta))
    WHERE id = _user;
END; $$;

-- Trigger on loan status change
CREATE OR REPLACE FUNCTION public.handle_loan_status() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  days_diff INT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'active' AND OLD.status = 'requested' THEN
    NEW.funded_at = now();
    PERFORM public.apply_score(NEW.lender_id, 1, 'Funded a loan', NEW.id);
  ELSIF NEW.status = 'repaid' THEN
    NEW.repaid_at = COALESCE(NEW.repaid_at, now());
    days_diff := (NEW.due_date - CURRENT_DATE);
    IF days_diff > 2 THEN
      PERFORM public.apply_score(NEW.borrower_id, 7, 'Repaid early', NEW.id);
    ELSIF days_diff >= 0 THEN
      PERFORM public.apply_score(NEW.borrower_id, 5, 'Repaid on time', NEW.id);
    ELSE
      PERFORM public.apply_score(NEW.borrower_id, -3, 'Repaid late', NEW.id);
    END IF;
    PERFORM public.apply_score(NEW.lender_id, 2, 'Loan repaid to you', NEW.id);
  ELSIF NEW.status = 'defaulted' THEN
    PERFORM public.apply_score(NEW.borrower_id, -15, 'Loan defaulted', NEW.id);
    PERFORM public.apply_score(NEW.lender_id, -2, 'Loan you gave defaulted', NEW.id);
  ELSIF NEW.status = 'disputed' THEN
    PERFORM public.apply_score(NEW.borrower_id, -5, 'Loan disputed', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_loan_status_change BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.handle_loan_status();
