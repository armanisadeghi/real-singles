import { createAdminClient } from "@/lib/supabase/admin";
import { runSpecificCheck } from "@/lib/services/data-integrity";
import Link from "next/link";
import {
  ArrowLeft,
  ImageOff,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { AvatarIssuesList } from "./AvatarIssuesList";

async function getAvatarIssues() {
  const supabase = createAdminClient();
  return runSpecificCheck(supabase, "avatars");
}

export default async function AvatarIssuesPage() {
  const data = await getAvatarIssues();

  const missingCount = data.summary.byType.missing_avatar || 0;
  const brokenCount = data.summary.byType.broken_avatar || 0;
  const totalIssues = missingCount + brokenCount;
  const autoFixable = data.issues.filter((i) => i.autoFixable).length;
  const noGalleryImages = data.issues.filter(
    (i) => i.details?.hasGalleryImages === false
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/data-integrity"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Avatar & Profile Image Issues
              </h1>
              <p className="text-sm text-gray-500">
                Users with missing or broken profile images
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(data.checkedAt).toLocaleString("en-US", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
          <Link
            href="/admin/data-integrity/avatars"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Missing Avatar</p>
          <p className="text-2xl font-bold text-red-600">{missingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Broken Avatar</p>
          <p className="text-2xl font-bold text-amber-600">{brokenCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Auto-Fixable</p>
          <p className="text-2xl font-bold text-green-600">{autoFixable}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">No Gallery Images</p>
          <p className="text-2xl font-bold text-gray-500">{noGalleryImages}</p>
        </div>
      </div>

      {/* Info Banner */}
      {totalIssues > 0 && autoFixable > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Auto-Fix Available</p>
            <p className="text-sm text-blue-600">
              {autoFixable} of {totalIssues} issues can be automatically fixed
              by syncing profile images from the user&apos;s primary gallery
              photo. Users without any gallery photos will need to upload images
              manually.
            </p>
          </div>
        </div>
      )}

      {/* Issues List */}
      <AvatarIssuesList issues={data.issues} />
    </div>
  );
}
