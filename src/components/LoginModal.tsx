import React, { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900 dark:bg-white dark:text-gray-900 border-gray-200 shadow-2xl p-8 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 text-center font-display">Join Master the Cloud</DialogTitle>
          <DialogDescription className="text-gray-600 text-center text-sm pt-2">
            Create a display name to track your progress and climb the live scoreboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-3">
            <Label
              htmlFor="name"
              className="text-sm font-bold text-gray-900"
            >
              Public Display Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., CyberGhost"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="bg-white border-gray-300 text-gray-900 h-12 focus:ring-primary/50 text-lg rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            {isLoading ? 'Processing...' : 'Start Solving Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}