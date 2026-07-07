export interface Flower {
  id: string;
  name: string;
  latin: string;
  palette: string[];
  seasonal: string;
}

export interface Vase {
  id: string;
  name: string;
  material: string;
}

export interface Wrap {
  id: string;
  name: string;
  material: string;
}

export const flowers: Flower[] = [
  { id: 'rose-red',        name: 'Red Garden Rose',    latin: 'Rosa gallica',        palette: ['#b3122a', '#e21e3d'], seasonal: 'Year round' },
  { id: 'rose-blush',      name: 'Blush Rose',         latin: 'Rosa × alba',         palette: ['#f4c2c2', '#e8a4a4'], seasonal: 'Year round' },
  { id: 'rose-white',      name: 'Ivory Rose',         latin: 'Rosa alba',           palette: ['#fbf7f0', '#e9dfd0'], seasonal: 'Year round' },
  { id: 'peony-pink',      name: 'Coral Peony',        latin: 'Paeonia lactiflora',  palette: ['#ff8fa3', '#ffb3c1'], seasonal: 'Late spring' },
  { id: 'peony-white',     name: 'White Peony',        latin: 'Paeonia lactiflora',  palette: ['#fffaf3', '#f2e6d8'], seasonal: 'Late spring' },
  { id: 'tulip-yellow',    name: 'Yellow Tulip',       latin: 'Tulipa gesneriana',   palette: ['#f4c430', '#ffd95a'], seasonal: 'Spring' },
  { id: 'tulip-purple',    name: 'Purple Tulip',       latin: 'Tulipa gesneriana',   palette: ['#6a3aa8', '#8a5cc9'], seasonal: 'Spring' },
  { id: 'lily-white',      name: 'Casablanca Lily',    latin: 'Lilium orientalis',   palette: ['#ffffff', '#f0e9d6'], seasonal: 'Summer' },
  { id: 'sunflower',       name: 'Sunflower',          latin: 'Helianthus annuus',   palette: ['#f5b301', '#8b5a2b'], seasonal: 'Summer' },
  { id: 'hydrangea-blue',  name: 'Blue Hydrangea',     latin: 'Hydrangea macrophylla', palette: ['#7aa7d6', '#b3d4f0'], seasonal: 'Summer' },
  { id: 'daisy',           name: 'Shasta Daisy',       latin: 'Leucanthemum × superbum', palette: ['#ffffff', '#ffd400'], seasonal: 'Summer' },
  { id: 'ranunculus',      name: 'Coral Ranunculus',   latin: 'Ranunculus asiaticus', palette: ['#ff6f61', '#ff8e7c'], seasonal: 'Spring' },
  { id: 'anemone',         name: 'White Anemone',      latin: 'Anemone coronaria',   palette: ['#ffffff', '#1a1a1a'], seasonal: 'Spring' },
  { id: 'eucalyptus',      name: 'Silver Eucalyptus',  latin: 'Eucalyptus cinerea',  palette: ['#9caf88', '#c7d3bf'], seasonal: 'Year round' },
  { id: 'baby-breath',     name: "Baby's Breath",      latin: 'Gypsophila paniculata', palette: ['#ffffff', '#f6f6f6'], seasonal: 'Year round' },
  { id: 'lavender',        name: 'French Lavender',    latin: 'Lavandula stoechas',  palette: ['#7a5fbf', '#b39ddb'], seasonal: 'Summer' },
];

export const vases: Vase[] = [
  { id: 'vase-glass-cyl',    name: 'Clear Glass Cylinder',  material: 'Blown glass' },
  { id: 'vase-crystal',      name: 'Crystal Vase',          material: 'Cut crystal' },
  { id: 'vase-ceramic-white',name: 'White Ceramic Urn',     material: 'Glazed stoneware' },
  { id: 'vase-terracotta',   name: 'Terracotta Pot',        material: 'Fired clay' },
  { id: 'vase-brass',        name: 'Brushed Brass Vase',    material: 'Brass' },
  { id: 'vase-black-matte',  name: 'Matte Black Ceramic',   material: 'Matte glaze' },
  { id: 'vase-mason',        name: 'Mason Jar',             material: 'Recycled glass' },
  { id: 'vase-bud-trio',     name: 'Bud Vase Trio',         material: 'Amber glass' },
  { id: 'vase-porcelain-blue', name: 'Blue Porcelain',      material: 'Painted porcelain' },
  { id: 'vase-fluted',       name: 'Fluted Milk Glass',     material: 'Opaque glass' },
];

export const wraps: Wrap[] = [
  { id: 'wrap-kraft',        name: 'Kraft Paper',           material: 'Recycled kraft' },
  { id: 'wrap-white',        name: 'Ivory Tissue',          material: 'Tissue paper' },
  { id: 'wrap-black',        name: 'Matte Black',           material: 'Coated paper' },
  { id: 'wrap-blush',        name: 'Blush Pink',            material: 'Korean wrap' },
  { id: 'wrap-sage',         name: 'Sage Linen',            material: 'Linen sheet' },
  { id: 'wrap-lace',         name: 'French Lace',           material: 'Cotton lace' },
  { id: 'wrap-burlap',       name: 'Rustic Burlap',         material: 'Jute' },
  { id: 'wrap-cellophane',   name: 'Clear Cellophane',      material: 'Biodegradable film' },
  { id: 'wrap-newsprint',    name: 'Vintage Newsprint',     material: 'Printed paper' },
  { id: 'wrap-navy',         name: 'Deep Navy',             material: 'Waxed paper' },
  { id: 'wrap-terracotta',   name: 'Terracotta Craft',      material: 'Textured craft' },
  { id: 'wrap-gold',         name: 'Gold Foil',             material: 'Foil sheet' },
];
