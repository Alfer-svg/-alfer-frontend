import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'

const makeImgIcon = (file: string, size = 40) => {
  const imgSize = Math.round(size * 0.78)
  const totalH = size + Math.round(size * 0.3)
  const arrowSize = Math.round(size * 0.18)
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${totalH}px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <div style="
          width: ${size}px; height: ${size}px;
          background: white;
          border-radius: 50%;
          border: 1px solid #C7C2BB;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
        ">
          <img src="/icones/${file}" alt="" style="width: ${imgSize}px; height: ${imgSize}px; object-fit: contain;" />
        </div>
        <div style="
          position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: ${arrowSize}px solid transparent;
          border-right: ${arrowSize}px solid transparent;
          border-top: ${Math.round(arrowSize * 1.7)}px solid #C7C2BB;
        "></div>
        <div style="
          position: absolute; bottom: 2px; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: ${arrowSize - 2}px solid transparent;
          border-right: ${arrowSize - 2}px solid transparent;
          border-top: ${Math.round(arrowSize * 1.5)}px solid white;
        "></div>
      </div>
    `,
    iconSize: [size, totalH],
    iconAnchor: [size / 2, totalH],
    popupAnchor: [0, -totalH],
  })
}

const iconePorTipoEquip = (tipo: string, size = 40) => {
  const map: Record<string, string> = {
    CONTAINER_SECO: 'container.png',
    CONTAINER_REEFER: 'container.png',
    CACAMBA_ESTACIONARIA: 'cacamba.png',
    CAMINHAO_MUNCK: 'munck.png',
    CAMINHAO_POLIGUINDASTE: 'caminhao.png',
    CAMINHAO_CAVALO_MECANICO: 'caminhao.png',
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
    CAMINHAO_POLIGUINDASTE: 'Caminhão Poliguindaste',
    CAMINHAO_CAVALO_MECANICO: 'Caminhão Cavalo Mecânico',
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
