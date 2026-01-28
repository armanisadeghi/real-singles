"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Mail, Send, Users, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
}

interface UserOption {
  id: string;
  email: string;
  display_name: string | null;
}

type RecipientMode = "custom" | "all" | "selected";

export default function AdminEmailPage() {
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("custom");
  const [customEmails, setCustomEmails] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetch("/api/admin/email")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTemplates(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch users when "selected" mode is chosen
  useEffect(() => {
    if (recipientMode === "selected" && users.length === 0) {
      setLoadingUsers(true);
      fetch("/api/admin/users?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setUsers(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [recipientMode, users.length]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.message);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ success: false, msg: "Subject and message are required" });
      return;
    }

    let payload: { subject: string; message: string; to?: string[]; userIds?: string[] } = {
      subject,
      message,
    };

    if (recipientMode === "custom") {
      const emails = customEmails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e.includes("@"));
      
      if (emails.length === 0) {
        setResult({ success: false, msg: "Please enter at least one valid email address" });
        return;
      }
      payload.to = emails;
    } else if (recipientMode === "selected") {
      if (selectedUserIds.length === 0) {
        setResult({ success: false, msg: "Please select at least one user" });
        return;
      }
      payload.userIds = selectedUserIds;
    } else if (recipientMode === "all") {
      // For "all users", we'd need to fetch all user IDs or handle server-side
      setResult({ success: false, msg: "Sending to all users is not yet implemented for safety. Use 'Selected Users' instead." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult({ success: data.success, msg: data.msg });

      if (data.success) {
        // Clear form on success
        setCustomEmails("");
        setSelectedUserIds([]);
        setSubject("");
        setMessage("");
      }
    } catch (error) {
      setResult({ success: false, msg: "Failed to send email" });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Users"
        subtitle="Send emails to users directly from the admin portal"
        variant="hero"
        iconName="zap"
        iconGradient="from-violet-500 to-purple-600"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Email Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipients Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Recipients</h2>
                <p className="text-xs text-slate-500">Choose who receives this email</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Recipient Mode Tabs */}
              <div className="flex gap-2">
                {[
                  { mode: "custom" as const, label: "Custom Emails" },
                  { mode: "selected" as const, label: "Selected Users" },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setRecipientMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recipientMode === mode
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Custom Emails Input */}
              {recipientMode === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Addresses
                  </label>
                  <textarea
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    placeholder="Enter email addresses (one per line or comma-separated)"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Separate multiple emails with commas or new lines
                  </p>
                </div>
              )}

              {/* User Selection */}
              {recipientMode === "selected" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Select Users ({selectedUserIds.length} selected)
                  </label>
                  {loadingUsers ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {user.display_name || "No name"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </label>
                      ))}
                      {users.length === 0 && (
                        <p className="text-sm text-slate-500 py-4 text-center">No users found</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email Content Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Email Content</h2>
                <p className="text-xs text-slate-500">Compose your email message</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={10}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Plain text message. Line breaks will be preserved.
                </p>
              </div>

              {/* Result Message */}
              {result && (
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                    result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">{result.msg}</span>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={loading || !subject.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Templates</h2>
                <p className="text-xs text-slate-500">Quick-start templates</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors group"
                >
                  <p className="text-sm font-medium text-slate-900 group-hover:text-violet-700">
                    {template.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{template.subject}</p>
                </button>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">Loading templates...</p>
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200/50 p-6">
            <h3 className="font-semibold text-violet-900 mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-violet-700">
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-0.5">•</span>
                Keep subject lines clear and concise
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-0.5">•</span>
                Personalize when possible
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-0.5">•</span>
                Test with your own email first
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-0.5">•</span>
                Avoid spam trigger words
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
