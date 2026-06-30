import { redirect } from "next/navigation";

// /terminos now lives at /aviso-legal
export default function TerminosPage() {
  redirect("/aviso-legal");
}
