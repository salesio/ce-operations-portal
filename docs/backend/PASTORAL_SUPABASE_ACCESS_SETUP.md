# Pastoral Supabase access setup

The Reitor and Responsável de Acompanhamento workspaces deliberately show only pastoral modules. They also require an authenticated Supabase role before Supabase can return pastoral data.

Apply `supabase/migrations/0014_pastoral_care_access.sql` manually in the Supabase SQL Editor. Do this first in staging, after a backup, and never place a service-role key in the frontend.

Then assign one server-side role for each authenticated account:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID_FOR_REITOR', 'pastoral_rector');

insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID_FOR_ACOMPANHAMENTO', 'follow_up_coordinator');
```

Use the UUID from Supabase Authentication > Users. Replace the placeholders before executing. The Reitor can read pastoral records and review First Timers. The Follow-Up Coordinator can read First Timers and create/update Follow-Up records. Neither role receives Finance, Staff, or broader operational access.

After assigning the roles, sign out and sign in again, then confirm that both accounts list the same authorised First Timers and Follow-Up records as the Admin view.
