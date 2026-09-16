import { useEffect, useState } from 'react';
import client from '../api/client';
import PlayerCard from '../components/PlayerCard';

function Dashboard() {
  const [squadData, setSquadData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fplTeamId, setFplTeamId] = useState('');
  const [linking, setLinking] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (isLoggedIn) {
      fetchSquad();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchSquad() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/my-squad');
      setSquadData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load squad');
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkTeam(e) {
    e.preventDefault();
    setLinking(true);
    setError('');
    try {
      await client.patch('/auth/link-fpl-team', { fplTeamId: parseInt(fplTeamId, 10) });
      await fetchSquad();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to link team');
    } finally {
      setLinking(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="p-10 text-center">
        <p className="text-lg">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }

  // No team linked yet, or squad fetch failed because none linked
  if (!squadData) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-6 bg-white rounded-lg shadow">
        <h1 className="text-xl font-bold mb-4">Link Your FPL Team</h1>
        <form onSubmit={handleLinkTeam} className="space-y-4">
          <input
            type="number"
            placeholder="Your FPL Team ID"
            value={fplTeamId}
            onChange={(e) => setFplTeamId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={linking}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {linking ? 'Linking...' : 'Link Team'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Find your Team ID in the URL when viewing your team on fantasy.premierleague.com
        </p>
      </div>
    );
  }

  const totalPoints = squadData.entryHistory?.total_points;
  const gwPoints = squadData.entryHistory?.points;
  const rank = squadData.entryHistory?.overall_rank;

  const starting = squadData.squad.filter((p) => p.multiplier > 0);
  const bench = squadData.squad.filter((p) => p.multiplier === 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your Squad — Gameweek {squadData.gameweek}</h1>
      <div className="flex gap-6 text-sm text-gray-600 mb-6">
        <span>GW Points: <strong>{gwPoints}</strong></span>
        <span>Total Points: <strong>{totalPoints}</strong></span>
        <span>Overall Rank: <strong>{rank?.toLocaleString()}</strong></span>
      </div>

      <h2 className="text-lg font-semibold mb-3">Starting XI</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {starting.map((p) => (
          <PlayerCard key={p.element} pick={p} />
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Bench</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {bench.map((p) => (
          <PlayerCard key={p.element} pick={p} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
