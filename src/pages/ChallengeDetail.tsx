import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lightbulb, ShieldCheck, Trophy, Tag, ChevronLeft, Loader2, User, Award, Code } from 'lucide-react';
import { toast } from 'sonner';
import { Highlight, themes } from 'prism-react-renderer';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Challenge, ChallengeStats } from '@shared/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserStore } from '@/stores/userStore';
import { LoginModal } from '@/components/LoginModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
const ChallengeDetailSkeleton = () => (
  <div className="grid md:grid-cols-3 gap-8">
    <div className="md:col-span-2 space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <div className="flex flex-wrap gap-4 items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
    <div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);
export function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [flag, setFlag] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const userId = useUserStore(s => s.userId);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  useEffect(() => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
    }
  }, [isLoggedIn]);
  const { data: challenge, isLoading, error } = useQuery<Challenge>({
    queryKey: ['challenge', id],
    queryFn: () => api(`/api/challenges/${id}`),
    enabled: !!id,
  });
  const { data: stats } = useQuery<ChallengeStats>({
    queryKey: ['challengeStats', id],
    queryFn: () => api(`/api/challenges/${id}/stats`),
    enabled: !!id,
  });
  const mutation = useMutation({
    mutationFn: (newFlag: { userId: string; flag: string }) => api(`/api/challenges/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(newFlag),
    }),
    onSuccess: (data: { message: string, pointsAwarded: number }) => {
      toast.success(data.message, {
        description: `Victory! Awarded ${data.pointsAwarded} points.`,
      });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['challengeStats', id] });
      navigate('/challenges');
    },
    onError: (err: Error) => {
      toast.error('Submission Failed', {
        description: err.message,
      });
    },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !userId) {
      setLoginModalOpen(true);
      return;
    }
    if (!flag.trim()) {
      toast.warning('Please enter a flag.');
      return;
    }
    mutation.mutate({ userId, flag });
  };
  return (
    <AppLayout>
      <LoginModal open={isLoginModalOpen} onOpenChange={setLoginModalOpen} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/challenges')} 
            className="mb-6 group hover:bg-accent/50 transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold">Back to Challenges</span>
          </Button>
          {isLoading && <ChallengeDetailSkeleton />}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {challenge && (
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="md:col-span-2 space-y-8"
              >
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">{challenge.title}</h1>
                  <div className="flex flex-wrap gap-3 items-center text-muted-foreground">
                    <Badge variant="outline" className="text-sm px-3 py-0.5 border-primary/50 bg-primary/5 text-primary">
                      {challenge.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm font-semibold">
                      <Trophy className="w-4 h-4" />
                      <span>{challenge.points} Points</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/50 text-accent-foreground text-sm font-semibold">
                      <User className="w-4 h-4" />
                      <span>{stats?.solvesCount ?? 0} Solves</span>
                    </div>
                  </div>
                </div>
                {stats?.firstBloodUser && (
                  <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-900 dark:text-yellow-200">
                    <Award className="h-5 w-5 !text-yellow-500" />
                    <AlertTitle className="text-yellow-700 dark:text-yellow-400 font-bold">First Blood!</AlertTitle>
                    <AlertDescription className="flex items-center gap-2 mt-2">
                      <Avatar className="h-7 w-7 border-2 border-yellow-500/20">
                        <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${stats.firstBloodUser.name}`} />
                        <AvatarFallback>{stats.firstBloodUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Captured by <strong className="font-bold">{stats.firstBloodUser.name}</strong></span>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-xl text-muted-foreground leading-relaxed text-pretty font-medium">
                    {challenge.description}
                  </p>
                </div>
                {challenge.codeSnippet && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Code className="w-4 h-4" />
                      Reference Snippet ({challenge.codeLanguage || 'text'})
                    </div>
                    <Highlight
                      theme={themes.vsDark}
                      code={challenge.codeSnippet}
                      language={challenge.codeLanguage || 'text'}
                    >
                      {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre className={cn(className, "text-sm rounded-xl p-4 md:p-6 overflow-x-auto bg-gray-900 shadow-2xl border border-white/10")} style={style}>
                          {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                              <span className="inline-block w-8 select-none text-white/20 text-xs mr-4">{i + 1}</span>
                              {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                              ))}
                            </div>
                          ))}
                        </pre>
                      )}
                    </Highlight>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {challenge.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1">
                      <Tag className="w-3 h-3 mr-1.5" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-4 pt-4">
                  <Button variant="outline" onClick={() => setShowHint(!showHint)} className="rounded-xl">
                    <Lightbulb className={cn("w-4 h-4 mr-2 transition-colors", showHint ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                    {showHint ? 'Hide' : 'Show'} Hint
                  </Button>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert className="border-primary/20 bg-primary/5 rounded-xl">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-bold">Strategy Hint</AlertTitle>
                        <AlertDescription className="text-muted-foreground mt-1">
                          {challenge.hint || 'No hint available for this challenge. Trust your instincts!'}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-1 md:sticky md:top-24"
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl rounded-2xl overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-indigo-600" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="text-primary h-5 w-5" />
                      Capture Flag
                    </CardTitle>
                    <CardDescription>Enter the decrypted flag to claim your points.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="FLAG{...}"
                          value={flag}
                          onChange={(e) => setFlag(e.target.value)}
                          disabled={mutation.isPending}
                          className="h-12 bg-background/50 border-border/50 focus:ring-primary/20 text-lg font-mono rounded-xl"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 btn-gradient text-lg font-bold rounded-xl shadow-lg shadow-primary/10" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                        ) : (
                          'Submit Flag'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <div className="mt-6 p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Flags are usually in the format <code>FLAG{`{...}`}</code>. Ensure you include the wrapper and correct casing. If you're stuck, check the hint!
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}