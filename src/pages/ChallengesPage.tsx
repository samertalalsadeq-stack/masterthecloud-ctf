import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Shield, Trophy, Filter, X } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Challenge, ChallengeDifficulty, PaginatedResponse } from '@shared/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
const difficultyColors: Record<ChallengeDifficulty, string> = {
  Easy: 'bg-green-500 hover:bg-green-600',
  Medium: 'bg-yellow-500 hover:bg-yellow-600',
  Hard: 'bg-red-500 hover:bg-red-600',
  Insane: 'bg-purple-600 hover:bg-purple-700'
};
const ChallengeCard = ({ challenge, index }: { challenge: Challenge; index: number; }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
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
      <CardContent className="flex-grow space-y-4">
        <p className="text-muted-foreground text-sm">{challenge.description}</p>
        {challenge.codeSnippet && (
          <Highlight
            theme={themes.vsDark}
            code={challenge.codeSnippet}
            language={challenge.codeLanguage || 'text'}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={cn(className, "text-sm rounded-md p-3 overflow-x-auto")} style={style}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {challenge.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {tag}
            </Badge>
          ))}
        </div>
        <Button asChild className="w-full btn-gradient">
          <Link to={`/challenges/${challenge.id}`}>
            <Shield className="mr-2 h-4 w-4" /> Solve Challenge
          </Link>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);
const ChallengeSkeleton = () => (
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
    </Card>
  );
export function ChallengesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagInput, setTagInput] = useState(searchParams.get('tags') || '');
  const difficulty = searchParams.get('difficulty') || '';
  const tags = searchParams.get('tags') || '';
  const cursor = searchParams.get('cursor') || '';
  const { data, isLoading, error } = useQuery<PaginatedResponse<Challenge>>({
    queryKey: ['challenges', difficulty, tags, cursor],
    queryFn: () => api('/api/challenges', { params: { difficulty, tags, cursor, limit: 6 } })
  });
  const handleFilterChange = (key: 'difficulty' | 'tags', value: string) => {
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.delete('cursor'); // Reset pagination on filter change
      return prev;
    });
  };
  const clearFilters = () => {
    setTagInput('');
    setSearchParams({});
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold">Challenges</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Test your skills across various domains. Each flag you capture brings you closer to victory.
            </p>
          </motion.div>
          <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 border rounded-lg bg-card/30">
            <div className="flex items-center gap-2 flex-grow">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Filter Challenges</h3>
            </div>
            <Select value={difficulty} onValueChange={(v) => handleFilterChange('difficulty', v)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
                <SelectItem value="Insane">Insane</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tags (e.g. web,crypto)"
              className="w-full md:w-[200px]"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('tags', tagInput)}
            />
            {(difficulty || tags) && (
              <Button variant="ghost" onClick={clearFilters}><X className="w-4 h-4 mr-2" />Clear</Button>
            )}
          </div>
          {error && (
            <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-md">
              Failed to load challenges: {error.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {isLoading && Array.from({ length: 6 }).map((_, i) => <ChallengeSkeleton key={i} />)}
              {data?.items?.map((challenge, i) => (
                <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
              ))}
            </AnimatePresence>
          </div>
          {!isLoading && data?.items?.length === 0 && (
            <div className="text-center col-span-full py-16">
              <h2 className="text-2xl font-semibold">No Challenges Found</h2>
              <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later.</p>
            </div>
          )}
          <div className="flex justify-center mt-12">
            {data?.next && (
              <Button onClick={() => handleFilterChange('cursor', data.next || '')}>
                Load More
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}