import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const homeTeam = searchParams.get('homeTeam')
  const awayTeam = searchParams.get('awayTeam')

  const { data } = await supabase
    .from('matches')
    .select('*')
    .or(`home_team.eq.${homeTeam},away_team.eq.${awayTeam}`)
    .limit(10)

  return NextResponse.json({ data })
}