# Redesign sandbox

> **Status: sudah diimplementasikan & live.** Mockup HTML di folder ini dipakai
> untuk merancang redesign, lalu di-port ke komponen Next.js di `components/v2/`
> dengan design system di `app/v2/v2.css`. Redesign kini menjadi halaman utama
> (`/`) di produksi; file di sini disimpan sebagai referensi desain.

Preview visual redesign yang **terisolasi** dari kode aplikasi. Tidak ada file di
`app/`, `components/`, atau `lib/` yang disentuh sampai sebuah section disetujui
dan di-port manual ke komponen Next.js.

## Aturan main

- **Data spasial tidak berubah.** Semua tetap dari PostGIS + GeoServer (tiles / WFS /
  WMTS). Mockup ini hanya lapisan presentasi + interaksi.
- **Kode lama aman.** Tiap file di sini self-contained (HTML + CSS + JS inline),
  dibuka langsung di browser tanpa build.
- **Step by step.** Satu section per file. Urutan: Hero → Benefits → How it works →
  Proof → CTA.
- **Merge hanya setelah disetujui.** Begitu kamu approve sebuah section, nilainya
  (font, token warna, motion, markup) kuport ke `app/globals.css` + komponen terkait.

## Design values (sumber kebenaran)

| Aspek | Nilai |
|---|---|
| Font | Geist (teks) + Geist Mono (angka). Tanpa italic, maksimal bold. |
| Background dark | `#181818` `#1F1F1F` `#272727` `#313131` |
| Hero heading | gradient teks `#FFFFFF → #9B9B9B` (kiri→kanan, teks saja) |
| Accent (UI) | `#E0A458` — satu accent, saturasi < 80% |
| Warna distrik (DATA) | `#f4a261 #2ec4b6 #c77dff #4cc9f0 #90be6d` — milik style peta, tak diubah |
| Spacing | 0 2 4 8 12 16 24 32 40 48 64 80 96 px |
| Radius | skala Tailwind; nested = outer − gap (bila > 2) |
| Ikon | Phosphor |
| Motion | `cubic-bezier(0.22,1,0.36,1)`, 500ms gerak / 300ms warna; hormati `prefers-reduced-motion` |

## File

- `01-hero.html` — Hero (living map + stat tiles + word reveal)
