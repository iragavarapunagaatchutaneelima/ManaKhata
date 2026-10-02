-- Settle everything between two people in one step and record ONE settlement for
-- the net amount actually paid (instead of one row per direction).
create or replace function public.settle_pair(p_debtor uuid, p_creditor uuid, p_note text default null)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  hid uuid;
  owed numeric;
  owed_back numeric;
  net numeric;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if hid is null then raise exception 'Join a household first'; end if;
  if p_debtor = p_creditor or not is_member_of(hid, p_debtor) or not is_member_of(hid, p_creditor) then
    raise exception 'Pick two members of your household';
  end if;
  if auth.uid() not in (p_debtor, p_creditor) and not is_manager(hid) then
    raise exception 'Only the people involved can settle this';
  end if;

  select coalesce(sum(amount), 0) into owed from expense_splits
  where household_id = hid and owed_by = p_debtor and owed_to = p_creditor and settled_at is null;
  select coalesce(sum(amount), 0) into owed_back from expense_splits
  where household_id = hid and owed_by = p_creditor and owed_to = p_debtor and settled_at is null;
  if owed = 0 and owed_back = 0 then return 0; end if;

  update expense_splits set settled_at = now()
  where household_id = hid and settled_at is null
    and ((owed_by = p_debtor and owed_to = p_creditor) or (owed_by = p_creditor and owed_to = p_debtor));

  net := owed - owed_back;
  if net > 0 then
    insert into settlements (household_id, from_user, to_user, amount, note) values (hid, p_debtor, p_creditor, net, p_note);
  elsif net < 0 then
    insert into settlements (household_id, from_user, to_user, amount, note) values (hid, p_creditor, p_debtor, -net, p_note);
  end if;
  return abs(net);
end $$;

revoke execute on function public.settle_pair(uuid, uuid, text) from public, anon;
grant execute on function public.settle_pair(uuid, uuid, text) to authenticated;
