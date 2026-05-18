
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_first BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO _is_first;

  INSERT INTO public.profiles (user_id, display_name, credits_remaining)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    10
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_first THEN 'admin'::public.app_role ELSE 'user'::public.app_role END);

  INSERT INTO public.credit_transactions (user_id, amount, type, note)
  VALUES (NEW.id, 10, 'signup_bonus', 'Welcome to TommyMeow Studio');

  RETURN NEW;
END;
$function$;

ALTER TABLE public.profiles ALTER COLUMN credits_remaining SET DEFAULT 10;
