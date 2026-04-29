import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { startTikTokSyncScheduler } from "./jobs/tiktok-sync-job.js";
import { startYouTubeSyncScheduler } from "./jobs/youtube-sync-job.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerDashboardRoutes } from "./routes/dashboard.js";
import { getActiveDataProvider } from "./repositories/dashboard-repository.js";
import { getDashboardPayload } from "./services/dashboard-service.js";
import { pingPostgres } from "./db/postgres.js";

const app = Fastify({
  logger: true,
  trustProxy: true,
});
const port = Number(process.env.PORT ?? 8787);

function getAllowedOrigins() {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  const frontendAppUrl = process.env.FRONTEND_APP_URL ?? "http://localhost:5173";
  return [
    frontendAppUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
}

const allowedOrigins = new Set(getAllowedOrigins());

await app.register(cors, {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin nao permitida por CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
await app.register(cookie);

app.addHook("onSend", async (_request, reply, payload) => {
  reply.header("X-Frame-Options", "DENY");
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
  reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return payload;
});

await registerDashboardRoutes(app);
await registerAuthRoutes(app);
await registerAdminRoutes(app);

function renderLegalPage(kind: "terms" | "privacy") {
  const isTerms = kind === "terms";
  const title = isTerms ? "Termos de Servico do JFclipes" : "Politica de Privacidade do JFclipes";
  const body = isTerms
    ? `
      <p>Estes Termos de Servico se aplicam ao aplicativo JFclipes e ao site publico JF Portfolio, disponivel em jfclipes.pro.</p>
      <h2>1. Sobre o JF Portfolio</h2>
      <p>O JF Portfolio e uma vitrine publica de alcance em redes sociais. O site apresenta metricas, contas conectadas, atualizacoes e historico de visualizacoes de canais autorizados.</p>
      <h2>2. Uso do site</h2>
      <p>Voce pode acessar o site para visualizar informacoes publicas de portfolio, resultados e dados agregados exibidos na pagina. Voce nao deve tentar acessar areas administrativas, interferir no funcionamento do servico, copiar dados de forma automatizada sem autorizacao ou usar o site para qualquer finalidade ilegal.</p>
      <h2>3. Dados e integracoes</h2>
      <p>Algumas informacoes exibidas podem vir de integracoes autorizadas com plataformas de terceiros, incluindo servicos de redes sociais e video. O acesso a esses dados depende das permissoes concedidas pelos titulares das contas e das regras das plataformas correspondentes.</p>
      <h2>4. Disponibilidade e precisao</h2>
      <p>As metricas podem mudar conforme novas atualizacoes sao registradas, conexoes sao renovadas ou plataformas de terceiros processam dados. O JF Portfolio busca apresentar informacoes corretas, mas nao garante disponibilidade ininterrupta nem ausencia total de atrasos ou inconsistencias.</p>
      <h2>5. Propriedade intelectual</h2>
      <p>A interface, organizacao visual, textos, identidade e apresentacao do JF Portfolio pertencem aos seus respectivos titulares. Marcas, nomes de plataformas e conteudos de terceiros pertencem aos seus proprietarios.</p>
      <h2>6. Alteracoes destes termos</h2>
      <p>Estes termos podem ser atualizados para refletir mudancas no site, nas integracoes ou em requisitos legais. A versao publicada nesta pagina e a versao vigente.</p>
      <h2>7. Contato</h2>
      <p>Para duvidas sobre estes termos, acesse a pagina inicial em <a href="/">jfclipes.pro</a> e utilize o canal de contato disponivel.</p>
    `
    : `
      <p>Esta Politica de Privacidade descreve como o aplicativo JFclipes e o site publico JF Portfolio, disponivel em jfclipes.pro, processam informacoes.</p>
      <h2>1. Informacoes que coletamos</h2>
      <p>O JF Portfolio pode processar dados necessarios para exibir metricas de contas autorizadas, como nome do canal ou conta, identificador publico, plataforma, total de visualizacoes, horarios de atualizacao e eventos de sincronizacao.</p>
      <p>Tambem podemos processar informacoes tecnicas basicas do acesso ao site, como endereco IP, navegador, dispositivo, registros de erro e dados de seguranca, quando esses dados forem gerados pela infraestrutura de hospedagem ou pelo backend.</p>
      <h2>2. Como usamos as informacoes</h2>
      <p>Usamos as informacoes para exibir o portfolio publico, atualizar metricas, manter integracoes com plataformas autorizadas, proteger o servico, diagnosticar problemas tecnicos e melhorar a experiencia da pagina.</p>
      <h2>3. Integracoes com terceiros</h2>
      <p>O site pode usar APIs e autenticacao de plataformas de terceiros para contas autorizadas. Essas plataformas podem ter suas proprias politicas de privacidade, termos e controles de permissao. O titular da conta pode revogar permissoes diretamente na plataforma correspondente quando disponivel.</p>
      <h2>4. Compartilhamento</h2>
      <p>Nao vendemos dados pessoais. Podemos compartilhar dados apenas quando necessario para operar a hospedagem, banco de dados, autenticacao, integracoes autorizadas, seguranca do servico ou quando exigido por lei.</p>
      <h2>5. Retencao e exclusao</h2>
      <p>Mantemos dados pelo tempo necessario para operar o portfolio, cumprir requisitos tecnicos, preservar historico autorizado ou atender obrigacoes legais. Solicitacoes de remocao ou revisao de dados podem ser feitas pelo canal de contato disponivel na pagina inicial.</p>
      <h2>6. Seguranca</h2>
      <p>Aplicamos medidas tecnicas razoaveis para proteger as informacoes processadas pelo site. Nenhum metodo de transmissao ou armazenamento e totalmente infalivel, mas buscamos reduzir riscos de acesso nao autorizado, perda ou uso indevido.</p>
      <h2>7. Seus direitos</h2>
      <p>Dependendo da sua localizacao, voce pode ter direitos de acesso, correcao, exclusao, portabilidade ou oposicao ao tratamento de dados. Para exercer esses direitos, utilize o canal de contato na pagina inicial.</p>
      <h2>8. Contato</h2>
      <p>Para perguntas sobre privacidade, acesse <a href="/">jfclipes.pro</a> e utilize o canal de contato disponivel.</p>
    `;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | JF Portfolio</title>
    <meta name="theme-color" content="#030305" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon/favicon-96x96.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/favicon/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
    <link rel="manifest" href="/favicon/site.webmanifest" />
    <style>
      body { margin: 0; background: #030305; color: #fff; font-family: Arial, sans-serif; }
      header, main { max-width: 880px; margin: 0 auto; padding: 24px; }
      header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid rgba(255,255,255,.12); }
      a { color: #fff; }
      .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
      .brand img { width: 44px; height: 44px; border-radius: 12px; display: block; }
      nav { display: flex; gap: 16px; }
      article { background: rgba(255,255,255,.06); border-radius: 24px; padding: 28px; }
      h1 { font-size: clamp(34px, 6vw, 56px); margin: 8px 0; }
      h2 { margin-top: 32px; font-size: 20px; }
      p { color: rgba(255,255,255,.68); line-height: 1.7; }
      .muted { color: rgba(255,255,255,.48); font-size: 14px; }
    </style>
  </head>
  <body>
    <header>
      <a class="brand" href="/"><img src="/favicon/favicon-96x96.png" alt="JF Portfolio" /><strong>JF Portfolio</strong></a>
      <nav><a href="/terms">Termos</a><a href="/privacy">Privacidade</a></nav>
    </header>
    <main>
      <article>
        <p class="muted">JF Portfolio</p>
        <h1>${title}</h1>
        <p class="muted">Ultima atualizacao: 23 de abril de 2026</p>
        ${body}
      </article>
    </main>
  </body>
</html>`;
}

app.get("/terms", async (_request, reply) => {
  reply.type("text/html; charset=utf-8");
  return renderLegalPage("terms");
});

app.get("/privacy", async (_request, reply) => {
  reply.type("text/html; charset=utf-8");
  return renderLegalPage("privacy");
});

app.get("/stream", async (request, reply) => {
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.flushHeaders?.();

  const sendPayload = async () => {
    const payload = JSON.stringify(await getDashboardPayload());
    reply.raw.write(`event: dashboard\n`);
    reply.raw.write(`data: ${payload}\n\n`);
  };

  await sendPayload();
  const interval = setInterval(() => {
    void sendPayload();
  }, 15000);

  request.raw.on("close", () => {
    clearInterval(interval);
    reply.raw.end();
  });
});

app.get("/health", async () => ({
  ok: true,
  dataProvider: getActiveDataProvider(),
  timestamp: new Date().toISOString(),
}));

if (getActiveDataProvider() === "postgres") {
  try {
    await pingPostgres();
    app.log.info("Conexao com Postgres validada para DATA_PROVIDER=postgres");
  } catch (error) {
    app.log.error(error, "Falha ao conectar no Postgres");
    throw error;
  }
}

startYouTubeSyncScheduler(app.log);
startTikTokSyncScheduler(app.log);

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
