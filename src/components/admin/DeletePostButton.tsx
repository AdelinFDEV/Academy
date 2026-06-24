"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres borrar esta entrada?")) return;
    await supabase.from("posts").delete().eq("id", id);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="action-btn delete">
      Borrar
    </button>
  );
}
