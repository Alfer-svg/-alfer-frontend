import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthMotorista } from '../AuthMotoristaContext'
import apiMotorista from '../api'
import { Fuel, Gauge, Droplets, CheckCircle2, AlertCircle, ChevronLeft, Camera, Loader2, Check } from 'lucide-react'

interface AbastecimentoItem {
  id: string
  dtAbastecimento: string
  kmAbastecimento: number
  litros: string | number
  litrosArla: string | number | null
  valorTotal: string | number
  caminhao?: { codigo: string; placa?: string | null }
}

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Aceita "123,45" ou "123.45" e devolve número (ou NaN).
const parseNum = (s: string) => Number(String(s).replace(/\./g, '').replace(',', '.'))

async function comprimirImagem(file: File, maxLado = 1280, qualidade = 0.7): Promise<Blob> {
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

export default function MotoristaAbastecimento() {
  const { caminhao } = useAuthMotorista()
  const navigate = useNavigate()

  const [km, setKm] = useState('')
  const [valor, setValor] = useState('')
  const [litrosDiesel, setLitrosDiesel] = useState('')
  const [litrosArla, setLitrosArla] = useState('')
  const [fotoNota, setFotoNota] = useState('')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [recentes, setRecentes] = useState<AbastecimentoItem[]>([])

  const escolherFotoNota = async (file: File) => {
    setUploadingFoto(true)
    setErro('')
    try {
      const blob = await comprimirImagem(file)
      const form = new FormData()
      form.append('file', blob, 'nota.jpg')
      const { data } = await apiMotorista.post('/motorista-app/upload/abastecimento', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFotoNota(data.url)
    } catch (e: any) {
      setErro('Falha ao enviar foto: ' + (e?.response?.data?.message || e.message))
    } finally {
      setUploadingFoto(false)
    }
  }

  useEffect(() => {
    apiMotorista.get('/motorista-app/me/abastecimentos')
      .then((r) => setRecentes(r.data || []))
      .catch(() => {})
  }, [ok])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    const kmN = parseNum(km)
    const valorN = parseNum(valor)
    const dieselN = parseNum(litrosDiesel)
    const arlaN = litrosArla.trim() ? parseNum(litrosArla) : 0

    if (!Number.isFinite(kmN) || kmN < 0) return setErro('Informe o KM do veículo')
    if (!(dieselN > 0)) return setErro('Informe os litros de diesel')
    if (!(valorN > 0)) return setErro('Informe o valor abastecido')
    if (litrosArla.trim() && (!Number.isFinite(arlaN) || arlaN < 0)) return setErro('Litros de arla inválido')
    if (!fotoNota) return setErro('Anexe a foto da nota fiscal')

    setEnviando(true)
    try {
      await apiMotorista.post('/motorista-app/abastecimento', {
        kmAbastecimento: kmN,
        valorTotal: valorN,
        litros: dieselN,
        litrosArla: litrosArla.trim() ? arlaN : null,
        fotoNotaUrl: fotoNota,
      })
      setOk(true)
      setKm(''); setValor(''); setLitrosDiesel(''); setLitrosArla(''); setFotoNota('')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao registrar abastecimento')
    } finally {
      setEnviando(false)
    }
  }

  if (!caminhao) {
    return (
      <div className="rounded-2xl bg-white border p-6 text-center" style={{ borderColor: '#E0DDD8' }}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <div className="font-medium text-gray-900 mb-1">Sem veículo alocado</div>
        <div className="text-sm text-gray-500">Procure o gestor pra alocar um caminhão à sua matrícula.</div>
      </div>
    )
  }

  if (ok) {
    return (
      <div className="space-y-5">
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <div className="font-bold text-green-900 mb-1">Abastecimento registrado!</div>
          <div className="text-sm text-green-800">Tá tudo certo. Bom trabalho.</div>
        </div>
        <button
          onClick={() => setOk(false)}
          className="w-full py-3.5 rounded-xl font-semibold text-gray-900 active:opacity-80"
          style={{ background: '#FFAF06' }}
        >
          Registrar outro
        </button>
        <button
          onClick={() => navigate('/m/veiculo')}
          className="w-full py-3 rounded-xl font-medium text-gray-600 bg-white border active:bg-gray-50"
          style={{ borderColor: '#E0DDD8' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/m/veiculo')}
        className="flex items-center gap-1 text-sm text-gray-500 -ml-1 active:opacity-70"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center gap-2">
        <Fuel className="w-6 h-6" style={{ color: '#FFAF06' }} />
        <h1 className="text-xl font-bold text-gray-900">Abastecimento</h1>
      </div>
      <p className="text-sm text-gray-500 -mt-3">
        {caminhao.codigo} · {caminhao.placa || caminhao.modelo}
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: '#E0DDD8' }}>
          <Campo
            icon={<Gauge className="w-4 h-4 text-gray-400" />}
            label="KM do veículo"
            value={km}
            onChange={setKm}
            placeholder="Ex: 154320"
            inputMode="numeric"
            sufixo="km"
          />
          <Campo
            icon={<span className="text-gray-400 text-sm font-semibold">R$</span>}
            label="Valor abastecido"
            value={valor}
            onChange={setValor}
            placeholder="Ex: 850,00"
            inputMode="decimal"
          />
          <Campo
            icon={<Fuel className="w-4 h-4 text-gray-400" />}
            label="Diesel"
            value={litrosDiesel}
            onChange={setLitrosDiesel}
            placeholder="Ex: 120"
            inputMode="decimal"
            sufixo="L"
          />
          <Campo
            icon={<Droplets className="w-4 h-4 text-gray-400" />}
            label="Arla 32 (opcional)"
            value={litrosArla}
            onChange={setLitrosArla}
            placeholder="Ex: 10"
            inputMode="decimal"
            sufixo="L"
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Foto da nota fiscal</label>
            <label
              className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer overflow-hidden bg-white active:bg-gray-50"
              style={{ borderColor: fotoNota ? '#C8E6C9' : '#E0DDD8', minHeight: fotoNota ? '11rem' : '6rem' }}
            >
              {fotoNota ? (
                <>
                  <img src={fotoNota} alt="Nota fiscal" className="w-full h-44 object-cover" />
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                    Toque pra trocar
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-5">
                  {uploadingFoto ? (
                    <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                  ) : (
                    <Camera className="w-7 h-7 text-gray-400" />
                  )}
                  <div className="text-xs text-gray-600 mt-1.5 font-medium">
                    {uploadingFoto ? 'Enviando…' : 'Tirar foto da nota'}
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) escolherFotoNota(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        {erro && (
          <div className="text-red-600 text-sm text-center">{erro}</div>
        )}

        <button
          type="submit"
          disabled={enviando || uploadingFoto}
          className="w-full py-3.5 rounded-xl font-semibold text-gray-900 text-base disabled:opacity-50 active:opacity-80"
          style={{ background: '#FFAF06' }}
        >
          {enviando ? 'Registrando…' : 'Registrar abastecimento'}
        </button>
      </form>

      {recentes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            Últimos abastecimentos
          </div>
          {recentes.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border p-3.5 flex items-center justify-between"
              style={{ borderColor: '#E0DDD8' }}
            >
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm">
                  {fmtMoeda(Number(a.valorTotal))}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {Number(a.litros)} L diesel
                  {a.litrosArla != null && Number(a.litrosArla) > 0 ? ` · ${Number(a.litrosArla)} L arla` : ''}
                  {' · '}{Number(a.kmAbastecimento).toLocaleString('pt-BR')} km
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 ml-3">
                {new Date(a.dtAbastecimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Campo({
  icon, label, value, onChange, placeholder, inputMode, sufixo,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric' | 'decimal'
  sufixo?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div
        className="flex items-center gap-2 px-3.5 rounded-xl bg-white"
        style={{ border: '1px solid #E0DDD8' }}
      >
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="flex-1 py-3 text-base outline-none bg-transparent"
        />
        {sufixo && <span className="text-sm text-gray-400">{sufixo}</span>}
      </div>
    </div>
  )
}
