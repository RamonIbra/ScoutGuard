import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type User = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  conversation_id: string;
};

type Conversation = {
  id: string;
  participant_a: string;
  participant_b: string;
  updated_at: string;
};

const ChatPage = () => {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [teammates, setTeammates] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const userId = sessionData.user?.id;
      if (!userId) return;
      setMyUserId(userId);

      const { data: user } = await supabase
        .from("users")
        .select("team_id")
        .eq("id", userId)
        .single();
      const teamId = user?.team_id;

      const { data: teammatesData } = await supabase
        .from("users")
        .select("id, name")
        .eq("team_id", teamId)
        .neq("id", userId);

      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order("updated_at", { ascending: false });

      setConversations(convData || []);

      const allUserIds =
        convData?.flatMap((c) => [c.participant_a, c.participant_b]) ?? [];
      const uniqueIds = [...new Set(allUserIds.filter((id) => id !== userId))];
      const { data: usersInChats } = await supabase
        .from("users")
        .select("id, name")
        .in("id", uniqueIds);

      const allUsers = [...(teammatesData ?? []), ...(usersInChats ?? [])];
      const map = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));
      setUserMap(map);

      const chattedWith =
        convData?.flatMap((c) =>
          [c.participant_a, c.participant_b].filter((id) => id !== userId)
        ) ?? [];
      const filteredTeammates =
        teammatesData?.filter((mate) => !chattedWith.includes(mate.id)) ?? [];
      setTeammates(filteredTeammates);
    };

    fetchData();

    const sub = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const message = payload.new as Message;
          if (!myUserId || !message.conversation_id) return;

          if (
            message.sender_id !== myUserId &&
            selectedConversation?.id === message.conversation_id
          ) {
            setMessages((prev) => [...prev, message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [selectedConversation, myUserId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !myUserId) return;

      const { data: allMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      setMessages(allMessages || []);
    };

    fetchMessages();
  }, [selectedConversation, myUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUserId || !newMessage || !selectedConversation) return;

    const { data: newMessageData, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: myUserId,
        content: newMessage,
      })
      .select()
      .single();

    if (!error && newMessageData) {
      setMessages((prev) => [...prev, newMessageData]);
      setNewMessage("");
    }
  };

  const startConversation = async (receiverId: string) => {
    if (!myUserId) return;

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant_a.eq.${myUserId},participant_b.eq.${receiverId}),and(participant_a.eq.${receiverId},participant_b.eq.${myUserId})`
      )
      .limit(1);

    if (existing && existing.length > 0) {
      setSelectedConversation(existing[0]);
    } else {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ participant_a: myUserId, participant_b: receiverId })
        .select()
        .single();

      if (!error) {
        setConversations((prev) => [data, ...prev]);
        setSelectedConversation(data);
      }
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Dina chattar</h2>
        {conversations.map((conv) => {
          const otherId =
            conv.participant_a === myUserId
              ? conv.participant_b
              : conv.participant_a;
          const otherName = userMap[otherId] ?? "Okänd";

          return (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            >
              <div>{otherName}</div>
              <div className="text-xs text-gray-500">
                {new Date(conv.updated_at).toLocaleTimeString()}
              </div>
            </div>
          );
        })}

        <hr className="my-4" />

        <h3 className="text-md font-semibold">Starta ny chatt</h3>
        {teammates.map((mate) => (
          <div
            key={mate.id}
            onClick={() => startConversation(mate.id)}
            className="cursor-pointer hover:bg-green-100 p-2 rounded text-sm"
          >
            {mate.name || "Okänd spelare"}
          </div>
        ))}
      </aside>

      <main className="flex-1 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded max-w-md ${
                msg.sender_id === myUserId ? "bg-green-200 ml-auto" : "bg-white"
              }`}
            >
              {msg.content}
              <div className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {selectedConversation && (
          <form onSubmit={handleSendMessage} className="mt-4 flex">
            <input
              type="text"
              className="flex-1 border rounded p-2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv ett meddelande..."
            />
            <button
              type="submit"
              className="ml-2 bg-green-600 text-white px-4 py-2 rounded"
            >
              Skicka
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
