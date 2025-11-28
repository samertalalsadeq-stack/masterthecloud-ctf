import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Trophy, Users, GitBranch, Award, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import type { ScoreboardEntry } from '@shared/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
const ScoreboardCard = ({ entries, isLoading }: { entries?: ScoreboardEntry[], isLoading: boolean }) => (
  <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-sm border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-2xl font-display">
        <Trophy className="text-yellow-400" />
        Live Scoreboard
      </CardTitle>
    </CardHeader>
    <CardContent>
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
        {entries?.slice(0, 5).map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${entry.name}`} />
              <AvatarFallback>{entry.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold">{entry.name}</p>
              <p className="text-sm text-muted-foreground">
                {entry.solvedCount} solves • Last solve {entry.lastSolveTs ? formatDistanceToNow(new Date(entry.lastSolveTs), { addSuffix: true }) : 'N/A'}
              </p>
            </div>
            <div className="font-bold text-lg text-primary">{entry.score} pts</div>
          </motion.div>
        ))}
        {!isLoading && entries?.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No scores yet. Be the first to solve a challenge!</p>
        )}
      </div>
    </CardContent>
  </Card>
);
export function HomePage() {
  const { data: scoreboard, isLoading } = useQuery<ScoreboardEntry[]>({
    queryKey: ['scoreboard'],
    queryFn: () => api('/api/scoreboard'),
  });
  return (
    <AppLayout>
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10 dark:opacity-20 pointer-events-none" />
        <ThemeToggle />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold text-balance leading-tight">
                Welcome to <span className="text-gradient">FlagForge</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                A beautiful, lightweight Capture-The-Flag platform built to run at the edge.
                Hone your skills, solve challenges, and climb the leaderboard.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-gradient px-8 py-4 text-lg font-semibold hover:-translate-y-0.5 transition-all duration-200">
                  <Link to="/challenges">
                    <Shield className="mr-2 h-5 w-5" /> View Challenges
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold">
                  <Link to="/admin">
                    <UserCheck className="mr-2 h-5 w-5" /> Admin Panel
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center pb-16 md:pb-24 lg:pb-32"
          >
            <ScoreboardCard entries={scoreboard} isLoading={isLoading} />
          </motion.div>
        </div>
        <Toaster richColors closeButton />
      </main>
    </AppLayout>
  );
}