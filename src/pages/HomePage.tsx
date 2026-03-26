import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Trophy, UserCheck, LogIn, Cloud } from 'lucide-react';
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
const ScoreboardCard = ({ entries, isLoading }: { entries?: ScoreboardEntry[], isLoading: boolean }) => (
  <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
    <CardHeader className="border-b border-border/50">
      <CardTitle className="flex items-center justify-between text-2xl font-display">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-400" />
          Live Scoreboard
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Live</span>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="space-y-4">
        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
        {!isLoading && (entries ?? []).slice(0, 10).map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
          >
            <div className={cn(
              "font-bold text-lg w-8 text-center",
              index === 0 && "text-yellow-500",
              index === 1 && "text-gray-400",
              index === 2 && "text-amber-600"
            )}>
              {index + 1}
            </div>
            <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary/20 transition-all">
              <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${entry.name}`} />
              <AvatarFallback>{entry.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold text-foreground">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.solvedCount} solves • {entry.lastSolveTs ? formatDistanceToNow(new Date(entry.lastSolveTs), { addSuffix: true }) : 'No solves yet'}
              </p>
            </div>
            <div className="font-bold text-lg text-primary tabular-nums">{entry.score} pts</div>
          </motion.div>
        ))}
        {!isLoading && entries?.length === 0 && (
          <div className="text-center py-12">
            <Cloud className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">The scoreboard is currently empty.</p>
            <p className="text-sm text-muted-foreground/60">Be the first to claim a flag!</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
export function HomePage() {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const isLoggedInFromStore = useUserStore(state => state.isLoggedIn);
  const { data: scoreboard, isLoading } = useQuery<ScoreboardEntry[]>({
    queryKey: ['scoreboard'],
    queryFn: () => api<ScoreboardEntry[]>('/api/scoreboard'),
    refetchInterval: 30000,
  });
  return (
    <AppLayout>
      <LoginModal open={isLoginModalOpen} onOpenChange={setLoginModalOpen} />
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-5 dark:opacity-10 pointer-events-none" />
        <ThemeToggle />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <Cloud className="h-3 w-3" />
                Edge-Powered Security
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-balance leading-[1.1] mb-8">
                Master the Cloud: <span className="text-gradient">Catch the Cloud</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed mb-12">
                Join our next-generation CTF platform running entirely at the edge. 
                Test your skills in Web Security, Cryptography, and Forensics through 
                interactive challenges on the Catch the Cloud platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!isLoggedInFromStore ? (
                  <Button
                    onClick={() => setLoginModalOpen(true)}
                    size="lg"
                    className="btn-gradient min-w-[200px] h-14 text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    <LogIn className="mr-2 h-5 w-5" /> Start Playing
                  </Button>
                ) : (
                  <Button asChild size="lg" className="btn-gradient min-w-[200px] h-14 text-lg font-bold">
                    <Link to="/challenges">
                      <Shield className="mr-2 h-5 w-5" /> All Challenges
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline" className="min-w-[200px] h-14 text-lg font-bold backdrop-blur-sm">
                  <Link to="/admin">
                    <UserCheck className="mr-2 h-5 w-5" /> Admin Portal
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center pb-24"
          >
            <ScoreboardCard entries={scoreboard} isLoading={isLoading} />
          </motion.div>
        </div>
      </main>
    </AppLayout>
  );
}