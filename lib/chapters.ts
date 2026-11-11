import { mapViews, type MapView } from "./mapViews";

export type Photo = {
  src: string;
  caption: string;
  // CSS object-position, to keep the subject in frame when the photo is cropped.
  position?: string;
};

export type Chapter = {
  id: string;
  districtId: string | null;
  title: string;
  subtitle?: string;
  theme?: string;
  color?: string;
  body: string;
  photos: Photo[];
  view: MapView;
};

// One accent colour per district; drives the map fill, card accents and dots.
export const districtColors: Record<string, string> = {
  jakpus: "#f4a261",
  jakbar: "#2ec4b6",
  jaksel: "#c77dff",
  jakut: "#4cc9f0",
  jaktim: "#90be6d",
};

const P = "/images/photos";

export const chapters: Chapter[] = [
  {
    id: "intro",
    districtId: null,
    title: "Jakarta",
    subtitle: "Lima wajah, satu kota",
    body: "DKI Jakarta terbagi menjadi lima kota administrasi daratan. Masing-masing punya denyutnya sendiri: bisnis, kampus, hiburan, pelabuhan, dan pabrik. Scroll untuk memulai.",
    photos: [],
    view: mapViews.overview,
  },
  {
    id: "jakpus",
    districtId: "jakpus",
    title: "Jakarta Pusat",
    subtitle: "Jantung bisnis",
    theme: "Bisnis",
    color: districtColors.jakpus,
    body: "Menara kantor berjajar di sepanjang koridor Sudirman dan kawasan SCBD, jantung ekonomi ibu kota dan kawasan tersibuknya di jam kerja.",
    photos: [{ src: `${P}/scbd.jpg`, caption: "SCBD", position: "center 35%" }],
    view: mapViews.jakpus,
  },
  {
    id: "jakbar",
    districtId: "jakbar",
    title: "Jakarta Barat",
    subtitle: "Kampus dan kuliner",
    theme: "Pendidikan & Kuliner",
    color: districtColors.jakbar,
    body: "Di sekitar Grogol, tiga kampus besar berdiri hampir berdampingan: Trisakti, Untar, dan Ciputra. Ribuan mahasiswanya menghidupi Tanjung Duren, salah satu pusat kuliner paling ramai di barat Jakarta.",
    photos: [
      { src: `${P}/trisakti.jpg`, caption: "Universitas Trisakti", position: "center 60%" },
    ],
    view: mapViews.jakbar,
  },
  {
    id: "jaksel",
    districtId: "jaksel",
    title: "Jakarta Selatan",
    subtitle: "Budaya pop dan hiburan",
    theme: "Pop Culture & Hiburan",
    color: districtColors.jaksel,
    body: "Blok M sudah jadi tempat nongkrong sejak puluhan tahun lalu dan kini hidup lagi bersama MRT dan M Bloc Space, bekas kompleks perumahan Peruri yang disulap jadi ruang kreatif dan live house. Sedikit ke selatan, Kemang melengkapi panggung anak muda Jakarta.",
    photos: [{ src: `${P}/mbloc.jpg`, caption: "M Bloc Space", position: "center 30%" }],
    view: mapViews.jaksel,
  },
  {
    id: "jakut",
    districtId: "jakut",
    title: "Jakarta Utara",
    subtitle: "Perdagangan dan pecinan",
    theme: "Perdagangan & Pecinan",
    color: districtColors.jakut,
    body: "Wajah pesisir Jakarta: kawasan modern PIK di barat laut, hingga jalur dagang lama di sekitar Glodok yang berakar dari pecinan Batavia. Di sinilah Jakarta paling dekat dengan lautnya.",
    photos: [
      { src: `${P}/pik.jpg`, caption: "Pantjoran PIK", position: "center 30%" },
      { src: `${P}/glodok.jpg`, caption: "Glodok Pancoran", position: "center 40%" },
    ],
    view: mapViews.jakut,
  },
  {
    id: "jaktim",
    districtId: "jaktim",
    title: "Jakarta Timur",
    subtitle: "Mesin industri kota",
    theme: "Industri Manufaktur",
    color: districtColors.jaktim,
    body: "Kota administrasi terluas di Jakarta. Kawasan Industri Pulogadung (JIEP) menjadi motor manufakturnya, tempat pabrik dan gudang menopang rantai pasok ibu kota.",
    photos: [
      { src: `${P}/pulogadung.jpg`, caption: "Kawasan Industri Pulogadung", position: "center 50%" },
    ],
    view: mapViews.jaktim,
  },
  {
    id: "outro",
    districtId: null,
    title: "Lima kota, satu Jakarta.",
    subtitle: "Ceritanya selesai, petanya masih terbuka",
    body: "Jelajahi petanya dengan bebas dan nyalakan lapisan yang kamu mau, atau lihat README untuk arsitektur, strategi data, dan timeline.",
    photos: [],
    view: mapViews.overview,
  },
];
