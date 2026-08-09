"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileDetailsCard } from "@/components/profile/ProfileDetailsCard";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { Card } from "@/components/ui/Card";
import { normalizarPerfil, statsDoPerfil, type MeuPerfil } from "@/types/profile";

function Esqueleto() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export function ProfileContent() {
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch("/users/me/perfil")
      .then((raw) => {
        if (!cancelado) setPerfil(normalizarPerfil(raw as never));
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : "Não foi possível carregar o perfil.");
        }
      });

    // Evita setState depois que a rota mudou e o componente saiu da tela.
    return () => {
      cancelado = true;
    };
  }, []);

  if (erro) {
    return (
      <Card>
        <h3 className="text-base font-bold text-slate-900">Não foi possível carregar o perfil</h3>
        <p className="mt-1.5 text-sm text-slate-500">{erro}</p>
      </Card>
    );
  }

  if (!perfil) return <Esqueleto />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <ProfileHeaderCard perfil={perfil} stats={statsDoPerfil(perfil)} />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-2">
        <ProfileDetailsCard perfil={perfil} />
        <SecurityCard />
      </div>
    </div>
  );
}
