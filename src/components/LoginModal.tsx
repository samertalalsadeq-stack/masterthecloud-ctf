import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import type { User } from '@shared/types';
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [name, setName] = useState('DemoUser');
  const [isLoading, setIsLoading] = useState(false);
  const login = useUserStore(s => s.login);
  const handleLogin = async () => {
    if (!name.trim()) {
      toast.error('Please enter a display name.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await api<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      login(user);
      toast.success(`Welcome, ${user.name}!`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to login', {
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join the Challenge</DialogTitle>
          <DialogDescription>
            Choose a display name to start solving challenges and appear on the scoreboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="name"
            placeholder="Your display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}