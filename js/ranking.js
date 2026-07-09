// ============================================================
// ranking.js - Placar de abates (local + online opcional via Supabase)
// Sempre salva no aparelho; se o Supabase estiver configurado,
// também envia/consulta o ranking global compartilhado.
// ============================================================
const Ranking = {
  chaveLocal: 'lendas_ranking',
  chaveNome: 'lendas_nome',

  cfg() { return window.RANKING_CONFIG || {}; },
  online() { const c = this.cfg(); return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY); },

  // Cabeçalhos de autenticação (aceita chave anon "eyJ..." ou publishable "sb_...")
  _auth(c) {
    const h = { apikey: c.SUPABASE_ANON_KEY };
    if (String(c.SUPABASE_ANON_KEY).startsWith('eyJ')) {
      h.Authorization = `Bearer ${c.SUPABASE_ANON_KEY}`;
    }
    return h;
  },

  // ---- Nome do jogador (lembrado entre partidas) ----
  lerNome() { try { return localStorage.getItem(this.chaveNome) || ''; } catch (e) { return ''; } },
  salvarNome(n) { try { localStorage.setItem(this.chaveNome, n); } catch (e) {} },

  // ---- Armazenamento local ----
  lerLocal() {
    try { return JSON.parse(localStorage.getItem(this.chaveLocal)) || []; }
    catch (e) { return []; }
  },
  gravarLocal(lista) {
    try { localStorage.setItem(this.chaveLocal, JSON.stringify(lista.slice(0, 50))); }
    catch (e) {}
  },

  // ---- Enviar pontuação (p = {nome, classe, abates, tempo, nivel}) ----
  async enviar(p) {
    const reg = {
      nome: (p.nome || 'Anônimo').slice(0, 16),
      classe: p.classe, abates: p.abates,
      tempo: Math.round(p.tempo), nivel: p.nivel
    };

    // Sempre guarda localmente
    const lista = this.lerLocal();
    lista.push({ ...reg, quando: Date.now() });
    lista.sort((a, b) => b.abates - a.abates);
    this.gravarLocal(lista);

    // Envia ao Supabase, se configurado
    if (this.online()) {
      const c = this.cfg();
      try {
        const r = await fetch(`${c.SUPABASE_URL}/rest/v1/${c.TABELA}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this._auth(c), Prefer: 'return=minimal' },
          body: JSON.stringify(reg)
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return { ok: true, online: true };
      } catch (e) {
        console.warn('Ranking online falhou — pontuação mantida localmente.', e);
        return { ok: true, online: false };
      }
    }
    return { ok: true, online: false };
  },

  // ---- Listar top N ----
  async listar(limite = 10) {
    if (this.online()) {
      const c = this.cfg();
      try {
        const url = `${c.SUPABASE_URL}/rest/v1/${c.TABELA}` +
          `?select=nome,classe,abates,tempo,nivel&order=abates.desc&limit=${limite}`;
        const r = await fetch(url, { headers: this._auth(c) });
        if (r.ok) return { fonte: 'online', lista: await r.json() };
      } catch (e) {
        console.warn('Ranking online indisponível — mostrando o local.', e);
      }
    }
    return { fonte: 'local', lista: this.lerLocal().slice(0, limite) };
  }
};
