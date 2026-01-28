import Link from "next/link";
import { MessageSquare, Target, Settings, ChevronRight, Cog } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const configSections = [
  {
    title: "Profile Prompts",
    description: "Manage the prompts users can answer on their profiles",
    href: "/admin/prompts",
    icon: MessageSquare,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-200",
    hoverBg: "hover:bg-blue-50/50",
  },
  {
    title: "Life Goals",
    description: "Configure life goals users can select for matching",
    href: "/admin/life-goals",
    icon: Target,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-200",
    hoverBg: "hover:bg-emerald-50/50",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="App Settings"
        subtitle="Configure app-wide settings, prompts, and other options that affect all users"
        variant="hero"
        icon={Cog}
        iconGradient="from-slate-600 to-slate-700"
      />

      <div 
        className="grid gap-4 sm:grid-cols-2
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        style={{ transitionDelay: "100ms" }}
      >
        {configSections.map((section, index) => (
          <Link
            key={section.href}
            href={section.href}
            className={`group bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 
              transition-all duration-200
              ${section.hoverBorder} ${section.hoverBg}
              hover:shadow-md`}
            style={{
              animation: `fadeIn 300ms ease-out forwards`,
              animationDelay: `${(index + 1) * 50}ms`,
              opacity: 0,
            }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${section.iconBg} rounded-xl flex items-center justify-center shrink-0
                group-hover:scale-110 transition-transform duration-200`}>
                <section.icon className={`w-6 h-6 ${section.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h2>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div 
        className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        style={{ transitionDelay: "200ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">More settings coming soon</h3>
            <p className="mt-1 text-sm text-slate-500">
              Additional configuration options for notifications, matching algorithms, and more will be added here.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
