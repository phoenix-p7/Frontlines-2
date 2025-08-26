import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, Info, Moon, Sun } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import { usePolling } from "@/hooks/usePolling";
import { useTheme } from "@/components/ThemeProvider";
import { ToastContainer, useToastNotifications } from "@/components/ui/toast-notification";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { ChatMessageWithReactions } from "@shared/schema";

interface ChatScreenProps {
  userInfo: {
    emoji: string;
    displayName: string;
    userId?: string;
  };
  onExitChat: () => void;
}

interface TypingUser {
  emoji: string;
  displayName: string;
}

export function ChatScreen({ userInfo, onExitChat }: ChatScreenProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessageWithReactions | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [lastSentMessageTimestamp, setLastSentMessageTimestamp] = useState<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const highlightTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToastNotifications();

  // Generate userId if not provided
  const userId = userInfo.userId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { 
    messages, 
    isConnected, 
    typingUsers, 
    startPolling, 
    stopPolling, 
    sendMessage, 
    addReaction, 
    removeReaction, 
    sendTyping 
  } = usePolling(2000);

  useEffect(() => {
    startPolling(userId);
    showInfo('Connected to chat');
    
    return () => {
      stopPolling();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to check if user is at bottom of chat
  const checkIfAtBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      const threshold = 100; // pixels from bottom
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
      setIsAtBottom(isNearBottom);
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    checkIfAtBottom();
  };

  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  // Smart auto-scroll for receivers: only scroll if they're already at bottom
  useEffect(() => {
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      // New messages have arrived
      if (isAtBottom) {
        // User is at bottom, auto-scroll to show new messages
        scrollToBottom();
        setHasNewMessages(false);
      } else {
        // User is scrolled up, show notification instead of forcing scroll
        const newMessages = messages.slice(lastMessageCount);
        const hasMessagesFromOthers = newMessages.some(msg => msg.displayName !== userInfo.displayName);
        if (hasMessagesFromOthers) {
          setHasNewMessages(true);
        }
      }
    }
    setLastMessageCount(messages.length);
  }, [messages.length, isAtBottom, lastMessageCount, userInfo.displayName]);

  // Handle scrolling for sender after their message appears
  useEffect(() => {
    if (lastSentMessageTimestamp && messages.length > 0) {
      // Find the newest message from the current user
      const userMessages = messages.filter(msg => 
        msg.displayName === userInfo.displayName && 
        msg.createdAt && 
        new Date(msg.createdAt).getTime() >= lastSentMessageTimestamp
      );
      
      if (userMessages.length > 0) {
        // Scroll to bottom only for the sender
        scrollToBottom();
        setLastSentMessageTimestamp(null); // Reset to prevent multiple scrolls
      }
    }
  }, [messages, lastSentMessageTimestamp, userInfo.displayName]);

  // Cleanup highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (quickMessage?: string) => {
    const messageToSend = quickMessage || currentMessage.trim();
    
    if (!messageToSend) {
      showError('Please enter a message', 2500, 'Action Required');
      return;
    }
    
    if (!isConnected) {
      showError('Not connected to chat. Please wait...', 2500, 'Action Required');
      return;
    }

    const result = await sendMessage(
      userInfo.emoji, 
      userInfo.displayName, 
      messageToSend, 
      userId,
      replyingTo?.id,
      replyingTo?.message,
      replyingTo?.displayName
    );
    
    if (result.success) {
      setCurrentMessage("");
      setReplyingTo(null);
      // Mark timestamp for when we sent this message to scroll when it appears
      setLastSentMessageTimestamp(Date.now());
      // Clear new message notification since sender is now sending
      setHasNewMessages(false);
      
      // Stop typing indicator
      sendTyping(false, userId, userInfo.emoji, userInfo.displayName);
    } else {
      showError(result.error || 'Failed to send message');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
    
    // Send typing indicator
    sendTyping(true, userId, userInfo.emoji, userInfo.displayName);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false, userId, userInfo.emoji, userInfo.displayName);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleQuickMessage = (message: string) => {
    // Send the message directly
    handleSendMessage(message);
  };

  const handleExitChat = () => {
    setIsMenuOpen(false);
    setShowExitDialog(true);
  };

  const showAbout = () => {
    setIsMenuOpen(false);
    setShowAboutDialog(true);
  };

  const handleConfirmExit = () => {
    onExitChat();
  };

  // Enhanced reaction handlers with error notifications
  const handleAddReaction = async (messageId: number, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const userReactionsCount = message.reactions?.filter(r => r.userId === userId).length || 0;
    if (userReactionsCount >= 2) {
      showError('You can only add up to 2 reactions per message.', 2500, 'Action Required');
      return;
    }
    
    const result = await addReaction(messageId, emoji, userId, userInfo.displayName);
    if (!result.success) {
      showError(result.error || 'Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (messageId: number, emoji: string) => {
    const result = await removeReaction(messageId, emoji, userId);
    if (!result.success) {
      showError(result.error || 'Failed to remove reaction');
    }
  };

  // Handle reply container click to scroll to and highlight original message
  const handleReplyClick = (messageId: number) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      // Prevent spam-click: if already highlighting this message, ignore
      if (highlightedMessageId === messageId) {
        return;
      }
      
      // Clear any existing highlight timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      // Reset highlight state first to ensure fresh animation
      setHighlightedMessageId(null);
      
      // Use a micro-delay to ensure state reset before setting new highlight
      setTimeout(() => {
        // Scroll to the message
        messageElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Highlight the message
        setHighlightedMessageId(messageId);
        
        // Remove highlight after longer delay for better visibility
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedMessageId(null);
        }, 2500);
      }, 10);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 shield-gradient rounded-lg flex items-center justify-center text-white text-sm">
            🛡️
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200">To the Frontlines</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            data-testid="button-menu"
          >
            <Menu className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </Button>
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-slate-50 dark:bg-slate-900 pt-20" 
        style={{ paddingBottom: replyingTo ? '180px' : '140px' }}
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            ref={(el) => {
              if (el) {
                messageRefs.current[message.id] = el;
              }
            }}
          >
            <MessageBubble
              message={message}
              isCurrentUser={message.displayName === userInfo.displayName}
              currentUserId={userId}
              currentUserDisplayName={userInfo.displayName}
              onReply={() => {
                setReplyingTo(message);
                // Focus input after a short delay to ensure UI updates
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }}
              onAddReaction={(emoji: string) => handleAddReaction(message.id, emoji)}
              onRemoveReaction={(emoji: string) => handleRemoveReaction(message.id, emoji)}
              onReplyClick={handleReplyClick}
              isHighlighted={highlightedMessageId === message.id}
            />
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-start space-x-2 mr-12">
            <div className="text-lg">{typingUsers[0].emoji}</div>
            <div className="bg-white dark:bg-slate-700 rounded-xl rounded-tl-sm px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.32s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.16s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* New Messages Notification */}
      {hasNewMessages && !isAtBottom && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={() => {
              scrollToBottom();
              setHasNewMessages(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-colors"
            data-testid="button-scroll-new-messages"
          >
            <span className="text-sm font-medium">New messages</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Quick Suggestions */}
      <div className={`fixed left-0 right-0 bg-white dark:bg-slate-800 px-4 py-2 border-t border-slate-200 dark:border-slate-700 z-10 ${replyingTo ? 'bottom-20' : 'bottom-16'}`}>
        <div className="flex space-x-2">
          <Button
            onClick={() => handleQuickMessage('Hello')}
            variant="secondary"
            size="sm"
            className="bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 text-slate-700 dark:text-blue-200 px-3 py-1 rounded-lg text-sm font-medium"
            data-testid="button-quick-hello"
          >Hello</Button>
          <Button
            onClick={() => handleQuickMessage('Stay strong 💪')}
            variant="secondary"
            size="sm"
            className="bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 text-slate-700 dark:text-blue-200 px-3 py-1 rounded-lg text-sm font-medium"
            data-testid="button-quick-strong"
          >
            Stay strong 💪
          </Button>
        </div>
      </div>
      
      {/* Reply Preview */}
      {replyingTo && (
        <div className="fixed bottom-16 left-0 right-0 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 px-4 py-3 z-20">
          <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border-l-4 border-sky-500 shadow-sm">
            <div className="flex-1">
              <div className="text-xs text-sky-600 dark:text-sky-400 font-medium mb-1">Replying to {replyingTo.displayName}</div>
              <div className="text-sm text-slate-600 dark:text-gray-300 truncate">{replyingTo.message}</div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-3 p-1"
              data-testid="button-cancel-reply"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 z-10">
        <div className="flex items-center space-x-3">
          <Input
            ref={inputRef}
            value={currentMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-600 border-0"
            disabled={!isConnected}
            data-testid="input-message"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!currentMessage.trim() || !isConnected}
            className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-lg min-w-[60px] h-10 flex items-center justify-center transition-colors"
            data-testid="button-send"
          >
            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-4 top-16 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[220px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-b border-slate-200 dark:border-slate-600">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Menu</h3>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-3 text-left transition-all duration-200 group"
                data-testid="button-toggle-theme"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {theme === 'dark' ? (
                    <Sun className="text-amber-600 w-4 h-4" />
                  ) : (
                    <Moon className="text-slate-600 w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  </p>
                </div>
              </button>
              <button
                onClick={showAbout}
                className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-3 text-left transition-all duration-200 group"
                data-testid="button-about"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Info className="text-sky-600 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">About Chat</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Learn about this space</p>
                </div>
              </button>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
              <button
                onClick={handleExitChat}
                className="w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center space-x-3 text-left transition-all duration-200 group"
                data-testid="button-exit-chat"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <X className="text-red-600 dark:text-red-300 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-600 dark:text-red-300">Exit Chat</span>
                  <p className="text-xs text-red-500 dark:text-red-400">Leave this conversation</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* About Dialog */}
      <ConfirmationDialog
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
        onConfirm={() => setShowAboutDialog(false)}
        title="About To the Frontlines"
        message="A purposeful space for accountability-driven conversations where individuals gather to support each other."
        confirmText="Got it"
        cancelText=""
        type="info"
      />
      
      {/* Exit Dialog */}
      <ConfirmationDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onConfirm={handleConfirmExit}
        title="Leave Chat"
        message="Are you sure you want to leave the chat? You'll need to enter your details again to rejoin."
        confirmText="Leave Chat"
        cancelText="Stay"
        type="danger"
      />
    </div>
  );
}