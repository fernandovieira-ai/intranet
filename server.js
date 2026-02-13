const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const plantaoRoutes = require("./routes/plantao");
const informativosRoutes = require("./routes/informativos");
const tomticketRoutes = require("./routes/tomticket");
const dtefRoutes = require("./routes/dtef");
const trmmRoutes = require("./routes/trmm");
const anydeskRoutes = require("./routes/anydesk");
const contratosRoutes = require("./routes/contratos");
const restritoRoutes = require("./routes/restrito");
const mensagensRoutes = require("./routes/mensagens");
const faqErrosRoutes = require("./routes/faq-erros");

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const USE_HTTPS = process.env.USE_HTTPS === "true";

// Middleware - Aumentar limite para upload de fotos (10MB)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Configurar sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || "seu_secret_aqui",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: USE_HTTPS, // true quando usar HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rotas da API
app.use("/api", authRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", plantaoRoutes);
app.use("/api", informativosRoutes);
app.use("/api", tomticketRoutes);
app.use("/api/dtef", dtefRoutes);
app.use("/api/trmm", trmmRoutes);
app.use("/api/anydesk", anydeskRoutes);
app.use("/api", contratosRoutes);
app.use("/api", restritoRoutes);
app.use("/api/mensagens", mensagensRoutes);
app.use("/api/faq", faqErrosRoutes);

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar servidor
if (USE_HTTPS) {
  // Configuração HTTPS
  try {
    const privateKey = fs.readFileSync(
      process.env.SSL_KEY_PATH || path.join(__dirname, "ssl", "private.key"),
      "utf8"
    );
    const certificate = fs.readFileSync(
      process.env.SSL_CERT_PATH ||
        path.join(__dirname, "ssl", "certificate.crt"),
      "utf8"
    );
    const ca = process.env.SSL_CA_PATH
      ? fs.readFileSync(process.env.SSL_CA_PATH, "utf8")
      : null;

    const credentials = {
      key: privateKey,
      cert: certificate,
      ...(ca && { ca: ca }),
    };

    // Servidor HTTPS
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
      console.log(`🔒 Servidor HTTPS rodando em https://0.0.0.0:${HTTPS_PORT}`);
      console.log(`📁 Diretório: ${__dirname}`);
      console.log(
        `🌐 Acessível em: https://${
          process.env.DOMAIN || "intranet.digitalrf.com.br"
        }`
      );
    });

    // Servidor HTTP para redirecionar para HTTPS (opcional)
    if (process.env.REDIRECT_HTTP === "true") {
      const httpApp = express();
      httpApp.use("*", (req, res) => {
        res.redirect(
          `https://${req.hostname}${
            HTTPS_PORT !== 443 ? ":" + HTTPS_PORT : ""
          }${req.url}`
        );
      });
      http.createServer(httpApp).listen(80, "0.0.0.0", () => {
        console.log(`↪️  Servidor HTTP (porta 80) redirecionando para HTTPS`);
      });
    }
  } catch (error) {
    console.error("❌ Erro ao carregar certificados SSL:", error.message);
    console.log("💡 Verifique se os arquivos de certificado existem:");
    console.log("   - " + (process.env.SSL_KEY_PATH || "ssl/private.key"));
    console.log("   - " + (process.env.SSL_CERT_PATH || "ssl/certificate.crt"));
    process.exit(1);
  }
} else {
  // Servidor HTTP simples
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor HTTP rodando em http://0.0.0.0:${PORT}`);
    console.log(`📁 Diretório: ${__dirname}`);
    console.log(
      `🌐 Acessível externamente em http://${
        require("os").networkInterfaces()["Ethernet"]?.[0]?.address ||
        "IP-DO-SERVIDOR"
      }:${PORT}`
    );
  });
}

module.exports = app;
