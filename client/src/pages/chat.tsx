import { useState, useEffect } from "react";
import JoinScreen from "@/components/JoinScreen";
import { ChatScreen } from "@/components/ChatScreenNetlify";

export interface User {
  emoji: string;
  displayName: string;
  userId: string;
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Restore user session from localStorage
    const savedUser = localStorage.getItem("chatUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsJoined(true);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem("chatUser");
      }
    }
  }, []);

  const handleJoinSuccess = (user: User) => {
    setCurrentUser(user);
    setIsJoined(true);
    // Save user session to localStorage
    localStorage.setItem("chatUser", JSON.stringify(user));
  };

  const handleExitChat = () => {
    setCurrentUser(null);
    setIsJoined(false);
    // Clear user session from localStorage
    localStorage.removeItem("chatUser");
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-800">
      {!isJoined ? (
        <JoinScreen onJoinSuccess={handleJoinSuccess} />
      ) : (
        <ChatScreen userInfo={currentUser!} onExitChat={handleExitChat} />
      )}
    </div>
  );
}