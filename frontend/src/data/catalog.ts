import type { Credit, FlowerMeta, VaseMeta, WrapMeta } from '../types';

const FFISH: Credit = {
  license: 'CC0-1.0',
  author: 'ffish.asia / floraZia.com',
  authorUrl: 'https://sketchfab.com/ffishAsia-and-floraZia',
};
const LASSI: Credit = {
  license: 'CC-BY-4.0',
  author: 'Lassi Kaukonen',
  authorUrl: 'https://sketchfab.com/thesidekick',
};
const ALEXDELKER: Credit = {
  license: 'CC-BY-4.0',
  author: 'alexdelker',
  authorUrl: 'https://sketchfab.com/alexdelker',
};

export const FLOWERS: FlowerMeta[] = [
  { id: 'spider-lily-white',   name: 'White Spider Lily',    latin: 'Lycoris albiflora',        seasonal: 'Late summer', hasModel: true, tint: '#fffaf3', credit: FFISH, modelNode: 'QS1567-W04-1-2_1' },
  { id: 'spider-lily-gold',    name: 'Golden Spider Lily',   latin: 'Lycoris traubii',          seasonal: 'Autumn',      hasModel: true, tint: '#f5b301', credit: FFISH, modelNode: 'QS1596-W24-1-1_1' },
  { id: 'spider-lily-red',     name: 'Red Spider Lily',      latin: 'Lycoris radiata',          seasonal: 'Autumn',      hasModel: true, tint: '#c8102e', credit: FFISH },
  { id: 'rain-lily-pink',      name: 'Pink Rain Lily',       latin: 'Zephyranthes carinata',    seasonal: 'Summer',      hasModel: true, tint: '#f4a1b8', credit: FFISH, modelNode: 'QS1599-W05-1-1_1' },
  { id: 'statice-purple',      name: 'Purple Statice',       latin: 'Limonium sinuatum',        seasonal: 'Summer',      hasModel: true, tint: '#7a5fbf', credit: FFISH },
  { id: 'wisteria',            name: 'Japanese Wisteria',    latin: 'Wisteria floribunda',      seasonal: 'Spring',      hasModel: true, tint: '#a58bd0', credit: FFISH, modelNode: 'GLTF_SceneRootNode', modelRotation: [Math.PI, 0, 0] },
  { id: 'chrysanthemum',       name: 'Chrysanthemum',        latin: 'Chrysanthemum cv.',        seasonal: 'Autumn',      hasModel: true, tint: '#f0c04a', credit: FFISH },
  { id: 'buttercup-japanese',  name: 'Japanese Buttercup',   latin: 'Ranunculus japonicus',     seasonal: 'Spring',      hasModel: true, tint: '#ffd23f', credit: FFISH, modelNode: 'QS1222-W14-1all-2_1' },
  { id: 'buttercup-spinyfruit',name: 'Spinyfruit Buttercup', latin: 'Ranunculus muricatus',     seasonal: 'Spring',      hasModel: true, tint: '#f5b301', credit: FFISH, modelNode: 'QS1222-W13-1all-1_7' },
  { id: 'hydrangea-lace',      name: 'Lace Hydrangea',       latin: 'Hydrangea luteovenosa',    seasonal: 'Early summer',hasModel: true, tint: '#e8e2c8', credit: FFISH, modelNode: 'QS1252-W02-1all-1_5', excludeNodes: ['Object_5', 'Object_10'] },
  { id: 'raspberry',           name: 'Wild Raspberry',       latin: 'Rubus hirsutus',           seasonal: 'Spring',      hasModel: true, tint: '#fbf7f0', credit: FFISH },
  { id: 'cottonweed',          name: 'Cottonweed',           latin: 'Pseudognaphalium affine',  seasonal: 'Spring',      hasModel: true, tint: '#f0e2a3', credit: FFISH },
  { id: 'sorrel',              name: 'Common Sorrel',        latin: 'Rumex acetosa',            seasonal: 'Summer',      hasModel: true, tint: '#a03830', credit: FFISH },
  { id: 'ivy-glechoma',        name: 'Ground Ivy',           latin: 'Glechoma hederacea',       seasonal: 'Spring',      hasModel: true, tint: '#8a6dc9', credit: FFISH },
  { id: 'skullcap-japanese',   name: 'Japanese Skullcap',    latin: 'Scutellaria indica',       seasonal: 'Spring',      hasModel: true, tint: '#6a4bb8', credit: FFISH },
  { id: 'skunkvine',           name: 'Skunkvine',            latin: 'Paederia foetida',         seasonal: 'Summer',      hasModel: true, tint: '#d9b8c4', credit: FFISH, modelNode: 'QS1734-E1-W03-1-1_1', modelRotation: [Math.PI, 0, 0] },
  { id: 'rose-red',            name: 'Red Rose',             latin: 'Rosa cv.',                 seasonal: 'Year round',  hasModel: true, tint: '#c8102e', credit: LASSI },
  { id: 'wild-bloom',          name: 'Wild Bloom',           latin: 'Flora sp.',                seasonal: 'Year round',  hasModel: true, tint: '#f0d9a8', credit: ALEXDELKER },
];

