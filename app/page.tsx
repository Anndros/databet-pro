// app/page.tsx
'use client';

import { supabase } from '@/app/lib/supabase';
import { useState } from 'react';

interface EstatisticasTime {
  time: string;
  total_jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  media_gols: number;
  media_escanteios: number;
  media_cartoes: number;
  percentual_vitorias: number;
}

interface Confronto {
  id: number;
  match_date: string;
  home_team: string;
  away_team: string;
  full_time_home_goals: number;
  full_time_away_goals: number;
  resultado_texto: string;
}

export default function Home() {
  const [timeCasa, setTimeCasa] = useState('');
  const [timeFora, setTimeFora] = useState('');
  const [estatisticasCasa, setEstatisticasCasa] = useState<EstatisticasTime | null>(null);
  const [estatisticasFora, setEstatisticasFora] = useState<EstatisticasTime | null>(null);
  const [confrontos, setConfrontos] = useState<Confronto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function buscarEstatisticas() {
    if (!timeCasa || !timeFora) {
      setErro('Digite os dois times!');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      // Buscar estatísticas do time da casa (quando joga em casa)
      const { data: dadosCasa, error: errorCasa } = await supabase
        .from('matches')
        .select('full_time_home_goals, full_time_away_goals, full_time_result, home_corners, home_yellow_cards, home_red_cards')
        .eq('home_team', timeCasa);

      // Buscar estatísticas do time visitante (quando joga fora)
      const { data: dadosFora, error: errorFora } = await supabase
        .from('matches')
        .select('full_time_home_goals, full_time_away_goals, full_time_result, away_corners, away_yellow_cards, away_red_cards')
        .eq('away_team', timeFora);

      // Buscar últimos confrontos diretos
      const { data: confrontosData, error: errorConfrontos } = await supabase
        .from('matches')
        .select('*')
        .or(`and(home_team.eq.${timeCasa},away_team.eq.${timeFora}),and(home_team.eq.${timeFora},away_team.eq.${timeCasa})`)
        .order('match_date', { ascending: false })
        .limit(10);

      if (errorCasa || errorFora || errorConfrontos) {
        console.error('Erros:', errorCasa, errorFora, errorConfrontos);
        setErro('Erro ao buscar dados. Verifique se os nomes dos times estão corretos.');
      } else {
        // Calcular estatísticas do time da casa
        if (dadosCasa && dadosCasa.length > 0) {
          const totalJogos = dadosCasa.length;
          const vitorias = dadosCasa.filter(j => j.full_time_result === 'H').length;
          const empates = dadosCasa.filter(j => j.full_time_result === 'D').length;
          const derrotas = dadosCasa.filter(j => j.full_time_result === 'A').length;
          const totalGols = dadosCasa.reduce((sum, j) => sum + (j.full_time_home_goals || 0), 0);
          const totalEscanteios = dadosCasa.reduce((sum, j) => sum + (j.home_corners || 0), 0);
          const totalCartoes = dadosCasa.reduce((sum, j) => sum + (j.home_yellow_cards || 0) + (j.home_red_cards || 0), 0);

          setEstatisticasCasa({
            time: timeCasa,
            total_jogos: totalJogos,
            vitorias,
            empates,
            derrotas,
            media_gols: Number((totalGols / totalJogos).toFixed(2)),
            media_escanteios: Number((totalEscanteios / totalJogos).toFixed(2)),
            media_cartoes: Number((totalCartoes / totalJogos).toFixed(2)),
            percentual_vitorias: Number(((vitorias / totalJogos) * 100).toFixed(1))
          });
        }

        // Calcular estatísticas do time visitante (similar)
        if (dadosFora && dadosFora.length > 0) {
          const totalJogos = dadosFora.length;
          const vitorias = dadosFora.filter(j => j.full_time_result === 'A').length;
          const empates = dadosFora.filter(j => j.full_time_result === 'D').length;
          const derrotas = dadosFora.filter(j => j.full_time_result === 'H').length;
          const totalGols = dadosFora.reduce((sum, j) => sum + (j.full_time_away_goals || 0), 0);
          const totalEscanteios = dadosFora.reduce((sum, j) => sum + (j.away_corners || 0), 0);
          const totalCartoes = dadosFora.reduce((sum, j) => sum + (j.away_yellow_cards || 0) + (j.away_red_cards || 0), 0);

          setEstatisticasFora({
            time: timeFora,
            total_jogos: totalJogos,
            vitorias,
            empates,
            derrotas,
            media_gols: Number((totalGols / totalJogos).toFixed(2)),
            media_escanteios: Number((totalEscanteios / totalJogos).toFixed(2)),
            media_cartoes: Number((totalCartoes / totalJogos).toFixed(2)),
            percentual_vitorias: Number(((vitorias / totalJogos) * 100).toFixed(1))
          });
        }

        // Preparar confrontos para exibição
        if (confrontosData) {
          const confrontosFormatados = confrontosData.map(j => ({
            id: j.id,
            match_date: new Date(j.match_date).toLocaleDateString('pt-BR'),
            home_team: j.home_team,
            away_team: j.away_team,
            full_time_home_goals: j.full_time_home_goals,
            full_time_away_goals: j.full_time_away_goals,
            resultado_texto: j.full_time_result === 'H' ? j.home_team : (j.full_time_result === 'A' ? j.away_team : 'Empate')
          }));
          setConfrontos(confrontosFormatados);
        }
      }
    } catch (err) {
      console.error(err);
      setErro('Erro inesperado ao buscar dados.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">⚽ StatsAposta</h1>
          <p className="text-gray-600">Análise estatística para suas apostas</p>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time que joga em CASA
              </label>
              <input
                type="text"
                value={timeCasa}
                onChange={(e) => setTimeCasa(e.target.value)}
                placeholder="Ex: Arsenal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time que joga FORA
              </label>
              <input
                type="text"
                value={timeFora}
                onChange={(e) => setTimeFora(e.target.value)}
                placeholder="Ex: Chelsea"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <button
            onClick={buscarEstatisticas}
            disabled={carregando}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {carregando ? 'Analisando...' : '🔍 Analisar Confronto'}
          </button>
          {erro && (
            <p className="mt-4 text-red-600 text-sm text-center">{erro}</p>
          )}
        </div>

        {/* Resultados */}
        {(estatisticasCasa || estatisticasFora) && (
          <div className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time da Casa */}
              {estatisticasCasa && (
                <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">🏠 {estatisticasCasa.time}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{estatisticasCasa.percentual_vitorias}%</div>
                      <div className="text-sm text-gray-600">Vitórias em casa</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{estatisticasCasa.media_gols}</div>
                      <div className="text-sm text-gray-600">Média de gols</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{estatisticasCasa.media_escanteios}</div>
                      <div className="text-sm text-gray-600">Média escanteios</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{estatisticasCasa.media_cartoes}</div>
                      <div className="text-sm text-gray-600">Média cartões</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    {estatisticasCasa.vitorias}V · {estatisticasCasa.empates}E · {estatisticasCasa.derrotas}D ({estatisticasCasa.total_jogos} jogos)
                  </div>
                </div>
              )}

              {/* Time Visitante */}
              {estatisticasFora && (
                <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">✈️ {estatisticasFora.time}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{estatisticasFora.percentual_vitorias}%</div>
                      <div className="text-sm text-gray-600">Vitórias fora</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{estatisticasFora.media_gols}</div>
                      <div className="text-sm text-gray-600">Média de gols</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{estatisticasFora.media_escanteios}</div>
                      <div className="text-sm text-gray-600">Média escanteios</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{estatisticasFora.media_cartoes}</div>
                      <div className="text-sm text-gray-600">Média cartões</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    {estatisticasFora.vitorias}V · {estatisticasFora.empates}E · {estatisticasFora.derrotas}D ({estatisticasFora.total_jogos} jogos)
                  </div>
                </div>
              )}
            </div>

            {/* Últimos Confrontos */}
            {confrontos.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Últimos Confrontos Diretos</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Data</th>
                        <th className="px-4 py-2 text-left">Mandante</th>
                        <th className="px-4 py-2 text-center">Placar</th>
                        <th className="px-4 py-2 text-left">Visitante</th>
                        <th className="px-4 py-2 text-left">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confrontos.map((jogo) => (
                        <tr key={jogo.id} className="border-t">
                          <td className="px-4 py-3 text-sm">{jogo.match_date}</td>
                          <td className="px-4 py-3 font-medium">{jogo.home_team}</td>
                          <td className="px-4 py-3 text-center font-bold">
                            {jogo.full_time_home_goals} - {jogo.full_time_away_goals}
                          </td>
                          <td className="px-4 py-3 font-medium">{jogo.away_team}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              jogo.resultado_texto === timeCasa ? 'bg-green-100 text-green-700' :
                              jogo.resultado_texto === timeFora ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {jogo.resultado_texto}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dica de uso */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Dica: Use os nomes dos times exatamente como aparecem nas ligas (ex: "Manchester City", "Arsenal", "Chelsea")</p>
        </div>
      </div>
    </div>
  );
}