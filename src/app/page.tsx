"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Code2, Users, ChevronRight, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export type UserRole = 'manager' | 'developer' | 'leadership';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.push('/overview');
    }
  }, [user, loading, router]);

  const roles: { id: UserRole, label: string, icon: any, desc: string }[] = [
    { id: 'manager', label: 'Manager', icon: ShieldCheck, desc: 'Full edit access & strategy controls' },
    { id: 'developer', label: 'Developer', icon: Code2, desc: 'Task updates & technical details' },
    { id: 'leadership', label: 'Leadership', icon: Users, desc: 'High-level overview & insights' },
  ];

  const handleRoleSelect = (roleId: UserRole) => {
    if (selectedRole === roleId) {
      // Toggle off if clicking same
      setSelectedRole(null);
      setEmail('');
      setPassword('');
    } else {
      setSelectedRole(roleId);
      if (roleId === 'manager') {
        setEmail('manager@jobpromax.com');
        setPassword('manager123');
      } else {
        setEmail('');
        setPassword('');
      }
    }
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-blue-600 rounded-full"></div>
          <p className="text-slate-500 font-medium">Entering JobProMax...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

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

          <h2 className="text-xl font-semibold text-slate-700 text-center">Select Your Persona</h2>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            Select your role to access the dashboard.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-sm bg-white/80">
          <CardContent className="p-6">
            <div className="space-y-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                const isLeadership = role.id === 'leadership';

                return (
                  <div
                    key={role.id}
                    className={cn(
                      "group rounded-xl border-2 transition-all duration-300 overflow-hidden cursor-pointer",
                      isSelected
                        ? "border-blue-600 bg-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-600"
                        : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md hover:translate-y-[-2px]"
                    )}
                  >
                    <div
                      id={`card-${role.id}`}
                      onClick={() => handleRoleSelect(role.id)}
                      className="flex items-center gap-4 p-4"
                    >
                      <div className={cn(
                        "p-3 rounded-xl transition-all duration-300 flex items-center justify-center",
                        isSelected
                          ? "bg-blue-600 text-white shadow-md scale-110"
                          : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn("font-bold text-base transition-colors", isSelected ? "text-blue-900" : "text-slate-700 group-hover:text-slate-900")}>
                          {role.label}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{role.desc}</p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-blue-600 bg-blue-600 opacity-100"
                          : "border-slate-300 opacity-0 group-hover:opacity-50"
                      )}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>

                    {/* Expandable Area */}
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-500 ease-in-out",
                        isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="p-4 pt-2 border-t border-blue-100/50">
                          {isLeadership ? (
                            <div className="space-y-3 pb-2">
                              <p className="text-xs text-slate-500 text-center px-4">
                                Leadership view provides high-level insights without editing capabilities.
                              </p>
                              <button
                                className="w-full py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 rounded-lg flex items-center justify-center cursor-pointer"
                                onClick={() => router.push('/overview')}
                              >
                                Enter Dashboard
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleLoginSubmit} className="space-y-3 pb-2">
                              {error && (
                                <div className="p-2 text-xs text-red-600 bg-red-50 rounded border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                  <Lock className="h-3 w-3" /> {error}
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="relative group">
                                  <input
                                    type="email"
                                    required
                                    className="w-full pl-3 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="relative group">
                                  <input
                                    type="password"
                                    required
                                    className="w-full pl-3 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                id="btn-login"
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Powered by JobProMax Secure Auth
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
