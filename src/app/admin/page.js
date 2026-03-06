'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AddMemberForm from '@/components/AddMemberForm';
import FamilyTreeGraph from '@/components/FamilyTreeGraph';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (error || profile?.role !== 'admin') {
          console.warn('Access denied: User is not an admin');
          // Optional: Stay on page but show access denied, or redirect to home/login
          // For now, let's redirect to login so they can switch accounts
          router.push('/login');
        } else {
          setProfile(profile);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/login');
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
             Welcome, {profile?.full_name || 'Admin'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <AddMemberForm onMemberAdded={() => setRefreshKey(prev => prev + 1)} />
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Live Family Tree</h2>
          <FamilyTreeGraph refreshTrigger={refreshKey} />
        </div>
      </div>
    </div>
  );
}
