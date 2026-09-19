import { Consola } from "@/components/consola/consola";
import { urlTablero, vistaTecnica } from "@/lib/servidor";

// La configuración se lee en cada petición para que `DASHBOARD_URL` no quede fijada en la imagen.
export const dynamic = "force-dynamic";

export default function PaginaConsola() {
  return <Consola urlTablero={urlTablero()} vistaTecnica={vistaTecnica()} />;
}
