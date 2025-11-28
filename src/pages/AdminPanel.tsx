import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, Users, ClipboardList } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api, setAdminToken } from '@/lib/api-client';
import type { Challenge, User } from '@shared/types';
const ADMIN_DEMO_TOKEN = 'secret-admin-token';
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
            {/* Add Challenge Dialog can go here */}
          </div>
          <Tabs defaultValue="challenges">
            <TabsList>
              <TabsTrigger value="challenges"><ClipboardList className="w-4 h-4 mr-2" />Challenges</TabsTrigger>
              <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
            </TabsList>
            <TabsContent value="challenges">
              <ChallengesTab />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
function ChallengesTab() {
  const { data: challenges, isLoading } = useQuery<(Challenge & { flag: string })[]>({
    queryKey: ['admin-challenges'],
    queryFn: () => api('/api/admin/challenges'),
  });
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button><PlusCircle className="w-4 h-4 mr-2" /> Add Challenge</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Flag</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
            {challenges?.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.title}</TableCell>
                <TableCell>{c.points}</TableCell>
                <TableCell>{c.difficulty}</TableCell>
                <TableCell><code className="font-mono text-sm">{c.flag}</code></TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="icon"><Edit className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
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
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Solved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
          {users?.map(u => (
            <TableRow key={u.id}>
              <TableCell><code className="font-mono text-sm">{u.id}</code></TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.score}</TableCell>
              <TableCell>{u.solvedChallenges.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}