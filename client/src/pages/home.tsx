import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Settings, 
  HelpCircle, 
  Rocket, 
  PuzzleIcon, 
  Code, 
  Plug,
  Play,
  Hammer,
  Bug,
  Folder,
  File,
  CheckCircle,
  Bolt
} from "lucide-react";

export default function Home() {
  const projectStats = [
    { label: "Build Time", value: "~500ms", color: "text-green-600" },
    { label: "Bundle Size", value: "~45KB", color: "text-green-600" },
    { label: "Hot Reload", value: "Instant", color: "text-green-600" },
    { label: "Dependencies", value: "Minimal", color: "text-blue-600" }
  ];

  const projectStructure = [
    { type: "folder", name: "src/", icon: Folder },
    { type: "file", name: "App.tsx", icon: File, indent: 1 },
    { type: "file", name: "main.tsx", icon: File, indent: 1 },
    { type: "file", name: "index.css", icon: File, indent: 1 },
    { type: "folder", name: "components/", icon: Folder, indent: 1 },
    { type: "folder", name: "hooks/", icon: Folder, indent: 1 },
    { type: "folder", name: "lib/", icon: Folder, indent: 1 },
    { type: "folder", name: "pages/", icon: Folder, indent: 1 },
    { type: "folder", name: "public/", icon: Folder },
    { type: "file", name: "package.json", icon: File },
    { type: "file", name: "vite.config.ts", icon: File },
    { type: "file", name: "tailwind.config.ts", icon: File }
  ];

  const techStack = [
    { name: "React 18", description: "Modern React with hooks", icon: "⚛️" },
    { name: "Vite", description: "Fast build tool", icon: "⚡" },
    { name: "TypeScript", description: "Type safety", icon: "🔷" }
  ];

  const features = [
    {
      icon: Rocket,
      title: "Fast Development",
      description: "Instant hot reload and fast builds with Vite",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: PuzzleIcon,
      title: "Modular Structure",
      description: "Organized folders for easy component management",
      color: "text-green-600 bg-green-50"
    },
    {
      icon: Code,
      title: "Clean Code",
      description: "ESLint configured for consistent code quality",
      color: "text-gray-600 bg-gray-50"
    },
    {
      icon: Plug,
      title: "Ready to Integrate",
      description: "Perfect foundation for any web application",
      color: "text-blue-600 bg-blue-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bolt className="text-blue-600 h-6 w-6" />
                <h1 className="text-xl font-semibold text-gray-900">React + Vite Setup</h1>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                Ready
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Project Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {techStack.map((tech, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">{tech.icon}</div>
                      <h3 className="font-medium text-gray-900">{tech.name}</h3>
                      <p className="text-sm text-gray-600">{tech.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code Preview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Clean Component Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-green-400 mb-2">// App.tsx - Clean functional component</div>
                  <div className="text-gray-300 whitespace-pre">
{`import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;`}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vite Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Vite Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-green-400 mb-2">// vite.config.ts - Optimized for development</div>
                  <div className="text-gray-300 whitespace-pre">
{`import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            
            {/* Project Structure */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Project Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  {projectStructure.map((item, index) => {
                    const Icon = item.icon;
                    const indentClass = item.indent ? `ml-${item.indent * 4}` : '';
                    const iconColor = item.type === 'folder' ? 'text-yellow-600' : 'text-blue-600';
                    
                    return (
                      <div key={index} className={`flex items-center space-x-2 ${indentClass}`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white" 
                    size="sm"
                    onClick={() => window.location.href = '/chat'}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Join Chat Room
                  </Button>
                  <Button className="w-full" variant="secondary" size="sm">
                    <Hammer className="h-4 w-4 mr-2" />
                    Build Production
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <Bug className="h-4 w-4 mr-2" />
                    Run Tests
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Development Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Development Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{stat.label}</span>
                      <span className={`font-medium ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ready for Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
