'use client'

import { useState } from 'react'

export default function Home() {
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [data, setData] = useState([])

  const buscar = async () => {
    const res = await fetch(`/api/team-stats?homeTeam=${home}&awayTeam=${away}`)
    const json = await res.json()
    setData(json.data)
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">Estatísticas de Futebol</h1>

      <input placeholder="Time da casa" onChange={e => setHome(e.target.value)} />
      <input placeholder="Visitante" onChange={e => setAway(e.target.value)} />

      <button onClick={buscar}>Buscar</button>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}