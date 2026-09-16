import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <nav className="bg-blue-700 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
      <Link to="/" className="font-bold text-lg whitespace-nowrap">FPL Dashboard</Link>
      <div className="flex flex-wrap gap-3 items-center text-sm sm:text-base">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <Link to="/players" className="hover:underline">Players</Link>
        <Link to="/fixtures" className="hover:underline">Fixtures</Link>
        <Link to="/suggestions" className="hover:underline">Suggestions</Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="bg-blue-900 px-3 py-1 rounded hover:bg-blue-800 whitespace-nowrap">
            Log Out
          </button>
        ) : (
          <Link to="/login" className="bg-blue-900 px-3 py-1 rounded hover:bg-blue-800 whitespace-nowrap">
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
