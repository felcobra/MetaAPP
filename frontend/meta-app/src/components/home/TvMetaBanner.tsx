"use client";

import {
  Film,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, apiUpload, apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { VideoTv } from "@/types/tv-meta";

// ─── TV META ─────────────────────────────────────────────────────────────────
//  A Home exibe um único vídeo MP4 rodando em loop, servido por
//  GET /tv-meta/video/stream com suporte a Range (o navegador baixa só o
//  trecho que está tocando). Quem tem role "admin" troca o arquivo pela
//  própria interface — nada aqui precisa mudar quando sai uma edição nova.
// ─────────────────────────────────────────────────────────────────────────────

/** Só admin publica uma edição nova da TV Meta. */
const ROLE_ADMIN = "admin";

/** Quanto os botões de avançar/voltar pulam. */
const SALTO_SEGUNDOS = 5;

/** Tempo parado até os controles sumirem de cima do vídeo. */
const OCULTAR_CONTROLES_MS = 2600;

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace(".", ",")} GB`;
  return `${mb.toFixed(1).replace(".", ",")} MB`;
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TvMetaBanner() {
  const { user } = useAuth();
  const podeTrocar = user?.role === ROLE_ADMIN;

  const [video, setVideo] = useState<VideoTv | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [assistindo, setAssistindo] = useState(false);
  const [trocando, setTrocando] = useState(false);

  // ── Estado do player do card ───────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressoRef = useRef<HTMLDivElement>(null);
  const controlesRef = useRef<HTMLDivElement>(null);
  const ocultarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pausa pedida no botão é diferente de pausa automática (aba em background,
  // card fora da tela): a primeira tem que sobreviver à volta da pessoa.
  const pausadoPeloUsuario = useRef(false);
  const tempoAoAbrirRef = useRef(0);

  const [tocando, setTocando] = useState(false);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const [noViewport, setNoViewport] = useState(false);
  const [abaVisivel, setAbaVisivel] = useState(true);

  useEffect(() => {
    let cancelado = false;

    apiFetch<VideoTv>("/tv-meta/video")
      .then((dados) => {
        if (!cancelado) setVideo(dados);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setErro(
            e instanceof Error ? e.message : "Não foi possível carregar a TV Meta.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const disponivel = Boolean(video?.disponivel && video.stream_url);
  const srcVideo = video?.stream_url ? apiUrl(video.stream_url) : "";

  // ── Controles que somem sozinhos ───────────────────────────────────────────
  // Qualquer sinal de presença (mouse, toque, foco no teclado) traz os botões
  // de volta e reinicia a contagem. Com o vídeo pausado eles ficam.
  const revelarControles = useCallback(() => {
    setControlesVisiveis(true);
    if (ocultarRef.current) clearTimeout(ocultarRef.current);
    ocultarRef.current = setTimeout(() => {
      const elemento = videoRef.current;
      const temFoco = controlesRef.current?.contains(document.activeElement);
      if (elemento && !elemento.paused && !temFoco) setControlesVisiveis(false);
    }, OCULTAR_CONTROLES_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (ocultarRef.current) clearTimeout(ocultarRef.current);
    };
  }, []);

  // ── Loop automático, mas só quando alguém pode ver ─────────────────────────
  // Sem isso o vídeo ficaria baixando megabytes numa aba de background ou com
  // o card fora da tela.
  useEffect(() => {
    const elemento = videoRef.current;
    if (!elemento || !disponivel) return;

    const observador = new IntersectionObserver(
      ([entrada]) => setNoViewport(entrada.isIntersecting),
      { threshold: 0.25 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [disponivel]);

  useEffect(() => {
    const aoMudarVisibilidade = () => setAbaVisivel(!document.hidden);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () =>
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, []);

  useEffect(() => {
    const elemento = videoRef.current;
    if (!elemento || !disponivel) return;

    const deveTocar =
      noViewport && abaVisivel && !assistindo && !pausadoPeloUsuario.current;

    if (deveTocar) {
      // Autoplay bloqueado pelo navegador não é erro: o card fica no primeiro
      // quadro com o botão de play à mostra.
      void elemento.play().catch(() => undefined);
    } else if (!elemento.paused) {
      elemento.pause();
    }
  }, [disponivel, noViewport, abaVisivel, assistindo]);

  // ── Ações dos botões ───────────────────────────────────────────────────────
  const alternarPlay = useCallback(() => {
    const elemento = videoRef.current;
    if (!elemento) return;

    if (elemento.paused) {
      pausadoPeloUsuario.current = false;
      void elemento.play().catch(() => undefined);
    } else {
      pausadoPeloUsuario.current = true;
      elemento.pause();
    }
    revelarControles();
  }, [revelarControles]);

  const pular = useCallback(
    (segundos: number) => {
      const elemento = videoRef.current;
      if (!elemento) return;

      const duracao = Number.isFinite(elemento.duration) ? elemento.duration : 0;
      const alvo = elemento.currentTime + segundos;
      // Fica dentro do vídeo em vez de dar a volta: perto do fim, avançar leva
      // ao último instante, e o loop segue normalmente a partir dali.
      elemento.currentTime = duracao
        ? Math.min(Math.max(alvo, 0), Math.max(duracao - 0.15, 0))
        : Math.max(alvo, 0);
      revelarControles();
    },
    [revelarControles],
  );

  // A barra de progresso é escrita direto no DOM: o timeupdate dispara umas 4
  // vezes por segundo e não vale um re-render do card a cada tique.
  const aoAvancarTempo = useCallback(() => {
    const elemento = videoRef.current;
    const barra = progressoRef.current;
    if (!elemento || !barra || !elemento.duration) return;
    barra.style.width = `${(elemento.currentTime / elemento.duration) * 100}%`;
  }, []);

  const abrirTelaCheia = useCallback(() => {
    tempoAoAbrirRef.current = videoRef.current?.currentTime ?? 0;
    setAssistindo(true);
  }, []);

  const fecharPlayer = useCallback(() => setAssistindo(false), []);

  // Esc fecha o player
  useEffect(() => {
    if (!assistindo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharPlayer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assistindo, fecharPlayer]);

  // Bloqueia o scroll do body enquanto um modal está aberto
  useEffect(() => {
    const aberto = assistindo || trocando;
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [assistindo, trocando]);

  const legendaArquivo = [
    video?.nome_arquivo,
    formatarTamanho(video?.tamanho_bytes ?? null),
    video?.atualizado_em ? `atualizado em ${formatarData(video.atualizado_em)}` : "",
    video?.atualizado_por ? `por ${video.atualizado_por}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const classeControles = `tv-banner-controles${
    controlesVisiveis ? "" : " tv-banner-controles-ocultos"
  }`;

  return (
    <>
      {/* ── Card da Home ───────────────────────────────────────────────────── */}
      <div className="tv-banner" role="region" aria-label="TV Meta">
        <div
          className="tv-banner-stage"
          onMouseMove={revelarControles}
          onTouchStart={revelarControles}
        >
          {carregando ? (
            <div className="tv-banner-empty">Carregando a TV Meta…</div>
          ) : erro ? (
            <div className="tv-banner-empty">{erro}</div>
          ) : disponivel ? (
            <video
              ref={videoRef}
              key={srcVideo}
              className="tv-banner-media"
              // O `#t=0.1` garante um quadro visível mesmo se o navegador
              // bloquear o autoplay, em vez de um retângulo preto.
              src={`${srcVideo}#t=0.1`}
              autoPlay
              loop
              // Autoplay só é permitido sem som — o áudio fica para a tela
              // cheia, onde a pessoa escolhe assistir.
              muted
              playsInline
              preload="metadata"
              tabIndex={-1}
              aria-hidden="true"
              onPlay={() => {
                setTocando(true);
                revelarControles();
              }}
              onPause={() => {
                setTocando(false);
                setControlesVisiveis(true);
                if (ocultarRef.current) clearTimeout(ocultarRef.current);
              }}
              onTimeUpdate={aoAvancarTempo}
            />
          ) : (
            <div className="tv-banner-empty">
              <Film className="h-7 w-7 opacity-60" aria-hidden="true" />
              <span>Nenhum vídeo publicado ainda.</span>
              {podeTrocar && <span>Envie a edição atual para começar.</span>}
            </div>
          )}

          {/* Véu discreto nas bordas, para os selos ficarem legíveis */}
          <div className="tv-banner-veil" aria-hidden="true" />

          {/* Identidade fica sempre à mostra — não é controle */}
          <span className="tv-banner-badge">
            <span className="tv-banner-badge-dot" aria-hidden="true" />
            TV Meta
          </span>

          {/* Camada dos controles: some sozinha com o vídeo rodando e volta ao
              primeiro sinal de mouse, toque ou foco de teclado. */}
          <div
            ref={controlesRef}
            className={classeControles}
            onFocusCapture={revelarControles}
            onMouseEnter={revelarControles}
          >
            {podeTrocar && (
              <button
                type="button"
                onClick={() => setTrocando(true)}
                className="tv-banner-admin"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                {disponivel ? "Trocar vídeo" : "Enviar vídeo"}
              </button>
            )}

            {disponivel && (
              <>
                <button
                  type="button"
                  onClick={() => pular(-SALTO_SEGUNDOS)}
                  aria-label={`Voltar ${SALTO_SEGUNDOS} segundos`}
                  className="tv-banner-skip tv-banner-skip-left"
                >
                  <RotateCcw className="h-6 w-6" aria-hidden="true" />
                  <span className="tv-banner-skip-num" aria-hidden="true">
                    {SALTO_SEGUNDOS}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => pular(SALTO_SEGUNDOS)}
                  aria-label={`Avançar ${SALTO_SEGUNDOS} segundos`}
                  className="tv-banner-skip tv-banner-skip-right"
                >
                  <RotateCw className="h-6 w-6" aria-hidden="true" />
                  <span className="tv-banner-skip-num" aria-hidden="true">
                    {SALTO_SEGUNDOS}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={abrirTelaCheia}
                  aria-label="Assistir em tela cheia, com som"
                  className="tv-banner-expandir"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={alternarPlay}
                  aria-label={tocando ? "Pausar vídeo" : "Reproduzir vídeo"}
                  className="tv-banner-play"
                >
                  {tocando ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progresso do vídeo — mesma faixa que o carrossel ocupava */}
        <div className="tv-banner-track" aria-hidden="true">
          <div ref={progressoRef} className="tv-banner-fill" />
        </div>

        {/* Texto fora do vídeo — nada bloqueia a imagem */}
        <div className="tv-banner-caption">
          <h3 className="tv-banner-title">TV Meta</h3>
          <p className="tv-banner-desc">
            Acompanhe o top of membro, os destaques e saiba quem está por trás
            dos principais projetos da empresa.
          </p>
          {legendaArquivo && <p className="tv-banner-meta">{legendaArquivo}</p>}
        </div>
      </div>

      {/* ── Player em tela cheia ───────────────────────────────────────────── */}
      {assistindo && disponivel && (
        <div
          className="tv-overlay"
          onClick={fecharPlayer}
          role="dialog"
          aria-modal="true"
          aria-label="TV Meta — player"
        >
          <div className="tv-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={fecharPlayer}
              aria-label="Fechar player"
              className="tv-close"
            >
              <X className="h-5 w-5" />
            </button>

            <video
              className="tv-player"
              src={srcVideo}
              controls
              autoPlay
              playsInline
              preload="auto"
              // Continua de onde o card estava, em vez de voltar ao início
              onLoadedMetadata={(e) => {
                e.currentTarget.currentTime = tempoAoAbrirRef.current;
              }}
            />
          </div>
        </div>
      )}

      {/* ── Modal de troca do vídeo (admin) ────────────────────────────────── */}
      {trocando && podeTrocar && (
        <TrocarVideoModal
          limiteMb={video?.limite_upload_mb ?? 500}
          onFechar={() => setTrocando(false)}
          onEnviado={(novo) => {
            pausadoPeloUsuario.current = false;
            setVideo(novo);
            setTrocando(false);
          }}
        />
      )}

      {/* ── Estilos scoped ─────────────────────────────────────────────────── */}
      <style>{`
        .tv-banner {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
          background: #0b1120;
          color: #fff;
        }

        /* Palco do vídeo: 16/9 limpo */
        .tv-banner-stage {
          position: relative;
          aspect-ratio: 16 / 9;
          min-height: 220px;
          overflow: hidden;
          background: #060c1a;
        }
        .tv-banner-media {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        .tv-banner-empty {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px;
          padding: 0 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(226, 232, 240, 0.6);
        }

        /* Sombra suave apenas nas bordas superior/inferior */
        .tv-banner-veil {
          position: absolute; inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to bottom,
              rgba(6, 12, 26, 0.55) 0%,
              rgba(6, 12, 26, 0.16) 14%,
              rgba(6, 12, 26, 0) 30%),
            linear-gradient(to top,
              rgba(6, 12, 26, 0.5) 0%,
              rgba(6, 12, 26, 0.12) 12%,
              rgba(6, 12, 26, 0) 26%);
        }

        /* Selo de identificação (vidro) */
        .tv-banner-badge {
          position: absolute; top: 14px; left: 14px; z-index: 4;
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(255, 255, 255, 0.94);
          background: rgba(6, 12, 26, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
        }
        .tv-banner-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #60a5fa;
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.9);
          animation: tvBannerPulse 2s ease-in-out infinite;
        }
        @keyframes tvBannerPulse {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%      { opacity: 0.4; transform: scale(0.8); }
        }

        /* Camada dos controles: a camada não intercepta o mouse, só os botões */
        .tv-banner-controles {
          position: absolute; inset: 0; z-index: 3;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.28s ease;
        }
        .tv-banner-controles > * { pointer-events: auto; }
        .tv-banner-controles-ocultos { opacity: 0; }
        .tv-banner-controles-ocultos > * { pointer-events: none; }

        /* Ação de admin: discreta, no canto oposto ao selo */
        .tv-banner-admin {
          position: absolute; top: 14px; right: 14px;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(6, 12, 26, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .tv-banner-admin:hover {
          background: rgba(6, 12, 26, 0.72);
          color: #fff;
        }

        /* Voltar / avançar 5 segundos */
        .tv-banner-skip {
          position: absolute; top: 50%;
          transform: translateY(-50%);
          display: flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 50%;
          cursor: pointer;
          color: #fff;
          background: rgba(6, 12, 26, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .tv-banner-skip:hover {
          background: rgba(6, 12, 26, 0.72);
          transform: translateY(-50%) scale(1.08);
        }
        .tv-banner-skip:active { transform: translateY(-50%) scale(0.94); }
        .tv-banner-skip:focus-visible {
          outline: 2px solid rgba(147, 197, 253, 0.9);
          outline-offset: 2px;
        }
        .tv-banner-skip-left  { left: 14px; }
        .tv-banner-skip-right { right: 14px; }
        /* O "5" no meio da seta circular, como nos players de vídeo */
        .tv-banner-skip-num {
          position: absolute;
          font-size: 9px; font-weight: 700;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        /* Tela cheia, ao lado do play */
        .tv-banner-expandir {
          position: absolute; bottom: 20px; right: 74px;
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          cursor: pointer;
          color: #fff;
          background: rgba(6, 12, 26, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .tv-banner-expandir:hover {
          background: rgba(6, 12, 26, 0.72);
          transform: scale(1.08);
        }

        /* Play / pause */
        .tv-banner-play {
          position: absolute; bottom: 14px; right: 14px;
          display: flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; border-radius: 50%;
          border: none; cursor: pointer;
          background: rgba(255, 255, 255, 0.92);
          color: #0b1120;
          box-shadow: 0 8px 24px rgba(3, 7, 18, 0.45);
          transition: transform 0.2s ease, box-shadow 0.2s ease,
                      background 0.2s ease;
        }
        .tv-banner-play:hover {
          transform: scale(1.09);
          background: #fff;
          box-shadow: 0 10px 30px rgba(3, 7, 18, 0.55),
                      0 0 0 6px rgba(255, 255, 255, 0.12);
        }
        .tv-banner-play:active { transform: scale(0.96); }

        /* Progresso do vídeo */
        .tv-banner-track {
          position: relative; z-index: 3;
          height: 3px; flex-shrink: 0;
          background: rgba(255, 255, 255, 0.1);
        }
        .tv-banner-fill {
          width: 0;
          height: 100%;
          background: linear-gradient(90deg, #60a5fa, #93c5fd);
        }

        /* Legenda em faixa própria, abaixo do vídeo */
        .tv-banner-caption {
          padding: 16px 20px 18px;
          background: linear-gradient(180deg, #101a30 0%, #0b1120 100%);
        }
        .tv-banner-title {
          font-size: 20px; font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .tv-banner-desc {
          margin-top: 5px;
          max-width: 62ch;
          font-size: 13px; line-height: 1.5;
          color: rgba(226, 232, 240, 0.7);
        }
        .tv-banner-meta {
          margin-top: 9px;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.85);
        }

        @media (prefers-reduced-motion: reduce) {
          .tv-banner-badge-dot { animation: none; }
          .tv-banner-controles { transition: none; }
        }

        /* ── Overlay compartilhado (player e upload) ───────────────────────── */
        .tv-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(8px);
          animation: tvFadeIn 0.22s ease;
        }
        @keyframes tvFadeIn { from { opacity: 0 } to { opacity: 1 } }

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

        .tv-player {
          width: 100%;
          max-height: 82vh;
          aspect-ratio: 16 / 9;
          background: #000;
          display: block;
        }

        .tv-close {
          position: absolute; top: 12px; right: 12px; z-index: 10;
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(0, 0, 0, 0.5); color: #fff;
          border: none; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .tv-close:hover { background: rgba(0,0,0,0.85); transform: scale(1.1); }

        /* ── Modal de upload ───────────────────────────────────────────────── */
        .tv-upload {
          position: relative;
          width: 100%; max-width: 520px;
          border-radius: 16px;
          background: #fff;
          color: #0f172a;
          padding: 24px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
          animation: tvPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tv-upload-title { font-size: 17px; font-weight: 700; }
        .tv-upload-sub {
          margin-top: 4px;
          font-size: 13px; line-height: 1.5;
          color: #64748b;
        }
        .tv-upload-drop {
          margin-top: 18px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px;
          padding: 26px 16px;
          border: 1.5px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          cursor: pointer;
          text-align: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .tv-upload-drop:hover { border-color: #60a5fa; background: #f1f5f9; }
        .tv-upload-drop-nome { font-size: 13px; font-weight: 600; }
        .tv-upload-drop-dica { font-size: 12px; color: #64748b; }
        .tv-upload-erro {
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .tv-upload-track {
          margin-top: 16px;
          height: 6px; border-radius: 999px;
          background: #e2e8f0; overflow: hidden;
        }
        .tv-upload-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          transition: width 0.2s ease;
        }
        .tv-upload-status {
          margin-top: 8px;
          font-size: 12px; color: #64748b;
          font-variant-numeric: tabular-nums;
        }
        .tv-upload-acoes {
          margin-top: 20px;
          display: flex; justify-content: flex-end; gap: 10px;
        }
        .tv-upload-btn {
          height: 40px; padding: 0 16px;
          border-radius: 12px;
          font-size: 14px; font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
        }
        .tv-upload-btn:disabled { opacity: 0.5; cursor: default; }
        .tv-upload-btn-primario {
          border: none;
          background: #2563eb; color: #fff;
        }
        .tv-upload-btn-primario:not(:disabled):hover { background: #1d4ed8; }
        .tv-upload-btn-secundario {
          border: 1px solid #e2e8f0;
          background: #fff; color: #475569;
        }
        .tv-upload-btn-secundario:not(:disabled):hover { background: #f8fafc; }
      `}</style>
    </>
  );
}

