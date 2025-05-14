import { useEffect, useState, useRef } from "react"; // Import useRef
import { supabase } from "@/lib/supabaseClient";
import GroupChatCreator from "@/components/ui/GroupChatCreator";

type User = {
  id: string;
  name: string;
  team_id?: string;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  conversation_id?: string;
  group_chat_id?: string;
};

type Conversation = {
  id: string;
  participant_a: string;
  participant_b: string;
  updated_at: string;
};

type GroupChat = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  team_id?: string;
};

const ChatPage = () => {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [teammates, setTeammates] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loadingChats, setLoadingChats] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Scroll when messages change

  // Effect to fetch initial data (user, teams, chats)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingChats(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      const userId = sessionData.user?.id;
      if (!userId) {
        setLoadingChats(false);
        return;
      }
      setMyUserId(userId);

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("team_id")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user team:", userError);
        setLoadingChats(false);
        return;
      }

      const teamId = user?.team_id;
      setMyTeamId(teamId); // Set the user's team ID state

      // Fetch teammates
      const { data: teammatesData, error: teammatesError } = await supabase
        .from("users")
        .select("id, name")
        .eq("team_id", teamId)
        .neq("id", userId);

      if (teammatesError) console.error("Error fetching teammates:", teammatesError);


      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (convError) console.error("Error fetching conversations:", convError);


      // Fetch group chat memberships
      const { data: memberGroups, error: memberGroupsError } = await supabase
        .from("group_chat_members")
        .select("group_chat_id")
        .eq("user_id", userId);

      if (memberGroupsError) console.error("Error fetching group memberships:", memberGroupsError);

      const groupIds = memberGroups?.map((m) => m.group_chat_id) ?? [];

      // Fetch group chats the user is a member of, ordered by updated_at
      const { data: groups, error: groupsError } = await supabase
        .from("group_chats")
        .select("*")
        .in("id", groupIds)
        .order("updated_at", { ascending: false }); // Order by updated_at

      if (groupsError) console.error("Error fetching groups:", groupsError);


      setGroupChats(groups ?? []);
      setConversations(convData ?? []);

      // Build user map for names
      const allUserIds = [
        ...(convData?.flatMap((c) => [c.participant_a, c.participant_b]) ?? []),
        ...(teammatesData?.map(t => t.id) ?? []), // Include all fetched teammates
         userId // Include the current user
      ].filter(Boolean); // Filter out any null/undefined


      const uniqueIds = [...new Set(allUserIds)];
      const { data: allUsersData, error: allUsersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", uniqueIds);

      if (allUsersError) console.error("Error fetching users for map:", allUsersError);

      const map = Object.fromEntries((allUsersData ?? []).map((u) => [u.id, u.name]));
      setUserMap(map);


      // Filter teammates who are not already in a conversation
      const chattedWith = convData?.flatMap((c) =>
        [c.participant_a, c.participant_b].filter((id) => id !== userId)
      ) ?? [];
      const filteredTeammates = teammatesData?.filter((mate) => !chattedWith.includes(mate.id)) ?? [];
      setTeammates(filteredTeammates);

      setLoadingChats(false);
    };

    fetchData();

  }, [myUserId]);


  // Effect to set up real-time subscription for messages
  useEffect(() => {
     if (!myUserId) return;

    const sub = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const message = payload.new as Message;

          // Check if the new message belongs to the currently selected chat
          // We are relying on the local state update for messages sent by the current user,
          // so we only add messages from others here.
          if (
            message.sender_id !== myUserId &&
            (
              (selectedConversation && message.conversation_id === selectedConversation.id) ||
              (selectedGroup && message.group_chat_id === selectedGroup.id)
            )
          ) {
             // Fetch sender name if not already in userMap
             if (!userMap[message.sender_id]) {
               const { data: sender, error } = await supabase
                 .from('users')
                 .select('id, name')
                 .eq('id', message.sender_id)
                 .single();
               if (!error && sender) {
                 setUserMap(prev => ({ ...prev, [sender.id]: sender.name }));
               }
             }
            setMessages((prev) => [...prev, message]);
          } else if (message.sender_id === myUserId && (selectedConversation || selectedGroup) &&
                     ((selectedConversation && message.conversation_id === selectedConversation.id) ||
                      (selectedGroup && message.group_chat_id === selectedGroup.id))) {
             // This case handles messages sent by the current user.
             // We rely on the optimistic update in handleSendMessage.
             // No need to add the message again from the subscription.
          }

           // Optional: When a message arrives (from self or others) for *any* chat the user is in,
           // update the list item's updated_at in state and re-sort to bring it to the top visually.
           // This happens outside the currently selected chat check to keep the sidebar updated.
           if (message.conversation_id && conversations.some(conv => conv.id === message.conversation_id)) {
               setConversations(prevConv => {
                  const convIndex = prevConv.findIndex(conv => conv.id === message.conversation_id);
                  if (convIndex > -1) {
                      const updatedConv = [...prevConv];
                      updatedConv[convIndex] = { ...updatedConv[convIndex], updated_at: message.created_at };
                      return updatedConv.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                  }
                  return prevConv;
               });
           } else if (message.group_chat_id && groupChats.some(group => group.id === message.group_chat_id)) {
               setGroupChats(prevGroups => {
                   const groupIndex = prevGroups.findIndex(group => group.id === message.group_chat_id);
                   if (groupIndex > -1) {
                       const updatedGroups = [...prevGroups];
                       updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], updated_at: message.created_at };
                       return updatedGroups.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
                   }
                   return prevGroups;
               });
           }


        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
     // Subscription depends on myUserId, selectedConversation, selectedGroup, userMap, conversations, groupChats
  }, [myUserId, selectedConversation, selectedGroup, userMap, conversations, groupChats]);


  // Effect to fetch messages for the selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!myUserId || (!selectedConversation && !selectedGroup)) {
        setMessages([]); // Clear messages if no chat is selected or user is null
        return;
      }

      // Clear messages before fetching new ones
      setMessages([]);

      let data = null;
      let error = null;

      if (selectedConversation) {
        const result = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConversation.id)
          .order("created_at", { ascending: true });
          data = result.data;
          error = result.error;

      } else if (selectedGroup) {
        const result = await supabase
          .from("messages")
          .select("*")
          .eq("group_chat_id", selectedGroup.id)
          .order("created_at", { ascending: true });
          data = result.data;
          error = result.error;
      }

      if (error) {
         console.error("Error fetching messages:", error);
      } else {
         setMessages(data ?? []);
      }
    };

    fetchMessages();
     // Fetching messages depends on which chat is selected and the user ID
  }, [selectedConversation, selectedGroup, myUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUserId || !newMessage.trim()) return;

    const payload: Omit<Message, 'id' | 'created_at'> = {
      sender_id: myUserId,
      content: newMessage.trim(),
    };

    if (selectedConversation) {
      payload.conversation_id = selectedConversation.id;
    } else if (selectedGroup) {
      payload.group_chat_id = selectedGroup.id;
    } else {
      return;
    }

    const { data, error } = await supabase.from("messages").insert(payload).select().single();
    if (error) {
       console.error("Error sending message:", error);
    } else if (data) {
      // Add the message to state immediately for optimistic UI
      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Manually update the updated_at for the current chat in the sidebar state
      // and re-sort the list to bring it to the top. This is a controlled update.
      if (selectedConversation) {
         setConversations(prevConv => {
            const convIndex = prevConv.findIndex(conv => conv.id === selectedConversation.id);
            if (convIndex > -1) {
              const updatedConv = [...prevConv];
              updatedConv[convIndex] = { ...updatedConv[convIndex], updated_at: data.created_at };
              // Sorting here ensures the list is updated visually
              return updatedConv.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            }
            return prevConv;
         });
      } else if (selectedGroup) {
         setGroupChats(prevGroups => {
           const groupIndex = prevGroups.findIndex(group => group.id === selectedGroup.id);
           if (groupIndex > -1) {
             const updatedGroups = [...prevGroups];
             updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], updated_at: data.created_at };
              // Sorting here ensures the list is updated visually
             return updatedGroups.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
           }
           return prevGroups;
         });
      }
    }
  };

  const startConversation = async (receiverId: string) => {
    if (!myUserId) return;

    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant_a.eq.${myUserId},participant_b.eq.${receiverId}),and(participant_a.eq.${receiverId},participant_b.eq.${myUserId})`
      )
      .limit(1);

    if (existingError) {
       console.error("Error checking existing conversation:", existingError);
       return;
    }

    if (existing && existing.length > 0) {
      setSelectedConversation(existing[0]);
      setSelectedGroup(null);
    } else {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ participant_a: myUserId, participant_b: receiverId })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
      } else if (data) {
        // Add the new conversation to the state and sort
        setConversations((prev) => {
            const updatedConv = [data, ...prev];
            return updatedConv.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        });
        setSelectedConversation(data);
        setSelectedGroup(null);
        // Remove the user from the "Start new chat" list if successful
        setTeammates(prev => prev.filter(mate => mate.id !== receiverId));
      }
    }
  };


  // Callback function for GroupChatCreator
  const handleGroupCreated = (newGroup: GroupChat) => {
    // Add the new group to the groupChats state and sort
    setGroupChats(prevGroups => {
      // Add the new group, use its created_at or the current time as updated_at initially for sorting
      const groupWithUpdated = { ...newGroup, updated_at: newGroup.created_at || new Date().toISOString() };
      const updatedGroups = [groupWithUpdated, ...prevGroups];
       return updatedGroups.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    });
    // Select the newly created group
    setSelectedGroup(newGroup);
    setSelectedConversation(null);
  };


  return (
    // Main container for the chat layout
    <div className="flex h-screen bg-gray-100 text-gray-800"> {/* Use h-screen for full height, add a light background */}

      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-gray-300 bg-white p-6 overflow-y-auto"> {/* Adjusted width, border color, background, padding */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Dina chattar</h2> {/* Larger heading, more bottom margin, darker text */}

        {loadingChats ? (
          <p className="text-gray-600">Laddar chattar...</p>
        ) : (
          <>
            {/* Conversations List */}
            <div className="mb-6"> {/* Add bottom margin to this section */}
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Privatchattar</h3> {/* Section heading */}
                <div className="divide-y divide-gray-200"> {/* Add dividers between items */}
                    {conversations.length > 0 ? (
                        conversations.map((conv) => {
                            const otherId = conv.participant_a === myUserId ? conv.participant_b : conv.participant_a;
                            const otherName = userMap[otherId] ?? "Okänd";

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => {
                                        setSelectedConversation(conv);
                                        setSelectedGroup(null);
                                    }}
                                    className={`cursor-pointer py-3 px-4 rounded-lg transition duration-200 ease-in-out ${
                                        selectedConversation?.id === conv.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100' // Active state with border
                                    }`}
                                >
                                    <div className="font-medium text-gray-900">{otherName}</div> {/* User name style */}
                                    <div className="text-xs text-gray-500">
                                        Senast aktiv: {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {/* Time format */}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-600 text-sm">Inga privatchattar ännu.</p>
                    )}
                </div>
            </div>

            {/* Start New Chat Section */}
            <div className="mb-6"> {/* Add bottom margin */}
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Starta ny chatt</h3>
              <div className="divide-y divide-gray-200">
                {teammates.length > 0 ? (
                  teammates.map((mate) => (
                    <div
                      key={mate.id}
                      onClick={() => startConversation(mate.id)}
                      className="cursor-pointer py-2 px-4 rounded-lg text-sm text-gray-700 hover:bg-green-50 transition duration-200 ease-in-out" // Style for starting new chat
                    >
                      {mate.name || "Okänd spelare"}
                    </div>
                  ))
                ) : (
                   <p className="text-gray-600 text-sm">Inga teammedlemmar att chatta med.</p>
                )}
              </div>
            </div>

            <hr className="my-6 border-gray-300" /> {/* Styled horizontal rule */}

            {/* Group Chat Creator Section */}
            {myUserId && myTeamId && <GroupChatCreator currentUserId={myUserId} teamId={myTeamId} onGroupCreated={handleGroupCreated} />}
             {myUserId && !myTeamId && (
                <p className="text-red-500 text-sm mt-4">Kan inte skapa gruppchatt utan team ID.</p>
             )}


            <hr className="my-6 border-gray-300" /> {/* Styled horizontal rule */}


            {/* Group Chats List */}
            <div className="mb-6"> {/* Add bottom margin */}
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Gruppchattar</h3>
                <div className="divide-y divide-gray-200"> {/* Add dividers between items */}
                    {groupChats.length > 0 ? (
                        groupChats.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => {
                                    setSelectedGroup(group);
                                    setSelectedConversation(null);
                                }}
                                className={`cursor-pointer py-3 px-4 rounded-lg transition duration-200 ease-in-out ${
                                    selectedGroup?.id === group.id ? 'bg-purple-100 border-l-4 border-purple-500' : 'hover:bg-gray-100' // Active state with border
                                }`}
                            >
                                <div className="font-medium text-gray-900">{group.name}</div> {/* Group name style */}
                                 {/* Display updated_at for groups if available, otherwise created_at */}
                                 <div className="text-xs text-gray-500">
                                    Senast aktiv: {new Date(group.updated_at || group.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {/* Time format */}
                                 </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-gray-600 text-sm">Inga gruppchattar ännu.</p>
                    )}
                </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col bg-gray-50"> {/* Flex column layout, light background */}
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-300 p-4 shadow-sm"> {/* Header styling */}
            <h2 className="text-xl font-bold text-gray-900">
                {selectedConversation ?
                   (userMap[selectedConversation.participant_a === myUserId ? selectedConversation.participant_b : selectedConversation.participant_a] ?? "Okänd Användare")
                   : selectedGroup ?
                   selectedGroup.name
                   : "Välj en chatt att starta"} {/* Display current chat name */}
            </h2>
        </div>


        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4"> {/* Added more padding and space between messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end ${msg.sender_id === myUserId ? "justify-end" : "justify-start"}`} // Use flex to position bubbles
            >
                <div className={`p-3 rounded-lg max-w-xs lg:max-w-md break-words ${ // Message bubble styling, break-words for long messages
                    msg.sender_id === myUserId
                        ? "bg-green-500 text-white rounded-br-none" // Sender's bubble
                        : "bg-gray-200 text-gray-800 rounded-bl-none" // Other users' bubbles
                }`}>
                   {/* Display sender name if it's a group chat message and not sent by the current user */}
                   {msg.group_chat_id && msg.sender_id !== myUserId && (
                       <div className="font-semibold text-sm mb-1 text-gray-700">
                           {userMap[msg.sender_id] ?? "Okänd"}
                       </div>
                   )}
                  {msg.content}
                   <div className="text-xs mt-1 opacity-80 text-right"> {/* Timestamp style */}
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
            </div>
          ))}
           <div ref={messagesEndRef} /> {/* Empty div for scrolling */}
        </div>

        {/* Message Input Area */}
        {(selectedConversation || selectedGroup) && (
          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-300 flex items-center gap-3"> {/* Input form styling */}
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" // Input field styling
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv ett meddelande..."
              disabled={!myUserId}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed" // Button styling
              disabled={!myUserId || !newMessage.trim()}
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