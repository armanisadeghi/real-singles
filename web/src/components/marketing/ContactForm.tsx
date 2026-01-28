"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  mobile: string;
  message: string;
}

export function ContactForm({ onSubmit, className = "" }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    mobile: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default behavior: submit to contact API
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error("Failed to submit");
        }
      }
      
      setSubmitStatus("success");
      setFormData({ name: "", email: "", mobile: "", message: "" });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="name" className="sr-only">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base"
        />
      </div>
      
      <div>
        <label htmlFor="mobile" className="sr-only">
          Mobile No.
        </label>
        <input
          type="tel"
          id="mobile"
          name="mobile"
          placeholder="Mobile No."
          value={formData.mobile}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base"
        />
      </div>
      
      <div>
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-base resize-none"
        />
      </div>
      
      {submitStatus === "success" && (
        <p className="text-green-600 text-sm">Thank you! We&apos;ll be in touch soon.</p>
      )}
      
      {submitStatus === "error" && (
        <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
