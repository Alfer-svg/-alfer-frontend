// Comprime uma imagem do usuário pra um JPEG menor (data URL base64).
// Usa canvas pra redimensionar pra largura máxima e ajustar qualidade.
// Aceita praticamente qualquer formato que o navegador entenda (JPG/PNG/WEBP/HEIC em alguns).
export async function comprimirImagem(
  file: File,
  opts: { maxLargura?: number; qualidade?: number; maxBytes?: number } = {},
): Promise<string> {
  const maxLargura = opts.maxLargura ?? 1600
  const qualidade = opts.qualidade ?? 0.85
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024 // 10MB original

  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo precisa ser uma imagem (JPG, PNG, etc).')
  }
  if (file.size > maxBytes) {
    throw new Error(`Imagem muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: ${(maxBytes / 1024 / 1024).toFixed(0)}MB.`)
  }

  const dataUrlOriginal = await lerComoDataUrl(file)
  const img = await carregarImagem(dataUrlOriginal)

  let { width, height } = img
  if (width > maxLargura) {
    height = Math.round((height * maxLargura) / width)
    width = maxLargura
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Navegador não suporta canvas para compressão.')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', qualidade)
}

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Não consegui ler o arquivo.'))
    r.readAsDataURL(file)
  })
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não consegui abrir a imagem. Formato pode não ser suportado.'))
    img.src = src
  })
}
