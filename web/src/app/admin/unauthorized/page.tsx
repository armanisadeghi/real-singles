import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access the admin portal.
        </p>
        <Link
          href="/admin/login"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
