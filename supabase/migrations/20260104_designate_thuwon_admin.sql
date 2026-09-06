-- Personal project administrator. The email is intentionally explicit per the owner's request.
-- Run after the account has signed up and a profiles row exists.
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where email = 'thuwon416@gmail.com'
);
