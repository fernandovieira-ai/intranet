// Gerar senha diária do sistema LZT
export function gerarSenhaDiaria(data = new Date()) {
  // Obter componentes da data
  const mes = data.getMonth() + 1; // meses são baseados em 0
  let diaDaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda-feira, etc.
  const dia = data.getDate();
  const ano = data.getFullYear() % 100; // últimos dois dígitos do ano

  // Ajustar dia da semana para que segunda-feira seja 0
  diaDaSemana = diaDaSemana === 0 ? 6 : diaDaSemana - 1;

  // Calcular cada parte da senha
  const parte1 = String(mes + diaDaSemana).padStart(2, "0");
  const parte2 = String(ano).padStart(2, "0");
  const parte3 = String(dia + mes + ano).padStart(2, "0");
  const parte4 = String(diaDaSemana * diaDaSemana + dia).padStart(2, "0");

  // Combinar todas as partes para criar a senha
  const senha = parte1 + parte2 + parte3 + parte4;

  return senha; // Retorna a senha gerada
}

// Gerar senhas para os próximos dias
export function gerarSenhasProximosDias(quantidadeDias = 7) {
  const senhas = [];
  const hoje = new Date();

  for (let i = 0; i < quantidadeDias; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);

    const diasSemana = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];

    senhas.push({
      data: data.toLocaleDateString("pt-BR"),
      diaSemana: diasSemana[data.getDay()],
      senha: gerarSenhaDiaria(data),
      ehHoje: i === 0,
    });
  }

  return senhas;
}

// Formatar data para exibição
export function formatarDataSenha(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const diaSemana = diasSemana[data.getDay()];

  return `${diaSemana} ${dia}/${mes}`;
}
