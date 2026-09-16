import { useEffect, useState } from 'react';
import client from '../api/client';

function difficultyColor(diff) {
  switch (diff) {
    case 1: return 'bg-green-500';
    case 2: return 'bg-green-300';
    case 3: return 'bg-yellow-300';
    case 4: return 'bg-orange-400';
    case 5: return 'bg-red-500';
    default: return 'bg-gray-200';
  }
}

function Fixtures() {
  const [teams, setTeams] = useState([]);
  const [fixturesByTeam, setFixturesByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const teamsRes = await client.get('/teams');
      setTeams(teamsRes.data);

      // Fetch next-5 fixture difficulty for every team in parallel
      const results = await Promise.all(
        teamsRes.data.map((t) =>
          client
            .get('/fixtures/difficulty', { params: { teamId: t.id, nextN: 5 } })
            .then((res) => ({ teamId: t.id, fixtures: res.data }))
        )
      );

      const map = {};
      results.forEach((r) => {
        map[r.teamId] = r.fixtures;
      });
      setFixturesByTeam(map);
    } catch (err) {
      console.error(err);
      setError('Failed to load fixture difficulty');
    } finally {
      setLoading(false);
    }
  }

  const teamNameById = (id) => teams.find((t) => t.id === id)?.shortName || id;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Fixture Difficulty — Next 5 Gameweeks</h1>

      <div className="flex gap-4 text-xs mb-4 items-center">
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-500 inline-block rounded" /> Easiest</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-300 inline-block rounded" /> Easy</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-yellow-300 inline-block rounded" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-orange-400 inline-block rounded" /> Hard</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-500 inline-block rounded" /> Hardest</span>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading fixtures...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow -mx-4 sm:mx-0">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-2 py-2">GW+1</th>
                <th className="px-2 py-2">GW+2</th>
                <th className="px-2 py-2">GW+3</th>
                <th className="px-2 py-2">GW+4</th>
                <th className="px-2 py-2">GW+5</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const fixtures = fixturesByTeam[t.id] || [];
                return (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{t.shortName}</td>
                    {[0, 1, 2, 3, 4].map((i) => {
                      const f = fixtures[i];
                      return (
                        <td key={i} className="px-2 py-2">
                          {f ? (
                            <div
                              className={`text-white text-xs rounded px-2 py-1 text-center ${difficultyColor(f.difficulty)}`}
                              title={`Difficulty ${f.difficulty}`}
                            >
                              {f.isHome ? '' : '@'}{teamNameById(f.opponent)}
                            </div>
                          ) : (
                            <div className="text-gray-300 text-xs text-center">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Fixtures;
