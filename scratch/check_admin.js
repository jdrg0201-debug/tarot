const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/pc/Crear T/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdmin() {
  const { data, error } = await supabase.from('configuracion_admin').select('*').single();
  if (error) {
    console.error('Error fetching admin settings:', error);
  } else {
    console.log('Admin Settings in DB:');
    console.log('Email:', data.email);
    console.log('Password Hash (Actual Password):', data.password_hash);
  }
}

checkAdmin();
