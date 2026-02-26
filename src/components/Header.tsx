import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-900">CONFUSE.AI</h1>
            <p className="ml-3 text-sm text-slate-500 hidden sm:block">
              Smart learning through confusion detection
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                {profile?.full_name || profile?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
