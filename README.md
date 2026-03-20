# DiziBul - Rastgele Dizi Önerici 🎲📺

DiziBul, kullanıcılara rastgele kaliteli dizi önerileri sunan, görsel olarak zengin ve animasyonlu bir web uygulamasıdır. İçerik ve diziler [TVmaze API](https://www.tvmaze.com/api) aracılığıyla çekilerek kullanıcının karşısına şık ve kullanışlı bir tasarımla sunulur.

## 🚀 Özellikler

- **İki Farklı Öneri Modu:** İster o anki ruh halinize uygun (Mutlu, Hüzünlü vb.) bir seçenek yapın, isterseniz de tek tıkla devasa kataloğun içinden tamamen rastgele bir dizi önerisi alın.
- **Detaylı Bilgiler:** Diziye ait tür (genre), IMDb puanı, toplam sezon/bölüm sayısı, yayınlandığı platform (örneğin Netflix) ve kısa konu özeti (description) yer alır.
- **Tema Sistemi:** Sağ üst kısımdan **Birlik (Siyah&Sarı)**, **Dark (Koyu materyal)** ve **Light (Aydınlık)** temaları anlık olarak aktif edilebilir.
- **İzleme Listesi (Watchlist):** Beğendiğiniz bir diziyi hızlıca `📌 Listeme Ekle` butonu ile kaydedebilirsiniz. Kaydettiğiniz diziler `localStorage` ile tarayıcınızın hafızasında tutulur.
- **Fragman Yönlendirmesi:** "Fragmanı İzle" butonu otomatik olarak YouTube aramasında dizinin ismini geçirir ve ilk video sonucuna yöneltir.
- **Anime.js Entegrasyonu:** Minimal ve modern sayfa içi geçişleri, form animasyonları ve loader yapısı tamamen `anime.js` kullanılarak modellenmiştir.

## 🛠️ Kurulum ve Kullanım

Bu proje herhangi bir paket yöneticisi (npm, yarn) veya derleme aracı gerektirmez! 

1. Dosyaları indirin veya klonlayın (`index.html`, `style.css`, `script.js`).
2. Doğrudan **`index.html`** dosyasını tarayıcınızda çift tıklayarak çalıştırın.
3. Veya bir Live Server (VSCode Eklentisi) üzerinden portlayarak açın.

## 📁 Proje Yapısı

- `index.html` : Modal yapıları, animasyon iskeletleri, üstbar ve container elemanlarının HTML'i.
- `style.css` : Flexbox tasarımı, modern cam form (glassmorphism) efektleri, karanlık/aydınlık tema variable'ları.
- `script.js` : TVmaze API entegrasyonu, `anime.js` Timeline kullanımları, LocalStorage işlemleri ve rastgele veri çekimi.

## 💡 TVmaze API Hakkında
Proje `https://api.tvmaze.com` uç noktasını kullanmaktadır:
- Kayıt gerektirmez, API Anahtarı **yoktur**.
- Düzenli olarak `/shows?page=` ile rastgele diziler alınır.
- `?embed=seasons` parametresi ile dizi detail isteği genişletilir ve sezon istatistikleri elde edilir.

---

> Proje içerisinde temiz bir yapı korumak amacıyla kod içi yorum satırları bırakılmamıştır. Kodlar modern JavaScript standartlarına (ES6+ ve Async/Await) uygun yazılmıştır.
