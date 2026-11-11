# antislop audit 001, laporan tindak lanjut — 2026-11-11

Cakupan: temuan HIGH #1 sampai #10 dari `audit-001-2026-11-11.md`, disetujui user ("Semua HIGH"). Dikerjakan di branch `fix/antislop-high`, bukan di `main`. Temuan MEDIUM (#11 sampai #17), LOW (#18 sampai #22), dan peluang (#23 sampai #25) tidak disentuh.

Hasil verifikasi: 90 test lulus (sebelumnya 49), build produksi bersih, tidak ada error di console, tidak ada overflow horizontal di 390px dan 1366px.

---

## Status per temuan

**#1 Angka statistik tanpa sumber: selesai.**
Tile hero kini dihitung dari data peta itu sendiri lewat `lib/dataStats.ts`, saat build, di `app/page.tsx`. Nilai akhir yang tampil: 5 kota administrasi, 12 landmark, 6 foto lokasi, 645 km² (luas dihitung dari geometri GADM, rumus luas bola, diuji terhadap persegi 0,1 derajat di ekuator). Angka 44 kecamatan, 267 kelurahan, dan 662 km² dihapus, begitu juga klaim "Agregat atribut layer". Catatan keterangan kini berbunyi "Dihitung langsung dari data GeoJSON peta".
Bukti: `tests/dataStats.test.ts` (5 test), `tests/ChapterV2.test.tsx` (nilai tile berasal dari props, teks "kecamatan" dan "kelurahan" tidak muncul). Di browser nilai akhir terbaca 5, 12, 6, 645 setelah animasi selesai.

