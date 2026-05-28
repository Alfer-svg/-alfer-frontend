import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { MapPin, Clock, FileText, ArrowLeft, AlertCircle } from 'lucide-react'

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

export default function MotoristaOSDetalhe() {
  const { tipo, id } = useParams<{ tipo: 'munck' | 'poli'; id: string }>()
  const navigate = useNavigate()
  const [os, setOs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    apiMotorista.get('/motorista-app/me/operacoes-hoje')
      .then((r) => {
        const found = (r.data || []).find(
          (x: any) => x.id === id && x.__kind === (tipo === 'munck' ? 'OS_MUNCK' : 'OS_POLI'),
        )
        if (found) setOs(found)
        else setErro('OS não encontrada na sua fila de hoje')
      })
      .finally(() => setLoading(false))
  }, [id, tipo])

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
          {/* Endereços diferem entre Munck e Poli */}
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

        {/* Resp. no local */}
        {(os.responsavelLocal || os.responsavelOrigem) && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-600" style={{ borderColor: '#F1EFE8' }}>
            Resp. no local: <span className="text-gray-900">{os.responsavelLocal || os.responsavelOrigem}</span>
            {(os.telResponsavel || os.telResponsavelOrig) && (
              <span className="ml-1">· {os.telResponsavel || os.telResponsavelOrig}</span>
            )}
          </div>
        )}

        {/* Detalhes específicos */}
        {isMunck && os.descricaoOperacional && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Descrição do serviço
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{os.descricaoOperacional}</div>
          </div>
        )}
        {isMunck && (os.cargaDescricao || os.cargaPesoKg || os.cargaDimensoes) && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Carga
            </div>
            <div className="text-sm text-gray-700 space-y-0.5">
              {os.cargaDescricao && <div>{os.cargaDescricao}</div>}
              {os.cargaPesoKg && <div className="text-xs text-gray-500">Peso: {Number(os.cargaPesoKg).toLocaleString('pt-BR')} kg</div>}
              {os.cargaQuantidade && <div className="text-xs text-gray-500">Quantidade: {os.cargaQuantidade}</div>}
              {os.cargaDimensoes && <div className="text-xs text-gray-500">Dimensões: {os.cargaDimensoes}</div>}
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-2xl border p-4 text-sm"
        style={{ background: '#FEF8E1', borderColor: '#F9E79F', color: '#7D6608' }}
      >
        <strong>Em construção:</strong> registrar conclusão da OS (com fotos e
        assinatura do responsável) pelo motorista será adicionado em breve.
        Por enquanto, finalize a OS no painel admin do SIAGO.
      </div>
    </div>
  )
}
