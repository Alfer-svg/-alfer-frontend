import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { Map as MapIcon, AlertCircle } from 'lucide-react'

// Ícone customizado usando imagens em /public/icones/
const makeImgIcon = (file: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: white;
        width: 52px; height: 52px;
        border-radius: 50%;
        border: 3px solid #FFAF06;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      ">
        <img src="/icones/${file}" alt="" style="width: 42px; height: 42px; object-fit: contain;" />
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
    popupAnchor: [0, -52],
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
