"use client";

import { useState } from "react";
import ChangePasswordModal from "./ChangePasswordModal";

export default function CuentaPasswordBtn() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="cuenta-btn-change-pw" onClick={() => setOpen(true)}>
        Cambiar contraseña
      </button>
      <ChangePasswordModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
