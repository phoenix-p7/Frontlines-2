import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { ToastContainer, useToastNotifications } from "@/components/ui/toast-notification";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
  Shield, 
  MessageSquare, 
  Users, 
  Settings, 
  Trash2, 
  Ban, 
  RefreshCw, 
  Key,
  ExternalLink,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, Moon, Sun } from "lucide-react";

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

interface Message {
  id: number;
  emoji: string;
  displayName: string;
  message: string;
  userId: string;
  replyToId?: number;
  replyToMessage?: string;
  replyToDisplayName?: string;
  createdAt: string;
  reactions?: Array<{id: number; messageId: number; userId: string; emoji: string; displayName: string; createdAt: Date}>;
}

interface ConnectedUser {
  userId: string;
  emoji: string;
  displayName: string;
  connected: boolean;
}

// Admin Message Bubble Component - mimics regular MessageBubble but with delete functionality
function AdminMessageBubble({ message, onDelete }: { message: Message; onDelete: (id: number, messageText: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Generate a subtle background color based on user name (same as regular MessageBubble)
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

  // Generate reply colors that match the original user's message color
  const getReplyColor = (displayName: string) => {
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

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc: { [key: string]: { count: number; users: string[] } }, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [] };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.displayName);
    return acc;
  }, {}) || {};

  return (
    <motion.div 
      className="flex flex-col items-start message-enter mr-12 relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        borderRadius: '0.75rem',
        padding: '8px',
        margin: '-8px'
      }}
    >
      <div className="flex items-start space-x-2 w-full">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-lg">{message.emoji}</div>
        </div>
        <div className="flex-1">
          <div 
            className={`rounded-xl rounded-tl-sm px-4 py-2 shadow-sm border max-w-xs min-w-[180px] ${getUserColor(message.displayName)}`}
          >
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">{message.displayName}</div>
            {message.replyToMessage && (
              <div 
                className={`px-3 py-2 mb-2 rounded-r reply-quote-inset ${getReplyColor(message.replyToDisplayName || message.displayName)}`}
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
          
          {/* Reactions display */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 max-w-xs">
              {Object.entries(groupedReactions).map(([emoji, data]) => (
                <div
                  key={emoji}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm"
                  title={`${data.users.join(', ')}`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{data.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Admin Delete Button */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onDelete(message.id, message.message)}
              className="w-8 h-8 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/70 rounded-full flex items-center justify-center shadow-lg border border-red-200 dark:border-red-700 transition-colors"
              title="Delete message (Admin only)"
              data-testid={`button-delete-message-${message.id}`}
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-300" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToastNotifications();
  const { theme, toggleTheme } = useTheme();

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch("/api/admin/messages", { 
        method: "GET",
        headers: headers 
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        showError("Failed to load messages");
      }
    } catch (error) {
      console.error("Load messages error:", error);
      showError("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadConnectedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/connected-users", { 
        method: "GET",
        headers: headers 
      });
      const data = await response.json();
      
      if (data.success) {
        setConnectedUsers(data.users);
      } else {
        showError("Failed to load users");
      }
    } catch (error) {
      console.error("Load users error:", error);
      showError("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess("Message deleted successfully");
        loadMessages(); // Refresh messages
      } else {
        showError("Failed to delete message");
      }
    } catch (error) {
      console.error("Delete message error:", error);
      showError("Failed to delete message");
    }
  };

  const clearAllMessages = async () => {
    try {
      const response = await fetch("/api/admin/clear-chat", {
        method: "POST",
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess("All messages cleared successfully");
        setMessages([]); // Clear local state
      } else {
        showError("Failed to clear messages");
      }
    } catch (error) {
      console.error("Clear messages error:", error);
      showError("Failed to clear messages");
    }
  };

  const changeAdminPassword = async () => {
    try {
      const response = await fetch("/api/admin/change-admin-password", {
        method: "POST",
        headers,
        body: JSON.stringify({ newPassword: newAdminPassword }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message);
        setNewAdminPassword("");
        // Auto-logout after password change to force re-authentication
        setTimeout(() => {
          showInfo("Please log in again with your new admin password.");
          onLogout();
        }, 2000);
      } else {
        showError(data.message || "Failed to change admin password");
      }
    } catch (error) {
      showError("Error changing admin password");
    }
  };

  const changePassword = async () => {
    if (!newPassword.trim()) {
      showError("Please enter a new password");
      return;
    }

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers,
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess("Room password updated successfully");
        setNewPassword("");
      } else {
        showError("Failed to update password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      showError("Failed to update password");
    }
  };

  const kickUser = async (userId: string, displayName: string) => {
    try {
      const response = await fetch("/api/admin/kick-user", {
        method: "POST",
        headers,
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`${displayName} has been kicked from the chat`);
        loadConnectedUsers(); // Refresh users
      } else {
        showError(`Failed to kick ${displayName}`);
      }
    } catch (error) {
      console.error("Kick user error:", error);
      showError(`Failed to kick ${displayName}`);
    }
  };

  const confirmDeleteMessage = (messageId: number, messageText: string) => {
    setConfirmTitle("Delete Message");
    setConfirmMessage(`Are you sure you want to delete this message?\n\n"${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`);
    setConfirmAction(() => () => deleteMessage(messageId));
    setShowConfirmDialog(true);
  };

  const confirmClearAll = () => {
    setConfirmTitle("Clear All Messages");
    setConfirmMessage("Are you sure you want to delete ALL chat messages? This action cannot be undone.");
    setConfirmAction(() => clearAllMessages);
    setShowConfirmDialog(true);
  };

  const confirmKickUser = (userId: string, displayName: string) => {
    setConfirmTitle("Kick User");
    setConfirmMessage(`Are you sure you want to kick ${displayName} from the chat?`);
    setConfirmAction(() => () => kickUser(userId, displayName));
    setShowConfirmDialog(true);
  };

  useEffect(() => {
    loadMessages();
    loadConnectedUsers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadMessages();
      loadConnectedUsers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border-b border-slate-200/60 dark:border-slate-700/60 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Admin Panel
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Chat Administration Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat Messages</span>
                  </CardTitle>
                  <CardDescription>
                    Manage all chat messages ({messages.length} total)
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMessages}
                    disabled={isLoadingMessages}
                    data-testid="button-refresh-messages"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmClearAll}
                    data-testid="button-clear-all-messages"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="text-center py-8 text-slate-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No messages found</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    {messages.map((message) => (
                      <AdminMessageBubble
                        key={message.id}
                        message={message}
                        onDelete={confirmDeleteMessage}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Connected Users</span>
                  </CardTitle>
                  <CardDescription>
                    Manage currently connected users ({connectedUsers.length} online)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadConnectedUsers}
                  disabled={isLoadingUsers}
                  data-testid="button-refresh-users"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="text-center py-8 text-slate-500">Loading users...</div>
                ) : connectedUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No users connected</div>
                ) : (
                  <div className="space-y-3">
                    {connectedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                        data-testid={`user-${user.userId}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{user.emoji}</span>
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">
                              {user.displayName}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {user.userId.substring(0, 8)}...
                            </p>
                          </div>
                          {user.connected && (
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                              Online
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmKickUser(user.userId, user.displayName)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          data-testid={`button-kick-user-${user.userId}`}
                        >
                          <Ban className="w-4 h-4" />
                          Kick
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Room Password</span>
                </CardTitle>
                <CardDescription>
                  Change the password required to join the chat room
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new room password"
                    className="max-w-sm"
                    data-testid="input-new-room-password"
                  />
                </div>
                <Button
                  onClick={changePassword}
                  disabled={!newPassword.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                  data-testid="button-change-password"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Admin Password</span>
                </CardTitle>
                <CardDescription>
                  Change your admin panel password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newAdminPassword" className="block text-sm font-medium mb-2">
                    New Admin Password
                  </Label>
                  <Input
                    id="newAdminPassword"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new admin password"
                    className="max-w-sm"
                    data-testid="input-new-admin-password"
                  />
                </div>
                <Button
                  onClick={changeAdminPassword}
                  disabled={!newAdminPassword.trim()}
                  className="bg-purple-500 hover:bg-purple-600"
                  data-testid="button-change-admin-password"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Update Admin Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Danger Zone</span>
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={confirmClearAll}
                  className="flex items-center space-x-2"
                  data-testid="button-danger-clear-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Messages</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          confirmAction();
          setShowConfirmDialog(false);
        }}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
        cancelText="Cancel"
        type="danger"
      />


      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-4 top-16 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[220px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-b border-slate-200 dark:border-slate-600">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Admin Menu</h3>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-3 text-left transition-all duration-200 group"
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
                onClick={() => {
                  window.open("/", "_blank");
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-3 text-left transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ExternalLink className="text-sky-600 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">View Chat</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Open chat in new tab</p>
                </div>
              </button>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center space-x-3 text-left transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LogOut className="text-red-600 dark:text-red-300 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-600 dark:text-red-300">Logout</span>
                  <p className="text-xs text-red-500 dark:text-red-400">Exit admin panel</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}