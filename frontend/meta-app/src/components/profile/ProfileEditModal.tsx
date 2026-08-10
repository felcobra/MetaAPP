"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { MeuPerfil } from "@/types/profile";

interface ProfileEditModalProps {
  perfil: MeuPerfil;
  onClose: () => void;
  onSaved: () => void;
}

/** Só os campos que o próprio membro edita — nome, e-mail, cargo e área
 * vêm do RH e não são editáveis por aqui (ver MembroPerfilMetaapp). */
export function ProfileEditModal({ perfil, onClose, onSaved }: ProfileEditModalProps) {
  const [telefone, setTelefone] = useState(perfil.telefone ?? "");
  const [dataNascimento, setDataNascimento] = useState(perfil.dataNascimento ?? "");
  const [fotoUrl, setFotoUrl] = useState(perfil.fotoUrl ?? "");
  const [sobre, setSobre] = useState(perfil.sobre ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil.membroId) return;

    setSalvando(true);
    setErro(null);
    try {
      await apiFetch(`/rh/membros/${perfil.membroId}/perfil`, {
        method: "PATCH",
        body: JSON.stringify({
          telefone: telefone.trim() || null,
          data_nascimento: dataNascimento || null,
          foto_url: fotoUrl.trim() || null,
          destaque_texto: sobre.trim() || null,
        }),
      });
      onSaved();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-5">
          <h2 className="text-xl font-bold text-slate-900">Editar perfil</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="perfil-telefone">Telefone</Label>
            <Input
              id="perfil-telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(21) 90000-0000"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="perfil-nascimento">Data de nascimento</Label>
            <Input
              id="perfil-nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="perfil-foto">Foto (link da imagem)</Label>
            <Input
              id="perfil-foto"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div>
            <Label htmlFor="perfil-sobre">Sobre você</Label>
            <Textarea
              id="perfil-sobre"
              value={sobre}
              onChange={(e) => setSobre(e.target.value)}
              rows={4}
              placeholder="Conte um pouco sobre você…"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
