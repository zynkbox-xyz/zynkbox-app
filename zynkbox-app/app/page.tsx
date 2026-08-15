'use client';

import Logo from '@/components/Logo';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Inbox,
  Star,
  Clock,
  Send,
  File,
  Trash2,
  Search,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Menu,
  ChevronDown,
  Archive,
  AlertCircle,
  MoreVertical,
  Reply,
  Forward,
  CornerUpLeft,
  Sparkles,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EmailItem {
  id: string;
  sender: string;
  subject: string;
  body_text: string;
  otp_code: string | null;
  received_at: string;
}

export default function GmailStyleInbox() {
  const [address, setAddress] = useState('');
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'starred' | 'trash'>('inbox');
  const [starredIds, setStarredIds] = useState<string[]>([]);

  // Generate or load temporary inbox
  const generateNewInbox = () => {
    const randomUser = Math.random().toString(36).substring(2, 9);
    const newEmail = `${randomUser}@zynkbox.xyz`;
    setAddress(newEmail);
    setEmails([]);
    setSelectedEmail(null);
  };

  useEffect(() => {
    generateNewInbox();
  }, []);

  // Fetch and subscribe to realtime emails
  useEffect(() => {
    if (!address) return;

    const fetchEmails = async () => {
      const { data } = await supabase
        .from('emails')
        .select('*')
        .eq('inbox_address', address)
        .order('received_at', { ascending: false });

      if (data) {
        setEmails(data);
        if (data.length > 0) setSelectedEmail(data[0]);
      }
    };

    fetchEmails();

    const channel = supabase
      .channel(`gmail-inbox-${address}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emails',
          filter: `inbox_address=eq.${address}`,
        },
        (payload) => {
          const newMail = payload.new as EmailItem;
          setEmails((prev) => [newMail, ...prev]);
          setSelectedEmail(newMail);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStarredIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredEmails = emails.filter((mail) => {
    const matchesSearch =
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.body_text.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFolder === 'starred') {
      return matchesSearch && starredIds.includes(mail.id);
    }
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-screen bg-[#f6f8fc] text-[#1f1f1f] font-sans antialiased overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#f6f8fc] border-b border-[#e5e7eb] gap-4 h-16 shrink-0">
        <div className="flex items-center gap-4 min-w-[240px]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 hover:bg-[#e9eef6] rounded-full transition text-[#444746]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size={36} />
        </div>

        {/* Gmail Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative flex items-center bg-[#eaf1fb] focus-within:bg-white focus-within:shadow-md focus-within:border-transparent transition-all rounded-full px-4 py-2.5">
            <Search className="w-4 h-4 text-[#444746] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search in mail and OTPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder-[#444746] text-[#1f1f1f]"
            />
          </div>
        </div>

        {/* Active Address Display & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-[#d3e3fd]/40 border border-[#c2e7ff] rounded-full px-3.5 py-1.5">
            <span className="text-xs font-mono font-medium text-[#001d35]">{address}</span>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-[#c2e7ff] rounded-full text-[#0b57d0] transition"
              title="Copy Address"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={generateNewInbox}
            className="p-2.5 hover:bg-[#e9eef6] rounded-full transition text-[#444746]"
            title="Generate New Address"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Left Navigation Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-60' : 'w-16'
          } flex flex-col justify-between transition-all duration-200 shrink-0 py-2`}
        >
          <div className="space-y-1">
            {/* Compose / Generate Button */}
            <div className="px-2 mb-4">
              <button
                onClick={generateNewInbox}
                className="flex items-center gap-3 bg-[#c2e7ff] hover:shadow-md hover:bg-[#b3ddff] text-[#001d35] font-semibold text-sm px-4 py-3.5 rounded-2xl transition w-full shadow-sm"
              >
                <Sparkles className="w-5 h-5 text-[#0b57d0] shrink-0" />
                {sidebarOpen && <span>New Temp Address</span>}
              </button>
            </div>

            {/* Folder Links */}
            <nav className="space-y-0.5 px-2">
              <button
                onClick={() => setActiveFolder('inbox')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-full text-xs font-medium transition ${
                  activeFolder === 'inbox'
                    ? 'bg-[#d3e3fd] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#eaebef]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Inbox className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span>Inbox</span>}
                </div>
                {sidebarOpen && emails.length > 0 && (
                  <span className="text-[11px] font-bold bg-[#0b57d0] text-white px-2 py-0.2 rounded-full">
                    {emails.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveFolder('starred')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-full text-xs font-medium transition ${
                  activeFolder === 'starred'
                    ? 'bg-[#d3e3fd] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#eaebef]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Star className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span>Starred</span>}
                </div>
                {sidebarOpen && starredIds.length > 0 && (
                  <span className="text-[11px] text-[#444746] font-semibold">
                    {starredIds.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveFolder('trash')}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-xs font-medium transition ${
                  activeFolder === 'trash'
                    ? 'bg-[#d3e3fd] text-[#001d35] font-bold'
                    : 'text-[#444746] hover:bg-[#eaebef]'
                }`}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Trash</span>}
              </button>
            </nav>
          </div>

          {/* Quick Info Box at Sidebar Bottom */}
          {sidebarOpen && (
            <div className="p-3 mx-2 bg-[#f0f4f9] rounded-xl border border-[#e0e3e7] text-[11px] text-[#444746] space-y-1">
              <p className="font-bold text-[#1f1f1f]">⚡ Live Webhook Active</p>
              <p className="text-[10px] leading-tight">Incoming emails appear instantly without reloading.</p>
            </div>
          )}
        </aside>

        {/* Middle Email List Pane */}
        <section className="w-full md:w-[380px] lg:w-[420px] bg-white rounded-2xl shadow-sm border border-[#e5e7eb] flex flex-col shrink-0 overflow-hidden">
          {/* List Controls */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f3f4] bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1f1f1f] capitalize">{activeFolder}</span>
              <span className="text-xs text-[#5e5e5e]">({filteredEmails.length})</span>
            </div>
            <button
              onClick={copyAddress}
              className="text-[11px] text-[#0b57d0] hover:underline font-semibold flex items-center gap-1"
            >
              {copied ? 'Copied' : 'Copy Box Address'}
            </button>
          </div>

          {/* Email Items Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f1f3f4]">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-[#5e5e5e]">
                <Inbox className="w-10 h-10 text-[#c7c7c7] stroke-1 mb-2" />
                <p className="text-xs font-medium">No messages in {activeFolder}</p>
                <p className="text-[11px] text-[#8e8e8e] mt-0.5">
                  Send an email to <span className="font-mono text-[#0b57d0]">{address}</span>
                </p>
              </div>
            ) : (
              filteredEmails.map((mail) => {
                const isSelected = selectedEmail?.id === mail.id;
                const isStarred = starredIds.includes(mail.id);

                return (
                  <div
                    key={mail.id}
                    onClick={() => setSelectedEmail(mail)}
                    className={`flex items-start gap-3 p-3.5 cursor-pointer transition relative ${
                      isSelected
                        ? 'bg-[#e8f0fe] border-l-4 border-[#0b57d0]'
                        : 'hover:bg-[#f6f8fc] bg-white'
                    }`}
                  >
                    {/* Star Icon */}
                    <button
                      onClick={(e) => toggleStar(e, mail.id)}
                      className="mt-0.5 text-[#5e5e5e] hover:text-[#e37400] transition"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : 'stroke-1'
                        }`}
                      />
                    </button>

                    {/* Email Content Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            isSelected ? 'font-bold text-[#0b57d0]' : 'font-semibold text-[#1f1f1f]'
                          }`}
                        >
                          {mail.sender}
                        </p>
                        <span className="text-[10px] text-[#5e5e5e] shrink-0 font-mono ml-2">
                          {new Date(mail.received_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-[#1f1f1f] font-medium truncate">{mail.subject}</p>
                      <p className="text-[11px] text-[#5e5e5e] truncate mt-0.5 line-clamp-1">
                        {mail.body_text}
                      </p>

                      {/* OTP Badge if detected */}
                      {mail.otp_code && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" /> OTP: {mail.otp_code}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Email Preview Detail Pane */}
        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-[#e5e7eb] flex flex-col overflow-hidden">
          {selectedEmail ? (
            <div className="flex flex-col h-full">
              {/* Header Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#f1f3f4] bg-white">
                <div className="flex items-center gap-3 text-[#444746]">
                  <button className="p-2 hover:bg-[#f1f3f4] rounded-full transition" title="Archive">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-[#f1f3f4] rounded-full transition" title="Report spam">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEmails((prev) => prev.filter((m) => m.id !== selectedEmail.id));
                      setSelectedEmail(null);
                    }}
                    className="p-2 hover:bg-[#f1f3f4] rounded-full transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[11px] text-[#5e5e5e]">
                  {new Date(selectedEmail.received_at).toLocaleString()}
                </div>
              </div>

              {/* Email Content Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Subject Line */}
                <div className="flex items-start justify-between">
                  <h1 className="text-xl font-bold text-[#1f1f1f]">{selectedEmail.subject}</h1>
                  <span className="bg-[#f1f3f4] text-[#444746] text-[10px] font-semibold px-2 py-0.5 rounded">
                    Inbox
                  </span>
                </div>

                {/* Sender Info Bar with Avatar */}
                <div className="flex items-center gap-3 border-b border-[#f1f3f4] pb-4">
                  <div className="w-10 h-10 rounded-full bg-[#c2e7ff] text-[#001d35] font-bold flex items-center justify-center text-sm uppercase shrink-0">
                    {selectedEmail.sender.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1f1f1f] truncate">{selectedEmail.sender}</p>
                    <p className="text-[11px] text-[#5e5e5e] truncate">
                      to <span className="font-mono">{address}</span>
                    </p>
                  </div>
                </div>

                {/* Highlighted OTP Banner Card */}
                {selectedEmail.otp_code && (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#dcfce7] text-[#166534] rounded-lg">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                          Security Verification Code
                        </p>
                        <p className="text-2xl font-mono font-black text-[#14532d] tracking-widest">
                          {selectedEmail.otp_code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyOtp(selectedEmail.otp_code!)}
                      className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      {otpCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {otpCopied ? 'Copied' : 'Copy OTP'}
                    </button>
                  </div>
                )}

                {/* Raw Body Text Preview */}
                <div className="text-xs text-[#3c4043] font-normal leading-relaxed whitespace-pre-wrap bg-[#fafafa] p-4 rounded-xl border border-[#eeeeee]">
                  {selectedEmail.body_text}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[#5e5e5e]">
              <div className="w-16 h-16 bg-[#f1f3f4] rounded-full flex items-center justify-center mb-3">
                <Inbox className="w-8 h-8 text-[#8e8e8e] stroke-1" />
              </div>
              <p className="text-sm font-semibold text-[#1f1f1f]">No conversation selected</p>
              <p className="text-xs text-[#5e5e5e] max-w-xs mt-1">
                Select an incoming message from the left to read verification codes and contents.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
const [user, setUser] = useState<any>(null);
const [isAuthOpen, setIsAuthOpen] = useState(false);
const [savedInboxes, setSavedInboxes] = useState<any[]>([]);

useEffect(() => {
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    setUser(user);
    if (user) {
      const { data: inboxes } = await supabase
        .from('user_inboxes')
        .select('*')
        .eq('user_id', user.id);

      if (inboxes && inboxes.length > 0) {
        setSavedInboxes(inboxes);
        setCurrentEmail(inboxes[0].address);
      }
    }
  });
}, []);