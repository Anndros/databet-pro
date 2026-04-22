export const runtime = 'nodejs'

import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const homeTeam = searchParams.get('homeTeam')
    const awayTeam = searchParams.get('awayTeam')

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: 'Times obrigatórios' })
    }

    // 🔹 Buscar jogos do mandante em casa
    const { data: homeMatches } = await supabase
      .from('matches')
      .select('*')
      .ilike('home_team', `%${homeTeam}%`)

    // 🔹 Buscar jogos do visitante fora
    const { data: awayMatches } = await supabase
      .from('matches')
      .select('*')
      .ilike('away_team', `%${awayTeam}%`)

    // 🔹 Função para calcular stats
    const calcularStats = (jogos: any[], tipo: 'home' | 'away') => {
      let totalJogos = jogos.length
      let over25 = 0
      let btts = 0
      let totalGols = 0

      jogos.forEach(jogo => {
        const golsCasa = jogo.full_time_home_goals
        const golsFora = jogo.full_time_away_goals

        const total = golsCasa + golsFora
        totalGols += total

        if (total >= 3) over25++

        if (golsCasa > 0 && golsFora > 0) btts++
      })

      return {
        jogos: totalJogos,
        mediaGols: totalJogos ? (totalGols / totalJogos).toFixed(2) : 0,
        over25: totalJogos ? ((over25 / totalJogos) * 100).toFixed(1) : 0,
        btts: totalJogos ? ((btts / totalJogos) * 100).toFixed(1) : 0,
      }
    }

    const homeStats = calcularStats(homeMatches || [], 'home')
    const awayStats = calcularStats(awayMatches || [], 'away')

    return NextResponse.json({
      homeTeam,
      awayTeam,
      homeStats,
      awayStats
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' })
  }
}