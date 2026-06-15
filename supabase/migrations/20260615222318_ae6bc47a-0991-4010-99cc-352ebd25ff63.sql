
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_loan_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_score(UUID, NUMERIC, TEXT, UUID) FROM PUBLIC, anon, authenticated;
