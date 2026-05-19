INSERT INTO public.site_settings (key, value)
VALUES ('shipping_rates', '{"US":4,"UK":5,"EU":7,"INTL":10}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
