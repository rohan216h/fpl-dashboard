import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2563eb', '#dc2626', '#16a34a'];

function PointsChart({ players }) {
  if (!players || players.length === 0) return null;

  // Build a unified list of gameweek numbers across all selected players
  const gwSet = new Set();
  players.forEach((p) => p.stats.forEach((s) => gwSet.add(s.gameweekId)));
  const gameweeks = Array.from(gwSet).sort((a, b) => a - b);

  // Build chart data: one row per gameweek, one column per player's points
  const data = gameweeks.map((gw) => {
    const row = { gameweek: `GW${gw}` };
    players.forEach((p) => {
      const stat = p.stats.find((s) => s.gameweekId === gw);
      row[p.webName] = stat ? stat.points : 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="font-semibold mb-3">Gameweek Points Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="gameweek" />
          <YAxis />
          <Tooltip />
          <Legend />
          {players.map((p, i) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.webName}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PointsChart;
