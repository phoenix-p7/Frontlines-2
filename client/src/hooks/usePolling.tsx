import { useState, useEffect, useRef } from 'react';
import type { ChatMessageWithReactions, MessageReaction } from '@shared/schema';

interface TypingUser {
  emoji: string;
  displayName: string;
  userId: string;
}

export function usePolling(interval: number = 2000) {
  const [messages, setMessages] = useState<ChatMessageWithReactions[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<number>(0);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string>('');

  const startPolling = (userId?: string) => {
    setIsConnected(true);
    if (userId) {
      currentUserIdRef.current = userId;
    }
    
    const poll = async () => {
      try {
        // Add timestamp to prevent caching issues in production
        const timestamp = Date.now();
        const [messagesResponse, typingResponse] = await Promise.all([
          fetch(`/api/messages?userId=${currentUserIdRef.current}&_t=${timestamp}`),
          fetch(`/api/typing?_t=${timestamp}`)
        ]);
        
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          if (data.success) {
            // Load reactions for each message
            const messagesWithReactions = await Promise.all(
              data.messages.map(async (message: any) => {
                try {
                  const reactionsResponse = await fetch(`/api/messages/${message.id}/reactions?_t=${timestamp}`);
                  if (reactionsResponse.ok) {
                    const reactionsData = await reactionsResponse.json();
                    return { ...message, reactions: reactionsData.success ? reactionsData.reactions : [] };
                  }
                  return { ...message, reactions: [] };
                } catch (error) {
                  console.error('Error loading reactions for message', message.id, error);
                  return { ...message, reactions: [] };
                }
              })
            );
            
            setMessages(messagesWithReactions);
            // Update last message ID for new message detection
            if (messagesWithReactions.length > 0) {
              const latestId = Math.max(...messagesWithReactions.map((m: ChatMessageWithReactions) => m.id));
              if (latestId > lastMessageIdRef.current) {
                lastMessageIdRef.current = latestId;
              }
            }
          }
        }
        
        if (typingResponse.ok) {
          const typingData = await typingResponse.json();
          if (typingData.success) {
            // Filter out current user from typing users
            const filteredTypingUsers = typingData.typingUsers.filter(
              (user: TypingUser) => user.userId !== currentUserIdRef.current
            );
            setTypingUsers(filteredTypingUsers);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        setIsConnected(false);
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  };

  const stopPolling = () => {
    setIsConnected(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  // Helper function to refresh all messages with reactions
  const refreshMessages = async (userId: string) => {
    try {
      const timestamp = Date.now();
      const pollResponse = await fetch(`/api/messages?userId=${userId}&_t=${timestamp}`);
      if (pollResponse.ok) {
        const data = await pollResponse.json();
        if (data.success) {
          // Load reactions for each message
          const messagesWithReactions = await Promise.all(
            data.messages.map(async (msg: any) => {
              try {
                const reactionsResponse = await fetch(`/api/messages/${msg.id}/reactions?_t=${timestamp}`);
                if (reactionsResponse.ok) {
                  const reactionsData = await reactionsResponse.json();
                  return { ...msg, reactions: reactionsData.success ? reactionsData.reactions : [] };
                }
                return { ...msg, reactions: [] };
              } catch (error) {
                return { ...msg, reactions: [] };
              }
            })
          );
          setMessages(messagesWithReactions);
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const sendMessage = async (emoji: string, displayName: string, message: string, userId: string, replyToId?: number, replyToMessage?: string, replyToDisplayName?: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emoji, 
          displayName, 
          message, 
          userId,
          replyToId,
          replyToMessage,
          replyToDisplayName
        }),
      });

      if (response.ok) {
        // Force immediate poll after sending
        setTimeout(() => {
          refreshMessages(userId);
        }, 100);
        
        return { success: true };
      } else {
        return { success: false, error: 'Failed to send message' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const addReaction = async (messageId: number, emoji: string, userId: string, displayName: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji, userId, displayName }),
      });

      if (response.ok) {
        // Immediately update the UI optimistically
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []),
                    { 
                      id: Date.now(), // Temporary ID 
                      messageId, 
                      userId, 
                      emoji, 
                      displayName,
                      createdAt: new Date()
                    }
                  ]
                }
              : msg
          )
        );
        
        // Then refresh all data to stay in sync
        setTimeout(() => {
          refreshMessages(userId);
        }, 50);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to add reaction' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const removeReaction = async (messageId: number, emoji: string, userId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji, userId }),
      });

      if (response.ok) {
        // Immediately update the UI optimistically
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => 
                    !(r.userId === userId && r.emoji === emoji)
                  )
                }
              : msg
          )
        );
        
        // Then refresh all data to stay in sync
        setTimeout(() => {
          refreshMessages(userId);
        }, 50);
        
        return { success: true };
      } else {
        return { success: false, error: 'Failed to remove reaction' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const sendTyping = async (isTyping: boolean, userId: string, emoji: string, displayName: string) => {
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isTyping, userId, emoji, displayName }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    messages,
    isConnected,
    typingUsers,
    startPolling,
    stopPolling,
    sendMessage,
    addReaction,
    removeReaction,
    sendTyping,
  };
}