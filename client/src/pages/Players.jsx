import { useEffect, useState } from 'react';
import client from '../api/client';
import PointsChart from '../components/PointsChart';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [positionFilter, setPositionFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchPlayers();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [positionFilter, teamFilter]);

  async function fetchTeams() {
    try {
      const res = await client.get('/teams');
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPlayers() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (positionFilter) params.position = positionFilter;
      if (teamFilter) params.team = teamFilter;
      const res = await client.get('/players', { params });
      setPlayers(res.data);
    } catch (err) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }

  async function handleCompare() {
    if (selectedIds.length < 2) return;
    setCompareLoading(true);
    try {
      const res = await client.get('/players/compare/list', {
        params: { ids: selectedIds.join(',') },
      });
      setCompareData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  }

  const filteredByPrice = maxPrice
    ? players.filter((p) => p.nowCost <= parseFloat(maxPrice) * 10)
    : players;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Players</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Max price (£m)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border rounded px-3 py-2 w-40"
          step="0.1"
        />
      </div>

      {/* Selection bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-center justify-between">
          <span className="text-sm">
            {selectedIds.length} player{selectedIds.length > 1 ? 's' : ''} selected (max 3) for comparison
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCompare}
              disabled={selectedIds.length < 2 || compareLoading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
            >
              {compareLoading ? 'Loading...' : 'Compare'}
            </button>
            <button
              onClick={() => { setSelectedIds([]); setCompareData(null); }}
              className="bg-gray-200 px-4 py-1.5 rounded text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {compareData && <PointsChart players={compareData} />}

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading players...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Form</th>
              </tr>
            </thead>
            <tbody>
              {filteredByPrice.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      disabled={!selectedIds.includes(p.id) && selectedIds.length >= 3}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">{p.webName}</td>
                  <td className="px-3 py-2">{p.team.shortName}</td>
                  <td className="px-3 py-2">{p.position}</td>
                  <td className="px-3 py-2">£{(p.nowCost / 10).toFixed(1)}m</td>
                  <td className="px-3 py-2">{p.totalPoints}</td>
                  <td className="px-3 py-2">{p.form}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Players;
