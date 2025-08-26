import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import type { ChatMessage } from "@shared/schema";

interface MessageBubbleProps {
  message: ChatMessage & { reactions?: Array<{id: number; messageId: number; userId: string; emoji: string; displayName: string; createdAt: Date}> };
  isCurrentUser: boolean;
  currentUserId: string;
  currentUserDisplayName: string;
  onReply: () => void;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  onReplyClick?: (messageId: number) => void;
  isHighlighted?: boolean;
}

export default function MessageBubble({ message, isCurrentUser, currentUserId, currentUserDisplayName, onReply, onAddReaction, onRemoveReaction, onReplyClick, isHighlighted }: MessageBubbleProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);
  const hasMoved = useRef(false);
  const { theme } = useTheme();

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Trigger highlight animation when message is highlighted
  const [shouldHighlight, setShouldHighlight] = useState(false);
  
  useEffect(() => {
    if (isHighlighted) {
      // Always reset states first to ensure fresh animation
      setIsShaking(false);
      setShouldHighlight(false);
      
      // Use micro-delay to ensure state reset before new animation
      const initTimer = setTimeout(() => {
        setIsShaking(true);
        setShouldHighlight(true);
        
        // Extended timing: fade out after longer delay for better visibility
        const fadeTimer = setTimeout(() => {
          setShouldHighlight(false);
        }, 2000);
        
        const shakeTimer = setTimeout(() => {
          setIsShaking(false);
        }, 300);
        
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(shakeTimer);
        };
      }, 5);
      
      return () => {
        clearTimeout(initTimer);
      };
    } else {
      // Reset states when not highlighted
      setIsShaking(false);
      setShouldHighlight(false);
    }
  }, [isHighlighted]);

  // Handle reply container click
  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (message.replyToId && onReplyClick) {
      onReplyClick(message.replyToId);
    }
  };

  // Touch event handlers for swipe-to-reply with animation and long-press for reactions
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    setIsAnimating(false);
    hasMoved.current = false;
    isLongPressRef.current = false;
    
    // Start long press timer
    longPressTimeoutRef.current = setTimeout(() => {
      if (!hasMoved.current) {
        isLongPressRef.current = true;
        setShowReactionPicker(true);
        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startXRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startXRef.current;
    
    // Mark as moved and cancel long press if user moves significantly
    if (Math.abs(diffX) > 5) {
      hasMoved.current = true;
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    }
    
    // Only process swipe if not a long press
    if (!isLongPressRef.current) {
      // Limit swipe distance and add resistance
      const maxSwipe = 80;
      const resistance = 0.6;
      let newOffset = diffX * resistance;
      
      // Apply direction-based limits
      if (isCurrentUser) {
        // Current user can swipe left (negative)
        newOffset = Math.max(-maxSwipe, Math.min(0, newOffset));
      } else {
        // Other users can swipe right (positive)
        newOffset = Math.max(0, Math.min(maxSwipe, newOffset));
      }
      
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // If it was a long press, don't process swipe
    if (isLongPressRef.current) {
      startXRef.current = 0;
      return;
    }
    
    const swipeThreshold = 30;
    const shouldReply = Math.abs(swipeOffset) > swipeThreshold;
    
    if (shouldReply) {
      // Trigger reply with smooth animation
      setIsAnimating(true);
      onReply();
      
      // Reset with smooth spring animation
      setTimeout(() => {
        setSwipeOffset(0);
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, 100);
    } else {
      // Animate back to original position smoothly
      setIsAnimating(true);
      setSwipeOffset(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
    
    startXRef.current = 0;
  };

  // Mouse event handlers for double-click reply (PC) or reaction (when no reactions exist)
  const handleDoubleClick = () => {
    if (Object.keys(groupedReactions).length === 0) {
      // If no reactions exist, show reaction picker
      setShowReactionPicker(true);
    } else {
      // If reactions exist, do reply
      setIsAnimating(true);
      onReply();
      
      // Brief animation feedback
      setTimeout(() => {
        setIsAnimating(false);
      }, 200);
    }
  };

  // Generate a subtle background color based on user name
  const getUserColor = (displayName: string) => {
    const colors = [
      'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50',
      'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50',
      'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700/50',
      'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700/50',
      'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700/50',
      'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/50',
      'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700/50',
      'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700/50',
    ];
    const hash = displayName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Generate reply colors that match the original user's message color with deeper shadow effect
  const getReplyColor = (displayName: string) => {
    // Darker versions of the original colors with enhanced shadow
    const replyColors = [
      'bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-l-blue-600 dark:border-l-blue-400',      
      'bg-green-100/60 dark:bg-green-900/40 border-l-4 border-l-green-600 dark:border-l-green-400',    
      'bg-purple-100/60 dark:bg-purple-900/40 border-l-4 border-l-purple-600 dark:border-l-purple-400',  
      'bg-orange-100/60 dark:bg-orange-900/40 border-l-4 border-l-orange-600 dark:border-l-orange-400',  
      'bg-pink-100/60 dark:bg-pink-900/40 border-l-4 border-l-pink-600 dark:border-l-pink-400',      
      'bg-indigo-100/60 dark:bg-indigo-900/40 border-l-4 border-l-indigo-600 dark:border-l-indigo-400',  
      'bg-teal-100/60 dark:bg-teal-900/40 border-l-4 border-l-teal-600 dark:border-l-teal-400',      
      'bg-yellow-100/60 dark:bg-yellow-900/40 border-l-4 border-l-yellow-600 dark:border-l-yellow-400',  
    ];
    const hash = displayName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return replyColors[hash % replyColors.length];
  };

  // Common reaction emojis
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😊'];

  // Handle reaction click
  const handleReactionClick = (emoji: string) => {
    // Check both userId (for current session) and displayName (for cross-session consistency) 
    const userReaction = message.reactions?.find(r => 
      (r.userId === currentUserId || r.displayName === currentUserDisplayName) && r.emoji === emoji
    );
    
    if (userReaction) {
      // Remove the reaction if user already reacted with this emoji
      onRemoveReaction(emoji);
    } else {
      // Check if user already has 2 reactions on this message (using both userId and displayName)
      const userReactionsCount = message.reactions?.filter(r => 
        r.userId === currentUserId || r.displayName === currentUserDisplayName
      ).length || 0;
      
      if (userReactionsCount >= 2) {
        // Don't allow more than 2 reactions per user
        return;
      }
      onAddReaction(emoji);
    }
    setShowReactionPicker(false);
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc: { [key: string]: { count: number; users: string[] } }, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [] };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.displayName);
    return acc;
  }, {}) || {};

  // Handle long press for reaction picker
  const handleLongPress = () => {
    setShowReactionPicker(true);
  };

  if (isCurrentUser) {
    return (
      <motion.div 
        className="flex flex-col items-end message-enter ml-12 relative group"
        animate={{
          backgroundColor: shouldHighlight 
            ? (theme === 'dark' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)') // Frontlines blue with opacity
            : 'rgba(0, 0, 0, 0)'
        }}
        transition={{ 
          duration: shouldHighlight ? 0.2 : 0.8, // Quick fade in, slow fade out
          ease: "easeInOut"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          borderRadius: '0.75rem',
          padding: '8px',
          margin: '-8px'
        }}
      >

        <div 
          className={`flex items-start justify-end ${
            isAnimating ? 'transition-transform duration-300 ease-out' : ''
          } ${isHighlighted && isShaking ? 'animate-shake-strong' : ''}`}
          style={{ 
            transform: `translateX(${swipeOffset}px)`,
            transition: isAnimating ? 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
          }}
        >
          {/* Desktop hover reply button for current user - positioned to the left of message with same gap as other messages */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReply();
                }}
                className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-600 transition-colors z-20 mt-2 mr-3"
                title="Reply to message"
              >
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
          
          <div className="flex-1 flex justify-end">
            <div 
              ref={bubbleRef}
              className={`rounded-xl rounded-tr-sm px-4 py-2 max-w-xs min-w-[180px] cursor-pointer select-none shadow-sm border ${getUserColor(message.displayName)} ${
                isAnimating && Math.abs(swipeOffset) > 30 && !shouldHighlight ? 'scale-95' : ''
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress();
              }}
            >
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">{message.displayName}</div>
              {message.replyToMessage && (
                <div 
                  className={`px-3 py-2 mb-2 rounded-r reply-quote-inset cursor-pointer hover:opacity-80 transition-opacity ${getReplyColor(message.replyToDisplayName || message.displayName)}`}
                  onClick={handleReplyClick}
                >
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">{message.replyToDisplayName}</div>
                  <div className="text-xs text-slate-700 dark:text-slate-200 truncate">{message.replyToMessage}</div>
                </div>
              )}
              <p className="text-sm text-slate-800 dark:text-slate-200">{message.message}</p>
              <div className="text-xs text-slate-400 mt-1 text-right">
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2 ml-2">
            <div className="text-lg">{message.emoji}</div>
          </div>
        </div>
        

        
        {/* Reactions for current user - positioned below message with proper alignment */}
        {Object.keys(groupedReactions).length > 0 && (
          // Reaction container with multi-row wrapping - reactions automatically flow to new rows when exceeding message width  
          <div className="flex flex-wrap gap-1 mt-3 max-w-48" style={{ alignSelf: 'flex-end', marginRight: '44px' }}>
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <motion.button
                key={emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReactionClick(emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  message.reactions?.find(r => (r.userId === currentUserId || r.displayName === currentUserDisplayName) && r.emoji === emoji)
                    ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm'
                } hover:bg-blue-200 dark:hover:bg-blue-800/70 transition-colors`}
                title={`${data.users.join(', ')}`}
              >
                <span>{emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">{data.count}</span>
              </motion.button>
            ))}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                // Check if user already has 2 reactions on this message
                const userReactionsCount = message.reactions?.filter(r => r.userId === currentUserId || r.displayName === currentUserDisplayName).length || 0;
                if (userReactionsCount >= 2) {
                  // Don't show picker if user already has 2 reactions
                  return;
                }
                setShowReactionPicker(true);
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors border ${
                (message.reactions?.filter(r => r.userId === currentUserId || r.displayName === currentUserDisplayName).length || 0) >= 2
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
              title={
                (message.reactions?.filter(r => r.userId === currentUserId || r.displayName === currentUserDisplayName).length || 0) >= 2
                  ? "Maximum 2 reactions per message"
                  : "Add reaction"
              }
            >
              +
            </motion.button>
          </div>
        )}
        
        {/* Reaction Picker Popup for current user */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" 
              onClick={() => setShowReactionPicker(false)}
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -10 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="absolute bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3 flex gap-2"
                style={{
                  top: (bubbleRef.current?.getBoundingClientRect().bottom || 0) + 10,
                  right: window.innerWidth - (bubbleRef.current?.getBoundingClientRect().right || 0),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {commonReactions.map((emoji, index) => (
                  <motion.button
                    key={emoji}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReactionClick(emoji)}
                    className="text-2xl p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col items-start message-enter mr-12 relative group"
      animate={{
        backgroundColor: shouldHighlight 
          ? (theme === 'dark' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)') // Frontlines blue with opacity
          : 'rgba(0, 0, 0, 0)'
      }}
      transition={{ 
        duration: shouldHighlight ? 0.2 : 0.8, // Quick fade in, slow fade out
        ease: "easeInOut"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        borderRadius: '0.75rem',
        padding: '8px',
        margin: '-8px'
      }}
    >
      <div 
        className={`flex items-start space-x-2 ${
          isAnimating ? 'transition-transform duration-300 ease-out' : ''
        } ${isHighlighted && isShaking ? 'animate-shake-strong' : ''}`}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
        }}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="text-lg">{message.emoji}</div>
        </div>
        <div className="flex-1">
          <div 
            ref={bubbleRef}
            className={`rounded-xl rounded-tl-sm px-4 py-2 shadow-sm border max-w-xs min-w-[180px] cursor-pointer select-none ${getUserColor(message.displayName)} ${
              isAnimating && Math.abs(swipeOffset) > 30 && !shouldHighlight ? 'scale-95' : ''
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => {
              e.preventDefault();
              handleLongPress();
            }}
          >
          <div className="text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">{message.displayName}</div>
          {message.replyToMessage && (
            <div 
              className={`px-3 py-2 mb-2 rounded-r reply-quote-inset cursor-pointer hover:opacity-80 transition-opacity ${getReplyColor(message.replyToDisplayName || message.displayName)}`}
              onClick={handleReplyClick}
            >
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">{message.replyToDisplayName}</div>
              <div className="text-xs text-slate-700 dark:text-slate-200 truncate">{message.replyToMessage}</div>
            </div>
          )}
          <p className="text-sm text-slate-800 dark:text-slate-200">{message.message}</p>
          <div className="text-xs text-slate-400 mt-1 text-right">
            {formatTime(message.createdAt)}
          </div>
        </div>
        
        {/* Desktop hover reply button */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onReply();
              }}
              className="absolute -right-12 top-2 w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-600 transition-colors z-10"
              title="Reply to message"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
        </div>
      </div>
      
      {/* Reactions for other users - positioned below message with proper alignment */}
      {Object.keys(groupedReactions).length > 0 && (
        // Reaction container with multi-row wrapping - reactions automatically flow to new rows when exceeding message width
        <div className="flex flex-wrap gap-1 mt-3 max-w-48" style={{ alignSelf: 'flex-start', marginLeft: '44px' }}>
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <motion.button
              key={emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReactionClick(emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                message.reactions?.find(r => (r.userId === currentUserId || r.displayName === currentUserDisplayName) && r.emoji === emoji)
                  ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm'
              } hover:bg-blue-200 dark:hover:bg-blue-800/70 transition-colors`}
              title={`${data.users.join(', ')}`}
            >
              <span>{emoji}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{data.count}</span>
            </motion.button>
          ))}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              // Check if user already has 2 reactions on this message
              const userReactionsCount = message.reactions?.filter(r => r.userId === currentUserId || r.displayName === currentUserDisplayName).length || 0;
              if (userReactionsCount >= 2) {
                // Don't show picker if user already has 2 reactions
                return;
              }
              setShowReactionPicker(true);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors border ${
              (message.reactions?.filter(r => r.userId === currentUserId || r.displayName === currentUserDisplayName).length || 0) >= 2
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
            title={
              (message.reactions?.filter(r => r.userId === currentUserId || r.displayName === currentUserDisplayName).length || 0) >= 2
                ? "Maximum 2 reactions per message"
                : "Add reaction"
            }
          >
            +
          </motion.button>
        </div>
      )}
      
      {/* Reaction Picker Popup */}
      <AnimatePresence>
        {showReactionPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50" 
            onClick={() => setShowReactionPicker(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="absolute bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3 flex gap-2"
              style={{
                top: (bubbleRef.current?.getBoundingClientRect().bottom || 0),
                left: (bubbleRef.current?.getBoundingClientRect().left || 0),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {commonReactions.map((emoji, index) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReactionClick(emoji)}
                  className="text-2xl p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
