import { authFeatures } from "@/mocks/auth";
import { LogoMark } from "@/components/layout/Logo";

export function AuthShowcasePanel() {
  return (
    <div className="relative hidden w-full max-w-md shrink-0 flex-col justify-between overflow-hidden bg-navy-950 px-10 py-10 text-white lg:flex xl:max-w-lg xl:px-14">
      <div>
        <div className="flex items-center gap-3 text-2xl font-bold">
          Meta
          <LogoMark className="h-7 w-7" />
          <span className="ml-1 h-7 w-px bg-white/30" />
        </div>

        <h1 className="mt-14 text-4xl font-bold leading-tight xl:text-5xl">
          Onde ideias viram
          <br />
          resultado.
        </h1>

        <ul className="mt-10 space-y-3">
          {authFeatures.map(({ icon: Icon, title, prefix, highlight, suffix }) => (
            <li
              key={title}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl brand-gradient">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm text-slate-400">
                  {prefix}
                  <span className="font-semibold text-sky-400">{highlight}</span>
                  {suffix}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-slate-500">© 2026 Meta Consultoria</p>
    </div>
  );
}
