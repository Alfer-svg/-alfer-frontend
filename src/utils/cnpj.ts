// Consulta dados de CNPJ na BrasilAPI (grátis, sem chave).
// Docs: https://brasilapi.com.br/docs#tag/CNPJ

export type DadosCnpj = {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  email: string
  telefone: string
  endereco: {
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
}

export function limparCnpj(v: string) {
  return (v || '').replace(/\D/g, '')
}

export function formatarCnpj(v: string) {
  const d = limparCnpj(v).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export async function buscarCnpj(cnpj: string): Promise<DadosCnpj> {
  const digits = limparCnpj(cnpj)
  if (digits.length !== 14) {
    throw new Error('CNPJ precisa ter 14 dígitos.')
  }
  const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
  if (r.status === 404) throw new Error('CNPJ não encontrado na Receita Federal.')
  if (!r.ok) throw new Error('Erro ao consultar CNPJ. Tente de novo.')
  const d = await r.json()
  // BrasilAPI retorna campos em snake_case
  const ddd = d.ddd_telefone_1 || ''
  return {
    cnpj: formatarCnpj(digits),
    razaoSocial: d.razao_social || '',
    nomeFantasia: d.nome_fantasia || '',
    email: d.email || '',
    telefone: ddd ? formatarTelefone(ddd) : '',
    endereco: {
      logradouro: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' '),
      numero: String(d.numero || ''),
      complemento: d.complemento || '',
      bairro: d.bairro || '',
      cidade: d.municipio || '',
      estado: d.uf || '',
      cep: formatarCep(d.cep),
    },
  }
}

function formatarCep(v: any) {
  const d = String(v || '').replace(/\D/g, '')
  if (d.length !== 8) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function formatarTelefone(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}
