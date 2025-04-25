import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const MainLayout = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (userId) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("name")
          .eq("id", userId)
          .single();

        if (!error && userData) {
          setUserName(userData.name);
        }
      } else {
        setUserName(null);
      }
    };

    getUserInfo();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUserInfo();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserName(null);
    navigate("/");
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
          <Link to="/chat" className="hover:text-green-400">
            Chat
          </Link>
        </nav>

        <div className="mt-auto space-y-2">
          {userName ? (
            <>
              <p className="text-sm text-gray-300">Inloggad som {userName}</p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:underline"
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
