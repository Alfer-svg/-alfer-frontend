import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { Map as MapIcon, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

// Ícone dentro de balão branco com ponteiro (estilo pin de mapa)
const makeImgIcon = (file: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: 56px; height: 68px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <div style="
          width: 56px; height: 56px;
          background: white;
          border-radius: 50%;
          border: 1px solid #C7C2BB;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
        ">
          <img src="/icones/${file}" alt="" style="width: 44px; height: 44px; object-fit: contain;" />
        </div>
        <div style="
          position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 14px solid #C7C2BB;
        "></div>
        <div style="
          position: absolute; bottom: 2px; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 11px solid white;
        "></div>
      </div>
    `,
    iconSize: [56, 68],
    iconAnchor: [28, 68],
    popupAnchor: [0, -68],
  })

const iconePorTipoEquip: Record<string, L.DivIcon> = {
  CONTAINER_SECO: makeImgIcon('container.png'),
  CONTAINER_REEFER: makeImgIcon('container.png'),
  CACAMBA_ESTACIONARIA: makeImgIcon('cacamba.png'),
  CAMINHAO_MUNCK: makeImgIcon('munck.png'),
}
const iconCaminhao = makeImgIcon('caminhao.png')
const iconEquipDefault = makeImgIcon('container.png')

const tipoEquipLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
}

const tipoCamLabel: Record<string, string> = {
  MUNCK: 'Munck',
  POLIGUINDASTE: 'Poliguindaste',
  CAVALO_MECANICO: 'Cavalo Mecânico',
}

export default function Mapa() {
  const navigate = useNavigate()
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarEquip, setMostrarEquip] = useState(true)
  const [mostrarCam, setMostrarCam] = useState(true)
  const [filtroStatusEquip, setFiltroStatusEquip] = useState('LOCADO')
  const [regeocodificando, setRegeocodificando] = useState(false)

  const regeocodificar = async () => {
    if (!confirm('Recalcular coordenadas de TODOS os equipamentos mobilizados sem lat/lng?\n\nIsso consulta o serviço de geocoding (Nominatim) — 1 endereço por segundo. Pode demorar.')) return
    setRegeocodificando(true)
    try {
      const r = await fetch((api.defaults.baseURL || '').replace(/\/$/, '') + '/logistica/regeocodificar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('alfer_token')}` },
      })
      const data = await r.json()
      alert(`✓ Concluído: ${data.sucesso || 0} com sucesso, ${data.falhou || 0} falharam (de ${data.total || 0} pendentes).`)
      window.location.reload()
    } catch (e: any) {
      alert('Erro: ' + (e?.message || 'desconhecido'))
    } finally {
      setRegeocodificando(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/equipamentos', { params: filtroStatusEquip ? { status: filtroStatusEquip } : {} }),
      api.get('/caminhoes'),
    ])
      .then(([e, c]) => {
        setEquipamentos(e.data.filter((x: any) => x.latitude != null && x.longitude != null))
        setCaminhoes(c.data.filter((x: any) => x.latitude != null && x.longitude != null))
      })
      .finally(() => setLoading(false))
  }, [filtroStatusEquip])

  // Centro: média dos pontos, ou Recife como fallback
  const todos = [
    ...(mostrarEquip ? equipamentos : []),
    ...(mostrarCam ? caminhoes : []),
  ]
  const centro: [number, number] = todos.length > 0
    ? [
        todos.reduce((s, p) => s + p.latitude, 0) / todos.length,
        todos.reduce((s, p) => s + p.longitude, 0) / todos.length,
      ]
    : [-8.0476, -34.8770] // Recife

  return (
    <div className="p-8 animate-fade-in h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Mapa</h1>
          <p className="text-gray-500 text-sm mt-1">
            {equipamentos.length + caminhoes.length} item(s) com localização cadastrada
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={regeocodificar}
            disabled={regeocodificando}
            title="Recalcula coordenadas de equipamentos mobilizados sem lat/lng (consultando Nominatim)"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            style={{ border: '1px solid #E0DDD8' }}
          >
            {regeocodificando ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Atualizar coordenadas
          </button>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={mostrarEquip} onChange={(e) => setMostrarEquip(e.target.checked)} className="w-4 h-4" style={{ accentColor: '#FFAF06' }} />
            <span className="flex items-center gap-1">
              <img src="/icones/container.png" alt="" className="w-5 h-5 object-contain" />
              Equipamentos ({equipamentos.length})
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={mostrarCam} onChange={(e) => setMostrarCam(e.target.checked)} className="w-4 h-4" style={{ accentColor: '#FFAF06' }} />
            <span className="flex items-center gap-1">
              <img src="/icones/caminhao.png" alt="" className="w-5 h-5 object-contain" />
              Caminhões ({caminhoes.length})
            </span>
          </label>
          <select
            value={filtroStatusEquip}
            onChange={(e) => setFiltroStatusEquip(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <option value="">Todos os equipamentos</option>
            <option value="LOCADO">Só locados</option>
            <option value="DISPONIVEL">Só disponíveis</option>
            <option value="MANUTENCAO">Só em manutenção</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : todos.length === 0 && !loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 max-w-md">
            <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum item com coordenadas cadastradas</p>
            <p className="text-xs mt-2 flex items-start gap-2 justify-center">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Edite um equipamento ou caminhão e use o botão "Buscar coordenadas" no campo de localização para gerar lat/lng a partir do endereço.</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: '500px' }}>
          <MapContainer center={centro} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mostrarEquip && equipamentos.map((e) => (
              <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={iconePorTipoEquip[e.tipo] || iconEquipDefault}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{e.codigo}</div>
                    <div className="text-gray-600">{e.modelo}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tipoEquipLabel[e.tipo] || e.tipo} • {e.status}
                    </div>
                    {e.localizacao && <div className="text-xs text-gray-500 mt-1">{e.localizacao}</div>}
                    <button
                      onClick={() => navigate(`/equipamentos/${e.id}`)}
                      className="mt-2 text-xs font-medium"
                      style={{ color: '#FFAF06' }}
                    >
                      Ver detalhe →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {mostrarCam && caminhoes.map((c) => (
              <Marker key={`c-${c.id}`} position={[c.latitude, c.longitude]} icon={iconCaminhao}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{c.codigo} — {c.placa}</div>
                    <div className="text-gray-600">{c.modelo}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tipoCamLabel[c.tipo] || c.tipo} • {c.status}
                    </div>
                    {c.localizacao && <div className="text-xs text-gray-500 mt-1">{c.localizacao}</div>}
                    {c.ultimaLocAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        Atualizado: {new Date(c.ultimaLocAt).toLocaleString('pt-BR')}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/caminhoes/${c.id}`)}
                      className="mt-2 text-xs font-medium"
                      style={{ color: '#2D80D1' }}
                    >
                      Ver detalhe →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
