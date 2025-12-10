import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Users, ClipboardList, Loader2, BarChart2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, setAdminToken } from '@/lib/api-client';
import type { Challenge, User, ChallengeDifficulty, Submission, ScoreboardEntry } from '@shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
const ADMIN_DEMO_TOKEN = 'secret-admin-token';
const challengeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  points: z.number().int().min(1, 'Points must be at least 1'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Insane']),
  tags: z.string().min(1, 'At least one tag is required'),
  flag: z.string().min(5, 'Flag must be at least 5 characters'),
  hint: z.string().optional()
});
type ChallengeFormValues = z.infer<typeof challengeSchema>;
type ChallengeWithFlag = Challenge & {flag: string;};
function ChallengeDialog({ challenge, onOpenChange, open }: {challenge?: ChallengeWithFlag;onOpenChange: (open: boolean) => void;open: boolean;}) {
  const queryClient = useQueryClient();
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      points: 100,
      difficulty: 'Easy',
      tags: '',
      flag: 'FLAG{}',
      hint: ''
    }
  });
  useEffect(() => {
    if (open) {
      if (challenge) {
        form.reset({
          ...challenge,
          tags: challenge.tags.join(', ')
        });
      } else {
        form.reset({
          title: '', description: '', points: 100, difficulty: 'Easy', tags: '', flag: 'FLAG{}', hint: ''
        });
      }
    }
  }, [challenge, open, form]);
  const mutation = useMutation({
    mutationFn: (values: ChallengeFormValues) => {
      const payload = { ...values, points: Number(values.points), tags: values.tags.split(',').map((t) => t.trim()) };
      const endpoint = challenge ? `/api/admin/challenges/${challenge.id}` : '/api/admin/challenges';
      const method = challenge ? 'PUT' : 'POST';
      return api(endpoint, { method, body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast.success(`Challenge ${challenge ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(`Failed to ${challenge ? 'update' : 'create'} challenge`, { description: err.message });
    }
  });
  const onSubmit = (values: ChallengeFormValues) => {
    mutation.mutate(values);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{challenge ? 'Edit' : 'Create'} Challenge</DialogTitle>
          <DialogDescription>
            Fill in the details for the challenge. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) =>
            <FormItem><FormLabel className="text-sm font-bold text-foreground">Title</FormLabel><FormControl><Input className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <FormField control={form.control} name="description" render={({ field }) =>
            <FormItem><FormLabel className="text-sm font-bold text-foreground">Description</FormLabel><FormControl><Textarea className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="points" render={({ field }) =>
              <FormItem><FormLabel className="text-sm font-bold text-foreground">Points</FormLabel><FormControl><Input type="number" min="1" placeholder="100" className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
              } />
              <FormField control={form.control} name="difficulty" render={({ field }) =>
              <FormItem><FormLabel className="text-sm font-bold text-foreground">Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(['Easy', 'Medium', 'Hard', 'Insane'] as ChallengeDifficulty[]).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              } />
            </div>
            <FormField control={form.control} name="tags" render={({ field }) =>
            <FormItem><FormLabel className="text-sm font-bold text-foreground">Tags (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., web, crypto, forensics" className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <FormField control={form.control} name="flag" render={({ field }) =>
            <FormItem><FormLabel className="text-sm font-bold text-foreground">Flag</FormLabel><FormControl><Input className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <FormField control={form.control} name="hint" render={({ field }) =>
            <FormItem><FormLabel className="text-sm font-bold text-foreground">Hint (Optional)</FormLabel><FormControl><Textarea placeholder="Optional hint for solvers" className="border-input/80 focus:border-primary/90 focus:ring-primary/50 focus:ring-2" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Challenge
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>);
}
function ChallengesTab() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithFlag | undefined>(undefined);
  const { data: challenges, isLoading } = useQuery<ChallengeWithFlag[]>({
    queryKey: ['admin-challenges'],
    queryFn: () => api('/api/admin/challenges')
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/challenges/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Challenge deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to delete challenge', { description: err.message });
    }
  });
  const handleEdit = (challenge: ChallengeWithFlag) => {
    setSelectedChallenge(challenge);
    setDialogOpen(true);
  };
  const handleAdd = () => {
    setSelectedChallenge(undefined);
    setDialogOpen(true);
  };
  return (
    <div>
      <ChallengeDialog open={isDialogOpen} onOpenChange={setDialogOpen} challenge={selectedChallenge} />
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}><PlusCircle className="w-4 h-4 mr-2" /> Add Challenge</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Points</TableHead><TableHead>Difficulty</TableHead><TableHead>Flag</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
            {challenges?.map((c) =>
            <TableRow key={c.id}>
                <TableCell>{c.title}</TableCell><TableCell>{c.points}</TableCell><TableCell>{c.difficulty}</TableCell>
                <TableCell><code className="font-mono text-sm">{c.flag}</code></TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the challenge.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>);
}
function UsersTab() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api('/api/admin/users')
  });
  const { data: scoreboard } = useQuery<ScoreboardEntry[]>({
    queryKey: ['scoreboard'],
    queryFn: () => api('/api/scoreboard')
  });
  const handleExport = () => {
    if (!scoreboard) {
      toast.error("No scoreboard data to export.");
      return;
    }
    const headers = "userId,name,score,solvedCount,lastSolveTs\n";
    const csv = scoreboard.map((row) => `${row.userId},${row.name},${row.score},${row.solvedCount},${row.lastSolveTs}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv;charset=utf--8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `scoreboard-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Scoreboard exported successfully!");
  };
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleExport} variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Score</TableHead><TableHead>Solved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
            {users?.map((u) =>
            <TableRow key={u.id}>
                <TableCell><code className="font-mono text-sm">{u.id}</code></TableCell>
                <TableCell>{u.name}</TableCell><TableCell>{u.score}</TableCell><TableCell>{u.solvedChallenges.length}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>);
}
function SubmissionsTab() {
  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ['admin-submissions'],
    queryFn: () => api('/api/admin/submissions')
  });
  return (
    <div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Challenge ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : (
              submissions?.map(s => (
                <TableRow key={s.id}>
                  <TableCell><code className="font-mono text-sm">{s.id.slice(0, 8)}...</code></TableCell>
                  <TableCell><code className="font-mono text-sm">{s.challengeId.slice(0, 8)}...</code></TableCell>
                  <TableCell>{s.userName}</TableCell>
                  <TableCell>{s.pointsAwarded}</TableCell>
                  <TableCell>{new Date(s.ts).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
function AnalyticsTab() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api('/api/admin/users')
  });
  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['admin-submissions'],
    queryFn: () => api('/api/admin/submissions')
  });
  const submissionsOverTime = submissions ? submissions.sort((a, b) => a.ts - b.ts).map((s, i) => ({
    name: new Date(s.ts).toLocaleTimeString(),
    submissions: i + 1
  })) : [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h3 className="text-xl font-semibold mb-4">User Scores</h3>
        <div className="w-full h-80 p-4 border rounded-lg">
          {usersLoading ? <p>Loading chart...</p> :
          <ResponsiveContainer width="100%" height="100%">
              <BarChart data={users ? users.sort((a, b) => b.score - a.score) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h3 className="text-xl font-semibold mb-4">Submissions Over Time</h3>
        <div className="w-full h-80 p-4 border rounded-lg">
          {submissionsLoading ? <p>Loading chart...</p> :
          <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          }
        </div>
      </motion.div>
    </div>);
}
export function AdminPanel() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const handleAuth = () => {
    if (token === ADMIN_DEMO_TOKEN) {
      setAdminToken(token);
      setIsAuthenticated(true);
      toast.success('Authentication successful!');
    } else {
      setAdminToken(null);
      setIsAuthenticated(false);
      toast.error('Invalid admin token.');
    }
  };
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg shadow-lg bg-card">
              <h1 className="text-2xl font-bold text-center mb-4">Admin Authentication</h1>
              <p className="text-muted-foreground text-center mb-6">Enter the admin token to access the panel.</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Admin Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
                <Button onClick={handleAuth}>Login</Button>
              </div>
              <Alert className="mt-4">
                <AlertTitle>Demo Information</AlertTitle>
                <AlertDescription>
                  For this demo, use the token: <code className="font-mono bg-muted px-1 py-0.5 rounded">{ADMIN_DEMO_TOKEN}</code>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </AppLayout>);
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-display">Admin Panel</h1>
          </div>
          <Tabs defaultValue="challenges">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="challenges"><ClipboardList className="w-4 h-4 mr-2" />Challenges</TabsTrigger>
              <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="analytics"><BarChart2 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="challenges" className="mt-4"><ChallengesTab /></TabsContent>
            <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
            <TabsContent value="submissions" className="mt-4"><SubmissionsTab /></TabsContent>
            <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>);
}