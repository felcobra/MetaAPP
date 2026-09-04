/** Vídeo institucional exibido na Home (TV Meta). */
export interface VideoTv {
  disponivel: boolean;
  /** Caminho relativo à raiz da API, com o token de leitura já embutido. */
  stream_url: string | null;
  nome_arquivo: string | null;
  tamanho_bytes: number | null;
  atualizado_em: string | null;
  atualizado_por: string | null;
  /** Teto aceito pelo backend, em MB — a interface avisa antes de enviar. */
  limite_upload_mb: number;
}
