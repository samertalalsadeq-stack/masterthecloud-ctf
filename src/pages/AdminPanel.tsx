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
import { cn } from '@/lib/utils';
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
type ChallengeWithFlag = Challenge & { flag: string };
function ChallengeDialog({ challenge, onOpenChange, open }: { challenge?: ChallengeWithFlag; onOpenChange: (open: boolean) => void; open: boolean; }) {
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
      const payload = {
        ...values,
        points: Number(values.points),
        tags: values.tags.split(',').map((t) => t.trim())
      };
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
      <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 border-gray-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 text-2xl font-bold">{challenge ? 'Edit' : 'Create'} Challenge</DialogTitle>
          <DialogDescription className="text-gray-600">
            Provide the technical details for this capture-the-flag challenge.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField control={form.control} name="title" render={({ field }) =>
              <FormItem>
                <FormLabel className="font-bold text-gray-900">Challenge Title</FormLabel>
                <FormControl><Input className="bg-white border-gray-300 text-gray-900 h-10" placeholder="Web Exploration 101" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            } />
            <FormField control={form.control} name="description" render={({ field }) =>
              <FormItem>
                <FormLabel className="font-bold text-gray-900">Description (Markdown Supported)</FormLabel>
                <FormControl><Textarea className="bg-white border-gray-300 text-gray-900 min-h-[100px]" placeholder="Describe the vulnerability..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            } />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="points" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-bold text-gray-900">Points</FormLabel>
                  <FormControl><Input type="number" className="bg-white border-gray-300 text-gray-900 h-10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <FormField control={form.control} name="difficulty" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-bold text-gray-900">Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-white">
                      {(['Easy', 'Medium', 'Hard', 'Insane'] as ChallengeDifficulty[]).map((d) => <SelectItem key={d} value={d} className="text-gray-900">{d}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              } />
            </div>
            <FormField control={form.control} name="tags" render={({ field }) =>
              <FormItem>
                <FormLabel className="font-bold text-gray-900">Tags (comma-separated)</FormLabel>
                <FormControl><Input className="bg-white border-gray-300 text-gray-900 h-10" placeholder="web, crypto, pwn" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            } />
            <FormField control={form.control} name="flag" render={({ field }) =>
              <FormItem>
                <FormLabel className="font-bold text-gray-900">Correct Flag</FormLabel>
                <FormControl><Input className="bg-white border-gray-300 text-gray-900 h-10 font-mono" placeholder="FLAG{secret}" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            } />
            <FormField control={form.control} name="hint" render={({ field }) =>
              <FormItem>
                <FormLabel className="font-bold text-gray-900">Hint (Optional)</FormLabel>
                <FormControl><Textarea className="bg-white border-gray-300 text-gray-900 h-20" placeholder="Helpful nudge..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            } />
            <DialogFooter className="pt-6 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-600 hover:bg-gray-100">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 rounded-xl shadow-lg shadow-primary/20">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {challenge ? 'Update Challenge' : 'Create Challenge'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
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
      <div className="flex justify-end mb-6">
        <Button onClick={handleAdd} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10">
          <PlusCircle className="w-4 h-4 mr-2" /> Add New Challenge
        </Button>
      </div>
      <div className="border rounded-2xl bg-card/50 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Title</TableHead>
              <TableHead className="font-bold">Points</TableHead>
              <TableHead className="font-bold">Difficulty</TableHead>
              <TableHead className="font-bold">Flag</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading challenges...</TableCell></TableRow>
            ) : challenges?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No challenges created yet.</TableCell></TableRow>
            ) : challenges?.map((c) => (
              <TableRow key={c.id} className="hover:bg-accent/10 transition-colors">
                <TableCell className="font-semibold text-foreground">{c.title}</TableCell>
                <TableCell className="font-bold text-primary">{c.points}</TableCell>
                <TableCell>
                   <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider">
                    {c.difficulty}
                   </span>
                </TableCell>
                <TableCell><code className="font-mono text-xs bg-muted/50 p-1.5 rounded-md border border-border/50">{c.flag}</code></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white text-gray-900 border-gray-200 rounded-2xl p-8">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 text-2xl font-black">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-lg">
                          This will permanently remove <strong>{c.title}</strong> and all associated submission data. This action is irreversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="pt-8">
                        <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100 rounded-xl h-11 px-6 font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11 px-6 font-bold shadow-lg shadow-destructive/20">
                          Permanently Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
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
    const headers = "UserId,Name,Score,SolvedCount,LastSolveTimestamp\n";
    const csv = scoreboard.map((row) => `"${row.userId}","${row.name.replace(/"/g, '""')}",${row.score},${row.solvedCount},${row.lastSolveTs}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `master-the-cloud-scoreboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Scoreboard CSV generated!");
  };
  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={handleExport} variant="outline" className="rounded-xl h-11 px-6"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
      </div>
      <div className="border rounded-2xl bg-card/50 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Player Name</TableHead>
              <TableHead className="font-bold">Total Score</TableHead>
              <TableHead className="font-bold">Captures</TableHead>
              <TableHead className="font-bold text-right">System ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12">Retrieving players...</TableCell></TableRow>
            ) : users?.map((u) => (
              <TableRow key={u.id} className="hover:bg-accent/10">
                <TableCell className="font-bold text-foreground">{u.name}</TableCell>
                <TableCell className="font-black text-primary tabular-nums">{u.score}</TableCell>
                <TableCell>{u.solvedChallenges.length} flags</TableCell>
                <TableCell className="text-right"><code className="font-mono text-[10px] text-muted-foreground uppercase">{u.id.slice(0, 12)}...</code></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
function SubmissionsTab() {
  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ['admin-submissions'],
    queryFn: () => api('/api/admin/submissions')
  });
  return (
    <div className="border rounded-2xl bg-card/50 overflow-hidden backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold">Timestamp</TableHead>
            <TableHead className="font-bold">Player</TableHead>
            <TableHead className="font-bold">Points</TableHead>
            <TableHead className="font-bold text-right">Submission ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="text-center py-12">Loading activity...</TableCell></TableRow>
          ) : (
            submissions?.map(s => (
              <TableRow key={s.id} className="hover:bg-accent/10">
                <TableCell className="text-muted-foreground font-mono text-xs">{new Date(s.ts).toLocaleString()}</TableCell>
                <TableCell className="font-bold text-foreground">{s.userName}</TableCell>
                <TableCell>
                  <span className={cn(
                    "font-bold tabular-nums px-2 py-0.5 rounded-md",
                    s.isFirstBlood ? "bg-yellow-500/10 text-yellow-600" : "bg-green-500/10 text-green-600"
                  )}>
                    +{s.pointsAwarded}{s.isFirstBlood && " 🔥"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-[10px] text-muted-foreground uppercase">{s.id.slice(0, 8)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
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
      name: new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      submissions: i + 1
    })) : [];
  }, [submissions]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <h3 className="text-xl font-bold font-display px-2">Player Distribution</h3>
        <div className="w-full h-80 p-6 border rounded-2xl bg-card/30 backdrop-blur-sm shadow-inner">
          {usersLoading ? <div className="flex items-center justify-center h-full text-muted-foreground">Calculating...</div> :
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={users ? [...users].sort((a, b) => b.score - a.score).slice(0, 10) : []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} tickFormatter={(v) => v.slice(0, 8)} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" fill="#F38020" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
        <h3 className="text-xl font-bold font-display px-2">Platform Velocity</h3>
        <div className="w-full h-80 p-6 border rounded-2xl bg-card/30 backdrop-blur-sm shadow-inner">
          {submissionsLoading ? <div className="flex items-center justify-center h-full text-muted-foreground">Plotting points...</div> :
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="submissions" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#4F46E5' }} />
              </LineChart>
            </ResponsiveContainer>
          }
        </div>
      </motion.div>
    </div>
  );
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
      toast.success('Administrator verified');
    } else {
      setAdminToken(null);
      setIsAuthenticated(false);
      toast.error('Access Denied', { description: 'Invalid administrator token provided.' });
    }
  };
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12 flex flex-col min-h-[70vh]">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="self-start mb-6 group hover:bg-accent/50 transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold">Back to Home</span>
            </Button>
            <div className="flex-grow flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full p-10 border border-border/50 rounded-3xl shadow-2xl bg-card/50 backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-orange" />
                <h1 className="text-3xl font-black text-center mb-2 font-display">Admin Console</h1>
                <p className="text-muted-foreground text-center mb-8 text-sm">Authentication required to manage platform assets.</p>
                <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">X-Admin-Token</Label>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      autoFocus
                      className="h-12 bg-background/50 text-lg rounded-xl border-border/50 focus:ring-primary/20"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 btn-gradient text-lg font-bold rounded-xl shadow-xl shadow-primary/20">
                    Verify Identity
                  </Button>
                </form>
                <Alert className="mt-10 bg-brand-orange/10 border-brand-orange/30 rounded-2xl">
                  <AlertTitle className="text-brand-orange font-black uppercase tracking-tighter text-xs">Evaluation Access</AlertTitle>
                  <AlertDescription className="text-[11px] font-mono mt-1 text-brand-orange/80">
                    Token: {ADMIN_DEMO_TOKEN}
                  </AlertDescription>
                </Alert>
              </motion.div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="group hover:bg-accent/50 transition-all duration-200 rounded-xl"
              >
                <ChevronLeft className="h-5 w-5 mr-1 transition-transform group-hover:-translate-x-1" />
                <span className="font-bold">Exit</span>
              </Button>
              <div>
                <h1 className="text-4xl font-black font-display tracking-tight leading-none">Command <span className="text-gradient">Center</span></h1>
                <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-black">Platform Administration</p>
              </div>
            </div>
          </div>
          <Tabs defaultValue="challenges" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 h-14 p-1.5 bg-muted/30 rounded-2xl border border-border/50 backdrop-blur-sm">
              <TabsTrigger value="challenges" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold"><ClipboardList className="w-4 h-4 mr-2" />Challenges</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
              <TabsTrigger value="submissions" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold"><Activity className="w-4 h-4 mr-2" />Activity</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold"><BarChart2 className="w-4 h-4 mr-2" />Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="challenges" className="mt-0 outline-none"><ChallengesTab /></TabsContent>
            <TabsContent value="users" className="mt-0 outline-none"><UsersTab /></TabsContent>
            <TabsContent value="submissions" className="mt-0 outline-none"><SubmissionsTab /></TabsContent>
            <TabsContent value="analytics" className="mt-0 outline-none"><AnalyticsTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}