import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Shield, Trophy, Filter, X, RefreshCcw, ChevronLeft } from 'lucide-react';
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
        <p className="text-muted-foreground text-sm leading-relaxed">{challenge.description}</p>
        {challenge.codeSnippet && (
          <Highlight
            theme={themes.vsDark}
            code={challenge.codeSnippet}
            language={challenge.codeLanguage || 'text'}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={cn(className, "text-sm rounded-xl p-4 overflow-x-auto bg-gray-900/80 border border-white/5")} style={style}>
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
      <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t border-border/10">
        <div className="flex flex-wrap gap-2">
          {challenge.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 px-2 py-0.5 rounded-md">
              <Tag className="w-3 h-3" /> {tag}
            </Badge>
          ))}
        </div>
        <Button asChild className="w-full btn-gradient h-11 rounded-xl">
          <Link to={`/challenges/${challenge.id}`}>
            <Shield className="mr-2 h-4 w-4" /> Start Challenge
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
      <Skeleton className="h-11 w-full" />
    </CardFooter>
  </Card>
);
export function ChallengesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagInput, setTagInput] = useState(searchParams.get('tags') || '');
  const difficulty = searchParams.get('difficulty') || '';
  const tags = searchParams.get('tags') || '';
  const cursor = searchParams.get('cursor') || '';
  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Challenge>>({
    queryKey: ['challenges', difficulty, tags, cursor],
    queryFn: () => api('/api/challenges', { params: { difficulty, tags, cursor, limit: 6 } }),
    staleTime: 30000,
  });
  const handleFilterChange = (key: 'difficulty' | 'tags', value: string) => {
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.delete('cursor');
      return prev;
    });
  };
  const clearFilters = () => {
    setTagInput('');
    setSearchParams((prev) => {
      prev.delete('difficulty');
      prev.delete('tags');
      prev.delete('cursor');
      return prev;
    });
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8 group hover:bg-accent/50 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold">Back to Home</span>
          </Button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-tight">Master the <span className="text-gradient">Cloud</span></h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Validate your cybersecurity expertise through real-world scenarios deployed globally at the Cloudflare edge.
            </p>
          </motion.div>
          <div className="flex flex-col md:flex-row gap-4 mb-12 p-6 border rounded-2xl bg-card/20 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 flex-grow">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Filter className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Challenge Selection</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={difficulty || 'all'} onValueChange={(v) => handleFilterChange('difficulty', v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Insane">Insane</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="Filter by tags..."
                  className="w-full sm:w-[240px] h-11 rounded-xl"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('tags', tagInput)}
                />
                <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl" onClick={() => handleFilterChange('tags', tagInput)}>
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>
              {(difficulty || tags) && (
                <Button variant="ghost" className="h-11 px-4 rounded-xl" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />Clear
                </Button>
              )}
            </div>
          </div>
          {error && (
            <div className="text-center space-y-4 p-12 border-2 border-destructive/20 bg-destructive/5 rounded-3xl mb-12">
              <p className="text-destructive font-bold text-xl">Operational Desynchronization</p>
              <p className="text-muted-foreground">{error.message}</p>
              <Button onClick={() => refetch()} variant="outline" className="rounded-xl h-11 px-8 font-bold">Retry Connection</Button>
            </div>
          )}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {Array.from({ length: 6 }).map((_, i) => <ChallengeSkeleton key={i} />)}
                </motion.div>
              ) : data?.items?.length ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {data.items.map((challenge, i) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-3xl bg-muted/10 text-center"
                >
                  <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-3xl font-black mb-3 font-display tracking-tight">Perimeter Uncharted</h2>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8 font-medium">
                    Our sensors detect no challenges matching these protocols. Adjust your filters to scan a wider range.
                  </p>
                  <Button onClick={clearFilters} variant="secondary" className="h-12 px-8 rounded-xl font-bold text-lg shadow-sm">Reset Scanning Protocols</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-center mt-16">
            {data?.next && (
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-2xl text-xl font-black border-2 hover:bg-accent/50 transition-all active:scale-95"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('cursor', data.next || '');
                  setSearchParams(newParams);
                }}
              >
                Scan More Sectors
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}