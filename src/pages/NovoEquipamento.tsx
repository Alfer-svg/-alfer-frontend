import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle, ImagePlus, X, Plus, Trash2, MapPin } from 'lucide-react'
import { comprimirImagem } from '../utils/imagem'
import { geocodificarEndereco } from '../utils/geocoding'

const tipos = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
  { v: 'CAMINHAO_POLIGUINDASTE', l: 'Caminhão Poliguindaste' },
  { v: 'CAMINHAO_CAVALO_MECANICO', l: 'Caminhão Cavalo Mecânico' },
]

export default function NovoEquipamento() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(isEdit)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    codigo: '',
    sequencial: '',
    tipo: 'CONTAINER_SECO',
    modelo: '',
    capacidade: '',
    ano: String(new Date().getFullYear()),
    status: 'DISPONIVEL',
    localizacao: '',
    horimetro: '',
    proxManutHs: '',
    ultimaManut: '',
    descricao: '',
    fotoUrl: '',
    latitude: '',
    longitude: '',
    observacoes: '',
  })
  const [precos, setPrecos] = useState<{ tipoLocacao: string; valor: string }[]>([])
  const [geocoding, setGeocoding] = useState(false)
  const [erroGeocoding, setErroGeocoding] = useState('')

  const buscarCoords = async () => {
    if (!form.localizacao) return setErroGeocoding('Digite o endereço primeiro.')
    setErroGeocoding('')
    setGeocoding(true)
    try {
      const c = await geocodificarEndereco(form.localizacao)
      setForm((f) => ({ ...f, latitude: String(c.latitude), longitude: String(c.longitude) }))
    } catch (err: any) {
      setErroGeocoding(err.message || 'Erro ao buscar coordenadas.')
    } finally {
      setGeocoding(false)
    }
  }

  const [modelosDisp, setModelosDisp] = useState<any[]>([])
  const [modeloSelecionado, setModeloSelecionado] = useState<string>('')

  useEffect(() => {
    if (!isEdit) return
    api.get(`/equipamentos/${id}`)
      .then((r) => {
        const e = r.data
        setForm({
          codigo: e.codigo || '',
          sequencial: e.sequencial != null ? String(e.sequencial) : '',
          tipo: e.tipo || 'CONTAINER_SECO',
          modelo: e.modelo || '',
          capacidade: e.capacidade || '',
          ano: String(e.ano || new Date().getFullYear()),
          status: e.status || 'DISPONIVEL',
          localizacao: e.localizacao || '',
          horimetro: e.horimetro != null ? String(e.horimetro) : '',
          proxManutHs: e.proxManutHs != null ? String(e.proxManutHs) : '',
          ultimaManut: e.ultimaManut ? new Date(e.ultimaManut).toISOString().slice(0, 10) : '',
          descricao: e.descricao || '',
          fotoUrl: e.fotoUrl || '',
          latitude: e.latitude != null ? String(e.latitude) : '',
          longitude: e.longitude != null ? String(e.longitude) : '',
          observacoes: e.observacoes || '',
        })
        if (Array.isArray(e.precos) && e.precos.length) {
          setPrecos(e.precos.map((p: any) => ({ tipoLocacao: p.tipoLocacao, valor: String(p.valor) })))
        } else if (e.valorLocacao != null) {
          // Compatibilidade: equip antigo com valorLocacao único
          setPrecos([{ tipoLocacao: e.tipoLocacao || 'MENSAL', valor: String(e.valorLocacao) }])
        }
      })
      .finally(() => setCarregando(false))
  }, [id, isEdit])

  useEffect(() => {
    api.get('/modelos', { params: { tipo: form.tipo } })
      .then((r) => setModelosDisp(r.data))
      .catch(() => setModelosDisp([]))
    if (!isEdit) setModeloSelecionado('')
  }, [form.tipo, isEdit])

  const aplicarModelo = (modeloId: string) => {
    setModeloSelecionado(modeloId)
    if (!modeloId) return
    const m = modelosDisp.find((x) => x.id === modeloId)
    if (!m) return
    setForm((f) => ({
      ...f,
      modelo: m.nome,
      capacidade: m.capacidade || f.capacidade,
      descricao: m.descricao || f.descricao,
      fotoUrl: m.fotoUrl || f.fotoUrl,
    }))
    if (Array.isArray(m.precos) && m.precos.length && precos.length === 0) {
      setPrecos(m.precos.map((p: any) => ({ tipoLocacao: p.tipoLocacao, valor: String(p.valor) })))
    } else if (m.valorLocacao != null && precos.length === 0) {
      setPrecos([{ tipoLocacao: m.tipoLocacao || 'MENSAL', valor: String(m.valorLocacao) }])
    }
  }

  const addPreco = () => {
    const usados = new Set(precos.map((p) => p.tipoLocacao))
    const disponivel = ['HORA', 'DIARIA', 'SEMANAL', 'MENSAL'].find((t) => !usados.has(t)) || 'MENSAL'
    setPrecos((ps) => [...ps, { tipoLocacao: disponivel, valor: '' }])
  }
  const setPreco = (i: number, k: 'tipoLocacao' | 'valor', v: string) =>
    setPrecos((ps) => ps.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)))
  const removePreco = (i: number) => setPrecos((ps) => ps.filter((_, idx) => idx !== i))

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const [erroFoto, setErroFoto] = useState('')
  const [processandoFoto, setProcessandoFoto] = useState(false)

  const handleFoto = async (file: File | undefined) => {
    setErroFoto('')
    if (!file) return
    setProcessandoFoto(true)
    try {
      const dataUrl = await comprimirImagem(file)
      set('fotoUrl', dataUrl)
    } catch (err: any) {
      setErroFoto(err?.message || 'Erro ao processar a imagem.')
    } finally {
      setProcessandoFoto(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.codigo || !form.modelo || !form.capacidade) return setErro('Preencha código, modelo e capacidade.')
    setLoading(true)
    try {
      const payload = {
        ...form,
        ano: Number(form.ano),
        sequencial: form.sequencial !== '' ? Number(form.sequencial) : null,
        horimetro: form.horimetro ? Number(form.horimetro) : null,
        proxManutHs: form.proxManutHs ? Number(form.proxManutHs) : null,
        ultimaManut: form.ultimaManut || null,
        localizacao: form.localizacao || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        descricao: form.descricao || null,
        fotoUrl: form.fotoUrl || null,
        observacoes: form.observacoes || null,
        precos: precos.filter((p) => p.valor !== '').map((p) => ({ tipoLocacao: p.tipoLocacao, valor: Number(p.valor) })),
      }
      if (isEdit) {
        await api.put(`/equipamentos/${id}`, payload)
        navigate(`/equipamentos/${id}`)
      } else {
        await api.post('/equipamentos', payload)
        navigate('/equipamentos')
      }
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} equipamento.`)
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }
  const onFocus = (e: any) => (e.target.style.borderColor = '#FFAF06')
  const onBlur = (e: any) => (e.target.style.borderColor = '#E0DDD8')

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button
        onClick={() => navigate('/equipamentos')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para equipamentos
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">{isEdit ? 'Editar equipamento' : 'Novo equipamento'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isEdit ? 'Atualize os dados do equipamento' : 'Cadastre um container, caçamba ou outro equipamento da frota'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Identificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value)}
                placeholder="Ex: CS-001"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sequencial <span className="text-xs font-normal text-gray-400">(opcional — uso livre)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.sequencial}
                onChange={(e) => set('sequencial', e.target.value)}
                placeholder="Ex: 47"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                {tipos.map((t) => (
                  <option key={t.v} value={t.v}>{t.l}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo cadastrado {modelosDisp.length === 0 && (
                  <span className="text-xs font-normal text-gray-400">
                    — nenhum modelo deste tipo.{' '}
                    <button type="button" onClick={() => navigate('/modelos')} className="font-medium" style={{ color: '#FFAF06' }}>
                      Cadastre um modelo
                    </button>
                  </span>
                )}
              </label>
              <select
                value={modeloSelecionado}
                onChange={(e) => aplicarModelo(e.target.value)}
                disabled={modelosDisp.length === 0}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">— Selecione um modelo ou digite abaixo —</option>
                {modelosDisp.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}{m.capacidade ? ` (${m.capacidade})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Selecionar um modelo preenche capacidade, descrição e foto automaticamente.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input
                value={form.modelo}
                onChange={(e) => set('modelo', e.target.value)}
                placeholder="Ex: 20ft Dry Standard"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade *</label>
              <input
                value={form.capacidade}
                onChange={(e) => set('capacidade', e.target.value)}
                placeholder="Ex: 28 toneladas / 33 m³"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                value={form.ano}
                onChange={(e) => set('ano', e.target.value)}
                type="number"
                min="1980"
                max="2100"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status inicial</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="LOCADO">Locado</option>
                <option value="MANUTENCAO">Em manutenção</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização atual</label>
              <div className="flex gap-2">
                <input
                  value={form.localizacao}
                  onChange={(e) => set('localizacao', e.target.value)}
                  placeholder="Ex: Av. Conde da Boa Vista, 1500, Recife-PE"
                  className={inputCls}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={buscarCoords}
                  disabled={geocoding || !form.localizacao}
                  title="Buscar latitude/longitude pelo endereço"
                  className="flex items-center gap-1 px-3 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#FFAF06' }}
                >
                  {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  Coords
                </button>
              </div>
              {erroGeocoding && (
                <div className="mt-1 text-xs text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {erroGeocoding}</div>
              )}
              {form.latitude && form.longitude && (
                <div className="mt-1 text-xs text-green-700">
                  ✓ Coords: {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)} — vai aparecer no mapa
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Tabela de preços de locação</h2>
            <button
              type="button"
              onClick={addPreco}
              disabled={precos.length >= 4}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ color: '#FFAF06', background: '#FFF8E6' }}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar preço
            </button>
          </div>
          {precos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Nenhum preço cadastrado. Clique em "Adicionar preço" para criar (ex: R$ 50/hora, R$ 300/dia, R$ 5000/mês).
            </p>
          ) : (
            <div className="space-y-2">
              {precos.map((p, i) => (
                <div key={i} className="flex gap-2 items-center p-3 rounded-xl" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
                  <select
                    value={p.tipoLocacao}
                    onChange={(e) => setPreco(i, 'tipoLocacao', e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none bg-white"
                    style={{ border: '1px solid #E0DDD8', minWidth: '110px' }}
                  >
                    <option value="HORA">Hora</option>
                    <option value="DIARIA">Diária</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                  </select>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-sm text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={p.valor}
                      onChange={(e) => setPreco(i, 'valor', e.target.value)}
                      placeholder="0,00"
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none bg-white"
                      style={{ border: '1px solid #E0DDD8' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePreco(i)}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {precos.length > 0 && new Set(precos.map((p) => p.tipoLocacao)).size !== precos.length && (
            <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Modalidades duplicadas serão consolidadas ao salvar.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Descrição</h2>
          <textarea
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            placeholder="Descreva o equipamento (estado de conservação, acessórios, particularidades...)"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Foto</h2>
          {form.fotoUrl ? (
            <div className="relative inline-block">
              <img src={form.fotoUrl} alt="Foto do equipamento" className="rounded-xl max-h-64 object-contain" style={{ border: '1px solid #E0DDD8' }} />
              <button
                type="button"
                onClick={() => set('fotoUrl', '')}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-red-600 hover:bg-red-50"
                style={{ border: '1px solid #FACACA' }}
                title="Remover foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl py-10 px-4 text-gray-500 hover:bg-gray-50 transition-all"
              style={{ border: '2px dashed #E0DDD8' }}
            >
              {processandoFoto ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#FFAF06' }} />
                  <span className="text-sm font-medium">Processando imagem...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-8 h-8" style={{ color: '#FFAF06' }} />
                  <span className="text-sm font-medium">Clique para enviar uma foto</span>
                  <span className="text-xs text-gray-400">JPG, PNG ou HEIC • até 10MB (comprimido automaticamente)</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={processandoFoto}
                onChange={(e) => handleFoto(e.target.files?.[0])}
              />
            </label>
          )}
          {erroFoto && (
            <div className="mt-3 p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroFoto}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Notas adicionais sobre o equipamento..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>

        {erro && (
          <div
            className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2"
            style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/equipamentos')}
            className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
            style={{ border: '1px solid #E0DDD8' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-900 transition-all flex items-center justify-center gap-2"
            style={{ background: loading ? '#CC8C00' : '#FFAF06' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEdit ? 'Salvar alterações' : 'Salvar equipamento'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
