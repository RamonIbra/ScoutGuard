import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  name: string;
}

interface GroupChatCreatorProps {
  currentUserId: string;
  teamId: string;
  onGroupCreated: (newGroup: { id: string; name: string; created_at: string; updated_at?: string; team_id?: string }) => void;
}

const GroupChatCreator = ({ currentUserId, teamId, onGroupCreated }: GroupChatCreatorProps) => {
  const [groupName, setGroupName] = useState("");
  const [teammates, setTeammates] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchTeammates = async () => {
      if (!currentUserId || !teamId) return;

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .eq("team_id", teamId)
        .neq("id", currentUserId);

      if (usersError) {
        console.error("Error fetching teammates for group creator:", usersError);
        return;
      }

      setTeammates(users ?? []);
    };

    fetchTeammates();
  }, [currentUserId, teamId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) {
      alert("Please enter a name and select at least one teammate.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    const { data: group, error: groupError } = await supabase
      .from("group_chats")
      .insert({ name: groupName.trim(), team_id: teamId })
      .select()
      .single();

    if (groupError || !group) {
      console.error("Group creation failed:", groupError);
      alert("Failed to create group.");
      setLoading(false);
      return;
    }

    const memberRows = [currentUserId, ...selected].map((user_id) => ({
      group_chat_id: group.id,
      user_id,
    }));

    const { error: memberErr } = await supabase
      .from("group_chat_members")
      .insert(memberRows);

    if (memberErr) {
      console.error("Error adding members:", memberErr);
      alert("Group created, but failed to add members.");
    } else {
      setSuccessMessage("✅ Group chat created!");
      setGroupName("");
      setSelected([]);
      onGroupCreated(group);
    }

    setLoading(false);
  };


  return (
    <div className="mt-6 pt-6 border-t border-gray-300"> {/* Adjusted top margin and border */}
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Create Group Chat</h3> {/* Adjusted heading style */}
      {!teamId ? (
          <p className="text-gray-600 text-sm">Loading team information...</p>
      ) : (
        <>
          <input
            type="text"
            className="border border-gray-300 p-2 rounded-lg w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" // Input styling
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <div className="text-sm mb-3 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50"> {/* Teammate list container style */}
            {teammates.length > 0 ? (
              teammates.map((mate) => (
                <label key={mate.id} className="flex items-center py-1"> {/* Align checkbox and text */}
                  <input
                    type="checkbox"
                    checked={selected.includes(mate.id)}
                    onChange={() => toggleSelect(mate.id)}
                    className="mr-2 form-checkbox text-blue-600" // Checkbox styling
                  />
                  <span className="text-gray-700">{mate.name || "Okänd spelare"}</span> {/* Text style */}
                </label>
              ))
            ) : (
              <p className="text-gray-600">Inga teammedlemmar att lägga till.</p>
            )}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed" // Button styling
            onClick={createGroup}
            disabled={loading || !groupName.trim() || selected.length === 0 || !teamId}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </>
      )}

      {successMessage && (
        <p className="text-green-600 text-sm mt-2">{successMessage}</p>
      )}
    </div>
  );
};

export default GroupChatCreator;