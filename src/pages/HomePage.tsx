import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Trophy, UserCheck, LogIn, Cloud, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { ScoreboardEntry } from '@shared/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUserStore } from '@/stores/userStore';
import { LoginModal } from '@/components/LoginModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
const ScoreboardCard = ({ entries, isLoading }: { entries?: ScoreboardEntry[], isLoading: boolean }) => {
  const latestSolveUser = useMemo(() => {
    if (!entries?.length) return null;
    const sorted = [...entries].filter(e => e.lastSolveTs > 0).sort((a, b) => b.lastSolveTs - a.lastSolveTs);
    return sorted[0] || null;
  }, [entries]);
  return (
    <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-md border-border/50 shadow-2xl rounded-2xl overflow-hidden group">
      <CardHeader className="border-b border-border/10 bg-muted/20">
        <CardTitle className="flex items-center justify-between text-2xl font-display">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500 w-6 h-6 group-hover:rotate-12 transition-transform" />
            Live Rankings
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Real-Time</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {latestSolveUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 rounded-xl bg-brand-indigo/5 border border-brand-indigo/10 flex items-center gap-3"
          >
            <Zap className="h-4 w-4 text-brand-indigo animate-pulse" />
            <span className="text-sm font-medium">
              <span className="text-brand-indigo font-bold">{latestSolveUser.name}</span> just captured a flag!
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(latestSolveUser.lastSolveTs), { addSuffix: true })}
            </span>
          </motion.div>
        )}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : entries?.length ? (
            entries.slice(0, 10).map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative",
                  index < 3 ? "bg-accent/30" : "hover:bg-accent/20"
                )}
              >
                <div className={cn(
                  "font-bold text-lg w-8 text-center font-mono",
                  index === 0 && "text-yellow-500 scale-110",
                  index === 1 && "text-slate-400",
                  index === 2 && "text-orange-600"
                )}>
                  #{index + 1}
                </div>
                <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary/20 transition-all shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${entry.name}`} />
                  <AvatarFallback>{entry.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">{entry.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                      {entry.solvedCount} {entry.solvedCount === 1 ? 'CAPTURE' : 'CAPTURES'}
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">
                      {entry.lastSolveTs ? formatDistanceToNow(new Date(entry.lastSolveTs), { addSuffix: true }) : 'Ghosting...'}
                    </span>
                  </div>
                </div>
                <div className="font-black text-xl text-primary tabular-nums group-hover:scale-105 transition-transform">{entry.score}</div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
              <div className="relative inline-block mb-4">
                <Cloud className="w-16 h-16 text-primary/20" />
                <Zap className="w-8 h-8 text-primary absolute bottom-0 right-0 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold mb-2">The Fog is Lifting...</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                Nobody has conquered a challenge yet. Be the first to strike and claim your spot on the leaderboard.
              </p>
              <Button asChild variant="secondary" className="rounded-xl font-bold">
                <Link to="/challenges">Take the First Step</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export function HomePage() {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const { data: scoreboard, isLoading, isError } = useQuery<ScoreboardEntry[]>({
    queryKey: ['scoreboard'],
    queryFn: () => api<ScoreboardEntry[]>('/api/scoreboard'),
    refetchInterval: 15000,
    retry: 2,
  });
  return (
    <AppLayout>
      <LoginModal open={isLoginModalOpen} onOpenChange={setLoginModalOpen} />
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-mesh opacity-[0.05] dark:opacity-[0.1] pointer-events-none" />
        <ThemeToggle />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow relative z-10">
          <div className="py-20 md:py-28 lg:py-40 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
                <Cloud className="h-4 w-4" />
                Edge-Powered Security Protocol
              </div>
              <h1 className="text-6xl md:text-8xl font-display font-black text-balance leading-none mb-10 tracking-tight">
                Master the <span className="text-gradient">Cloud</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed mb-16 font-medium">
                The ultimate capture-the-flag proving ground. 
                Experience a lightning-fast CTF platform running on the global edge.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                {!isLoggedIn ? (
                  <Button
                    onClick={() => setLoginModalOpen(true)}
                    size="lg"
                    className="btn-gradient min-w-[240px] h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    <LogIn className="mr-2 h-6 w-6" /> Join the Hunt
                  </Button>
                ) : (
                  <Button asChild size="lg" className="btn-gradient min-w-[240px] h-16 text-xl font-black rounded-2xl shadow-2xl active:scale-95 transition-all">
                    <Link to="/challenges">
                      <Shield className="mr-2 h-6 w-6" /> Explore Challenges
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline" className="min-w-[240px] h-16 text-xl font-black rounded-2xl backdrop-blur-md border-border/50 hover:bg-accent/10 active:scale-95 transition-all">
                  <Link to="/admin">
                    <UserCheck className="mr-2 h-6 w-6" /> Admin Console
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex justify-center pb-32"
          >
            <ErrorBoundary>
              {isError ? (
                <Card className="w-full max-w-2xl bg-destructive/5 border-destructive/20 p-8 text-center rounded-2xl">
                  <h3 className="text-lg font-bold text-destructive mb-2">Rankings Offline</h3>
                  <p className="text-muted-foreground text-sm">We're having trouble reaching the command center. Please refresh the page.</p>
                </Card>
              ) : (
                <ScoreboardCard entries={scoreboard} isLoading={isLoading} />
              )}
            </ErrorBoundary>
          </motion.div>
        </div>
        <footer className="py-12 border-t border-border/10 text-center relative z-10 bg-background/50 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest opacity-60">
            Powered by Cloudflare Durable Objects • Master the Cloud Protocol v1.0.42
          </p>
        </footer>
      </main>
    </AppLayout>
  );
}