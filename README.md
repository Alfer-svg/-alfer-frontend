# Alfer Frontend — Painel de Gestão

React + Vite + TypeScript + Tailwind CSS

## Rodar localmente

```bash
npm install
cp .env.example .env
npm run dev
```

Acesse: http://localhost:3001

## Deploy no Vercel

1. Acesse https://vercel.com e faça login com GitHub
2. Clique em "New Project" → selecione o repositório `alfer-frontend`
3. Em "Environment Variables", adicione:
   - `VITE_API_URL` = `https://alfer-backend-production.up.railway.app/api/v1`
4. Clique em "Deploy"

## Credenciais

- Admin: `admin@alferequipamentos.com.br` / `alfer2026`
- Motorista: matrícula `MOT001` / PIN `1234`

## Módulos implementados

- ✅ Login com autenticação JWT
- ✅ Dashboard com KPIs e alertas
- ✅ Clientes — listagem com busca
- ✅ Contratos — listagem com filtros
- ✅ Financeiro — KPIs e lançamentos
- 🔧 Equipamentos (em desenvolvimento)
- 🔧 Caminhões (em desenvolvimento)
- 🔧 Caçambas (em desenvolvimento)
- 🔧 Agenda (em desenvolvimento)
