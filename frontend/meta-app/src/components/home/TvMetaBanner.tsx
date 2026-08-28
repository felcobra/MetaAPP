"use client";

import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── SLIDES DA TV META ────────────────────────────────────────────────────────
//  Gerado automaticamente a partir dos arquivos em public/slides/
//  Formato: slide-01.jpeg até slide-101.jpeg
//
const TOTAL_SLIDES = 101;
const SLIDES: string[] = Array.from(
  { length: TOTAL_SLIDES },
  (_, i) => `/slides/slide-${String(i + 1).padStart(2, "0")}.jpeg`,
);
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_ADVANCE_MS = 4000;

export function TvMetaBanner() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = SLIDES.length;

  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  const openModal = () => {
    setCurrent(0);
    setOpen(true);
  };

  const closeModal = useCallback(() => {
    setOpen(false);
    setPaused(false);
  }, []);

  // Auto-advance a cada 4 segundos (pausa se mouse em cima)
  useEffect(() => {
    if (!open || paused) return;
    timerRef.current = setTimeout(next, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, paused, current, next]);

  // Navegação por teclado
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal, next, prev]);

  // Bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ── Banner Card ───────────────────────────────────────────────────── */}
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
          aria-label="Abrir TV Meta"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-navy-950 transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] active:scale-95"
        >
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </button>
      </div>

      {/* ── Modal Slideshow ───────────────────────────────────────────────── */}
      {open && (
        <div
          className="tv-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="TV Meta – Junho 2026"
        >
          <div
            className="tv-modal"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fechar apresentação"
              className="tv-close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Slide atual */}
            <div className="tv-slide-wrap">
              <img
                key={current}
                src={SLIDES[current]}
                alt={`Slide ${current + 1} de ${total}`}
                className="tv-slide-img"
                draggable={false}
              />
            </div>

            {/* Seta esquerda */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Slide anterior"
              className="tv-arrow tv-arrow-left"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Seta direita */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Próximo slide"
              className="tv-arrow tv-arrow-right"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Nav bar inferior: dots + contador */}
            <div className="tv-nav-bar">
              <div className="tv-dots" role="tablist">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Ir para slide ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(i);
                    }}
                    className={`tv-dot${i === current ? " tv-dot-active" : ""}`}
                  />
                ))}
              </div>
              <span className="tv-counter">
                {current + 1}&thinsp;/&thinsp;{total}
              </span>
            </div>

            {/* Barra de progresso automático */}
            <div className="tv-progress-track" aria-hidden="true">
              <div
                key={`${current}-${paused}`}
                className="tv-progress-fill"
                style={{
                  animationDuration: `${AUTO_ADVANCE_MS}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Estilos scoped ────────────────────────────────────────────────── */}
      <style>{`
        /* Overlay */
        .tv-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(8px);
          animation: tvFadeIn 0.22s ease;
        }
        @keyframes tvFadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* Modal */
        .tv-modal {
          position: relative;
          width: 92vw; max-width: 1100px;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7);
          animation: tvPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: #000;
          display: flex; flex-direction: column;
        }
        @keyframes tvPopIn {
          from { opacity: 0; transform: scale(0.88) translateY(28px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }

        /* Slide */
        .tv-slide-wrap {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #000;
          position: relative;
        }
        .tv-slide-img {
          width: 100%; height: 100%;
          object-fit: contain;
          display: block;
          animation: tvSlideIn 0.32s ease;
          user-select: none;
        }
        @keyframes tvSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0);    }
        }

        /* Setas */
        .tv-arrow {
          position: absolute;
          top: calc(50% - 28px); /* sobe um pouco por causa da nav bar */
          transform: translateY(-50%);
          z-index: 5;
          display: flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          color: #fff; border: none; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .tv-arrow:hover {
          background: rgba(255, 255, 255, 0.28);
          transform: translateY(-50%) scale(1.1);
        }
        .tv-arrow-left  { left: 14px; }
        .tv-arrow-right { right: 14px; }

        /* Nav bar */
        .tv-nav-bar {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 11px 48px;
          background: rgba(0, 0, 0, 0.55);
          position: relative;
          min-height: 44px;
        }
        .tv-dots { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
        .tv-dot {
          width: 8px; height: 8px; border-radius: 50%;
          border: none; cursor: pointer; padding: 0;
          background: rgba(255, 255, 255, 0.3);
          transition: background 0.2s, width 0.25s, border-radius 0.25s, transform 0.2s;
        }
        .tv-dot-active {
          background: #fff;
          width: 24px;
          border-radius: 4px;
        }
        .tv-counter {
          position: absolute; right: 16px;
          font-size: 12px; color: rgba(255, 255, 255, 0.45);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
        }

        /* Barra de progresso */
        .tv-progress-track {
          width: 100%; height: 3px;
          background: rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .tv-progress-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.65);
          animation: tvProgress linear forwards;
          transform-origin: left;
        }
        @keyframes tvProgress {
          from { width: 0% }
          to   { width: 100% }
        }

        /* Botão fechar */
        .tv-close {
          position: absolute; top: 12px; right: 12px; z-index: 10;
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(0, 0, 0, 0.5); color: #fff;
          border: none; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .tv-close:hover { background: rgba(0,0,0,0.85); transform: scale(1.1); }
      `}</style>
    </>
  );
}
