import { redirect } from "next/navigation";

export default function AdminStoreItemsPage() {
  redirect("/admin/products?tab=store-items");
}
