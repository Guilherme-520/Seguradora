// Servidor local / Docker. No Vercel o app é exposto por /api/index.js.
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL}`);
});
