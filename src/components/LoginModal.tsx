import { useState } from 'react';
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
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900 dark:bg-white dark:text-gray-900 border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Join the Challenge</DialogTitle>
          <DialogDescription className="bg-white p-3 rounded-md text-gray-900 dark:bg-white dark:text-gray-900 text-sm mt-2">
            Choose a display name to start solving challenges and appear on the scoreboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label 
              htmlFor="name" 
              className="text-sm font-bold text-gray-900 bg-white dark:text-gray-900 dark:bg-white"
            >
              Display Name
            </Label>
            <Input
              id="name"
              placeholder="Your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="bg-white border-gray-300 focus:border-primary/90 focus:ring-primary/50 focus:ring-2 text-gray-900 dark:bg-white dark:border-gray-300 dark:text-gray-900 h-11"
            />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button 
            type="submit" 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-primary/50 focus:border-primary/90 dark:bg-white dark:text-gray-900 dark:border-gray-300 dark:hover:bg-gray-50 font-bold h-11 transition-all"
          >
            {isLoading ? 'Joining...' : 'Join FlagForge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}