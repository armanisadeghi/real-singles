import Link from "next/link";
import { 
  MessageSquare, 
  Target, 
  Settings, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Gift
} from "lucide-react";
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

const toolsSections = [
  {
    title: "Data Integrity",
    description: "Monitor and fix data quality issues across user accounts",
    href: "/admin/data-integrity",
    icon: ShieldCheck,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    hoverBorder: "hover:border-teal-200",
    hoverBg: "hover:bg-teal-50/50",
  },
  {
    title: "Algorithm Simulator",
    description: "Test discovery and matching algorithms for any user",
    href: "/admin/algorithm-simulator",
    icon: Zap,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    hoverBorder: "hover:border-purple-200",
    hoverBg: "hover:bg-purple-50/50",
  },
  {
    title: "Reward Products",
    description: "Manage products users can redeem with points",
    href: "/admin/products",
    icon: Gift,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    hoverBorder: "hover:border-rose-200",
    hoverBg: "hover:bg-rose-50/50",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="App Settings"
        subtitle="Configure app-wide settings, tools, and options"
        variant="hero"
        iconName="cog"
        iconGradient="from-slate-600 to-slate-700"
      />

      {/* Configuration Section */}
      <div className="space-y-4">
        <div 
          className="opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Configuration</h2>
          <p className="text-sm text-slate-500">Content and options that affect the user experience</p>
        </div>

        <div 
          className="grid gap-4 sm:grid-cols-2
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "50ms" }}
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
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
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
      </div>

      {/* Tools & Management Section */}
      <div className="space-y-4">
        <div 
          className="opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "100ms" }}
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Tools & Management</h2>
          <p className="text-sm text-slate-500">Advanced tools for testing, monitoring, and managing the platform</p>
        </div>

        <div 
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "150ms" }}
        >
          {toolsSections.map((section, index) => (
            <Link
              key={section.href}
              href={section.href}
              className={`group bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 
                transition-all duration-200
                ${section.hoverBorder} ${section.hoverBg}
                hover:shadow-md`}
              style={{
                animation: `fadeIn 300ms ease-out forwards`,
                animationDelay: `${(index + 3) * 50}ms`,
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
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
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
      </div>

    </div>
  );
}
