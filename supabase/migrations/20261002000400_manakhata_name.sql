-- Product name is ManaKhata: anonymised logins use a ManaKhata placeholder address.
-- Same function as 20261002000200_safe_account_deletion.sql otherwise.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
  hid uuid;
  heir uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  select household_id into hid from household_members where user_id = me;

  if hid is not null then
    if exists (select 1 from household_members where household_id = hid and user_id = me and role = 'HOUSEHEAD') then
      select user_id into heir from household_members
      where household_id = hid and user_id <> me
      order by (role = 'PARENT') desc, joined_at asc limit 1;
      if heir is not null then
        update household_members set role = 'HOUSEHEAD' where household_id = hid and user_id = heir;
      end if;
    end if;

    delete from household_members where household_id = hid and user_id = me;

    if not exists (select 1 from household_members where household_id = hid) then
      delete from households where id = hid;
    else
      delete from expenses where household_id = hid and paid_by = me and visibility = 'PERSONAL';
      delete from incomes where household_id = hid and user_id = me;
      delete from tax_documents where household_id = hid and owner_id = me;
      delete from chat_messages where household_id = hid and sender_id = me;
      delete from budgets where household_id = hid and user_id = me;
    end if;
  end if;

  begin
    delete from auth.users where id = me;
  exception when foreign_key_violation then
    update profiles set full_name = 'Former member', email = null, phone = null, updated_at = now() where id = me;
    update auth.users set
      email = 'deleted-' || me::text || '@deleted.manakhata.invalid',
      phone = null,
      encrypted_password = null,
      raw_user_meta_data = '{}'::jsonb,
      email_confirmed_at = null,
      banned_until = 'infinity'
    where id = me;
    delete from auth.identities where user_id = me;
    delete from auth.sessions where user_id = me;
    delete from auth.refresh_tokens where user_id = me::text;
  end;
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
