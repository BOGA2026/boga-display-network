import type { ScreenData, ScreenScheduleItem } from "@/data/mockScreens";

const DAYS_MAP: Record<string, string> = {
  Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function timeToOffset(time: string) {
  const [h, m] = time.split(":").map(Number);
  return ((h + m / 60) / 24) * 100;
}

function timeToWidth(start: string, end: string) {
  return timeToOffset(end) - timeToOffset(start);
}

export default function ScreenTimeline({ screen }: { screen: ScreenData }) {
  const byDay = DAYS.reduce<Record<string, ScreenScheduleItem[]>>((acc, d) => {
    acc[d] = screen.schedule.filter((s) => s.day === d);
    return acc;
  }, {});

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">Programación semanal</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="flex border-b border-border">
            <div className="w-12 shrink-0" />
            <div className="flex flex-1">
              {HOURS.filter((h) => h % 3 === 0).map((h) => (
                <span key={h} className="flex-1 border-l border-border px-1 py-1 text-[10px] text-muted-foreground">
                  {String(h).padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>

          {DAYS.map((day) => (
            <div key={day} className="flex border-b border-border last:border-b-0">
              <div className="flex w-12 shrink-0 items-center justify-center text-xs font-medium text-muted-foreground">
                {DAYS_MAP[day]}
              </div>
              <div className="relative flex-1 h-10">
                {byDay[day]?.map((item, i) => (
                  <div
                    key={i}
                    className="absolute top-1 bottom-1 rounded bg-primary/20 border border-primary/30 flex items-center overflow-hidden"
                    style={{
                      left: `${timeToOffset(item.startTime)}%`,
                      width: `${timeToWidth(item.startTime, item.endTime)}%`,
                    }}
                    title={`${item.contentName} ${item.startTime}–${item.endTime}`}
                  >
                    <span className="truncate px-1 text-[10px] font-medium text-primary-foreground">
                      {item.contentName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenido programado</p>
        {[...new Map(screen.schedule.map((s) => [s.contentName, s])).values()].map((item) => (
          <div key={item.contentName} className="flex items-center gap-3">
            <img src={item.thumbnailUrl} alt={item.contentName} className="h-9 w-14 rounded object-cover bg-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.contentName}</p>
              <p className="text-xs text-muted-foreground">{item.startTime} – {item.endTime}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
