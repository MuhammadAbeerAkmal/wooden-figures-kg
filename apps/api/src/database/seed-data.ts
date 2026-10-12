import type { Condition } from './entities/index.js';

/**
 * FICTIONAL DATA.
 *
 * Every figure, inventory number, measurement, condition report, previous owner
 * and the museum itself are invented for this portfolio project. None of them
 * describes a real museum object.
 *
 * Only the vocabularies use real-world terms: wood species, object types,
 * Egyptian place names and the conventional names of historical periods. The
 * period dates are rounded conventional dates and are approximate.
 */

export const MUSEUM_NAME = 'Museum of Nile Valley Antiquities (fictional)';

export const MATERIALS = [
  { slug: 'sycamore-fig', name: 'Sycamore fig', scientificName: 'Ficus sycomorus' },
  { slug: 'acacia', name: 'Acacia', scientificName: 'Vachellia nilotica' },
  { slug: 'tamarisk', name: 'Tamarisk', scientificName: 'Tamarix aphylla' },
  { slug: 'cedar', name: 'Cedar of Lebanon', scientificName: 'Cedrus libani' },
  { slug: 'christs-thorn', name: "Christ's thorn", scientificName: 'Ziziphus spina-christi' },
];

export const OBJECT_TYPES = [
  { slug: 'servant-figure', name: 'Servant figure' },
  { slug: 'offering-bearer', name: 'Offering bearer' },
  { slug: 'rower-figure', name: 'Rower figure' },
  { slug: 'shabti', name: 'Shabti' },
  { slug: 'statuette', name: 'Statuette' },
];

/** Negative years are BCE. Parents must be listed before their children. */
export const PERIODS = [
  { slug: 'old-kingdom', name: 'Old Kingdom', startYear: -2686, endYear: -2181 },
  { slug: 'first-intermediate-period', name: 'First Intermediate Period', startYear: -2181, endYear: -2055 },
  { slug: 'middle-kingdom', name: 'Middle Kingdom', startYear: -2055, endYear: -1650 },
  { slug: 'new-kingdom', name: 'New Kingdom', startYear: -1550, endYear: -1069 },
  { slug: 'late-period', name: 'Late Period', startYear: -664, endYear: -332 },
];

export const SITES: { slug: string; name: string; parent: string | null }[] = [
  { slug: 'egypt', name: 'Egypt', parent: null },
  { slug: 'memphite-region', name: 'Memphite region', parent: 'egypt' },
  { slug: 'saqqara', name: 'Saqqara', parent: 'memphite-region' },
  { slug: 'middle-egypt', name: 'Middle Egypt', parent: 'egypt' },
  { slug: 'asyut', name: 'Asyut', parent: 'middle-egypt' },
  { slug: 'meir', name: 'Meir', parent: 'middle-egypt' },
  { slug: 'beni-hasan', name: 'Beni Hasan', parent: 'middle-egypt' },
  { slug: 'deir-el-bersha', name: 'Deir el-Bersha', parent: 'middle-egypt' },
  { slug: 'upper-egypt', name: 'Upper Egypt', parent: 'egypt' },
  { slug: 'thebes', name: 'Thebes', parent: 'upper-egypt' },
  { slug: 'deir-el-bahri', name: 'Deir el-Bahri', parent: 'thebes' },
];

/** Invented previous owners. Any resemblance to real collections is accidental. */
export const COLLECTIONS = [
  { slug: 'hartwell', name: 'Hartwell Collection' },
  { slug: 'varga-estate', name: 'Estate of M. Varga' },
  { slug: 'lindqvist-bequest', name: 'Lindqvist Bequest' },
  { slug: 'oakhaven', name: 'Oakhaven Antiquities' },
  { slug: 'brandt-keller', name: 'Brandt-Keller Family Collection' },
];

export interface SeedFigure {
  inventoryNumber: string;
  title: string;
  objectType: string;
  material: string;
  site: string | null;
  period: string;
  collection: string | null;
  acquisitionYear: number | null;
  /** [height, width, depth] in centimetres. */
  size: [number, number | null, number | null];
  description: string;
  reports: { assessedOn: string; condition: Condition; note: string }[];
}

