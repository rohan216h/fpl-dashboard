function PlayerCard({ pick }) {
  const { player, is_captain, is_vice_captain } = pick;
  if (!player) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center relative">
      {is_captain && (
        <span className="absolute top-1 right-1 bg-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
          C
        </span>
      )}
      {is_vice_captain && (
        <span className="absolute top-1 right-1 bg-gray-300 text-xs font-bold px-1.5 py-0.5 rounded">
          VC
        </span>
      )}
      <p className="font-semibold">{player.webName}</p>
      <p className="text-xs text-gray-500">{player.team.shortName} · {player.position}</p>
      <p className="text-sm mt-2">
        <span className="font-bold">{player.totalPoints}</span> pts
      </p>
      <p className="text-xs text-gray-500">Form: {player.form}</p>
    </div>
  );
}

export default PlayerCard;
