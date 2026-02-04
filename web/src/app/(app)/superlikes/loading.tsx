import { Loader2 } from "lucide-react";

export default function SuperLikesLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
    </div>
  );
}
