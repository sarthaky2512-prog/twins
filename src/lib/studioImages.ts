import heroLuxuryWedding from '../assets/images/hero_luxury_wedding_1794726153162.jpg';
import aboutEditorialCouple from '../assets/images/about_editorial_couple_1794726153722.jpg';
import ceremonyOutdoorVows from '../assets/images/ceremony_outdoor_vows_1794726153398.jpg';
import bridalPortraitEditorial from '../assets/images/bridal_portrait_editorial_1794726155520.jpg';
import groomPreparationClassic from '../assets/images/groom_preparation_classic_1794726154228.jpg';
import receptionCandlelightDance from '../assets/images/reception_candlelight_dance_1794726154514.jpg';
import preweddingCoastalSunset from '../assets/images/prewedding_coastal_sunset_1794726155580.jpg';
import weddingDecorChampagne from '../assets/images/wedding_decor_champagne_1794726155981.jpg';

const STUDIO_IMAGE_MAP: Record<string, string> = {
  'img://hero': heroLuxuryWedding,
  'img://about': aboutEditorialCouple,
  'img://ceremony': ceremonyOutdoorVows,
  'img://bridal': bridalPortraitEditorial,
  'img://groom': groomPreparationClassic,
  'img://reception': receptionCandlelightDance,
  'img://prewedding': preweddingCoastalSunset,
  'img://decor': weddingDecorChampagne,
  '/src/assets/images/hero_luxury_wedding_1794726153162.jpg': heroLuxuryWedding,
  '/src/assets/images/about_editorial_couple_1794726153722.jpg': aboutEditorialCouple,
  '/src/assets/images/ceremony_outdoor_vows_1794726153398.jpg': ceremonyOutdoorVows,
  '/src/assets/images/bridal_portrait_editorial_1794726155520.jpg': bridalPortraitEditorial,
  '/src/assets/images/groom_preparation_classic_1794726154228.jpg': groomPreparationClassic,
  '/src/assets/images/reception_candlelight_dance_1794726154514.jpg': receptionCandlelightDance,
  '/src/assets/images/prewedding_coastal_sunset_1794726155580.jpg': preweddingCoastalSunset,
  '/src/assets/images/wedding_decor_champagne_1794726155981.jpg': weddingDecorChampagne,
};

export function resolveStudioImage(src?: string): string {
  if (!src) return heroLuxuryWedding;
  return STUDIO_IMAGE_MAP[src] || src;
}

export const STUDIO_IMAGE_PRESETS = [
  { label: 'Vineyard Golden Hour Couple', value: 'img://hero' },
  { label: 'Sandstone Arches Editorial', value: 'img://about' },
  { label: 'Garden Estate Ceremony Vows', value: 'img://ceremony' },
  { label: 'Heritage Window Bridal Portrait', value: 'img://bridal' },
  { label: 'Classic Groom Preparation', value: 'img://groom' },
  { label: 'Candlelight Reception First Dance', value: 'img://reception' },
  { label: 'South Australian Coastal Sunset', value: 'img://prewedding' },
  { label: 'Champagne & Floral Table Styling', value: 'img://decor' },
];
