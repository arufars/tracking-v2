-- 🎯 AUTO-ASSIGN CREATOR TO PROJECT (Optional Enhancement)
-- Trigger untuk otomatis assign creator ke project setelah project dibuat
-- Ini lebih flexible dari function karena tidak perlu update parameter

-- Trigger function
create or replace function auto_assign_project_creator()
returns trigger as $$
begin
  -- Get user role
  declare
    v_role text;
  begin
    select role into v_role
    from users
    where id = NEW.created_by;

    -- Auto-assign creator to project
    insert into user_projects (
      user_id,
      project_id,
      access_level,
      team_role
    ) values (
      NEW.created_by,
      NEW.id,
      'admin',
      case 
        when v_role = 'admin' then 'admin'
        else 'production'
      end
    );
  end;

  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists trigger_auto_assign_project_creator on projects;

create trigger trigger_auto_assign_project_creator
  after insert on projects
  for each row
  execute function auto_assign_project_creator();

-- ✅ Dengan trigger ini:
-- 1. Tambah column baru di projects? Tidak perlu update trigger
-- 2. Insert langsung ke projects, trigger handle assignment
-- 3. Flexible dan maintainable
