-- Set the hero UC2 demo lead (Michael Truell @ Cursor) to your Twilio-verified phone.
-- Run in Supabase SQL editor before the live demo.
-- Replace +1XXXXXXXXXX with your verified E.164 number.

UPDATE leads
SET phone = '+19145598426'
WHERE id = 'b1000000-0001-0000-0000-000000000001';
