-- Enable RLS for tables you expose to the client
alter table public.orders enable row level security;

-- Example: a user can only see their own orders (assuming auth.users.id = orders.user_id)
create policy "Users can view own orders"
on public.orders for select
to authenticated
using (auth.uid() = user_id);

-- Never use service_role key on the client. Use anon key here and perform privileged ops via Edge Functions.

-- Storage example: only allow reading public bucket, signed URLs for private
