import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'

const makeImgIcon = (file: string, size = 40) =>
  L.divIcon({
    className: 'custom-marker',
    html: `
      <img
        src="/icones/${file}"
        alt=""
        style="width: ${size}px; height: ${size}px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));"
      />
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 4],
    popupAnchor: [0, -(size - 4)],
  })

const iconePorTipoEquip = (tipo: string, size = 40) => {
  const map: Record<string, string> = {
    CONTAINER_SECO: 'container.png',
    CONTAINER_REEFER: 'container.png',
    CACAMBA_ESTACIONARIA: 'cacamba.png',
    CAMINHAO_MUNCK: 'munck.png',
  }
  return makeImgIcon(map[tipo] || 'container.png', size)
}
const iconCaminhao = (size = 40) => makeImgIcon('caminhao.png', size)

const tipoLabel = (v: string) =>
  ({
    CONTAINER_SECO: 'Container Seco',
    CONTAINER_REEFER: 'Container Reefer',
    CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
    CAMINHAO_MUNCK: 'Caminhão Munck',
    MUNCK: 'Munck',
    POLIGUINDASTE: 'Poliguindaste',
    CAVALO_MECANICO: 'Cavalo Mecânico',
  }[v]) || v

type Item = {
  id: string
  tipo: string
  codigo: string
  modelo: string
  placa?: string
  status?: string
  latitude: number
  longitude: number
  localizacao?: string
}

export default function MapaEquipamentos({
  equipamentos = [],
  caminhoes = [],
  height = '300px',
  iconSize = 32,
}: {
  equipamentos?: Item[]
  caminhoes?: Item[]
  height?: string
  iconSize?: number
}) {
  const navigate = useNavigate()
  const todos = [...equipamentos, ...caminhoes]
  const centro: [number, number] = todos.length > 0
    ? [
        todos.reduce((s, p) => s + p.latitude, 0) / todos.length,
        todos.reduce((s, p) => s + p.longitude, 0) / todos.length,
      ]
    : [-8.0476, -34.877] // Recife

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden">
      <MapContainer center={centro} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {equipamentos.map((e) => (
          <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={iconePorTipoEquip(e.tipo, iconSize)}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{e.codigo}</div>
                <div className="text-gray-600">{e.modelo}</div>
                <div className="text-xs text-gray-500 mt-1">{tipoLabel(e.tipo)}{e.status ? ` • ${e.status}` : ''}</div>
                {e.localizacao && <div className="text-xs text-gray-500 mt-1">{e.localizacao}</div>}
                <button onClick={() => navigate(`/equipamentos/${e.id}`)} className="mt-2 text-xs font-medium" style={{ color: '#FFAF06' }}>
                  Ver detalhe →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {caminhoes.map((c) => (
          <Marker key={`c-${c.id}`} position={[c.latitude, c.longitude]} icon={iconCaminhao(iconSize)}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{c.codigo}{c.placa ? ` — ${c.placa}` : ''}</div>
                <div className="text-gray-600">{c.modelo}</div>
                <div className="text-xs text-gray-500 mt-1">{tipoLabel(c.tipo)}{c.status ? ` • ${c.status}` : ''}</div>
                {c.localizacao && <div className="text-xs text-gray-500 mt-1">{c.localizacao}</div>}
                <button onClick={() => navigate(`/caminhoes/${c.id}`)} className="mt-2 text-xs font-medium" style={{ color: '#2D80D1' }}>
                  Ver detalhe →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
