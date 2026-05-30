// Dicas de segurança exibidas no login do motorista (uma aleatória por acesso).
export interface DicaSeguranca {
  emoji: string
  titulo: string
  texto: string
}

export const DICAS_SEGURANCA: DicaSeguranca[] = [
  { emoji: '🛣️', titulo: 'Direção defensiva', texto: 'Mantenha distância segura do veículo da frente. Quanto maior a velocidade, maior o espaço necessário.' },
  { emoji: '🦺', titulo: 'Uso de EPI', texto: 'Capacete, luvas, botas e colete refletivo não são opcionais. Use o EPI sempre que sair da cabine.' },
  { emoji: '🧰', titulo: 'Organização', texto: 'Carga bem amarrada e equipamentos no lugar evitam acidentes e perda de tempo. Confira antes de sair.' },
  { emoji: '😴', titulo: 'Descanso', texto: 'Cansaço mata. Se bater o sono, pare em local seguro. Nenhuma entrega vale mais que sua vida.' },
  { emoji: '📱', titulo: 'Sem celular ao volante', texto: 'Mensagem e ligação podem esperar. Encoste para usar o telefone.' },
  { emoji: '🚦', titulo: 'Respeite os limites', texto: 'Velocidade adequada à via e à carga. Excesso aumenta a distância de frenagem e o risco de tombamento.' },
  { emoji: '🔧', titulo: 'Checklist do veículo', texto: 'Pneus, freios, luzes e óleo: confira no início do dia. Pequenos defeitos viram grandes problemas na estrada.' },
  { emoji: '🌧️', titulo: 'Chuva e pista molhada', texto: 'Reduza a velocidade e dobre a atenção. Aquaplanagem acontece rápido com pneu careca.' },
  { emoji: '🅿️', titulo: 'Manobras e ré', texto: 'Em ré ou manobra apertada, desça e olhe. Na dúvida, peça ajuda para sinalizar.' },
  { emoji: '⚖️', titulo: 'Carga e amarração', texto: 'Distribua o peso corretamente e revise as cintas. Carga solta desestabiliza o conjunto.' },
  { emoji: '💧', titulo: 'Hidratação e alimentação', texto: 'Beba água e faça refeições leves. Corpo bem cuidado mantém a atenção na direção.' },
  { emoji: '🚧', titulo: 'Atenção em operações', texto: 'Em carga/descarga com munck ou guindaste, mantenha distância da zona de risco e use sinalização.' },
]

export function dicaAleatoria(): DicaSeguranca {
  return DICAS_SEGURANCA[Math.floor(Math.random() * DICAS_SEGURANCA.length)]
}
