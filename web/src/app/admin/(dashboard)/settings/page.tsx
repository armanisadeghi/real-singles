import Link from "next/link";
import { MessageSquare, Target, Settings, ChevronRight } from "lucide-react";

const configSections = [
  {
    title: "Profile Prompts",
    description: "Manage the prompts users can answer on their profiles",
    href: "/admin/prompts",
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Life Goals",
    description: "Configure life goals users can select for matching",
    href: "/admin/life-goals",
    icon: Target,
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure app-wide settings, prompts, and other options that affect all users.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {configSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {section.title}
                  </h2>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">More settings coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Additional configuration options for notifications, matching algorithms, and more will be added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
