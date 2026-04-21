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
  Activity,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, setAdminToken } from '@/lib/api-client';
import type { Challenge, User, ChallengeDifficulty, Submission } from '@shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
const EVALUATION_ADMIN_TOKEN = 'secret-admin-token';
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
        tags: values.tags.split(',').map((t) => t.trim()).filter(Boolean)
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
      toast.error(`Platform error: ${err.message}`);
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-white text-gray-900 border-gray-200 shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="h-2 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-orange" />
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-gray-900 text-3xl font-black tracking-tight">{challenge ? 'Modify' : 'Initialize'} Protocol</DialogTitle>
            <DialogDescription className="text-gray-600 text-base font-medium">
              Define the parameters for this capture-the-flag scenario.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              <FormField control={form.control} name="title" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Identity</FormLabel>
                  <FormControl><Input className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl focus:ring-brand-indigo/20" placeholder="Web Exploration 101" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <FormField control={form.control} name="description" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Intel/Description (Markdown)</FormLabel>
                  <FormControl><Textarea className="bg-gray-50 border-gray-200 text-gray-900 min-h-[120px] rounded-xl focus:ring-brand-indigo/20 leading-relaxed" placeholder="Describe the vulnerability path..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="points" render={({ field }) =>
                  <FormItem>
                    <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Award Weight</FormLabel>
                    <FormControl><Input type="number" className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                } />
                <FormField control={form.control} name="difficulty" render={({ field }) =>
                  <FormItem>
                    <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Complexity Rating</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-white">
                        {(['Easy', 'Medium', 'Hard', 'Insane'] as ChallengeDifficulty[]).map((d) => <SelectItem key={d} value={d} className="text-gray-900 font-bold">{d}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                } />
              </div>
              <FormField control={form.control} name="tags" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Domain Tags (CSV)</FormLabel>
                  <FormControl><Input className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl" placeholder="web, crypto, pwn" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <FormField control={form.control} name="flag" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Verified Flag Content</FormLabel>
                  <FormControl><Input className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl font-mono" placeholder="FLAG{secret_data}" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <FormField control={form.control} name="hint" render={({ field }) =>
                <FormItem>
                  <FormLabel className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Guidance/Hint (Optional)</FormLabel>
                  <FormControl><Textarea className="bg-gray-50 border-gray-200 text-gray-900 h-24 rounded-xl" placeholder="A nudge for the players..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <div className="pt-8 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 font-bold h-12 rounded-xl hover:bg-gray-100">Cancel</Button>
                <Button type="submit" disabled={mutation.isPending} className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-black px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {challenge ? 'Commit Changes' : 'Initialize Protocol'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
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
      toast.success('Challenge decommissioned');
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    },
    onError: (err: Error) => {
      toast.error(`Decommission failure: ${err.message}`);
    }
  });
  return (
    <div>
      <ChallengeDialog open={isDialogOpen} onOpenChange={setDialogOpen} challenge={selectedChallenge} />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black tracking-tight">Challenge <span className="text-muted-foreground">Registry</span></h2>
        <Button onClick={() => { setSelectedChallenge(undefined); setDialogOpen(true); }} className="rounded-xl h-12 px-6 shadow-xl shadow-primary/20 font-bold">
          <PlusCircle className="w-5 h-5 mr-2" /> Initialize New Protocol
        </Button>
      </div>
      <div className="border rounded-3xl bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-2">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Title</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Points</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Difficulty</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Flag Signature</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-mono uppercase tracking-widest text-xs">Accessing encrypted storage...</TableCell></TableRow>
            ) : (challenges ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No challenges active in perimeter.</TableCell></TableRow>
            ) : challenges?.map((c) => (
              <TableRow key={c.id} className="hover:bg-accent/10 transition-colors border-b border-border/50">
                <TableCell className="font-bold text-foreground text-base py-5">{c.title}</TableCell>
                <TableCell className="font-black text-brand-orange tabular-nums">{c.points}</TableCell>
                <TableCell>
                   <Badge variant="outline" className="font-black uppercase tracking-tighter text-[10px] bg-muted/20 border-border/50">
                    {c.difficulty}
                   </Badge>
                </TableCell>
                <TableCell><code className="font-mono text-xs bg-muted/50 p-2 rounded-lg border border-border/50 text-brand-indigo">{c.flag}</code></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-brand-indigo/10 hover:text-brand-indigo" onClick={() => { setSelectedChallenge(c); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl p-8 border-2 border-destructive/20 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-3xl font-black tracking-tighter text-destructive uppercase">Decommission Protocol</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground text-lg leading-relaxed pt-2">
                          Are you certain you wish to purge <strong>{c.title}</strong>? All historical capture data will be permanently erased from the edge.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="pt-8">
                        <AlertDialogCancel className="h-12 rounded-xl px-6 font-bold">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="h-12 rounded-xl px-8 font-black bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all active:scale-95">
                          Confirm Purge
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
  const handleExport = () => {
    if (!users) return;
    const csv = users.map(u => `"${u.id}","${u.name}",${u.score}`).join('\n');
    const blob = new Blob([`ID,Name,Score\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edge-players-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black tracking-tight">Active <span className="text-muted-foreground">Operators</span></h2>
        <Button onClick={handleExport} variant="outline" className="rounded-xl h-12 px-6 border-2 font-bold"><Download className="w-5 h-5 mr-2" /> Snapshot CSV</Button>
      </div>
      <div className="border rounded-3xl bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-2">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Player Credential</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Total Score</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Verified Captures</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Edge Identity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning user nodes...</TableCell></TableRow>
            ) : (users ?? []).map((u) => (
              <TableRow key={u.id} className="hover:bg-accent/10 border-b border-border/50">
                <TableCell className="font-black text-foreground text-base py-5">{u.name}</TableCell>
                <TableCell className="font-black text-brand-indigo text-xl tabular-nums">{u.score}</TableCell>
                <TableCell className="font-bold text-muted-foreground">{u.solvedChallenges.length} flags</TableCell>
                <TableCell className="text-right"><code className="font-mono text-[10px] text-muted-foreground/60 uppercase bg-muted/30 px-2 py-1 rounded-md">{u.id.slice(0, 14)}...</code></TableCell>
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
    <div>
      <h2 className="text-2xl font-black tracking-tight mb-8">Network <span className="text-muted-foreground">Activity</span></h2>
      <div className="border rounded-3xl bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-2">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Timestamp</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Player</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Award</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Event ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-mono text-xs uppercase tracking-widest animate-pulse">Intercepting transmissions...</TableCell></TableRow>
            ) : (
              (submissions ?? []).map(s => (
                <TableRow key={s.id} className="hover:bg-accent/10 border-b border-border/50">
                  <TableCell className="text-muted-foreground font-mono text-xs py-4">{new Date(s.ts).toLocaleString()}</TableCell>
                  <TableCell className="font-black text-foreground">{s.userName}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-black tabular-nums px-2.5 py-1 rounded-lg text-xs uppercase tracking-tighter",
                      s.isFirstBlood ? "bg-brand-orange text-white" : "bg-brand-indigo/10 text-brand-indigo"
                    )}>
                      +{s.pointsAwarded}{s.isFirstBlood && " FIRST BLOOD"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-muted-foreground/60 uppercase">{s.id.slice(0, 8)}</TableCell>
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
    if (!submissions || submissions.length === 0) return [];
    return [...submissions].sort((a, b) => a.ts - b.ts).map((s, i) => ({
      name: new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      submissions: i + 1
    }));
  }, [submissions]);
  const userDistribution = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    return [...users].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [users]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h3 className="text-xl font-black font-display px-2 uppercase tracking-tighter">Global Ranking Distribution</h3>
        <div className="w-full h-96 p-8 border rounded-3xl bg-card/20 backdrop-blur-sm shadow-inner">
          {usersLoading ? <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse font-mono">Synthesizing telemetry...</div> :
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userDistribution}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" fill="#F38020" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <h3 className="text-xl font-black font-display px-2 uppercase tracking-tighter">Capture Velocity (Cumulative)</h3>
        <div className="w-full h-96 p-8 border rounded-3xl bg-card/20 backdrop-blur-sm shadow-inner">
          {submissionsLoading ? <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse font-mono">Tracing temporal data...</div> :
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
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
    if (token.trim()) {
      setAdminToken(token);
      login({ id: 'admin', name: 'Administrator', score: 0, solvedChallenges: [] }, true, token);
      setIsAuthenticated(true);
      toast.success('Administrative session established');
    } else {
      toast.error('Credential required for perimeter access');
    }
  };
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12 flex flex-col min-h-[75vh]">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="self-start mb-8 group hover:bg-accent/50 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold">Return to Master the Cloud</span>
            </Button>
            <div className="flex-grow flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="max-w-md w-full p-12 border border-border/50 rounded-[2.5rem] shadow-2xl bg-card/60 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-orange" />
                <div className="mb-10 text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-black mb-2 font-display tracking-tight">Command Center</h1>
                  <p className="text-muted-foreground font-medium">Verify your administrative authority.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Access Credential</Label>
                    <Input
                      type="password"
                      placeholder="X-Admin-Token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      autoFocus
                      className="h-14 bg-background/50 text-xl rounded-2xl border-border/50 text-center font-mono tracking-widest focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 btn-gradient text-xl font-black rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95">
                    Authorize Session
                  </Button>
                </form>
                <div className="mt-10 p-5 rounded-2xl bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-black uppercase text-[10px] tracking-widest">
                    <Info className="h-3 w-3" /> Security Policy
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Access is logged by IP and timestamp. For production, rotate tokens via <code className="bg-muted px-1 rounded font-mono text-foreground font-bold">wrangler secret put ADMIN_TOKEN</code>.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Demo Identity</span>
                  <code className="text-[10px] font-mono text-brand-orange/80 bg-white px-2 py-0.5 rounded border border-brand-orange/10 font-bold">{EVALUATION_ADMIN_TOKEN}</code>
                </div>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="group hover:bg-accent/50 transition-all duration-200 rounded-2xl h-12 border-2 border-border/50 font-bold px-6"
              >
                <ChevronLeft className="h-5 w-5 mr-1 transition-transform group-hover:-translate-x-1" />
                Exit Console
              </Button>
              <div>
                <h1 className="text-5xl font-black font-display tracking-tight leading-none mb-2">Master the Cloud: <span className="text-gradient">Command Center</span></h1>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-black">Authorized Operations Only</p>
                </div>
              </div>
            </div>
          </div>
          <Tabs defaultValue="challenges" className="space-y-12">
            <TabsList className="flex w-full h-16 p-2 bg-muted/30 rounded-3xl border border-border/50 backdrop-blur-sm overflow-x-auto gap-2">
              <TabsTrigger value="challenges" className="flex-1 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary h-full">
                <ClipboardList className="w-5 h-5 mr-2" />Challenges
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary h-full">
                <Users className="w-5 h-5 mr-2" />Users
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex-1 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary h-full">
                <Activity className="w-5 h-5 mr-2" />Activity
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary h-full">
                <BarChart2 className="w-5 h-5 mr-2" />Insights
              </TabsTrigger>
            </TabsList>
            <TabsContent value="challenges" className="mt-0 focus-visible:outline-none"><ChallengesTab /></TabsContent>
            <TabsContent value="users" className="mt-0 focus-visible:outline-none"><UsersTab /></TabsContent>
            <TabsContent value="submissions" className="mt-0 focus-visible:outline-none"><SubmissionsTab /></TabsContent>
            <TabsContent value="analytics" className="mt-0 focus-visible:outline-none"><AnalyticsTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}