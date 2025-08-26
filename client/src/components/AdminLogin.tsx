import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { ToastContainer, useToastNotifications } from "@/components/ui/toast-notification";
import { Shield, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToastNotifications();

  const handleLogin = async () => {
    if (!password) {
      showError("Please enter the admin password", 2500, "Action Required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/login", {
        password: password,
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess("Admin access granted");
        localStorage.setItem("adminToken", data.token);
        onLoginSuccess(data.token);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        const colonIndex = errorMessage.indexOf(':');
        
        if (colonIndex !== -1) {
          const jsonPart = errorMessage.substring(colonIndex + 1).trim();
          try {
            const errorData = JSON.parse(jsonPart);
            showError(errorData.message || "Invalid admin password", 2500, "Access Denied");
          } catch {
            showError("Invalid admin password", 2500, "Access Denied");
          }
        } else {
          showError("Invalid admin password", 2500, "Access Denied");
        }
      } else {
        showError("Invalid admin password", 2500, "Access Denied");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Admin Access
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Enter the admin password to access the control panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Admin Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:border-red-400"
                onKeyPress={handleKeyPress}
                data-testid="input-admin-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password-visibility"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading || !password}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-admin-login"
          >
            {isLoading ? "Authenticating..." : "Access Admin Panel"}
          </Button>

          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              🔒 Restricted access for administrators only
            </p>
          </div>
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}