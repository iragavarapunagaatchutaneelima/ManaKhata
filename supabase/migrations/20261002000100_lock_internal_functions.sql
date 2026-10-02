-- Internal helpers are only used by triggers or other SECURITY DEFINER functions;
-- signed-in users must not call them directly through /rest/v1/rpc.
revoke execute on function
  public.handle_new_user(),
  public.validate_member_refs(),
  public.validate_parent_household(),
  public.is_member_of(uuid, uuid),
  public.wallet_balance(uuid, uuid)
from public, anon, authenticated;
