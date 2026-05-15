require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  console.log("Testing connection to:", process.env.SUPABASE_URL);
  const { data: readData, error: readError } = await supabase.from('usuarios').select('*').limit(1);
  console.log("Read Test:", readError ? readError : "Success", readData);
  const { data, error } = await supabase.from('usuarios').insert({
    user_id: 'test_user_' + Date.now(),
    nombre: 'Test User',
    estado: 'online'
  }).select();
  console.log("Insert Test:", error ? error : "Success", data);
}
test();
