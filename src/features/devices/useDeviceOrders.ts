import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/features/auth/useTenant";
import type { DeviceOrderStatus } from "@/config/devices";

export interface DeviceOrder {
  id: string;
  status: DeviceOrderStatus;
  model_name: string | null;
  price_cop: number;
  included: boolean;
  address: string;
  city: string;
  contact_name: string;
  tracking_code: string | null;
  created_at: string;
}

/** Pedidos de dispositivo del negocio, para seguirlos sin escribir a soporte. */
export function useDeviceOrders() {
  const { businessId } = useTenant();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["device-orders", businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<DeviceOrder[]> => {
      const { data, error } = await supabase
        .from("device_orders")
        .select(
          "id, status, model_name, price_cop, included, address, city, contact_name, tracking_code, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DeviceOrder[];
    },
  });

  return {
    orders: query.data ?? [],
    loading: query.isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["device-orders", businessId] }),
  };
}
