import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Mapa de nombre de CCAA → código ISO 3166-2:ES usado por nager.at
const CCAA_CODE_MAP: Record<string, string> = {
  "Andalucía": "ES-AN",
  "Aragón": "ES-AR",
  "Asturias": "ES-AS",
  "Baleares": "ES-IB",
  "Canarias": "ES-CN",
  "Cantabria": "ES-CB",
  "Castilla-La Mancha": "ES-CM",
  "Castilla y León": "ES-CL",
  "Cataluña": "ES-CT",
  "Extremadura": "ES-EX",
  "Galicia": "ES-GA",
  "La Rioja": "ES-RI",
  "Madrid": "ES-MD",
  "Murcia": "ES-MU",
  "Navarra": "ES-NC",
  "País Vasco": "ES-PV",
  "Valencia": "ES-VC",
  "Ceuta": "ES-CE",
  "Melilla": "ES-ML",
};

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// ---------------------------------------------------------------------------
// GET /api/holidays/public?year=YYYY&region=Madrid
// Proxy de la API pública de festivos de España (nager.at)
// Filtra por CCAA si se proporciona la región
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const yearParam = req.nextUrl.searchParams.get("year");
  const region = req.nextUrl.searchParams.get("region") ?? null;

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Año inválido" }, { status: 400 });
  }

  const countyCode = region ? (CCAA_CODE_MAP[region] ?? null) : null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let holidays: NagerHoliday[];
  try {
    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/ES`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: "La API de festivos no está disponible. Inténtalo de nuevo más tarde." },
        { status: 503 }
      );
    }

    holidays = (await res.json()) as NagerHoliday[];
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: "La API de festivos no respondió a tiempo. Puedes añadir los festivos manualmente." },
      { status: 503 }
    );
  }

  // Filtrar por CCAA: incluir festivos nacionales (counties === null) y los de la CCAA
  const filtered = countyCode
    ? holidays.filter(
        (h) => h.counties === null || h.counties.includes(countyCode)
      )
    : holidays;

  const result = filtered.map((h) => ({
    date: h.date,
    description: h.localName,
  }));

  return NextResponse.json(result);
}
