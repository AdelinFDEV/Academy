"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import DeleteAccountModal from "./DeleteAccountModal";

export default function CuentaDeleteAccountBtn({ isPremium }: { isPremium: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="cuenta-btn-delete-account" onClick={() => setOpen(true)}>
        <Trash2 size={14} />
        Eliminar cuenta
      </button>
      <DeleteAccountModal open={open} onClose={() => setOpen(false)} isPremium={isPremium} />
    </>
  );
}
