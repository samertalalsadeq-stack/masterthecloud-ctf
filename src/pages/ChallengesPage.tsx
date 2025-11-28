import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Shield, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Challenge, ChallengeDifficulty } from '@shared/types';function cn<T = unknown>(...args: unknown[]): T | null {console.warn('cn is not implemented', args);return null as T | null;
}const difficultyColors: Record<ChallengeDifficulty, string> = {
  Easy: 'bg-green-500 hover:bg-green-600',
  Medium: 'bg-yellow-500 hover:bg-yellow-600',
  Hard: 'bg-red-500 hover:bg-red-600',
  Insane: 'bg-purple-600 hover:bg-purple-700'
};
const ChallengeCard = ({ challenge, index }: {challenge: Challenge;index: number;}) =>
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.05 }}>

    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold font-display">{challenge.title}</CardTitle>
          <Badge className={cn('text-white', difficultyColors[challenge.difficulty])}>
            {challenge.difficulty}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2 pt-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{challenge.points} Points</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm">{challenge.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {challenge.tags.map((tag) =>
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {tag}
            </Badge>
        )}
        </div>
        <Button asChild className="w-full btn-gradient">
          <Link to={`/challenges/${challenge.id}`}>
            <Shield className="mr-2 h-4 w-4" /> Solve Challenge
          </Link>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>;

const ChallengeSkeleton = () =>
<Card className="h-full flex flex-col">
    <CardHeader>
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-24 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
    <CardFooter className="flex flex-col items-start gap-4">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>;

export function ChallengesPage() {
  const { data: challenges, isLoading, error } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => api('/api/challenges')
  });
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12">

            <h1 className="text-4xl md:text-5xl font-display font-bold">Challenges</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Test your skills across various domains. Each flag you capture brings you closer to victory.
            </p>
          </motion.div>
          {error &&
          <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-md">
              Failed to load challenges: {error.message}
            </div>
          }
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {isLoading && Array.from({ length: 6 }).map((_, i) => <ChallengeSkeleton key={i} />)}
            {challenges?.map((challenge, i) =>
            <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
            )}
          </div>
          {!isLoading && challenges?.length === 0 &&
          <div className="text-center col-span-full py-16">
              <h2 className="text-2xl font-semibold">No Challenges Available</h2>
              <p className="text-muted-foreground mt-2">Please check back later or contact an administrator.</p>
            </div>
          }
        </div>
      </div>
    </AppLayout>);

}