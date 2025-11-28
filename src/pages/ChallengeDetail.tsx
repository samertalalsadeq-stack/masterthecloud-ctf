import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lightbulb, Paperclip, ShieldCheck, Trophy, Tag, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Challenge } from '@shared/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// A mock user ID for demo purposes. In a real app, this would come from an auth context.
const MOCK_USER_ID = 'u1'; 
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
  const { data: challenge, isLoading, error } = useQuery<Challenge>({
    queryKey: ['challenge', id],
    queryFn: () => api(`/api/challenges/${id}`),
    enabled: !!id,
  });
  const mutation = useMutation({
    mutationFn: (newFlag: { userId: string; flag: string }) => api(`/api/challenges/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(newFlag),
    }),
    onSuccess: (data: { message: string, pointsAwarded: number }) => {
      toast.success(data.message, {
        description: `You've been awarded ${data.pointsAwarded} points!`,
      });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
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
    if (!flag.trim()) {
      toast.warning('Please enter a flag.');
      return;
    }
    mutation.mutate({ userId: MOCK_USER_ID, flag });
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button variant="ghost" onClick={() => navigate('/challenges')} className="mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
          {isLoading && <ChallengeDetailSkeleton />}
          {error && <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>}
          {challenge && (
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="md:col-span-2 space-y-6"
              >
                <h1 className="text-4xl font-display font-bold">{challenge.title}</h1>
                <div className="flex flex-wrap gap-4 items-center text-muted-foreground">
                  <Badge variant="outline" className="text-lg px-4 py-1 border-green-500/50 bg-green-500/10 text-green-400">
                    {challenge.difficulty}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-lg">{challenge.points} Points</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">{challenge.description}</p>
                <div className="flex flex-wrap gap-2">
                  {challenge.tags.map(tag => (
                    <Badge key={tag} variant="secondary"><Tag className="w-3 h-3 mr-1" />{tag}</Badge>
                  ))}
                </div>
                <div className="space-y-4 pt-4">
                  <Button variant="outline" onClick={() => setShowHint(!showHint)}>
                    <Lightbulb className="w-4 h-4 mr-2" /> {showHint ? 'Hide' : 'Show'} Hint
                  </Button>
                  {showHint && (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>Hint</AlertTitle>
                      <AlertDescription>
                        {challenge.hint || 'No hint available for this challenge.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Paperclip className="w-5 h-5" /> Attachments</h3>
                  <p className="text-muted-foreground text-sm">No attachments for this challenge.</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-1 sticky top-24"
              >
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary" /> Submit Flag</CardTitle>
                    <CardDescription>Enter the flag to solve the challenge.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        placeholder="FLAG{...}"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        disabled={mutation.isPending}
                      />
                      <Button type="submit" className="w-full btn-gradient" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                          'Submit'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}