**#2 Em dash di teks UI: selesai.**
Judul halaman kini "Jakarta: Lima Wajah Satu Kota". Tiga kalimat naratif di `lib/chapters.ts` ditulis ulang dengan koma dan titik dua. Keterangan hero ikut diganti (#1). Teks "6 foto, klik untuk memperbesar" di galeri juga tanpa tanda pisah.
Bukti: `ChapterV2.test.tsx` memeriksa tidak ada em dash di semua judul, subjudul, dan isi bab; HTML hasil build berjudul tanpa em dash.

**#3 Landmark `<main>` dan heading: selesai.**
`app/page.tsx` membungkus aplikasi dengan `<main>`. Galeri kini memakai `h1`; mode Jelajah punya `h1` tersembunyi secara visual ("Jelajahi peta"), jadi selalu ada tepat satu `h1`.
Bukti: terukur di browser: landmark `MAIN, NAV[Mode], NAV[Bab]`, satu `h1` di tiap mode.

**#4 ARIA tablist tidak valid: selesai.**
Navigator bab kini `<nav aria-label="Bab">` berisi tombol dengan `aria-label` dan `aria-current`. `role="tablist"` dihapus.
Bukti: `StoryAppV2.test.tsx` (tidak ada `tablist` maupun `tab`); terukur di browser.

**#5 Target sentuh di bawah 44px: selesai.**
Tombol nav 44px (sebelumnya 27px), tombol "Kembali ke cerita" 44px, baris toggle Jelajah 44px dengan kotak centang 20px, titik bab 44x44 dengan titik visual tetap 10px, tombol lightbox 44x44.
Bukti: diukur di browser, 390x844 dan 1366x820.

**#6 Kartu hero menutupi peta di mobile: selesai.**
Kartu hero turun dari 550px (65% layar) menjadi 244px (29%): tile statistik dan petunjuk scroll disembunyikan di layar sempit. Kartu bab lain dipadatkan (padding, foto 21:9, teks 14px). `cameraPadding` bawah di mobile dinaikkan dari 45% ke 55% tinggi layar. Semua tujuh kartu kini 29% sampai 50% tinggi layar, di bawah batas 55%, jadi peta tampil utuh di atas kartu.
Bukti: tinggi tiap kartu diukur di 390x844: intro 244, jakpus 352, jakbar 396, jaksel 418, jakut 304, jaktim 374, outro 271 (piksel). Screenshot mobile menunjukkan kelima distrik terlihat di atas kartu hero. `tests/mapLayers.test.ts` tetap lulus.

**#7 State loading, error, kosong: selesai.**
`MapCanvas` kini melaporkan status lewat prop `onStatus`: `ready` saat peta termuat, `error` bila data distrik atau landmark gagal, bila gaya peta tidak datang sebelum load, atau bila peta belum selesai dimuat setelah 20 detik. Kegagalan satu tile basemap sengaja diabaikan. `StoryAppV2` menampilkan status "Memuat peta" selama memuat, dan pesan "Peta gagal dimuat. Periksa koneksi internetmu, lalu muat ulang halaman." dengan tombol "Muat ulang" saat galat. Foto yang gagal dimuat menampilkan keterangannya, bukan kotak kosong. Galeri punya tampilan kosong.
Bukti: `MapCanvas.test.tsx` (5 test status baru), `StoryAppV2.test.tsx` (status loading dan error), `ChapterV2.test.tsx` (foto gagal). Batasan: tampilan error dan loading diuji lewat unit test; saya tidak memaksa kegagalan jaringan di browser.

**#8 Fokus lightbox: selesai.**
Fokus pindah ke tombol "Tutup" saat dialog terbuka, Tab dan Shift+Tab berputar di dalam dialog, dan fokus kembali ke tile saat ditutup.
Bukti: `Lightbox.test.tsx` (2 test baru). Di browser: Enter pada tile membuka dialog dengan fokus di "Tutup"; tiga kali Tab kembali ke "Tutup" tetap di dalam dialog; Escape menutup dan fokus kembali ke tile pertama.

**#9 State `:active`: selesai.**
Ditambahkan untuk tombol nav, titik bab, tombol kembali, tombol lightbox (termasuk sebelumnya/berikutnya yang memakai transform posisi), dan tile galeri.
Bukti: pemeriksaan kode (`app/v2/v2.css`). Saya tidak menekan-tahan tombol di browser, jadi tampilan visualnya belum dilihat.

**#10 Redesign tanpa test dan tanpa uji mobile: selesai.**
Test baru: `NavV2` (3), `ChapterV2` (10), `ScrollerV2` (3), `StoryAppV2` (13), `dataStats` (5), tambahan di `MapCanvas` (5) dan `Lightbox` (2). Total 90 test. Click-through mobile dan keyboard dicatat di bawah.

---

## Click-through (R-35), dicatat apa adanya

Dijalankan di dev server lokal (`npm run dev`) setelah `.next` dibersihkan, viewport 390x844 lalu 1366x820.

| Langkah | Hasil |
|---|---|
| Muat `/` di 390x844 | Peta siap, tidak ada status loading tersisa, tidak ada overflow horizontal, tidak ada error di console |
| Landmark dokumen | `MAIN`, `NAV[Mode]`, `NAV[Bab]`; satu `h1` "Jakarta"; tidak ada `tablist` |
| Ukuran tombol nav | 73x44, 70x44, 78x44 |
| Tinggi tujuh kartu bab | 244 sampai 418 px, semuanya di bawah batas 464 px |
| Klik "Galeri" | Tombol adalah elemen teratas di titik klik; handler memindah ke Galeri (`h1` "Landmark lima kota", 6 tile, "6 foto, klik untuk memperbesar") |
| Enter pada tile (keyboard) | Lightbox terbuka, fokus di "Tutup", tiga tombol masing-masing 44x44 |
| Tab x3 di lightbox | Fokus berputar kembali ke "Tutup", tidak keluar dari dialog |
| Escape | Dialog tertutup, fokus kembali ke tile pertama |
| Klik "Jelajah" | `h1` "Jelajahi peta"; baris toggle 170x44; tombol kembali 180x44; mengklik kotak centang mengubah `true` menjadi `false` |
| Desktop 1366x820, mode Cerita | Titik bab 44x44 (7 titik, kolom 308px), tile akhir 5 / 12 / 6 / 645 km² |

Batasan yang perlu diketahui:
- Klik pointer asli pertama pada "Galeri" tidak terdaftar karena jendela pane browser tersembunyi. Saya memastikan tombol itu elemen teratas pada titik klik (`elementFromPoint`) lalu memicu klik lewat skrip. Keyboard (Enter, Tab, Escape) memakai penekanan tombol asli dan berfungsi.
- Screenshot di pane sering gagal atau bertumpuk saat jendela tersembunyi, jadi sebagian bukti memakai pengukuran DOM, bukan gambar.
- Tampilan `:active`, loading, dan error tidak dilihat secara visual (lihat #7 dan #9).

---

## Yang masih terbuka (tidak disetujui untuk dikerjakan)

Dari pengecekan DOM di galeri terkonfirmasi bahwa temuan **#13** (CSS lama bocor) masih berlaku: caption tile memakai radius 999px dan border 1px lama, tile punya `box-shadow` dan overlay `linear-gradient` dari `app/globals.css`. Temuan #11 sampai #25 lainnya juga belum dikerjakan. Sebutkan nomor yang mau dilanjutkan.

## Status git

Perubahan ada di branch `fix/antislop-high`, belum di-push dan belum di-merge ke `main`. Produksi Vercel masih menampilkan versi sebelumnya sampai branch ini di-merge.
