import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";

interface PlayerCardProps {
  id: string;
  name: string;
  shirt_number: number;
  position: string;
  nationality: string;
  image_url?: string;
  team_id: string;
  currentUserId: string;
  currentUserTeamId: string;
  isRecommended?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  id,
  name,
  shirt_number,
  position,
  nationality,
  image_url,
  team_id,
  currentUserId,
  currentUserTeamId,
  isRecommended = false,
}) => {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const canVote = isRecommended && team_id !== currentUserTeamId;

  const fetchVotes = async () => {
    const { data, error } = await supabase
      .from("player_votes")
      .select("vote_type, voter_id")
      .eq("player_id", id);

    if (!data || error) return;

    setUpvotes(data.filter((v) => v.vote_type === "up").length);
    setDownvotes(data.filter((v) => v.vote_type === "down").length);
    const userVoted = data.find((v) => v.voter_id === currentUserId);
    setUserVote(userVoted?.vote_type ?? null);
  };

  useEffect(() => {
    fetchVotes();
  }, [id, currentUserId]);

  const handleVote = async (type: "up" | "down") => {
    if (!canVote) return;

    if (userVote === type) {
      // Remove vote
      await supabase
        .from("player_votes")
        .delete()
        .eq("player_id", id)
        .eq("voter_id", currentUserId);
      setUserVote(null);
      if (type === "up") setUpvotes((prev) => prev - 1);
      else setDownvotes((prev) => prev - 1);
    } else {
      // Add or change vote
      await supabase
        .from("player_votes")
        .upsert(
          { player_id: id, voter_id: currentUserId, vote_type: type },
          { onConflict: "player_id,voter_id" }
        );
      if (userVote === "up") setUpvotes((prev) => prev - 1);
      if (userVote === "down") setDownvotes((prev) => prev - 1);
      if (type === "up") setUpvotes((prev) => prev + 1);
      else setDownvotes((prev) => prev + 1);
      setUserVote(type);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 w-full max-w-[220px] mx-auto flex flex-col items-center text-center space-y-2">
      {image_url && (
        <img
          src={image_url}
          alt={name}
          className="w-36 h-36 object-cover rounded-xl mx-auto mt-1 mb-2 shadow"
        />
      )}
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-sm text-gray-600">
        #{shirt_number} | {position}
      </p>
      <p className="text-sm text-gray-500">{nationality}</p>

      {canVote && (
        <div className="flex gap-4 mt-3">
          <button
            className={`flex items-center gap-1 ${userVote === "up" ? "text-green-600" : "text-gray-500"}`}
            onClick={() => handleVote("up")}
          >
            <FaThumbsUp /> {upvotes}
          </button>
          <button
            className={`flex items-center gap-1 ${userVote === "down" ? "text-red-600" : "text-gray-500"}`}
            onClick={() => handleVote("down")}
          >
            <FaThumbsDown /> {downvotes}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