export const VASES: VaseMeta[] = [
  { id: 'vase-glass-cyl',      name: 'Clear Glass Cylinder', material: 'Blown glass',      tint: '#c9e2ec', glass: true },
  { id: 'vase-crystal',        name: 'Crystal Vase',         material: 'Cut crystal',      tint: '#e0edf3', glass: true },
  { id: 'vase-ceramic-white',  name: 'White Ceramic Urn',    material: 'Glazed stoneware', tint: '#fbf7f0' },
  { id: 'vase-terracotta',     name: 'Terracotta Pot',       material: 'Fired clay',       tint: '#b95a2f' },
  { id: 'vase-brass',          name: 'Brushed Brass Vase',   material: 'Brass',            tint: '#d4a538' },
  { id: 'vase-black-matte',    name: 'Matte Black Ceramic',  material: 'Matte glaze',      tint: '#1a1a1a' },
  { id: 'vase-mason',          name: 'Mason Jar',            material: 'Recycled glass',   tint: '#b7dbd0', glass: true },
  { id: 'vase-bud-trio',       name: 'Bud Vase Trio',        material: 'Amber glass',      tint: '#a86a2b', glass: true },
  { id: 'vase-porcelain-blue', name: 'Blue Porcelain',       material: 'Painted porcelain',tint: '#dbe6f0' },
  { id: 'vase-fluted',         name: 'Fluted Milk Glass',    material: 'Opaque glass',     tint: '#fffaf0' },
];

export const WRAPS: WrapMeta[] = [
  { id: 'wrap-kraft',       name: 'Kraft Paper',       material: 'Recycled kraft',   tint: '#b98452' },
  { id: 'wrap-white',       name: 'Ivory Tissue',      material: 'Tissue paper',     tint: '#fbf7f0' },
  { id: 'wrap-black',       name: 'Matte Black',       material: 'Coated paper',     tint: '#1a1a1a' },
  { id: 'wrap-blush',       name: 'Blush Pink',        material: 'Korean wrap',      tint: '#f4c2c2' },
  { id: 'wrap-sage',        name: 'Sage Linen',        material: 'Linen sheet',      tint: '#a5b490' },
  { id: 'wrap-lace',        name: 'French Lace',       material: 'Cotton lace',      tint: '#fbf7f0' },
  { id: 'wrap-burlap',      name: 'Rustic Burlap',     material: 'Jute',             tint: '#c9a878' },
  { id: 'wrap-cellophane',  name: 'Clear Cellophane',  material: 'Biodegradable',    tint: '#dbeaf0' },
  { id: 'wrap-newsprint',   name: 'Vintage Newsprint', material: 'Printed paper',    tint: '#efe9d5' },
  { id: 'wrap-navy',        name: 'Deep Navy',         material: 'Waxed paper',      tint: '#1e2f4d' },
  { id: 'wrap-terracotta',  name: 'Terracotta Craft',  material: 'Textured craft',   tint: '#c96e42' },
  { id: 'wrap-gold',        name: 'Gold Foil',         material: 'Foil sheet',       tint: '#d4a538' },
];
