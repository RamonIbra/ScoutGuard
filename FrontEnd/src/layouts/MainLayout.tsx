import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const MainLayout = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-2xl font-bold mb-4">ScoutGuard</h2>

        <nav className="flex flex-col space-y-2">
          <Link to="/" className="hover:text-green-400">
            Dashboard
          </Link>
          <Link to="/discovery" className="hover:text-green-400">
            Player Discovery
          </Link>
          <Link to="/metrics" className="hover:text-green-400">
            Defensive Metrics
          </Link>
          <Link to="/vote" className="hover:text-green-400">
            Vote
          </Link>
          <Link to="/chat" className="hover:text-green-400">
            Chat
          </Link>
        </nav>

        <div className="mt-auto space-y-2">
          {userEmail ? (
            <>
              <p className="text-sm text-gray-300">Inloggad som {userEmail}</p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Logga ut
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm hover:text-red-400">
              Logga in
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
