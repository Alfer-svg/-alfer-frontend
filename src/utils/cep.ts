// Consulta endereço a partir do CEP via ViaCEP (grátis, sem chave).
// Docs: https://viacep.com.br/

export type DadosCep = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export function limparCep(v: string) {
  return (v || '').replace(/\D/g, '')
}

export function formatarCep(v: string) {
  const d = limparCep(v).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export async function buscarCep(cep: string): Promise<DadosCep> {
  const digits = limparCep(cep)
  if (digits.length !== 8) {
    throw new Error('CEP precisa ter 8 dígitos.')
  }
  const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  if (!r.ok) throw new Error('Erro ao consultar CEP.')
  const d = await r.json()
  if (d.erro) throw new Error('CEP não encontrado.')
  return {
    cep: formatarCep(digits),
    logradouro: d.logradouro || '',
    complemento: d.complemento || '',
    bairro: d.bairro || '',
    cidade: d.localidade || '',
    estado: d.uf || '',
  }
}
