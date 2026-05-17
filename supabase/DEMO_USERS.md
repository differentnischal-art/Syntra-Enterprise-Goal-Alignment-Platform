# AlignOS demo users

Create these three users in **Supabase Auth** first, then insert matching `public.profiles` rows with the exact `auth.users.id` UUIDs.

| Persona | Suggested email | Role | Manager |
| --- | --- | --- | --- |
| Employee demo | `employee.demo@alignos.local` | `employee` | Manager demo |
| Manager demo | `manager.demo@alignos.local` | `manager` | — |
| Admin demo | `admin.demo@alignos.local` | `admin` | — |

Example profile seeding pattern after the Auth users exist:

```sql
insert into public.profiles (
  id,
  full_name,
  email,
  role,
  department_id,
  manager_id,
  job_title
)
select
  employee_auth.id,
  'Employee Demo',
  employee_auth.email,
  'employee',
  engineering.id,
  manager_auth.id,
  'Software Engineer'
from auth.users employee_auth
cross join public.departments engineering
cross join auth.users manager_auth
where employee_auth.email = 'employee.demo@alignos.local'
  and manager_auth.email = 'manager.demo@alignos.local'
  and engineering.name = 'Engineering'
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  department_id = excluded.department_id,
  manager_id = excluded.manager_id,
  job_title = excluded.job_title;
```

Repeat the same pattern for the manager and admin users, using their real Auth UUIDs. Do **not** reintroduce fake IDs such as `u1`, `u2`, or `m1` anywhere in production data.

For a hackathon submission, keep actual passwords outside the repository and share them only through your submission notes or password manager.
