"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { UserRole } from "@/context/RoleContext";
import { Lock, User, ChevronRight, ShieldCheck, Code2, Users, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useRole();
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedRole !== 'leadership' && !username.trim()) {
      setError("Please enter your username.");
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock Validation
    let isValid = false;

    // Allow any password for leadership for ease of demo, specific ones for others
    if (selectedRole === 'manager' && (password === 'manager123' || password === 'admin')) isValid = true;
    if (selectedRole === 'developer' && (password === 'dev123' || password === 'admin')) isValid = true;
    if (selectedRole === 'leadership') isValid = true; // Open access for demo

    if (isValid) {
      login(username, selectedRole); // Use new login method
      router.push('/roadmap');
    } else {
      setError("Invalid password. Try 'admin' or 'dev123'.");
      setIsLoading(false);
    }
  };

  const roles: { id: UserRole, label: string, icon: any, desc: string }[] = [
    { id: 'manager', label: 'Manager', icon: ShieldCheck, desc: 'Full edit access & strategy controls' },
    { id: 'developer', label: 'Developer', icon: Code2, desc: 'Task updates & technical details' },
    { id: 'leadership', label: 'Leadership', icon: Users, desc: 'High-level overview & insights' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* Background Decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8">

        {/* Branding */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex flex-col items-center mb-8">
            <div className="text-center">
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
                JobProMax
              </h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
                Progress Hub
              </p>
            </div>
            {/* Horizontal Accent Bar */}
            <div className="h-1.5 w-24 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] mt-6"></div>
          </div>

          <h2 className="text-xl font-semibold text-slate-700 text-center">Welcome Back</h2>
          <p className="text-slate-500 text-sm text-center">Sign in to continue</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-sm bg-white/80">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">

              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Role</label>
                <div className="grid gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          "relative flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                          isSelected
                            ? "border-blue-600 bg-blue-50/50"
                            : "border-slate-100 hover:border-blue-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className={cn("font-bold text-sm", isSelected ? "text-blue-900" : "text-slate-700")}>
                            {role.label}
                          </h3>
                          <p className="text-xs text-slate-500">{role.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={cn(
                "space-y-4 transition-all duration-500 ease-in-out overflow-hidden",
                selectedRole === 'leadership' ? "max-h-0 opacity-0" : "max-h-[300px] opacity-100"
              )}>
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="jdoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required={selectedRole !== 'leadership'}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="Enter password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-2">{error}</p>}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-base text-white shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <span className="flex items-center">
                    Sign In <ChevronRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
