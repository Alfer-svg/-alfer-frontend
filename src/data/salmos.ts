// Trechos curtos de Salmos pra exibição no topo do dashboard.
// Seleção determinística por dia do ano — todo mundo vê o mesmo no mesmo dia.
export const SALMOS_DIARIOS: { texto: string; ref: string }[] = [
  { texto: 'O Senhor é o meu pastor; nada me faltará.', ref: 'Salmos 23:1' },
  { texto: 'Em ti, Senhor, ponho a minha confiança.', ref: 'Salmos 31:1' },
  { texto: 'O Senhor é a minha luz e a minha salvação; a quem temerei?', ref: 'Salmos 27:1' },
  { texto: 'Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.', ref: 'Salmos 103:1' },
  { texto: 'Aquietai-vos, e sabei que eu sou Deus.', ref: 'Salmos 46:10' },
  { texto: 'Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.', ref: 'Salmos 118:24' },
  { texto: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', ref: 'Salmos 37:5' },
  { texto: 'O Senhor é bom para todos, e as suas misericórdias estão sobre todas as suas obras.', ref: 'Salmos 145:9' },
  { texto: 'Tu és o meu refúgio e a minha fortaleza, ó meu Deus, em quem confio.', ref: 'Salmos 91:2' },
  { texto: 'Bom é louvar ao Senhor, e cantar louvores ao teu nome, ó Altíssimo.', ref: 'Salmos 92:1' },
  { texto: 'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo.', ref: 'Salmos 23:4' },
  { texto: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', ref: 'Salmos 119:105' },
  { texto: 'Os céus declaram a glória de Deus, e o firmamento anuncia a obra das suas mãos.', ref: 'Salmos 19:1' },
  { texto: 'O Senhor é o meu rochedo, e o meu lugar forte, e o meu libertador.', ref: 'Salmos 18:2' },
  { texto: 'Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.', ref: 'Salmos 37:4' },
  { texto: 'Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto.', ref: 'Salmos 51:10' },
  { texto: 'Como é grande o Senhor! Como é digno de ser louvado!', ref: 'Salmos 48:1' },
  { texto: 'Tu, Senhor, és bom, e pronto a perdoar; rico em benignidade para com todos os que te invocam.', ref: 'Salmos 86:5' },
  { texto: 'Os meus olhos se elevam para os montes; de onde virá o meu socorro? O meu socorro vem do Senhor.', ref: 'Salmos 121:1-2' },
  { texto: 'Ainda que muitos sejam os meus inimigos, o Senhor é o sustentáculo da minha vida.', ref: 'Salmos 27:1' },
  { texto: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', ref: 'Salmos 46:1' },
  { texto: 'Espera no Senhor, anima-te, e ele fortalecerá o teu coração.', ref: 'Salmos 27:14' },
  { texto: 'Bem-aventurado o homem que se compadece e empresta; ele defende a sua causa em juízo.', ref: 'Salmos 112:5' },
  { texto: 'Quão amáveis são os teus tabernáculos, Senhor dos Exércitos!', ref: 'Salmos 84:1' },
  { texto: 'O Senhor abençoará o seu povo com paz.', ref: 'Salmos 29:11' },
  { texto: 'O temor do Senhor é o princípio da sabedoria.', ref: 'Salmos 111:10' },
  { texto: 'Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele confia.', ref: 'Salmos 34:8' },
  { texto: 'Os justos clamam, e o Senhor os ouve, e os livra de todas as suas angústias.', ref: 'Salmos 34:17' },
  { texto: 'Confia no Senhor, e faze o bem; habitarás na terra, e te alimentarás em segurança.', ref: 'Salmos 37:3' },
  { texto: 'O Senhor é a força do seu povo; é a fortaleza salvadora do seu ungido.', ref: 'Salmos 28:8' },
  { texto: 'Como a corça brama pelas correntes das águas, assim suspira a minha alma por ti, ó Deus!', ref: 'Salmos 42:1' },
  { texto: 'Tu me cercas por trás e por diante, e sobre mim pões a tua mão.', ref: 'Salmos 139:5' },
  { texto: 'Ó Senhor, quão admirável é o teu nome em toda a terra!', ref: 'Salmos 8:1' },
  { texto: 'Suplica perante mim, e te livrarei, e tu me glorificarás.', ref: 'Salmos 50:15' },
  { texto: 'O Senhor faz prosperar o que empreendes.', ref: 'Salmos 90:17' },
  { texto: 'Os passos de um homem bom são confirmados pelo Senhor, e deleita-se no seu caminho.', ref: 'Salmos 37:23' },
  { texto: 'Tu me darás a vereda da vida; na tua presença há fartura de alegrias.', ref: 'Salmos 16:11' },
  { texto: 'Louvai ao Senhor, porque ele é bom; porque a sua benignidade dura para sempre.', ref: 'Salmos 107:1' },
  { texto: 'Os que semeiam em lágrimas, com alegria ceifarão.', ref: 'Salmos 126:5' },
  { texto: 'Confiai no Senhor para sempre, porque o Senhor Deus é uma rocha eterna.', ref: 'Salmos 31:14' },
]

/**
 * Retorna o salmo do dia (determinístico — todo mundo vê o mesmo
 * no mesmo dia, e muda à meia-noite local).
 */
export function salmoDoDia(): { texto: string; ref: string } {
  const hoje = new Date()
  // Dia do ano (1..366) com fuso local
  const inicioAno = new Date(hoje.getFullYear(), 0, 0)
  const diff = hoje.getTime() - inicioAno.getTime() + ((inicioAno.getTimezoneOffset() - hoje.getTimezoneOffset()) * 60 * 1000)
  const diaDoAno = Math.floor(diff / 86_400_000)
  return SALMOS_DIARIOS[diaDoAno % SALMOS_DIARIOS.length]
}
