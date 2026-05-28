import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { MapPin, Clock, FileText, ArrowLeft, AlertCircle, Camera, Loader2, Trash2, Play, Check } from 'lucide-react'

const TIPO_MOV_POLI: Record<string, string> = {
  ENTREGA_VAZIA: 'Entrega de caçamba vazia',
  COLETA_CHEIA: 'Coleta de caçamba cheia',
  TROCA: 'Troca de caçamba',
  TRANSPORTE_DESTINO: 'Transporte ao destino',
}

const SERVICO_MUNCK_LABEL: Record<string, string> = {
  ICAMENTO: 'Içamento',
  CARGA_DESCARGA: 'Carga e descarga',
  TRANSPORTE: 'Transporte',
  MOVIMENTACAO: 'Movimentação',
  INSTALACAO: 'Instalação',
  OUTROS: 'Outros',
}

async function comprimirImagem(file: File, maxLado = 1280, qualidade = 0.75): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })
  let w = img.width, h = img.height
  if (w > h && w > maxLado) { h = (h * maxLado) / w; w = maxLado }
  else if (h > maxLado) { w = (w * maxLado) / h; h = maxLado }
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', qualidade)
  })
}

export default function MotoristaOSDetalhe() {
  const { tipo, id } = useParams<{ tipo: 'munck' | 'poli'; id: string }>()
  const navigate = useNavigate()
  const [os, setOs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [ocorrencias, setOcorrencias] = useState('')
  const [respNome, setRespNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    apiMotorista.get('/motorista-app/me/operacoes-hoje')
      .then((r) => {
        const found = (r.data || []).find(
          (x: any) => x.id === id && x.__kind === (tipo === 'munck' ? 'OS_MUNCK' : 'OS_POLI'),
        )
        if (found) {
          setOs(found)
          setFotos(found.fotosUrls || [])
          setOcorrencias(found.ocorrencias || '')
          setRespNome(
            found.assinaturaClienteNome ||
            (tipo === 'munck' ? found.responsavelLocal : found.responsavelOrigem) ||
            '',
          )
        } else {
          setErro('OS não encontrada na sua fila de hoje')
        }
      })
      .finally(() => setLoading(false))
  }, [id, tipo])

  const iniciar = async () => {
    if (!id) return
    setErro('')
    try {
      await apiMotorista.post(`/motorista-app/os/${tipo}/${id}/iniciar`)
      setOs({ ...os, status: 'EM_ANDAMENTO' })
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao iniciar')
    }
  }

  const adicionarFoto = async (file: File) => {
    setUploading(true)
    setErro('')
    try {
      const blob = await comprimirImagem(file)
      const form = new FormData()
      form.append('file', blob, `${Date.now()}.jpg`)
      const { data } = await apiMotorista.post('/motorista-app/upload/operacao', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFotos((prev) => [...prev, data.url])
    } catch (e: any) {
      setErro('Falha ao enviar foto: ' + (e?.response?.data?.message || e.message))
    } finally {
      setUploading(false)
    }
  }

  const removerFoto = (i: number) => setFotos((prev) => prev.filter((_, idx) => idx !== i))

  const concluir = async () => {
    if (!id) return
    if (fotos.length === 0) {
      setErro('Adicione ao menos uma foto da execução')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await apiMotorista.post(`/motorista-app/os/${tipo}/${id}/concluir`, {
        fotosUrls: fotos,
        ocorrencias: ocorrencias || null,
        respNome: respNome || null,
        assinaturaClienteNome: respNome || null,
      })
      navigate('/m/operacoes')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao concluir')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!os) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/m/operacoes')}
          className="flex items-center gap-1 text-sm text-gray-500 active:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-center py-12">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <div className="text-red-600 text-sm">{erro}</div>
        </div>
      </div>
    )
  }

  const isMunck = tipo === 'munck'
  const tituloPrincipal = isMunck
    ? (os.servicoTipos || []).map((s: string) => SERVICO_MUNCK_LABEL[s] || s).join(' · ')
    : TIPO_MOV_POLI[os.tipoMovimento] || os.tipoMovimento

  const concluida = os.status === 'CONCLUIDA' || os.status === 'CANCELADA'
  const podeIniciar = os.status === 'RASCUNHO'
  const podeConcluir = os.status === 'EM_ANDAMENTO'

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/m/operacoes')}
        className="flex items-center gap-1 text-sm text-gray-500 active:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E0DDD8' }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4" style={{ color: '#FFAF06' }} />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            OS {isMunck ? 'Munck' : 'Poli'} · {os.numero}
          </span>
        </div>
        <div className="font-bold text-lg text-gray-900">{tituloPrincipal}</div>
        {os.cliente?.razaoSocial && (
          <div className="text-sm text-gray-700 mt-1">{os.cliente.razaoSocial}</div>
        )}
        {os.contatoNome && (
          <div className="text-xs text-gray-500 mt-1">
            Contato: {os.contatoNome}{os.contatoTelefone ? ` · ${os.contatoTelefone}` : ''}
          </div>
        )}

        <div className="space-y-1.5 mt-3 text-sm">
          {os.dtHora && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{new Date(os.dtHora).toLocaleString('pt-BR')}</span>
            </div>
          )}
          {isMunck && os.endereco && (
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{os.endereco}</span>
            </div>
          )}
          {!isMunck && os.enderecoOrigem && (
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-gray-400">Origem</div>
                <div>{os.enderecoOrigem}</div>
              </div>
            </div>
          )}
          {!isMunck && os.enderecoDestino && (
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-gray-400">Destino</div>
                <div>{os.enderecoDestino}</div>
              </div>
            </div>
          )}
        </div>

        {(os.responsavelLocal || os.responsavelOrigem) && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-600" style={{ borderColor: '#F1EFE8' }}>
            Resp. no local: <span className="text-gray-900">{os.responsavelLocal || os.responsavelOrigem}</span>
          </div>
        )}

        {isMunck && os.descricaoOperacional && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Descrição do serviço
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{os.descricaoOperacional}</div>
          </div>
        )}
        {isMunck && (os.cargaDescricao || os.cargaPesoKg) && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Carga</div>
            <div className="text-sm text-gray-700">
              {os.cargaDescricao && <div>{os.cargaDescricao}</div>}
              {os.cargaPesoKg && <div className="text-xs text-gray-500">Peso: {Number(os.cargaPesoKg).toLocaleString('pt-BR')} kg</div>}
            </div>
          </div>
        )}
      </div>

      {concluida ? (
        <div
          className="rounded-2xl border p-5 text-center"
          style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <Check className="w-10 h-10 mx-auto mb-2 text-green-600" />
          <div className="font-medium text-green-900">OS concluída</div>
          {os.hTermino && (
            <div className="text-xs text-green-800 mt-1">Término registrado às {os.hTermino}</div>
          )}
          {fotos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {fotos.map((url, i) => (
                <img key={i} src={url} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {podeIniciar && (
            <button
              onClick={iniciar}
              className="w-full py-3 rounded-xl bg-white border-2 flex items-center justify-center gap-2 font-medium text-gray-900 active:bg-gray-50"
              style={{ borderColor: '#FFAF06' }}
            >
              <Play className="w-4 h-4" />
              Iniciar OS
            </button>
          )}

          {/* Fotos */}
          <section>
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Fotos da execução
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removerFoto(i)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                    aria-label="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
              <label
                className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-white active:bg-gray-50"
                style={{ borderColor: '#E0DDD8' }}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-[10px] text-gray-500 mt-1">Adicionar</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) adicionarFoto(f)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </section>

          {/* Responsável que assinou */}
          <section>
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Responsável no local <span className="text-gray-400 normal-case">(opcional)</span>
            </div>
            <input
              type="text"
              value={respNome}
              onChange={(e) => setRespNome(e.target.value)}
              placeholder="Nome de quem assinou / recebeu"
              className="w-full px-4 py-3 bg-white rounded-xl text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </section>

          {/* Ocorrências */}
          <section>
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Ocorrências <span className="text-gray-400 normal-case">(opcional)</span>
            </div>
            <textarea
              value={ocorrencias}
              onChange={(e) => setOcorrencias(e.target.value)}
              rows={3}
              placeholder="Imprevistos, atrasos, problemas no local…"
              className="w-full px-4 py-3 bg-white rounded-xl text-sm outline-none resize-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </section>

          {erro && (
            <div className="text-red-600 text-sm text-center">{erro}</div>
          )}

          {podeConcluir && (
            <button
              onClick={concluir}
              disabled={salvando}
              className="w-full py-4 rounded-xl font-semibold text-gray-900 disabled:opacity-50 active:opacity-80"
              style={{ background: '#FFAF06' }}
            >
              {salvando ? 'Concluindo…' : 'Concluir OS'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