// ─── Modal de troca do vídeo ─────────────────────────────────────────────────

interface TrocarVideoModalProps {
  limiteMb: number;
  onFechar: () => void;
  onEnviado: (novo: VideoTv) => void;
}

function TrocarVideoModal({ limiteMb, onFechar, onEnviado }: TrocarVideoModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const enviando = progresso !== null;

  const escolher = (selecionado: File | null) => {
    if (!selecionado) return;
    if (!selecionado.name.toLowerCase().endsWith(".mp4")) {
      setErro("Escolha um arquivo .mp4 — é o formato que toca em todos os navegadores.");
      return;
    }
    if (selecionado.size > limiteMb * 1024 * 1024) {
      setErro(
        `O vídeo tem ${formatarTamanho(selecionado.size)} e o limite é ${limiteMb} MB.`,
      );
      return;
    }
    setErro(null);
    setArquivo(selecionado);
  };

  const enviar = async () => {
    if (!arquivo) return;
    setErro(null);
    setProgresso(0);

    const form = new FormData();
    form.append("arquivo", arquivo);

    try {
      const novo = await apiUpload<VideoTv>("/tv-meta/video", form, setProgresso);
      onEnviado(novo);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar o vídeo.");
      setProgresso(null);
    }
  };

  return (
    <div
      className="tv-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Trocar o vídeo da TV Meta"
      onClick={() => {
        // Um clique fora não pode descartar um upload em andamento
        if (!enviando) onFechar();
      }}
    >
      <div className="tv-upload" onClick={(e) => e.stopPropagation()}>
        <h3 className="tv-upload-title">Publicar nova edição da TV Meta</h3>
        <p className="tv-upload-sub">
          O vídeo enviado substitui o que está no ar para toda a empresa, na
          hora. Formato MP4, até {limiteMb} MB.
        </p>

        <button
          type="button"
          className="tv-upload-drop"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
        >
          <Upload className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <span className="tv-upload-drop-nome">
            {arquivo ? arquivo.name : "Escolher arquivo MP4"}
          </span>
          <span className="tv-upload-drop-dica">
            {arquivo ? formatarTamanho(arquivo.size) : "Clique para procurar no computador"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,.mp4"
          hidden
          onChange={(e) => escolher(e.target.files?.[0] ?? null)}
        />

        {erro && <p className="tv-upload-erro">{erro}</p>}

        {enviando && (
          <>
            <div className="tv-upload-track">
              <div className="tv-upload-fill" style={{ width: `${progresso}%` }} />
            </div>
            <p className="tv-upload-status">
              {progresso < 100
                ? `Enviando… ${progresso}%`
                : "Processando no servidor…"}
            </p>
          </>
        )}

        <div className="tv-upload-acoes">
          <button
            type="button"
            className="tv-upload-btn tv-upload-btn-secundario"
            onClick={onFechar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="tv-upload-btn tv-upload-btn-primario"
            onClick={enviar}
            disabled={!arquivo || enviando}
          >
            {enviando ? "Enviando…" : "Publicar vídeo"}
          </button>
        </div>
      </div>
    </div>
  );
}
