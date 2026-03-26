import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Users, 
  ClipboardList, 
  Loader2, 
  BarChart2, 
  Download, 
  ChevronLeft,
  Activity
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, setAdminToken } from '@/lib/api-client';
import type { Challenge, User, ChallengeDifficulty, Submission, ScoreboardEntry } from '@shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
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
      <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 dark:bg-white dark:text-gray-900 border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{challenge ? 'Edit' : 'Create'} Challenge</DialogTitle>
          <DialogDescription className="text-gray-600">
            Fill in the details for the challenge. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) =>
              <FormItem><FormLabel className="font-bold text-gray-900">Title</FormLabel><FormControl><Input className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <FormField control={form.control} name="description" render={({ field }) =>
              <FormItem><FormLabel className="font-bold text-gray-900">Description</FormLabel><FormControl><Textarea className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="points" render={({ field }) =>
                <FormItem><FormLabel className="font-bold text-gray-900">Points</FormLabel><FormControl><Input type="number" className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
              } />
              <FormField control={form.control} name="difficulty" render={({ field }) =>
                <FormItem><FormLabel className="font-bold text-gray-900">Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-white">
                      {(['Easy', 'Medium', 'Hard', 'Insane'] as ChallengeDifficulty[]).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              } />
            </div>
            <FormField control={form.control} name="tags" render={({ field }) =>
              <FormItem><FormLabel className="font-bold text-gray-900">Tags (comma-separated)</FormLabel><FormControl><Input className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <FormField control={form.control} name="flag" render={({ field }) =>
              <FormItem><FormLabel className="font-bold text-gray-900">Flag</FormLabel><FormControl><Input className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <FormField control={form.control} name="hint" render={({ field }) =>
              <FormItem><FormLabel className="font-bold text-gray-900">Hint (Optional)</FormLabel><FormControl><Textarea className="bg-white border-gray-300 text-gray-900 focus:ring-primary/50" {...field} /></FormControl><FormMessage /></FormItem>
            } />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-900 hover:bg-gray-100 border border-transparent">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8">
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
      <div className="border rounded-lg bg-card/50">
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
                <TableCell className="font-medium">{c.title}</TableCell><TableCell>{c.points}</TableCell><TableCell>{c.difficulty}</TableCell>
                <TableCell><code className="font-mono text-xs bg-muted p-1 rounded">{c.flag}</code></TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent className="bg-white text-gray-900 dark:bg-white dark:text-gray-900 border-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          This action cannot be undone. This will permanently delete the <strong>{c.title}</strong> challenge and remove it from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold">
                          Delete Challenge
                        </AlertDialogAction>
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
      <div className="border rounded-lg bg-card/50">
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
                <TableCell><code className="font-mono text-xs">{u.id.slice(0, 8)}</code></TableCell>
                <TableCell className="font-medium">{u.name}</TableCell><TableCell className="font-bold text-primary">{u.score}</TableCell><TableCell>{u.solvedChallenges.length}</TableCell>
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
      <div className="border rounded-lg bg-card/50">
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
                  <TableCell><code className="font-mono text-xs">{s.id.slice(0, 8)}</code></TableCell>
                  <TableCell><code className="font-mono text-xs">{s.challengeId.slice(0, 8)}</code></TableCell>
                  <TableCell className="font-medium">{s.userName}</TableCell>
                  <TableCell className="font-bold text-primary">+{s.pointsAwarded}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.ts).toLocaleString()}</TableCell>
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
  const submissionsOverTime = React.useMemo(() => {
    return submissions ? submissions.slice().sort((a, b) => a.ts - b.ts).map((s, i) => ({
      name: new Date(s.ts).toLocaleTimeString(),
      submissions: i + 1
    })) : [];
  }, [submissions]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h3 className="text-xl font-semibold mb-4">User Scores</h3>
        <div className="w-full h-80 p-4 border rounded-lg bg-card/30 backdrop-blur-sm">
          {usersLoading ? <p>Loading chart...</p> :
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={users ? [...users].sort((a, b) => b.score - a.score) : []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#333', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="score" fill="#F38020" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h3 className="text-xl font-semibold mb-4">Submissions Over Time</h3>
        <div className="w-full h-80 p-4 border rounded-lg bg-card/30 backdrop-blur-sm">
          {submissionsLoading ? <p>Loading chart...</p> :
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#333', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="submissions" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
  const navigate = useNavigate();
  const storedToken = useUserStore(s => s.adminToken);
  const login = useUserStore(s => s.login);
  useEffect(() => {
    if (storedToken) {
      setAdminToken(storedToken);
      setIsAuthenticated(true);
    }
  }, [storedToken]);
  const handleAuth = () => {
    if (token.trim() === ADMIN_DEMO_TOKEN.trim()) {
      setAdminToken(token);
      login({ id: 'admin', name: 'Admin', score: 0, solvedChallenges: [] }, true, token);
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
          <div className="py-8 md:py-10 lg:py-12 flex items-center justify-center min-h-[70vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full p-8 border border-border/50 rounded-2xl shadow-2xl bg-card/50 backdrop-blur-md"
            >
              <h1 className="text-3xl font-bold text-center mb-2 font-display">Admin Access</h1>
              <p className="text-muted-foreground text-center mb-8">Secure portal for platform administrators.</p>
              <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Administrator Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter token"
                    value={token}
                    onChange={(e) => { setToken(e.target.value); }}
                    autoFocus={true}
                    className="h-12 bg-background/50"
                  />
                </div>
                <Button type="submit" className="w-full h-12 btn-gradient text-lg font-bold">Login to Panel</Button>
              </form>
              <Alert className="mt-8 bg-primary/5 border-primary/20">
                <AlertTitle className="text-primary font-bold">Demo Mode</AlertTitle>
                <AlertDescription className="text-xs">
                  For this evaluation, use the token: <code className="font-mono bg-primary/10 px-1 py-0.5 rounded text-primary">{ADMIN_DEMO_TOKEN}</code>
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        </div>
      </AppLayout>);
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-accent/50">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-4xl font-bold font-display tracking-tight">Admin <span className="text-primary">Console</span></h1>
            </div>
          </div>
          <Tabs defaultValue="challenges" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="challenges" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><ClipboardList className="w-4 h-4 mr-2" />Challenges</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
              <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Activity className="w-4 h-4 mr-2" />Submissions</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><BarChart2 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="challenges" className="mt-0 outline-none"><ChallengesTab /></TabsContent>
            <TabsContent value="users" className="mt-0 outline-none"><UsersTab /></TabsContent>
            <TabsContent value="submissions" className="mt-0 outline-none"><SubmissionsTab /></TabsContent>
            <TabsContent value="analytics" className="mt-0 outline-none"><AnalyticsTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>);
}