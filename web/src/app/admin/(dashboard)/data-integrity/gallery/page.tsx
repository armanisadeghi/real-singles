import { createAdminClient } from "@/lib/supabase/admin";
import { runSpecificCheck } from "@/lib/services/data-integrity";
import Link from "next/link";
import { ArrowLeft, Images, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { GalleryIssuesList } from "./GalleryIssuesList";

async function getGalleryIssues() {
  const supabase = createAdminClient();
  return runSpecificCheck(supabase, "gallery");
}

export default async function GalleryIssuesPage() {
  const data = await getGalleryIssues();

  const noPhotos = data.summary.byType.no_gallery_photos || 0;
  const missingPrimary = data.summary.byType.missing_primary_photo || 0;
  const brokenPrimary = data.summary.byType.broken_primary_photo || 0;
  const orphanedRecords = data.summary.byType.orphaned_gallery_record || 0;
  const totalIssues = noPhotos + missingPrimary + brokenPrimary + orphanedRecords;
  const autoFixable = data.issues.filter((i) => i.autoFixable).length;

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
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Images className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gallery & Photo Issues
              </h1>
              <p className="text-sm text-gray-500">
                Gallery integrity and photo management issues
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
            href="/admin/data-integrity/gallery"
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
          <p className="text-sm text-gray-500">No Gallery Photos</p>
          <p className="text-2xl font-bold text-amber-600">{noPhotos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Missing Primary</p>
          <p className="text-2xl font-bold text-amber-600">{missingPrimary}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Broken Primary</p>
          <p className="text-2xl font-bold text-red-600">{brokenPrimary}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Orphaned Records</p>
          <p className="text-2xl font-bold text-gray-600">{orphanedRecords}</p>
        </div>
      </div>

      {/* Info Banner */}
      {autoFixable > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Auto-Fix Available</p>
            <p className="text-sm text-blue-600">
              {autoFixable} issues can be automatically fixed:
            </p>
            <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
              <li>
                <strong>Missing Primary:</strong> First gallery image will be set
                as primary
              </li>
              <li>
                <strong>Broken Primary:</strong> Record deleted, next image
                promoted to primary
              </li>
              <li>
                <strong>Orphaned Records:</strong> Database records with missing
                files will be deleted
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Issues List */}
      <GalleryIssuesList issues={data.issues} />
    </div>
  );
}
