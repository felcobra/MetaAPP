"use client";

import { Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function TvMetaBanner() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openModal = () => setOpen(true);

  const closeModal = useCallback(() => {
    setOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  // Bloquear scroll do body enquanto modal aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Banner Card */}
      <div className="flex min-h-[280px] flex-col justify-between rounded-2xl bg-navy-950 p-8 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
            JUNHO
          </p>
          <h3 className="mt-2 text-3xl font-bold">TV Meta</h3>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Acompanhe o top of membro, os destaques e saiba quem está por trás
            dos principais projetos da empresa.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          aria-label="Assistir TV Meta"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-navy-950 transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] active:scale-95"
        >
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </button>
      </div>

      {/* Modal Overlay */}
      {open && (
        <div
          className="tv-meta-overlay"
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
          aria-label="TV Meta – Junho"
        >
          <div
            className="tv-meta-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fechar vídeo"
              className="tv-meta-close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Vídeo */}
            <video
              ref={videoRef}
              src="/videos/TV-META-JUNHO-2026.mp4"
              controls
              autoPlay
              className="tv-meta-video"
            />
          </div>
        </div>
      )}

      {/* Estilos via <style> para não poluir o CSS global */}
      <style>{`
        .tv-meta-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(6px);
          animation: tvOverlayIn 0.25s ease;
        }

        @keyframes tvOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .tv-meta-modal {
          position: relative;
          width: 90vw;
          max-width: 960px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
          animation: tvModalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes tvModalIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }

        .tv-meta-video {
          display: block;
          width: 100%;
          max-height: 80vh;
          background: #000;
        }

        .tv-meta-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .tv-meta-close:hover {
          background: rgba(0, 0, 0, 0.85);
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}
