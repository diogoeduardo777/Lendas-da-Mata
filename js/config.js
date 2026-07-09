// ============================================================
// config.js - Configuração do RANKING ONLINE (opcional)
// ------------------------------------------------------------
// Enquanto os campos abaixo estiverem VAZIOS, o ranking funciona
// apenas neste aparelho (localStorage). Para o ranking GLOBAL,
// compartilhado entre todos que jogam pelo link, preencha com os
// dados de um projeto gratuito do Supabase (instruções no README).
//
// A chave "anon" do Supabase é PÚBLICA por natureza (protegida por
// políticas RLS), então pode ficar aqui no repositório sem problema.
// ============================================================
window.RANKING_CONFIG = {
  SUPABASE_URL: '',        // ex.: https://abcdefgh.supabase.co
  SUPABASE_ANON_KEY: '',   // chave pública "anon public"
  TABELA: 'ranking'
};
