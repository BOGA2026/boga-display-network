import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, MonitorOff, MapPin, Image } from "lucide-react";

const stats = [
  { label: "Pantallas totales", value: "0", icon: Monitor, color: "text-primary" },
  { label: "En línea", value: "0", icon: Monitor, color: "text-green-400" },
  { label: "Fuera de línea", value: "0", icon: MonitorOff, color: "text-destructive" },
  { label: "Ubicaciones", value: "0", icon: MapPin, color: "text-accent" },
  { label: "Contenido activo", value: "0", icon: Image, color: "text-muted-foreground" },
];

const Dashboard = () => {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Panel de control</h1>
        <p className="text-sm text-muted-foreground">Resumen general de tu red de señalización</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay actividad reciente. Comienza agregando ubicaciones y pantallas.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Estado de pantallas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay pantallas registradas aún.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Need to import cn
import { cn } from "@/lib/utils";

export default Dashboard;
