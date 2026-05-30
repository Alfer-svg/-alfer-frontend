// Dicas exibidas no login (uma aleatória por acesso) — segurança, cuidado com o
// veículo e apresentação. A categoria permite filtrar por modo do app:
//   - 'direcao'/'veiculo' só fazem sentido pra motoristas/operadores (modo campo)
//   - as demais valem pra todo mundo (inclusive pátio)
export type CategoriaDica = 'direcao' | 'veiculo' | 'geral' | 'apresentacao' | 'operacao' | 'patio'

export interface DicaSeguranca {
  emoji: string
  titulo: string
  texto: string
  categoria: CategoriaDica
}

export const DICAS_SEGURANCA: DicaSeguranca[] = [
  { emoji: '🛣️', titulo: 'Direção defensiva', texto: 'Mantenha distância segura do veículo da frente. Quanto maior a velocidade, maior o espaço necessário.', categoria: 'direcao' },
  { emoji: '🦺', titulo: 'Uso de EPI', texto: 'Capacete, luvas, botas e colete refletivo não são opcionais. Use o EPI sempre que estiver na operação.', categoria: 'geral' },
  { emoji: '🧰', titulo: 'Organização', texto: 'Carga bem amarrada e equipamentos no lugar evitam acidentes e perda de tempo. Confira antes de sair.', categoria: 'geral' },
  { emoji: '😴', titulo: 'Descanso', texto: 'Cansaço mata. Se bater o sono ao volante, pare em local seguro. Nenhuma entrega vale mais que sua vida.', categoria: 'direcao' },
  { emoji: '📱', titulo: 'Sem celular ao volante', texto: 'Mensagem e ligação podem esperar. Encoste para usar o telefone.', categoria: 'direcao' },
  { emoji: '🚦', titulo: 'Respeite os limites', texto: 'Velocidade adequada à via e à carga. Excesso aumenta a distância de frenagem e o risco de tombamento.', categoria: 'direcao' },
  { emoji: '🔧', titulo: 'Checklist do veículo', texto: 'Pneus, freios, luzes e óleo: confira no início do dia. Pequenos defeitos viram grandes problemas na estrada.', categoria: 'veiculo' },
  { emoji: '🌧️', titulo: 'Chuva e pista molhada', texto: 'Reduza a velocidade e dobre a atenção. Aquaplanagem acontece rápido com pneu careca.', categoria: 'direcao' },
  { emoji: '🅿️', titulo: 'Manobras e ré', texto: 'Em ré ou manobra apertada, desça e olhe. Na dúvida, peça ajuda para sinalizar.', categoria: 'direcao' },
  { emoji: '⚖️', titulo: 'Carga e amarração', texto: 'Distribua o peso corretamente e revise as cintas. Carga solta desestabiliza e pode cair.', categoria: 'operacao' },
  { emoji: '💧', titulo: 'Hidratação e alimentação', texto: 'Beba água e faça refeições leves. Corpo bem cuidado mantém a atenção no trabalho.', categoria: 'geral' },
  { emoji: '🚧', titulo: 'Atenção em operações', texto: 'Em carga/descarga com munck ou guindaste, mantenha distância da zona de risco e use sinalização.', categoria: 'operacao' },
  { emoji: '🧼', titulo: 'Caminhão limpo', texto: 'Veículo limpo passa profissionalismo e ajuda a identificar vazamentos e avarias. Lave por dentro e por fora com frequência.', categoria: 'veiculo' },
  { emoji: '✨', titulo: 'Cuide da pintura', texto: 'Evite riscos e batidas em manobras. A boa aparência do caminhão é o cartão de visita da Alfer na rua.', categoria: 'veiculo' },
  { emoji: '👕', titulo: 'Boa apresentação', texto: 'Uniforme limpo e postura educada com o cliente. Você representa a empresa o tempo todo.', categoria: 'apresentacao' },
  { emoji: '🛞', titulo: 'Calibragem dos pneus', texto: 'Pneu calibrado dura mais, economiza diesel e é mais seguro. Confira a pressão toda semana.', categoria: 'veiculo' },
  { emoji: '🩹', titulo: 'Reporte avarias', texto: 'Quebrou, riscou ou notou um defeito? Avise o gestor na hora. Pequeno reparo cedo evita gasto grande depois.', categoria: 'geral' },
  { emoji: '🪑', titulo: 'Cuide da cabine', texto: 'Mantenha a cabine organizada e sem lixo. Painel limpo e nada solto que possa atrapalhar a direção.', categoria: 'veiculo' },
  // Específicas de pátio / operações em solo
  { emoji: '🏋️', titulo: 'Levantamento de peso', texto: 'Dobre os joelhos, mantenha a coluna reta e peça ajuda em cargas pesadas. Sua coluna agradece.', categoria: 'patio' },
  { emoji: '🧯', titulo: 'Pátio organizado', texto: 'Mantenha corredores livres e materiais empilhados com segurança. Pátio limpo evita acidentes e tropeços.', categoria: 'patio' },
  { emoji: '🤝', titulo: 'Trabalho em equipe', texto: 'Comunique-se com o time durante manobras e içamentos. Combine sinais antes de começar.', categoria: 'patio' },
  { emoji: '🧤', titulo: 'Mãos protegidas', texto: 'Use luvas adequadas ao manusear cabos, correntes e peças. Atenção a pontos de esmagamento.', categoria: 'patio' },
]

// Categorias que NÃO aparecem no modo pátio (dicas de direção e de veículo).
const OCULTAS_NO_PATIO: CategoriaDica[] = ['direcao', 'veiculo']

export function dicaAleatoria(modo: 'campo' | 'patio' = 'campo'): DicaSeguranca {
  const lista = modo === 'patio'
    ? DICAS_SEGURANCA.filter((d) => !OCULTAS_NO_PATIO.includes(d.categoria))
    : DICAS_SEGURANCA
  return lista[Math.floor(Math.random() * lista.length)]
}
