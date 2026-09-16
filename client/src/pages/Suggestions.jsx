import { useEffect, useState } from 'react';
import client from '../api/client';

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
const POSITION_LABELS = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };

function Suggestions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (isLoggedIn) fetchSuggestions();
    else setLoading(false);
  }, []);

  async function fetchSuggestions() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/suggestions');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="p-10 text-center">
        <p className="text-lg">Please log in to view suggestions.</p>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading suggestions...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Transfer Suggestions</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ranked by recent form and how easy their upcoming fixtures look. Players already in your squad are excluded.
      </p>

      {POSITION_ORDER.map((pos) => {
        const list = data?.[pos] || [];
        if (list.length === 0) return null;
        return (
          <div key={pos} className="mb-8">
            <h2 className="text-lg font-semibold mb-3">{POSITION_LABELS[pos]}</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {list.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold w-5">{idx + 1}</span>
                    <div>
                      <p className="font-medium">{p.webName} <span className="text-gray-500 text-sm">({p.team})</span></p>
                      <p className="text-xs text-gray-500">
                        Form {p.form} · Avg upcoming difficulty {p.avgUpcomingDifficulty}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    Score: {p.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Suggestions;
