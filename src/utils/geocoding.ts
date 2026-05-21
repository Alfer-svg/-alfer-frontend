// Geocodificação reversa/direta usando Nominatim (OpenStreetMap, grátis, sem chave)
// Limite: 1 req/seg conforme política de uso

export type Coordenadas = { latitude: number; longitude: number; enderecoNormalizado: string }

export async function geocodificarEndereco(endereco: string): Promise<Coordenadas> {
  if (!endereco || endereco.length < 3) throw new Error('Endereço muito curto.')
  const params = new URLSearchParams({
    q: endereco,
    format: 'json',
    limit: '1',
    countrycodes: 'br',
  })
  const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'pt-BR' },
  })
  if (!r.ok) throw new Error('Erro ao consultar Nominatim.')
  const arr = await r.json()
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('Endereço não encontrado. Tente algo mais específico (rua, cidade, estado).')
  }
  const d = arr[0]
  return {
    latitude: Number(d.lat),
    longitude: Number(d.lon),
    enderecoNormalizado: d.display_name || endereco,
  }
}
