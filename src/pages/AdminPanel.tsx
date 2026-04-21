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
      title: '', description: '', points: 100, difficulty: 'Easy', tags: '', flag: 'FLAG{}', hint: ''
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
      toast.success(`Protocol ${challenge ? 'updated' : 'initialized'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(`System fault: ${err.message}`)
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] overflow-hidden p-0 rounded-3xl">
        <div className="h-2 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-orange" />
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tight">Master the Cloud: {challenge ? 'Edit' : 'New'} Protocol</DialogTitle>
            <DialogDescription className="text-base font-medium">
              Define the tactical parameters for this challenge deployment.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5 max-h-[60vh] overflow-y-auto pr-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-black uppercase tracking-widest text-[11px]">Challenge Identity</FormLabel>
                  <FormControl><Input placeholder="Operation: Cloud Breach" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-black uppercase tracking-widest text-[11px]">Tactical Intel</FormLabel>
                  <FormControl><Textarea className="min-h-[120px]" placeholder="Mission objectives..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="points" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase tracking-widest text-[11px]">Award Credits</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase tracking-widest text-[11px]">Complexity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(['Easy', 'Medium', 'Hard', 'Insane'] as ChallengeDifficulty[]).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="flag" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-black uppercase tracking-widest text-[11px]">Verified Flag Signature</FormLabel>
                  <FormControl><Input className="font-mono" placeholder="FLAG{...}" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="pt-8 border-t flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending} className="font-black px-10 rounded-xl shadow-lg active:scale-95">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {challenge ? 'Save Changes' : 'Initialize Protocol'}
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
      toast.success('Protocol decommissioned');
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    }
  });
  return (
    <div>
      <ChallengeDialog open={isDialogOpen} onOpenChange={setDialogOpen} challenge={selectedChallenge} />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black tracking-tight">Protocol <span className="text-muted-foreground">Registry</span></h2>
        <Button onClick={() => { setSelectedChallenge(undefined); setDialogOpen(true); }} className="rounded-xl h-12 px-6 shadow-xl font-bold">
          <PlusCircle className="w-5 h-5 mr-2" /> New Protocol
        </Button>
      </div>
      <div className="border rounded-3xl bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Title</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Credits</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Difficulty</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-mono text-xs">Accessing storage...</TableCell></TableRow>
            ) : challenges?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-bold py-5">{c.title}</TableCell>
                <TableCell className="font-black text-brand-orange tabular-nums">{c.points}</TableCell>
                <TableCell><Badge variant="outline">{c.difficulty}</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedChallenge(c); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl p-8 border-2">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-3xl font-black text-destructive uppercase">Decommission Protocol</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg pt-2">
                          Are you sure you want to purge <strong>{c.title}</strong>? This action cannot be reversed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="pt-8">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive hover:bg-destructive/90">Confirm Purge</AlertDialogAction>
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
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight mb-8">Active <span className="text-muted-foreground">Operators</span></h2>
      <div className="border rounded-3xl bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Identity</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Score</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Captures</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">ID Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-mono text-xs animate-pulse">Scanning...</TableCell></TableRow>
            ) : users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-black py-5">{u.name}</TableCell>
                <TableCell className="font-black text-brand-indigo text-xl">{u.score}</TableCell>
                <TableCell className="font-bold text-muted-foreground">{u.solvedChallenges.length} flags</TableCell>
                <TableCell className="text-right"><code className="text-[10px] uppercase text-muted-foreground/60">{u.id.slice(0, 14)}...</code></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
      toast.success('Command Center Access Verified');
    } else {
      toast.error('Identity verification failed');
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
              className="self-start mb-8 group bg-accent/20 hover:bg-accent/40 rounded-2xl h-12 font-bold px-6"
            >
              <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              Return Home
            </Button>
            <div className="flex-grow flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full p-12 border rounded-[2.5rem] shadow-2xl bg-card/60 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-orange" />
                <div className="mb-10 text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">Command Center</h1>
                  <p className="text-muted-foreground font-medium">Identify yourself, Administrator.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-6">
                  <Input
                    type="password"
                    placeholder="Verification Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-14 bg-background/50 text-xl rounded-2xl text-center font-mono"
                  />
                  <Button type="submit" className="w-full h-14 btn-gradient text-xl font-black rounded-2xl shadow-2xl">
                    Verify Identity
                  </Button>
                </form>
                <div className="mt-10 p-5 rounded-2xl bg-muted/20 border text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Demo Access</span>
                  <div className="mt-1 font-mono text-xs font-bold text-brand-orange">{EVALUATION_ADMIN_TOKEN}</div>
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
                variant="ghost"
                onClick={() => navigate('/')}
                className="bg-accent/20 hover:bg-accent/40 rounded-2xl h-12 font-bold px-6"
              >
                <ChevronLeft className="h-5 w-5 mr-1" /> Exit Console
              </Button>
              <div>
                <h1 className="text-5xl font-black tracking-tight leading-none mb-2">Master the Cloud: <span className="text-gradient">Command Center</span></h1>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-black">Authorized Ops Active</p>
                </div>
              </div>
            </div>
          </div>
          <Tabs defaultValue="challenges" className="space-y-12">
            <TabsList className="flex w-full h-16 p-2 bg-muted/30 rounded-3xl border backdrop-blur-sm gap-2">
              <TabsTrigger value="challenges" className="flex-1 rounded-2xl font-black uppercase text-sm h-full">
                <ClipboardList className="w-5 h-5 mr-2" />Protocols
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 rounded-2xl font-black uppercase text-sm h-full">
                <Users className="w-5 h-5 mr-2" />Operators
              </TabsTrigger>
            </TabsList>
            <TabsContent value="challenges"><ChallengesTab /></TabsContent>
            <TabsContent value="users"><UsersTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}