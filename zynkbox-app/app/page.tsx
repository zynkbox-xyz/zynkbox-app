'use client';

import React, { useState, useEffect } from 'react';
import { supabase, EmailRecord } from '@/lib/supabase';
import Logo from '@/components/Logo';
import AuthModal from '@/components/AuthModal';
import { 
  Inbox, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  User,
  LogOut,
  Plus,
  Lock
} from 'lucide-react';

export default function ZynkBoxApp() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userInboxes, setUserInboxes] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [addingAlias, setAddingAlias] = useState(false);

  // Generate random temporary fallback address
  const generateRandomAddress = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${result}@zynkbox.xyz`;
  };

  // Check auth and load inboxes
  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user's claimed permanent inboxes
        const { data: inboxes } = await supabase
          .from('user_inboxes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (inboxes && inboxes.length > 0) {
          setUserInboxes(inboxes);
          setCurrentEmail(inboxes[0].address);
          return;
        }
      }

      // Fallback to saved local temporary address
      const saved = localStorage.getItem('zynkbox_temp_email');
      if (saved) {
        setCurrentEmail(saved);
      } else {
        const newTemp = generateRandomAddress();
        localStorage.setItem('zynkbox_temp_email', newTemp);
        setCurrentEmail(newTemp);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch emails for current inbox
  const fetchEmails = async (address: string) => {
    if (!address) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('inbox_address', address)
      .order('received_at', { ascending: false });

    if (!error && data) {
      setEmails(data as EmailRecord[]);
      if (selectedEmail) {
        const updated = data.find((e) => e.id === selectedEmail.id);
        if (updated) setSelectedEmail(updated as EmailRecord);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentEmail) return;
    fetchEmails(currentEmail);

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`inbox:${currentEmail}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emails',
          filter: `inbox_address=eq.${currentEmail}`,
        },
        (payload) => {
          setEmails((prev) => [payload.new as EmailRecord, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEmail]);

  // Create new permanent alias (logged in only)
  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim() || !user) return;

    const clean = newAlias.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    const fullAddress = `${clean}@zynkbox.xyz`;

    const { data, error } = await supabase
      .from('user_inboxes')
      .insert({
        user_id: user.id,
        username: clean,
        address: fullAddress,
      })
      .select()
      .single();

    if (!error && data) {
      setUserInboxes([...userInboxes, data]);
      setCurrentEmail(data.address);
      setNewAlias('');
      setAddingAlias(false);
    } else {
      alert(error?.message || 'Error creating address');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserInboxes([]);
    const temp = generateRandomAddress();
    localStorage.setItem('zynkbox_temp_email', temp);
    setCurrentEmail(temp);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('emails').delete().eq('id', id);
    setEmails(emails.filter((m) => m.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f6f8fc] text-[#1f1f1f] font-sans antialiased overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e5e7eb] h-16 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <Logo size={34} />
          {user && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <ShieldCheck size={14} /> Permanent Account
            </span>
          )}
        </div>

        {/* Address & Actions Bar */}
        <div className="flex items-center gap-3">
          {user && userInboxes.length > 0 ? (
            <div className="flex items-center gap-2 bg-[#f0f4f9] rounded-xl px-3 py-1.5 border border-transparent focus-within:border-gray-300">
              <select
                value={currentEmail}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setAddingAlias(true);
                  } else {
                    setCurrentEmail(e.target.value);
                  }
                }}
                className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-gray-800"
              >
                {userInboxes.map((inbox) => (
                  <option key={inbox.id} value={inbox.address}>
                    {inbox.address}
                  </option>
                ))}
                <option value="__add_new__">+ Claim another address...</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#f0f4f9] rounded-xl px-3 py-1.5 border border-transparent">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Temp:</span>
              <span className="text-sm font-semibold text-gray-800">{currentEmail}</span>
            </div>
          )}

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-black text-white hover:bg-neutral-800 transition"
            title="Copy address"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => fetchEmails(currentEmail)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            title="Refresh Inbox"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* User Auth Profile Button */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition border border-red-100"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
            >
              <User size={14} />
              <span>Sign In / Claim Permanent</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Mail App Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#e5e7eb] flex flex-col p-4 shrink-0 hidden md:flex">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#e8f0fe] text-[#1a73e8] rounded-2xl font-medium text-sm">
            <Inbox size={18} />
            <span className="flex-1 font-semibold">Inbox</span>
            <span className="text-xs bg-[#1a73e8] text-white px-2 py-0.5 rounded-full font-bold">
              {emails.length}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3">
              {user ? 'Your Permanent Addresses' : 'Permanent Storage'}
            </div>
            
            {user ? (
              <div className="space-y-1 mt-1">
                {userInboxes.map((ib) => (
                  <button
                    key={ib.id}
                    onClick={() => setCurrentEmail(ib.address)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium truncate transition ${
                      currentEmail === ib.address
                        ? 'bg-gray-100 text-black font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {ib.address}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-2 mt-1">
                <p className="leading-relaxed">
                  Currently using a temporary session. Create an account to permanently keep your address and emails.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-1.5 bg-black text-white text-xs rounded-lg font-medium hover:bg-neutral-800 transition"
                >
                  Create Permanent Inbox
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Email List Column */}
        <div className={`w-full md:w-96 border-r border-[#e5e7eb] bg-white flex flex-col ${selectedEmail ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>{emails.length} {emails.length === 1 ? 'Message' : 'Messages'}</span>
            <span>Auto-synced</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4 text-gray-400">
                <Inbox size={40} className="mb-2 stroke-1" />
                <p className="text-sm font-medium">Waiting for incoming emails...</p>
                <p className="text-xs text-gray-400 mt-1">Send to {currentEmail}</p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer transition hover:bg-[#f2f6fc] ${
                    selectedEmail?.id === email.id ? 'bg-[#e8f0fe]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">
                      {email.sender}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(email.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-800 truncate mb-1">
                    {email.subject || '(No Subject)'}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {email.body_text || 'No text preview'}
                  </div>

                  {email.otp_code && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold">
                      <span>OTP: {email.otp_code}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Reading View */}
        <div className={`flex-1 bg-white flex flex-col ${!selectedEmail ? 'hidden md:flex' : 'flex'}`}>
          {selectedEmail ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Message Header */}
              <div className="p-6 border-b border-[#e5e7eb] flex items-start justify-between">
                <div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="md:hidden text-xs text-blue-600 font-semibold mb-3 block"
                  >
                    ← Back to Inbox
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 leading-snug">
                    {selectedEmail.subject || '(No Subject)'}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">{selectedEmail.sender}</span>
                    <span>•</span>
                    <span>To: {selectedEmail.inbox_address}</span>
                    <span>•</span>
                    <span>{new Date(selectedEmail.received_at).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => deleteEmail(selectedEmail.id, e)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition"
                  title="Delete message"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Highlighted OTP Banner */}
              {selectedEmail.otp_code && (
                <div className="mx-6 mt-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-green-800">
                      Verification Code Detected
                    </div>
                    <div className="text-2xl font-mono font-extrabold text-green-900 tracking-wider mt-0.5">
                      {selectedEmail.otp_code}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEmail.otp_code || '');
                      alert('OTP Copied to Clipboard!');
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    Copy OTP
                  </button>
                </div>
              )}

              {/* Message Body Content */}
              <div className="p-6 flex-1 overflow-y-auto text-sm text-gray-800 leading-relaxed font-normal">
                {selectedEmail.body_html ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} 
                    className="prose max-w-none text-sm"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                    {selectedEmail.body_text || '(Empty email body)'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Inbox size={48} className="stroke-1 mb-3" />
              <h3 className="text-base font-semibold text-gray-700">No email selected</h3>
              <p className="text-xs text-gray-400 mt-1">
                Choose a message from the left list to read its content and view verification codes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Create New Alias Dialog */}
      {addingAlias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">Claim New Permanent Address</h3>
            <p className="text-xs text-gray-500 mb-4">Add another active address under your account.</p>
            <form onSubmit={handleAddAlias} className="space-y-3">
              <div className="flex items-center border rounded-xl px-3 py-2 bg-gray-50">
                <input
                  type="text"
                  placeholder="alias_name"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none font-medium"
                  required
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">@zynkbox.xyz</span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setAddingAlias(false)}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
                >
                  Create Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}