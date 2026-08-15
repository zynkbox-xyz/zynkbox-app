'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [desiredUsername, setDesiredUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // 1. Sign up the user
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authErr) throw authErr;

        if (authData.user) {
          // 2. Claim their permanent @zynkbox.xyz address
          const cleanUser = desiredUsername.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
          const fullAddress = `${cleanUser}@zynkbox.xyz`;

          const { error: inboxErr } = await supabase.from('user_inboxes').insert({
            user_id: authData.user.id,
            username: cleanUser,
            address: fullAddress,
            is_primary: true,
          });

          if (inboxErr) throw inboxErr;
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
      }
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {isSignUp ? 'Claim Your Permanent Mailbox' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isSignUp ? 'Create an account to keep your custom address forever.' : 'Sign in to access your permanent inbox.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Desired Address</label>
              <div className="flex items-center border rounded-xl px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-black">
                <input
                  type="text"
                  placeholder="yourname"
                  value={desiredUsername}
                  onChange={(e) => setDesiredUsername(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none"
                  required
                />
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">@zynkbox.xyz</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Recovery Email</label>
            <div className="flex items-center border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-black">
              <Mail size={16} className="text-gray-400 mr-2" />
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-sm w-full outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="flex items-center border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-black">
              <Lock size={16} className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm w-full outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Permanent Inbox' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-600 hover:text-black font-medium cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have a permanent address? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}