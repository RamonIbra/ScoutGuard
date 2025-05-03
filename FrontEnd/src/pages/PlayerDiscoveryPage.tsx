import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PlayerCard from "@/components/ui/PlayerCard";

interface Player {
  id: string;
  name: string;
  shirt_number: number;
  position: string;
  nationality: string;
  image_url: string;
  team_id: string;
}

const DiscoverPlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [recommendedPlayers, setRecommendedPlayers] = useState<Player[]>([]);
  const [myTeamPlayers, setMyTeamPlayers] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userTeamId, setUserTeamId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUserId(user.id);

      const { data: userData } = await supabase
        .from("users")
        .select("team_id")
        .eq("id", user.id)
        .single();

      const teamId = userData?.team_id;
      setUserTeamId(teamId);

      const { data: playersData } = await supabase
        .from("players")
        .select("*");

      const { data: recommended } = await supabase
        .from("recommended_players")
        .select("player_id");

      const recommendedIds = recommended?.map((r) => r.player_id) ?? [];

      const allPlayers = playersData ?? [];
      setPlayers(allPlayers);
      setMyTeamPlayers(allPlayers.filter((p) => p.team_id === teamId));
      setRecommendedPlayers(
        allPlayers.filter((p) =>
          recommendedIds.includes(p.id)
        )
      );
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Discover Players</h1>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
        {/* My Players */}
        <div className="lg:w-2/5 overflow-y-auto">
          <h2 className="text-l font-semibold mb-4">My Players</h2>
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {myTeamPlayers.map((player) => (
              <PlayerCard key={player.id} {...player} currentUserId={currentUserId} currentUserTeamId={userTeamId} />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="block lg:hidden h-px bg-gray-300 my-4" />
        <div className="hidden lg:block w-px bg-gray-300" />

        {/* Recommended Players */}
        <div className="lg:w-3/5 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Recommended Players</h2>
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {recommendedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                {...player}
                currentUserId={currentUserId}
                currentUserTeamId={userTeamId}
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverPlayersPage;
