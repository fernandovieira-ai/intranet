document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    const lembrar = document.getElementById("lembrar").checked;
    const mensagem = document.getElementById("mensagem");

    // Limpar mensagens anteriores
    mensagem.textContent = "";
    mensagem.className = "mensagem";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuario,
          senha: senha,
          lembrar: lembrar,
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        mensagem.textContent = "Login realizado com sucesso!";
        mensagem.className = "mensagem sucesso";

        // Redirecionar para o dashboard após 1 segundo
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } else {
        mensagem.textContent = data.mensagem || "Erro ao fazer login";
        mensagem.className = "mensagem erro";
      }
    } catch (error) {
      mensagem.textContent = "Erro de conexão com o servidor";
      mensagem.className = "mensagem erro";
      console.error("Erro:", error);
    }
  });

// Verificar se já está logado
window.addEventListener("load", async function () {
  try {
    const response = await fetch("/api/verificar-sessao");
    const data = await response.json();

    if (data.logado) {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
  }
});
