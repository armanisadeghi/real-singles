import { redirect } from "next/navigation";

// Redirect /chats to /messages - the canonical messages route
// Individual chats still use /chats/[id] for the immersive chat experience
export default function ChatsPage() {
  redirect("/messages");
}
