import { mapViews, type MapView } from "./mapViews";

export type Chapter = {
  id: string;
  districtId: string | null;
  title: string;
  body: string;
  image: string | null;
  view: MapView;
  congestion?: boolean;
};

export const chapters: Chapter[] = [
  {
    id: "intro",
    districtId: null,
    title: "Jakarta — Lima Wajah Satu Kota",
    body: "Jelajahi lima kota administrasi DKI Jakarta, masing-masing dengan karakter dan denyutnya sendiri. Scroll untuk memulai.",
    image: null,
    view: mapViews.overview,
  },
  {
    id: "jakpus",
    districtId: "jakpus",
    title: "Jakarta Pusat — Jantung Bisnis",
    body: "Pusat bisnis ibu kota. Menara pencakar langit berjajar di koridor Sudirman dan kawasan SCBD — yang juga terkenal dengan kemacetannya.",
    image: "/images/jakpus-sudirman.svg",
    view: mapViews.jakpus,
    congestion: true,
  },
  {
    id: "jakbar",
    districtId: "jakbar",
    title: "Jakarta Barat — Kampus dan Kuliner",
    body: "Rumah bagi kampus ternama — Trisakti, Untar, dan Ciputra — serta surga kuliner di Tanjung Duren.",
    image: "/images/jakbar-untar.svg",
    view: mapViews.jakbar,
  },
  {
    id: "jaksel",
    districtId: "jaksel",
    title: "Jakarta Selatan — Pop Culture & Hiburan",
    body: "Episentrum budaya pop dan hiburan anak muda, dari legenda Blok M hingga kafe-kafe Kemang.",
    image: "/images/jaksel-blokm.svg",
    view: mapViews.jaksel,
  },
  {
    id: "jakut",
    districtId: "jakut",
    title: "Jakarta Utara — Perdagangan & Pecinan",
    body: "Gerbang perdagangan dan pelabuhan, dari kawasan modern PIK hingga pecinan bersejarah.",
    image: "/images/jakut-pik.svg",
    view: mapViews.jakut,
  },
  {
    id: "jaktim",
    districtId: "jaktim",
    title: "Jakarta Timur — Industri Manufaktur",
    body: "Basis industri manufaktur ibu kota, dengan kawasan Pulogadung sebagai motornya.",
    image: "/images/jaktim-pulogadung.svg",
    view: mapViews.jaktim,
  },
  {
    id: "outro",
    districtId: null,
    title: "Lima kota, satu Jakarta.",
    body: "Satu proof-of-concept WebGIS storytelling. Jelajahi petanya dengan bebas, atau lihat README untuk arsitektur, strategi data, dan timeline.",
    image: null,
    view: mapViews.overview,
  },
];
