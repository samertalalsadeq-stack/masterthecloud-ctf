import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BarChart, ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import type { User as UserType, Challenge } from '@shared/types';
const ProfileSkeleton = () => (
  <div className="grid md:grid-cols-3 gap-8">
    <div className="md:col-span-1">
      <Card>
        <CardHeader className="items-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-32 mt-4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    </div>
    <div className="md:col-span-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
export function ProfilePage() {
  const navigate = useNavigate();
  const userId = useUserStore(s => s.userId);
  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: ['user', userId],
    queryFn: () => api(`/api/users/${userId}`),
    enabled: !!userId,
  });
  const { data: challenges, isLoading: isLoadingChallenges } = useQuery<{items: Challenge[]}>({
    queryKey: ['challenges'],
    queryFn: () => api('/api/challenges', { params: { limit: 100 } }),
  });
  const safeChallenges = challenges?.items ?? [];
  const solvedChallenges = safeChallenges.filter(c => user?.solvedChallenges?.includes(c.id) ?? false);
  if (!userId) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6 group hover:bg-accent/50 transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold">Back to Home</span>
            </Button>
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold">Please Log In</h1>
              <p className="text-muted-foreground mt-2">You need to be logged in to view your Master the Cloud profile.</p>
              <Button asChild className="mt-4">
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  const isLoading = isLoadingUser || isLoadingChallenges;
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 group hover:bg-accent/50 transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold">Back to Home</span>
          </Button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold">Your Profile</h1>
            <p className="mt-2 text-lg text-muted-foreground">Track your progress and celebrate your victories on Master the Cloud.</p>
          </motion.div>
          {isLoading ? <ProfileSkeleton /> : user && (
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-1 space-y-8"
              >
                <Card className="text-center">
                  <CardHeader className="items-center">
                    <Avatar className="h-24 w-24 text-3xl">
                      <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl pt-4">{user.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" disabled>Edit Name (soon)</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5" /> Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-bold text-primary">{user.score} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Challenges Solved</span>
                      <span className="font-bold">{user.solvedChallenges.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Solved Challenges</CardTitle>
                    <CardDescription>A list of all the challenges you have conquered.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Challenge</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {solvedChallenges.length > 0 ? (
                            solvedChallenges.map(challenge => (
                              <TableRow key={challenge.id}>
                                <TableCell className="font-medium">
                                  <Link to={`/challenges/${challenge.id}`} className="hover:underline">
                                    {challenge.title}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{challenge.difficulty}</Badge>
                                </TableCell>
                                <TableCell>{challenge.points}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center h-24">
                                You haven't solved any challenges yet. <Link to="/challenges" className="text-primary hover:underline font-semibold">Get started!</Link>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
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