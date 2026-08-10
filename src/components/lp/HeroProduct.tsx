import WallDisplay from "@/components/lp/WallDisplay";
import DemoMenu, { DEMO_MENUS } from "@/components/lp/DemoMenu";

/**
 * Hero: el producto funcionando. La pantalla de pared con el menú y, al
 * frente, el panel en el celular que la controla. No hay foto de comida de
 * banco de imágenes: lo que vendemos es esto.
 */
export default function HeroProduct() {
  const menu = DEMO_MENUS[1];

  return (
    <div className="relative pb-10 pr-4 sm:pb-6">
      <WallDisplay>
        <DemoMenu menu={menu} />
      </WallDisplay>

      {/* Celular al frente: una cosa controla la otra */}
      <div className="absolute -bottom-1 right-0 w-[34%] max-w-[150px] rounded-[18px] border border-border/70 bg-card p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
        <span className="mx-auto mb-2 block h-1 w-8 rounded-full bg-muted-foreground/40" />
        <p className="text-[9px] font-semibold uppercase tracking-widest text-primary">Tu panel</p>
        <div className="mt-1.5 space-y-1">
          {menu.dishes.map((d, i) => (
            <div
              key={d.name}
              className={`flex items-center justify-between rounded-md border px-1.5 py-1 text-[9px] ${
                i === 0 ? "border-primary/60 bg-primary/10" : "border-border/50"
              }`}
            >
              <span className="truncate text-foreground">{d.name}</span>
              <span className="ml-1 shrink-0 text-muted-foreground">
                ${(d.price / 1000).toFixed(0)}k
              </span>
            </div>
          ))}
        </div>
        <span className="mt-2 block rounded-md bg-primary py-1 text-center text-[9px] font-semibold text-primary-foreground">
          Enviar a la pantalla
        </span>
      </div>
    </div>
  );
}