export const FIGURES: SeedFigure[] = [
  {
    inventoryNumber: 'WF-0001', title: 'Servant grinding grain', objectType: 'servant-figure',
    material: 'sycamore-fig', site: 'asyut', period: 'middle-kingdom', collection: 'hartwell',
    acquisitionYear: 1923, size: [18.4, 7.2, 14.5],
    description: 'Kneeling woman leaning over a quern. Red-brown skin paint and a white kilt survive on the torso.',
    reports: [{ assessedOn: '2019-03-12', condition: 'good', note: 'Stable. Minor paint loss on the base.' }],
  },
  {
    inventoryNumber: 'WF-0002', title: 'Offering bearer with basket', objectType: 'offering-bearer',
    material: 'sycamore-fig', site: 'asyut', period: 'middle-kingdom', collection: 'hartwell',
    acquisitionYear: 1923, size: [42.0, 9.5, 12.0],
    description: 'Striding woman balancing a basket on her head with the left hand. Arms carved separately and pegged.',
    reports: [
      { assessedOn: '2012-06-04', condition: 'fair', note: 'Left arm loose at the peg. Gesso flaking on the basket.' },
      { assessedOn: '2021-09-20', condition: 'good', note: 'Arm re-fixed and gesso consolidated during conservation.' },
    ],
  },
  {
    inventoryNumber: 'WF-0003', title: 'Rower from a model boat', objectType: 'rower-figure',
    material: 'sycamore-fig', site: 'asyut', period: 'middle-kingdom', collection: 'varga-estate',
    acquisitionYear: 1951, size: [11.2, 4.0, 6.3],
    description: 'Seated rower with both arms stretched forward. The oar and the boat are lost.',
    reports: [{ assessedOn: '2018-11-02', condition: 'poor', note: 'Old insect damage in the legs. Paint largely lost.' }],
  },
  {
    inventoryNumber: 'WF-0004', title: 'Rower with raised arms', objectType: 'rower-figure',
    material: 'acacia', site: 'asyut', period: 'middle-kingdom', collection: 'varga-estate',
    acquisitionYear: 1951, size: [12.0, 4.4, 6.0],
    description: 'Seated rower with arms raised at the end of the stroke. Black wig and white kilt.',
    reports: [{ assessedOn: '2018-11-02', condition: 'fair', note: 'Shrinkage crack along the back.' }],
  },
  {
    inventoryNumber: 'WF-0005', title: 'Brewer straining mash', objectType: 'servant-figure',
    material: 'sycamore-fig', site: 'meir', period: 'middle-kingdom', collection: 'lindqvist-bequest',
    acquisitionYear: 1968, size: [21.5, 8.1, 10.2],
    description: 'Standing man bending over a vat and pressing mash through a sieve.',
    reports: [{ assessedOn: '2020-01-15', condition: 'good', note: 'Stable. Vat rim chipped.' }],
  },
  {
    inventoryNumber: 'WF-0006', title: 'Baker tending an oven', objectType: 'servant-figure',
    material: 'tamarisk', site: 'meir', period: 'middle-kingdom', collection: 'lindqvist-bequest',
    acquisitionYear: 1968, size: [16.8, 7.7, 11.9],
    description: 'Squatting man shielding his face from the heat with one hand. The oven is a separate block.',
    reports: [{ assessedOn: '2020-01-15', condition: 'fair', note: 'Right hand missing. Surface dusty but sound.' }],
  },
  {
    inventoryNumber: 'WF-0007', title: 'Offering bearer with duck', objectType: 'offering-bearer',
    material: 'sycamore-fig', site: 'meir', period: 'first-intermediate-period', collection: 'hartwell',
    acquisitionYear: 1925, size: [33.0, 8.0, null],
    description: 'Upper part of a striding woman holding a duck by the wings. Roughly carved.',
    reports: [{ assessedOn: '2017-05-23', condition: 'fragmentary', note: 'Legs and base missing. Preserved from the hips up.' }],
  },
  {
    inventoryNumber: 'WF-0008', title: 'Striding male statuette', objectType: 'statuette',
    material: 'acacia', site: 'saqqara', period: 'old-kingdom', collection: 'oakhaven',
    acquisitionYear: 1987, size: [54.3, 13.0, 21.6],
    description: 'Man striding with the left leg forward, arms at his sides. Holes in the fists for a lost staff.',
    reports: [{ assessedOn: '2016-02-08', condition: 'fair', note: 'Deep vertical crack through the chest. Stable.' }],
  },
  {
    inventoryNumber: 'WF-0009', title: 'Standing female statuette', objectType: 'statuette',
    material: 'sycamore-fig', site: 'saqqara', period: 'old-kingdom', collection: 'oakhaven',
    acquisitionYear: 1987, size: [38.7, 9.2, 8.5],
    description: 'Woman standing with feet together in a close-fitting dress. Inlaid eyes are lost.',
    reports: [
      { assessedOn: '2010-10-11', condition: 'poor', note: 'Active flaking of the paint layer.' },
      { assessedOn: '2022-04-06', condition: 'fair', note: 'Paint layer consolidated. Kept in a climate-controlled case.' },
    ],
  },
  {
    inventoryNumber: 'WF-0010', title: 'Servant carrying a jar', objectType: 'servant-figure',
    material: 'acacia', site: 'saqqara', period: 'old-kingdom', collection: null,
    acquisitionYear: null, size: [14.9, null, null],
    description: 'Torso of a man with a jar on the left shoulder. No record of how it entered the museum.',
    reports: [{ assessedOn: '2016-02-09', condition: 'fragmentary', note: 'Head, right arm and lower legs missing.' }],
  },
  {
    inventoryNumber: 'WF-0011', title: 'Porter with yoke', objectType: 'servant-figure',
    material: 'sycamore-fig', site: 'beni-hasan', period: 'middle-kingdom', collection: 'brandt-keller',
    acquisitionYear: 1934, size: [24.6, 15.3, 7.0],
    description: 'Striding man carrying two baskets on a shoulder yoke. Yoke and cords are modern replacements.',
    reports: [{ assessedOn: '2019-07-30', condition: 'good', note: 'Stable. Modern additions documented.' }],
  },
  {
    inventoryNumber: 'WF-0012', title: 'Weaver at a ground loom', objectType: 'servant-figure',
    material: 'sycamore-fig', site: 'beni-hasan', period: 'middle-kingdom', collection: 'brandt-keller',
    acquisitionYear: 1934, size: [13.1, 6.5, 12.8],
    description: 'Squatting woman with hands held out over a loom that is now lost.',
    reports: [{ assessedOn: '2019-07-30', condition: 'fair', note: 'Loss to the left knee. Paint abraded.' }],
  },
  {
    inventoryNumber: 'WF-0013', title: 'Rower, seated', objectType: 'rower-figure',
    material: 'tamarisk', site: 'beni-hasan', period: 'middle-kingdom', collection: 'varga-estate',
    acquisitionYear: 1952, size: [10.5, 3.8, 5.9],
    description: 'Seated rower with a short black wig. Peg under the seat for fixing to a boat deck.',
    reports: [{ assessedOn: '2018-11-05', condition: 'good', note: 'Stable. Peg intact.' }],
  },
  {
    inventoryNumber: 'WF-0014', title: 'Scribe figure from a granary model', objectType: 'servant-figure',
    material: 'sycamore-fig', site: 'deir-el-bersha', period: 'middle-kingdom', collection: 'lindqvist-bequest',
    acquisitionYear: 1969, size: [12.4, 6.0, 7.5],
    description: 'Seated scribe with a writing board on his lap. Fine painted details on the face.',
    reports: [{ assessedOn: '2020-01-16', condition: 'good', note: 'Stable. Excellent paint preservation.' }],
  },
  {
    inventoryNumber: 'WF-0015', title: 'Offering bearer with box', objectType: 'offering-bearer',
    material: 'cedar', site: 'deir-el-bersha', period: 'middle-kingdom', collection: 'lindqvist-bequest',
    acquisitionYear: 1969, size: [47.2, 10.4, 15.1],
    description: 'Striding woman carrying a chest on her head. Finely carved, with a bead-net dress painted in blue and green.',
    reports: [{ assessedOn: '2020-01-16', condition: 'good', note: 'Stable. Small loss at the front of the base.' }],
  },
  {
    inventoryNumber: 'WF-0016', title: 'Helmsman figure', objectType: 'rower-figure',
    material: 'sycamore-fig', site: 'deir-el-bersha', period: 'first-intermediate-period', collection: null,
    acquisitionYear: null, size: [15.7, 5.2, 6.6],
    description: 'Standing man with arms bent to hold a steering oar. Provenance before the museum is unknown.',
    reports: [{ assessedOn: '2017-05-24', condition: 'poor', note: 'Wood soft and friable at the feet.' }],
  },
  {
    inventoryNumber: 'WF-0017', title: 'Shabti with painted inscription', objectType: 'shabti',
    material: 'christs-thorn', site: 'deir-el-bahri', period: 'new-kingdom', collection: 'hartwell',
    acquisitionYear: 1926, size: [22.3, 6.4, 4.1],
    description: 'Mummiform figure with a tripartite wig and four lines of painted text around the body.',
    reports: [{ assessedOn: '2021-03-03', condition: 'good', note: 'Stable. Text fully legible.' }],
  },
  {
    inventoryNumber: 'WF-0018', title: 'Shabti with hoes', objectType: 'shabti',
    material: 'tamarisk', site: 'deir-el-bahri', period: 'new-kingdom', collection: 'brandt-keller',
    acquisitionYear: 1936, size: [19.8, 5.9, 3.8],
    description: 'Mummiform figure holding a hoe in each hand, with a basket painted on the back.',
    reports: [{ assessedOn: '2021-03-03', condition: 'fair', note: 'Paint faded. Fine cracks around the feet.' }],
  },
  {
    inventoryNumber: 'WF-0019', title: 'Shabti, uninscribed', objectType: 'shabti',
    material: 'sycamore-fig', site: 'thebes', period: 'new-kingdom', collection: 'oakhaven',
    acquisitionYear: 1988, size: [17.5, 5.0, 3.5],
    description: 'Plain mummiform figure with summary carving and traces of a black coating.',
    reports: [{ assessedOn: '2021-03-04', condition: 'fair', note: 'Coating flaking in places.' }],
  },
  {
    inventoryNumber: 'WF-0020', title: 'Overseer shabti', objectType: 'shabti',
    material: 'cedar', site: 'thebes', period: 'new-kingdom', collection: 'oakhaven',
    acquisitionYear: 1988, size: [23.9, 7.1, 5.0],
    description: 'Figure in the dress of daily life with a projecting kilt and a whip in the right hand.',
    reports: [{ assessedOn: '2021-03-04', condition: 'good', note: 'Stable. Tip of the kilt chipped.' }],
  },
  {
    inventoryNumber: 'WF-0021', title: 'Statuette of a standing official', objectType: 'statuette',
    material: 'cedar', site: 'thebes', period: 'new-kingdom', collection: 'brandt-keller',
    acquisitionYear: 1936, size: [31.4, 8.8, 10.7],
    description: 'Man in a pleated garment with a long kilt, on a rectangular base with an incised offering formula.',
    reports: [{ assessedOn: '2019-08-01', condition: 'good', note: 'Stable. Old repair to the base.' }],
  },
  {
    inventoryNumber: 'WF-0022', title: 'Mummiform statuette', objectType: 'statuette',
    material: 'sycamore-fig', site: null, period: 'late-period', collection: 'varga-estate',
    acquisitionYear: 1953, size: [48.6, 12.5, 9.9],
    description: 'Mummiform figure with a tall crown and a long base tenon. Find site not recorded.',
    reports: [{ assessedOn: '2018-11-06', condition: 'poor', note: 'Gesso layer detaching over large areas.' }],
  },
  {
    inventoryNumber: 'WF-0023', title: 'Shabti with traces of gilding', objectType: 'shabti',
    material: 'acacia', site: null, period: 'late-period', collection: null,
    acquisitionYear: null, size: [9.6, 3.1, null],
    description: 'Lower half of a small shabti with gold leaf on the feet. Neither find site nor previous owner is recorded.',
    reports: [{ assessedOn: '2017-05-25', condition: 'fragmentary', note: 'Broken at the waist. Upper half missing.' }],
  },
  {
    inventoryNumber: 'WF-0024', title: 'Butcher figure', objectType: 'servant-figure',
    material: 'sycamore-fig', site: 'asyut', period: 'first-intermediate-period', collection: 'hartwell',
    acquisitionYear: 1925, size: [17.0, 6.9, 9.4],
    description: 'Man bending forward with a knife in the right hand. The ox he was cutting up is lost.',
    reports: [{ assessedOn: '2017-05-23', condition: 'fair', note: 'Knife blade broken. Paint worn.' }],
  },
  {
    inventoryNumber: 'WF-0025', title: 'Statuette of a kneeling woman', objectType: 'statuette',
    material: 'christs-thorn', site: 'deir-el-bahri', period: 'middle-kingdom', collection: 'lindqvist-bequest',
    acquisitionYear: 1970, size: [14.2, 5.5, 8.0],
    description: 'Woman kneeling with both hands raised in front of the face.',
    reports: [
      { assessedOn: '2015-09-14', condition: 'fair', note: 'Hairline cracks at the wrists.' },
      { assessedOn: '2023-02-27', condition: 'poor', note: 'Cracks have widened. Left hand at risk of detaching.' },
    ],
  },
];
