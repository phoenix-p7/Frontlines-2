import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { Menu, Moon, Sun, Info, Eye, EyeOff } from "lucide-react";
import { ToastContainer, useToastNotifications } from "@/components/ui/toast-notification";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { User } from "@/pages/chat";

interface JoinScreenProps {
  onJoinSuccess: (user: User) => void;
}

const EMOJIS = ['💪', '🔥', '🎯', '⚡', '🚀', '💎', '🦾', '👊', '⭐', '🌟', '🏆', '🎖️', '🛡️', '⚔️', '🗡️', '🏹', '🎮', '💥'];

export default function JoinScreen({ onJoinSuccess }: JoinScreenProps) {
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToastNotifications();

  const handleJoin = async () => {
    if (!selectedEmoji || !displayName.trim() || !password.trim()) {
      showError("Please fill in all fields and select an emoji to proceed.", 2500, "Action Required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/join", {
        emoji: selectedEmoji,
        displayName: displayName.trim(),
        password: password.trim(),
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess("Successfully joined the chat!");
        onJoinSuccess(data.user);
      }
    } catch (error) {
      console.error("Join error:", error);
      
      // Handle API error response
      if (error instanceof Error) {
        // Extract JSON from error message (format: "401: {json}")
        const errorMessage = error.message;
        const colonIndex = errorMessage.indexOf(':');
        
        if (colonIndex !== -1) {
          const jsonPart = errorMessage.substring(colonIndex + 1).trim();
          try {
            const errorData = JSON.parse(jsonPart);
            showError(errorData.message || "Invalid password", 2500, "Action Required");
          } catch {
            showError("Invalid password", 2500, "Action Required");
          }
        } else {
          showError("Invalid password", 2500, "Action Required");
        }
      } else {
        showError("Invalid password", 2500, "Action Required");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  const showAbout = () => {
    setIsMenuOpen(false);
    setShowAboutDialog(true);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 shield-gradient rounded-xl flex items-center justify-center text-white text-lg font-semibold">
            🛡️
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">To the Frontlines</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Call of the Union for accountability</p>
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

      {/* Join Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-6">

          {/* Emoji Selection */}
          <div>
            <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Choose your emoji</Label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-12 h-12 text-2xl rounded-xl transition-colors border-2 ${
                    selectedEmoji === emoji
                      ? "bg-sky-100 dark:bg-sky-900/50 border-sky-500"
                      : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Display name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:focus:border-sky-400"
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Chat password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter chat password"
                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:focus:border-sky-400"
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoin}
            disabled={isLoading || !selectedEmoji || !displayName.trim() || !password.trim()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Joining..." : "Join Chat"}
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
    </div>
  );
}