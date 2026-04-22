const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/pc/Crear\ T/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('usuarios').select('etiquetas, quiz_data').limit(1);
  console.log(error || data);
}
test();
