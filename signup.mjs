import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nmfldtzethxclqivgofs.supabase.co', 'sb_publishable_plC4phFHrv-H3CnnJ2VMjw_-DUmlINf');

async function signUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'rangelmaker@gmail.com',
    password: '250524.Raj',
  });
  if (error) console.error("Error:", error.message);
  else console.log("Success:", data.user?.id);
}
signUp();
