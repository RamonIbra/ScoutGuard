// src/layouts/MainLayout.tsx
import { ReactNode } from "react";
import { Link } from "react-router-dom";

const MainLayout = ({ children }: { children: ReactNode }) => {
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
        <div className="mt-auto">
          <Link to="/login" className="text-sm hover:text-red-400">
            Logga in
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">{children}</main>
    </div>
  );
};

export default MainLayout;
