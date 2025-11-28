import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Users, ClipboardList, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, setAdminToken } from '@/lib/api-client';
import type { Challenge, User, ChallengeDifficulty, Submission } from '@shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
const ADMIN_DEMO_TOKEN = 'secret-admin-token';
const challengeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  points: z.coerce.number().int().min(1, 'Points must be at least 1'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Insane']),
  tags: z.string().min(1, 'At least one tag is required'),
  flag: z.string().min(5, 'Flag must be at least 5 characters'),
  hint: z.string().optional(),
});
type ChallengeFormValues = z.infer<typeof challengeSchema>;
type ChallengeWithFlag = Challenge & { flag: string };
function ChallengeDialog({ challenge, onOpenChange, open }: { challenge?: ChallengeWithFlag, onOpenChange: (open: boolean) => void, open: boolean }) {
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
      hint: '',
    },
  });
  useEffect(() => {
    if (challenge) {
      form.reset({
        ...challenge,
        tags: challenge.tags.join(', '),
      });
    } else {
      form.reset();
    }
  }, [challenge, form]);
  const mutation = useMutation({
    mutationFn: (values: ChallengeFormValues) => {
      const payload = { ...values, tags: values.tags.split(',').map(t => t.trim()) };
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
            Fill in the details for the new challenge. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="points" render={({ field }) => (
                <FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="difficulty" render={({ field }) => (
                <FormItem><FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(['Easy', 'Medium', 'Hard', 'Insane'] as ChallengeDifficulty[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="flag" render={({ field }) => (
              <FormItem><FormLabel>Flag</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="hint" render={({ field }) => (
              <FormItem><FormLabel>Hint (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
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
    </Dialog>
  );
}
function ChallengesTab() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithFlag | undefined>(undefined);
  const { data: challenges, isLoading } = useQuery<ChallengeWithFlag[]>({
    queryKey: ['admin-challenges'],
    queryFn: () => api('/api/admin/challenges'),
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
            {challenges?.map(c => (
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
    queryFn: () => api('/api/admin/users'),
  });
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Score</TableHead><TableHead>Solved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
          {users?.map(u => (
            <TableRow key={u.id}>
              <TableCell><code className="font-mono text-sm">{u.id}</code></TableCell>
              <TableCell>{u.name}</TableCell><TableCell>{u.score}</TableCell><TableCell>{u.solvedChallenges.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
function SubmissionsTab() {
    const { data: submissions, isLoading } = useQuery<Submission[]>({
      queryKey: ['admin-submissions'],
      queryFn: () => api('/api/admin/submissions'),
    });
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead><TableHead>Challenge ID</TableHead><TableHead>Points</TableHead><TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
            {submissions?.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.userName}</TableCell>
                <TableCell><code className="font-mono text-sm">{s.challengeId}</code></TableCell>
                <TableCell>{s.pointsAwarded}</TableCell>
                <TableCell>{new Date(s.ts).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
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
        <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-4">Admin Authentication</h1>
          <p className="text-muted-foreground text-center mb-6">Enter the admin token to access the panel.</p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Admin Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            />
            <Button onClick={handleAuth}>Login</Button>
          </div>
          <Alert className="mt-4">
            <AlertTitle>Demo Information</AlertTitle>
            <AlertDescription>
              For this demo, use the token: <code className="font-mono bg-muted px-1 py-0.5 rounded">{ADMIN_DEMO_TOKEN}</code>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-display">Admin Panel</h1>
          </div>
          <Tabs defaultValue="challenges">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="challenges"><ClipboardList className="w-4 h-4 mr-2" />Challenges</TabsTrigger>
              <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>
            <TabsContent value="challenges" className="mt-4"><ChallengesTab /></TabsContent>
            <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
            <TabsContent value="submissions" className="mt-4"><SubmissionsTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}