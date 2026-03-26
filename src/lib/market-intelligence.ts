export type CityType = 'urban' | 'mountain' | 'seaside' | 'other';

export interface RomanianCity {
  name: string;
  type: CityType;
}

export const ROMANIAN_CITIES: RomanianCity[] = [
  // Orașe principale
  { name: 'București', type: 'urban' },
  { name: 'Cluj-Napoca', type: 'urban' },
  { name: 'Timișoara', type: 'urban' },
  { name: 'Iași', type: 'urban' },
  { name: 'Constanța', type: 'urban' },
  { name: 'Craiova', type: 'urban' },
  { name: 'Brașov', type: 'urban' },
  { name: 'Galați', type: 'urban' },
  { name: 'Ploiești', type: 'urban' },
  { name: 'Oradea', type: 'urban' },
  { name: 'Sibiu', type: 'urban' },
  { name: 'Bacău', type: 'urban' },
  { name: 'Suceava', type: 'urban' },
  { name: 'Piatra Neamț', type: 'urban' },
  { name: 'Târgu Mureș', type: 'urban' },
  { name: 'Baia Mare', type: 'urban' },
  { name: 'Alba Iulia', type: 'urban' },
  { name: 'Deva', type: 'urban' },
  { name: 'Satu Mare', type: 'urban' },
  { name: 'Botoșani', type: 'urban' },
  { name: 'Râmnicu Vâlcea', type: 'urban' },
  { name: 'Buzău', type: 'urban' },
  { name: 'Focșani', type: 'urban' },
  { name: 'Bistrița', type: 'urban' },
  { name: 'Sfântu Gheorghe', type: 'urban' },
  { name: 'Miercurea Ciuc', type: 'urban' },
  { name: 'Turda', type: 'urban' },
  { name: 'Mediaș', type: 'urban' },
  { name: 'Lugoj', type: 'urban' },
  { name: 'Câmpina', type: 'urban' },
  { name: 'Petroșani', type: 'urban' },
  { name: 'Câmpulung', type: 'urban' },
  { name: 'Roman', type: 'urban' },
  { name: 'Zalău', type: 'urban' },
  { name: 'Drobeta-Turnu Severin', type: 'urban' },
  { name: 'Hunedoara', type: 'urban' },
  { name: 'Medgidia', type: 'urban' },
  { name: 'Reșița', type: 'urban' },
  { name: 'Giurgiu', type: 'urban' },
  { name: 'Slobozia', type: 'urban' },
  { name: 'Alexandria', type: 'urban' },
  { name: 'Târgoviște', type: 'urban' },
  { name: 'Onești', type: 'urban' },
  { name: 'Adjud', type: 'urban' },
  { name: 'Mioveni', type: 'urban' },
  { name: 'Arad', type: 'urban' },
  { name: 'Pitești', type: 'urban' },
  { name: 'Brăila', type: 'urban' },
  { name: 'Râmnicu Sărat', type: 'urban' },
  { name: 'Odorheiu Secuiesc', type: 'urban' },
  { name: 'Reghin', type: 'urban' },
  { name: 'Sighetu Marmației', type: 'urban' },
  // Stațiuni montane
  { name: 'Sinaia', type: 'mountain' },
  { name: 'Predeal', type: 'mountain' },
  { name: 'Poiana Brașov', type: 'mountain' },
  { name: 'Bușteni', type: 'mountain' },
  { name: 'Azuga', type: 'mountain' },
  { name: 'Vatra Dornei', type: 'mountain' },
  { name: 'Sovata', type: 'mountain' },
  { name: 'Băile Herculane', type: 'mountain' },
  { name: 'Băile Felix', type: 'mountain' },
  { name: 'Băile Tușnad', type: 'mountain' },
  { name: 'Covasna', type: 'mountain' },
  { name: 'Bran', type: 'mountain' },
  { name: 'Moeciu', type: 'mountain' },
  { name: 'Fundata', type: 'mountain' },
  { name: 'Rânca', type: 'mountain' },
  { name: 'Straja', type: 'mountain' },
  { name: 'Păltiniș', type: 'mountain' },
  { name: 'Semenic', type: 'mountain' },
  { name: 'Râșnov', type: 'mountain' },
  { name: 'Zărnești', type: 'mountain' },
  { name: 'Borșa', type: 'mountain' },
  { name: 'Arieșeni', type: 'mountain' },
  // Litoral
  { name: 'Mamaia', type: 'seaside' },
  { name: 'Eforie Nord', type: 'seaside' },
  { name: 'Eforie Sud', type: 'seaside' },
  { name: 'Neptun', type: 'seaside' },
  { name: 'Olimp', type: 'seaside' },
  { name: 'Jupiter', type: 'seaside' },
  { name: 'Venus', type: 'seaside' },
  { name: 'Saturn', type: 'seaside' },
  { name: 'Mangalia', type: 'seaside' },
  { name: 'Năvodari', type: 'seaside' },
  { name: 'Techirghiol', type: 'seaside' },
  { name: 'Costinești', type: 'seaside' },
  { name: '2 Mai', type: 'seaside' },
  { name: 'Vama Veche', type: 'seaside' },
  // Alte zone turistice
  { name: 'Sighișoara', type: 'other' },
  { name: 'Sulina', type: 'other' },
  { name: 'Tulcea', type: 'other' },
  { name: 'Cheile Bicazului', type: 'other' },
  { name: 'Murighiol', type: 'other' },
  { name: 'Crișan', type: 'other' },
  { name: 'Mila 23', type: 'other' },
  { name: 'Lacul Roșu', type: 'other' },
  { name: 'Cheile Nerei', type: 'other' },
  { name: 'Certeze', type: 'other' },
  { name: 'Harghita-Băi', type: 'other' },
  { name: 'Peștera', type: 'other' },
  { name: 'Moieciu de Sus', type: 'other' },
  { name: 'Delta Dunării', type: 'other' },
];

export const CITY_NAMES = new Set(ROMANIAN_CITIES.map(c => c.name));

export const AMENITY_KEYS = {
  parking: 'Parcare',
  pool: 'Piscină',
  wifi: 'WiFi',
  ac: 'Aer condiționat',
  kitchen: 'Bucătărie',
  pets: 'Animale de companie acceptate',
  washer: 'Mașină de spălat / uscător',
  balcony: 'Balcon / terasă',
} as const;

export type AmenityKey = keyof typeof AMENITY_KEYS;
export const AMENITY_KEY_LIST = Object.keys(AMENITY_KEYS) as AmenityKey[];

/** Returns occupancy % default for a city and check-in month (1=Jan, 12=Dec). */
export function getOccupancyDefault(city: string, checkinMonth: number): number {
  const cityEntry = ROMANIAN_CITIES.find(c => c.name === city);
  const type = cityEntry?.type ?? 'other';

  if (type === 'seaside') {
    return [6, 7, 8].includes(checkinMonth) ? 85 : 40;
  }
  if (type === 'mountain') {
    return [12, 1, 2].includes(checkinMonth) ? 80 : 60;
  }
  if (type === 'urban') {
    return [11, 12, 1, 2, 3].includes(checkinMonth) ? 60 : 70;
  }
  // other
  return [6, 7, 8].includes(checkinMonth) ? 65 : 50;
}

export interface MarketStats {
  avg: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

export function computeStats(prices: number[]): MarketStats {
  if (prices.length === 0) return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
  return { avg, median, min: sorted[0], max: sorted[sorted.length - 1], count: prices.length };
}
