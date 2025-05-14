import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  name: string;
}

const GroupChatCreator = ({ currentUserId }: { currentUserId: string }) => {
  const [groupName, setGroupName] = useState("");
  const [teammates, setTeammates] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchTeammates = async () => {
      const { data: user } = await supabase
        .from("users")
        .select("team_id")
        .eq("id", currentUserId)
        .single();

      const { data: users } = await supabase
        .from("users")
        .select("id, name")
        .eq("team_id", user?.team_id)
        .neq("id", currentUserId);

      setTeammates(users ?? []);
    };

    fetchTeammates();
  }, [currentUserId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = async () => {
    if (!groupName || selected.length === 0) {
      alert("Please enter a name and select at least one teammate.");
      return;
    }
  
    setLoading(true);
    setSuccessMessage("");
  
    const { data: group, error: groupError } = await supabase
      .from("group_chats")
      .insert({ name: groupName })
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
    }
  
    setLoading(false);
  };
  

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-md font-semibold mb-2">Create Group Chat</h3>
      <input
        type="text"
        className="border p-1 rounded w-full mb-2"
        placeholder="Group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <div className="text-sm mb-2 max-h-32 overflow-y-auto">
        {teammates.map((mate) => (
          <label key={mate.id} className="block">
            <input
              type="checkbox"
              checked={selected.includes(mate.id)}
              onChange={() => toggleSelect(mate.id)}
              className="mr-2"
            />
            {mate.name}
          </label>
        ))}
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2 disabled:opacity-50"
        onClick={createGroup}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Group"}
      </button>
      {successMessage && (
        <p className="text-green-600 text-sm mt-2">{successMessage}</p>
      )}
    </div>
  );
};

export default GroupChatCreator;
