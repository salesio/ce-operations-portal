/**
 * Mozambique provinces and cities — frontend-first location catalogue.
 * Structured for future PostgreSQL tables: provinces, cities.
 */
const mozambiqueLocations = [
  {
    province: "Maputo Cidade",
    cities: ["KaMpfumo", "Nlhamankulu", "KaMaxakeni", "KaMavota", "KaMubukwana", "Katembe"]
  },
  {
    province: "Maputo Província",
    cities: ["Matola", "Boane", "Marracuene", "Moamba", "Namaacha", "Manhiça", "Magude", "Matutuíne"]
  },
  {
    province: "Gaza",
    cities: ["Xai-Xai", "Chókwè", "Chibuto", "Bilene", "Macia", "Mandlakazi", "Massinga"]
  },
  {
    province: "Inhambane",
    cities: ["Inhambane", "Maxixe", "Vilankulo", "Massinga", "Homoíne", "Jangamo"]
  },
  {
    province: "Sofala",
    cities: ["Beira", "Dondo", "Nhamatanda", "Búzi", "Gorongosa", "Marromeu", "Caia"]
  },
  {
    province: "Manica",
    cities: ["Chimoio", "Manica", "Gondola", "Sussundenga", "Catandica"]
  },
  {
    province: "Tete",
    cities: ["Tete", "Moatize", "Cahora Bassa", "Angónia", "Tsangano", "Changara"]
  },
  {
    province: "Zambézia",
    cities: ["Quelimane", "Mocuba", "Gurué", "Milange", "Alto Molócuè"]
  },
  {
    province: "Nampula",
    cities: ["Nampula", "Nacala", "Angoche", "Ilha de Moçambique", "Monapo", "Murrupula", "Ribáuè"]
  },
  {
    province: "Niassa",
    cities: ["Lichinga", "Cuamba", "Mandimba", "Marrupa", "Metangula"]
  },
  {
    province: "Cabo Delgado",
    cities: ["Pemba", "Montepuez", "Mocímboa da Praia", "Mueda", "Chiúre"]
  },
  {
    province: "Online",
    cities: ["Online"]
  }
];

/** Legacy seed values → canonical province names */
const MAPUTO_PROVINCE_CITIES = new Set(
  (mozambiqueLocations.find((entry) => entry.province === "Maputo Província") || { cities: [] }).cities
);

const LEGACY_CITY_ALIASES = {
  Maputo: "KaMpfumo",
  Khongolote: "Matola",
  Choupal: "KaMubukwana",
  Virtual: "Online"
};

function getProvinceList() {
  return mozambiqueLocations.map((entry) => entry.province);
}

function getCitiesForProvince(province) {
  const entry = mozambiqueLocations.find((item) => item.province === province);
  return entry ? [...entry.cities] : [];
}

/**
 * Resolve legacy province/city pairs from seed data to canonical catalogue values.
 */
function normalizeLocationValues(province = "", city = "") {
  let resolvedProvince = province || "";
  let resolvedCity = city || "";

  if (resolvedProvince === "Maputo") {
    resolvedProvince = MAPUTO_PROVINCE_CITIES.has(resolvedCity) || resolvedCity === "Khongolote"
      ? "Maputo Província"
      : "Maputo Cidade";
  }

  if (LEGACY_CITY_ALIASES[resolvedCity]) {
    resolvedCity = LEGACY_CITY_ALIASES[resolvedCity];
  }

  const cities = getCitiesForProvince(resolvedProvince);
  if (resolvedCity && cities.length && !cities.includes(resolvedCity)) {
    const fuzzy = cities.find((item) => item.toLowerCase() === resolvedCity.toLowerCase());
    if (fuzzy) resolvedCity = fuzzy;
  }

  return { province: resolvedProvince, city: resolvedCity };
}

function findProvinceForCity(city = "") {
  if (!city) return "";
  const alias = LEGACY_CITY_ALIASES[city] || city;
  const match = mozambiqueLocations.find((entry) => entry.cities.includes(alias));
  return match ? match.province : "";
}