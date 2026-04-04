"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  initialData: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.full_name);
  const [phone, setPhone] = useState(initialData.phone);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", userId);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <Input
        label="Nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        label="Correo electrónico"
        type="email"
        value={initialData.email}
        disabled
        hint="El correo no se puede cambiar"
      />
      <Input
        label="Teléfono"
        type="tel"
        placeholder="+57 300 000 0000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button type="submit" size="md" loading={loading}>
        {saved ? "Guardado" : "Guardar cambios"}
      </Button>
    </form>
  );
}
