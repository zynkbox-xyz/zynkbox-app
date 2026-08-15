'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, X, AtSign } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    const fullAddress = `${cleanUser}@zynkbox.xyz`;

    try {
      if (isSignUp) {
        // Direct signup without external email confirmation
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: fullAddress,
          password: password,
        });
        if (authErr) throw authErr;

        if (authData.user) {
          // Register permanent inbox record
          const { error: inboxErr } = await supabase.from('user_inboxes').insert({
            user_id: authData.user.id,
            username: cleanUser,
            address: fullAddress,
            is_primary: true,
          });

          if (inboxErr) throw inboxErr;
        }
      } else {
        // Direct login using full mailbox address and password
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: fullAddress,
          password: password,
        });
        if (signInErr) throw signInErr;
      }

      onClose();
      window.location.reload();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {isSignUp ? 'Create Permanent Mailbox' : 'Mailbox Login'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isSignUp 
            ? 'Set a custom address and password for immediate access.' 
            : 'Enter your mailbox address and password.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mailbox Address</label>
            <div className="flex items-center border rounded-xl px-3 py-2.5 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-black">
              <AtSign size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="client_name"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace('@zynkbox.xyz', ''))}
                className="bg-transparent text-sm w-full outline-none font-medium"
                required
              />
              <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">@zynkbox.xyz</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="flex items-center border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-black">
              <Lock size={16} className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm w-full outline-none font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Mailbox Instantly' : 'Access Mailbox'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-600 hover:text-black font-medium cursor-pointer"
          >
            {isSignUp ? 'Already have an inbox? Sign In' : 'Need a new permanent inbox? Create One'}
          </button>
        </div>
      </div>
    </div>
  );
}