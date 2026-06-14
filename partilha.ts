// Edge Function "partilha" — gera a prévia (Open Graph) de cada pergaminho
// para que o link compartilhado mostre o TÍTULO e um TRECHO do texto.
// O leitor humano é redirecionado para o site; os robôs (WhatsApp, Telegram,
// Facebook, X) leem as meta tags daqui.
//
// COMO PUBLICAR (sem instalar nada):
// 1. No Supabase: menu "Edge Functions" > "Create a function".
// 2. Nome: partilha
// 3. Cole TODO este conteúdo no editor e clique em "Deploy".
// 4. IMPORTANTE: desligue a verificação de JWT dessa função
//    (em Edge Functions > partilha > Details/Settings, desmarque "Verify JWT"),
//    senão os robôs não conseguem abrir o link.
// 5. No index.html, troque  var OG_DINAMICO = false;  por  true.
//
// O endereço final fica: https://<seu-ref>.supabase.co/functions/v1/partilha?id=ID

const SITE = "https://www.penasepergaminhos.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const destino = id ? `${SITE}/?texto=${encodeURIComponent(id)}` : SITE;

  let titulo = "Penas & Pergaminhos";
  let descricao = "Histórias da taverna do leitor — leia e deixe a sua.";

  if (id) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pergaminhos?id=eq.${encodeURIComponent(id)}&status=eq.aprovado&select=titulo,autor,conteudo`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
      );
      const linhas = await r.json();
      const p = Array.isArray(linhas) ? linhas[0] : null;
      if (p) {
        titulo = p.titulo || titulo;
        const corpo = (p.conteudo || "").replace(/\s+/g, " ").trim();
        const trecho = corpo.slice(0, 160) + (corpo.length > 160 ? "…" : "");
        descricao = `por ${p.autor || "Anónimo"} — "${trecho}"`;
      }
    } catch (_e) { /* mantém os textos padrão */ }
  }

  const html = `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="Penas & Pergaminhos">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:url" content="${esc(destino)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descricao)}">
<meta name="twitter:image" content="${SITE}/og.png">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
</head><body>
<script>location.replace(${JSON.stringify(destino)});</script>
<p style="font-family:Georgia,serif">A abrir o pergaminho… <a href="${esc(destino)}">continuar</a></p>
</body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  });
});
