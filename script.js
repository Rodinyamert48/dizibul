const dict = {
    tr: {
        subtitle: "Şu an nasıl hissediyorsun? Ruh haline en uygun diziyi senin için bulalım.",
        theme_birlik: "Birlik", theme_dark: "Karanlık", theme_light: "Aydınlık",
        watchlist_btn: "📑 Listem", watchlist_title: "İzleme Listem",
        type_series: "📺 Dizi", type_anime: "🎌 Anime", type_both: "🎲 Her İkisi",
        mood_happy: "Mutlu", mood_sad: "Hüzünlü", mood_angry: "Sinirli",
        mood_relaxed: "Sakin / Rahat", mood_romantic: "Romantik", mood_adventurous: "Maceracı",
        random_btn: "Ya Da Tamamen Rastgele Bul!", loader_text: "Veritabanı taranıyor...",
        error_title: "Bir Sorun Oluştu", error_desc: "İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", error_back: "Geri Dön",
        watch_trailer: "Fragmanı İzle", add_watchlist: "📌 Listeme Ekle", added_watchlist: "✅ Listede",
        share_btn: "📤 Paylaş", shared_btn: "✅ Kopyalandı!", reset_btn: "Başka Bul", similar_btn: "🔍 Benzerlerini Öner",
        show_cast: "🎭 Oyuncuları Gör", hide_cast: "🎭 Oyuncuları Gizle",
        alert_no_result: "Bu duygu durumuna uygun dizi bulunamadı."
    },
    en: {
        subtitle: "How are you feeling right now? Let's find the best show for your mood.",
        theme_birlik: "Birlik", theme_dark: "Dark", theme_light: "Light",
        watchlist_btn: "📑 My List", watchlist_title: "My Watchlist",
        type_series: "📺 Series", type_anime: "🎌 Anime", type_both: "🎲 Both",
        mood_happy: "Happy", mood_sad: "Sad", mood_angry: "Angry",
        mood_relaxed: "Relaxed", mood_romantic: "Romantic", mood_adventurous: "Adventurous",
        random_btn: "Or Find Something Completely Random!", loader_text: "Scanning database...",
        error_title: "Something Went Wrong", error_desc: "Check your internet connection or try again later.", error_back: "Go Back",
        watch_trailer: "Watch Trailer", add_watchlist: "📌 Add to List", added_watchlist: "✅ Added",
        share_btn: "📤 Share", shared_btn: "✅ Copied!", reset_btn: "Find Another", similar_btn: "🔍 Suggest Similar",
        show_cast: "🎭 View Cast", hide_cast: "🎭 Hide Cast",
        alert_no_result: "No show found for this mood."
    }
};

let currentLang = 'tr';

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[currentLang][key]) {
            if (el.childNodes.length > 1) {
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                        node.textContent = ' ' + dict[currentLang][key];
                    }
                });
            } else {
                el.innerText = dict[currentLang][key];
            }
        }
    });
}

async function translateText(text, targetLang) {
    if (!text || text === dict['en'].desc_none || text === dict['tr'].desc_none) return text;
    if (targetLang === 'en') return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map(x => x[0]).join('');
    } catch (e) {
        console.warn("Çeviri hatası", e);
        return text;
    }
}

const prefLogic = {
    getDislikes: () => JSON.parse(localStorage.getItem('dislikes') || '[]'),
    addDislike: (id) => {
        let list = prefLogic.getDislikes();
        if (!list.includes(id)) { list.push(id); localStorage.setItem('dislikes', JSON.stringify(list)); }
    },
    getLikes: () => JSON.parse(localStorage.getItem('likes') || '[]'),
    addLike: (genres) => {
        let list = prefLogic.getLikes();
        genres.forEach(g => { if (!list.includes(g)) list.push(g); });
        localStorage.setItem('likes', JSON.stringify(list));
    }
};

const moodToGenre = {
    happy: ['Comedy', 'Family', 'Children'],
    sad: ['Drama', 'Tragedy'],
    angry: ['Action', 'Crime', 'Thriller', 'Mystery'],
    relaxed: ['Anime', 'Documentary', 'Nature', 'Travel'],
    romantic: ['Romance'],
    adventurous: ['Adventure', 'Science-Fiction', 'Fantasy']
};

const animeToGenre = {
    happy: ['Comedy', 'Slice of Life'],
    sad: ['Drama', 'Psychological'],
    angry: ['Action', 'Thriller', 'Mecha'],
    relaxed: ['Slice of Life', 'Fantasy', 'Music'],
    romantic: ['Romance'],
    adventurous: ['Adventure', 'Sci-Fi']
};

let currentShowId = null;
let currentShowTitle = '';
let currentShowGenre = '';
let currentShowRawGenres = [];
let currentShowDescEn = '';
let currentShowDescTr = '';

const anilistApiService = {
    fetchRecommendation: async function (mood) {
        let variables = {};
        let genreFilter = "";

        let randomPage;
        if (mood && mood !== 'random') {
            const targetGenres = animeToGenre[mood];
            genreFilter = `genre_in: ${JSON.stringify(targetGenres)}, `;
            randomPage = Math.floor(Math.random() * 5) + 1;
        } else {
            randomPage = Math.floor(Math.random() * 50) + 1;
        }

        const query = `
        query ($page: Int) {
          Page(page: $page, perPage: 50) {
            media(type: ANIME, ${genreFilter}sort: POPULARITY_DESC) {
              id
              title { romaji english native }
              description
              seasonYear
              averageScore
              episodes
              status
              genres
              coverImage { large }
              trailer { site id }
              studios(isMain: true) { nodes { name } }
              characters(sort: ROLE, perPage: 8) { nodes { name { full } image { large } } }
            }
          }
        }
        `;

        variables = { page: randomPage };

        const url = 'https://graphql.anilist.co';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error("AniList bağlantı hatası.");
            const data = await response.json();
            const mediaList = data.data.Page.media;

            if (mediaList.length === 0) throw new Error("Duygu durumuna uygun anime bulunamadı.");

            const dislikes = prefLogic.getDislikes();
            let availableShows = mediaList.filter(s => !dislikes.includes("A" + s.id));
            if (availableShows.length === 0) availableShows = mediaList;

            const randomAnime = availableShows[Math.floor(Math.random() * availableShows.length)];

            const summaryText = randomAnime.description ? randomAnime.description.replace(/<[^>]*>?/gm, '') : "Açıklama bulunmuyor.";
            const platform = (randomAnime.studios && randomAnime.studios.nodes.length > 0) ? randomAnime.studios.nodes[0].name : "Bilinmiyor";
            const trailerUrl = (randomAnime.trailer && randomAnime.trailer.site === "youtube")
                ? `https://www.youtube.com/watch?v=${randomAnime.trailer.id}`
                : `https://www.youtube.com/results?search_query=${encodeURIComponent((randomAnime.title.english || randomAnime.title.romaji) + " anime trailer")}`;

            let statusText = "Bilinmiyor";
            if (randomAnime.status === "FINISHED") statusText = "Tamamlandı";
            if (randomAnime.status === "RELEASING") statusText = "Devam Ediyor";
            if (randomAnime.status === "NOT_YET_RELEASED") statusText = "Yakında";
            if (randomAnime.status === "CANCELLED") statusText = "İptal Edildi";

            let castList = [];
            if (randomAnime.characters && randomAnime.characters.nodes) {
                castList = randomAnime.characters.nodes.map(c => ({
                    name: c.name.full,
                    role: "Character",
                    image: c.image.large || 'https://via.placeholder.com/60x60.png?text=?'
                }));
            }

            return {
                id: "A" + randomAnime.id,
                title: randomAnime.title.english || randomAnime.title.romaji,
                genre: randomAnime.genres.length > 0 ? randomAnime.genres.slice(0, 3).join(", ") : "Anime",
                rawGenres: randomAnime.genres,
                year: randomAnime.seasonYear || "Belirsiz",
                rating: randomAnime.averageScore ? (randomAnime.averageScore / 10).toFixed(1) : "N/A",
                desc: summaryText,
                posterUrl: randomAnime.coverImage.large,
                trailer: trailerUrl,
                platform: platform,
                status: statusText,
                seasonsText: randomAnime.episodes ? `${randomAnime.episodes} Bölüm` : "Belirsiz",
                castList: castList
            };
        } catch (error) {
            throw error;
        }
    },
    fetchSimilar: async function(animeId) {
        const query = `
        query($id: Int) {
          Media(id: $id, type: ANIME) {
            recommendations(sort: RATING_DESC, page: 1, perPage: 15) {
              nodes {
                mediaRecommendation {
                  id title { romaji english native } description seasonYear averageScore episodes status genres coverImage { large } trailer { site id } studios(isMain: true) { nodes { name } } characters(sort: ROLE, perPage: 8) { nodes { name { full } image { large } } }
                }
              }
            }
          }
        }`;
        const variables = { id: parseInt(animeId.toString().replace("A", "")) };
        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const data = await res.json();
        const mediaList = data.data.Media.recommendations.nodes.map(n => n.mediaRecommendation).filter(m => m != null);
        if(mediaList.length === 0) throw new Error(dict[currentLang].alert_no_result);
        const dislikes = prefLogic.getDislikes();
        let available = mediaList.filter(s => !dislikes.includes("A" + s.id));
        if(available.length === 0) available = mediaList;
        const anm = available[Math.floor(Math.random() * available.length)];
        
        let cList = [];
        if (anm.characters && anm.characters.nodes) {
            cList = anm.characters.nodes.map(c => ({
                name: c.name.full, role: "Character", image: c.image.large || 'https://via.placeholder.com/60x60.png?text=?'
            }));
        }
        return {
            id: "A" + anm.id, title: anm.title.english || anm.title.romaji, genre: anm.genres.length>0 ? anm.genres.slice(0,3).join(", ") : "Anime", rawGenres: anm.genres,
            year: anm.seasonYear || "Belirsiz", rating: anm.averageScore ? (anm.averageScore/10).toFixed(1) : "N/A",
            desc: anm.description ? anm.description.replace(/<[^>]*>?/gm, '') : dict['en'].desc_none,
            posterUrl: anm.coverImage.large, trailer: (anm.trailer && anm.trailer.site==="youtube") ? `https://www.youtube.com/watch?v=${anm.trailer.id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent((anm.title.english||anm.title.romaji)+" anime trailer")}`,
            platform: (anm.studios && anm.studios.nodes.length>0) ? anm.studios.nodes[0].name : dict['en'].platform_unknown,
            status: anm.status==="FINISHED"?"Ended":(anm.status==="RELEASING"?"Running":anm.status), seasonsText: anm.episodes ? `${anm.episodes} Bölüm` : "Belirsiz", castList: cList
        };
    }
};

const seriesApiService = {
    fetchRecommendation: async function (mood) {
        let randomPage;
        let requiresGenreMatch = false;
        let targetGenres = [];

        if (mood && mood !== 'random') {
            targetGenres = moodToGenre[mood];
            requiresGenreMatch = true;
            randomPage = Math.floor(Math.random() * 5);
        } else {
            randomPage = Math.floor(Math.random() * 250);
        }

        try {
            let res = await fetch(`https://api.tvmaze.com/shows?page=${randomPage}`);
            if (!res.ok) {
                res = await fetch(`https://api.tvmaze.com/shows?page=1`);
                if (!res.ok) throw new Error("TVmaze bağlantı hatası.");
            }

            const data = await res.json();
            if (data.length === 0) throw new Error("Dizi bulunamadı.");

            let matchedShows = data;

            if (!requiresGenreMatch) {
                const likes = prefLogic.getLikes();
                if (likes.length > 0 && Math.random() > 0.5) {
                    let likedShows = data.filter(show => show.genres && show.genres.some(g => likes.includes(g)));
                    if (likedShows.length > 0) matchedShows = likedShows;
                }
            }

            if (requiresGenreMatch) {
                matchedShows = data.filter(show => {
                    if (!show.genres) return false;
                    return show.genres.some(g => targetGenres.includes(g));
                });

                if (matchedShows.length === 0) {
                    throw new Error(dict[currentLang].alert_no_result);
                }
            }

            const dislikes = prefLogic.getDislikes();
            let availableShows = matchedShows.filter(s => !dislikes.includes(s.id));
            if (availableShows.length === 0) availableShows = matchedShows;

            let randomShow = availableShows[Math.floor(Math.random() * availableShows.length)];

            const detailRes = await fetch(`https://api.tvmaze.com/shows/${randomShow.id}?embed[]=seasons&embed[]=cast`);
            const showDetails = await detailRes.json();

            const summaryText = showDetails.summary ? showDetails.summary.replace(/<[^>]*>?/gm, '') : "Açıklama bulunmuyor.";
            const platform = showDetails.webChannel ? showDetails.webChannel.name : (showDetails.network ? showDetails.network.name : "İnternet");

            let totalEpisodes = 0;
            let totalSeasons = 0;
            if (showDetails._embedded && showDetails._embedded.seasons) {
                totalSeasons = showDetails._embedded.seasons.length;
                totalEpisodes = showDetails._embedded.seasons.reduce((acc, season) => acc + (season.episodeOrder || 0), 0);
            }
            let episodeString = `${totalSeasons} Sezon`;
            if (totalEpisodes > 0) episodeString += ` (${totalEpisodes} Bölüm)`;

            let castList = [];
            if (showDetails._embedded && showDetails._embedded.cast) {
                castList = showDetails._embedded.cast.slice(0, 8).map(c => ({
                    name: c.person.name,
                    role: c.character.name,
                    image: c.person.image ? c.person.image.medium : 'https://via.placeholder.com/60x60.png?text=?'
                }));
            }

            return {
                id: showDetails.id,
                title: showDetails.name,
                genre: showDetails.genres.length > 0 ? showDetails.genres.join(", ") : "Dizi",
                rawGenres: showDetails.genres,
                year: showDetails.premiered ? showDetails.premiered.substring(0, 4) : "Belirsiz",
                rating: showDetails.rating && showDetails.rating.average ? showDetails.rating.average.toFixed(1) : "N/A",
                desc: summaryText,
                posterUrl: showDetails.image && showDetails.image.original ? showDetails.image.original : (showDetails.image?.medium || null),
                trailer: `https://www.youtube.com/results?search_query=${encodeURIComponent(showDetails.name + " tv series trailer")}`,
                platform: platform,
                status: showDetails.status === "Ended" ? "Tamamlandı" : (showDetails.status === "Running" ? "Devam Ediyor" : showDetails.status),
                seasonsText: episodeString,
                castList: castList
            };
        } catch (error) {
            throw error;
        }
    },
    fetchSimilar: async function(genres, excludeId) {
        let attempts = 0;
        let bestMatch = null;
        while(attempts < 10) {
            attempts++;
            try {
                const randomPage = Math.floor(Math.random() * 20);
                const res = await fetch(`https://api.tvmaze.com/shows?page=${randomPage}`);
                if(!res.ok) continue;
                const data = await res.json();
                const dislikes = prefLogic.getDislikes();
                let matches = data.filter(show => {
                    if (show.id === excludeId || dislikes.includes(show.id)) return false;
                    if (!show.genres) return false;
                    const common = show.genres.filter(g => genres.includes(g));
                    return common.length >= Math.min(2, genres.length || 1);
                });
                if (matches.length > 0) {
                    bestMatch = matches[Math.floor(Math.random() * matches.length)];
                    break;
                }
            } catch(e) {}
        }
        if(!bestMatch) throw new Error(dict[currentLang].alert_no_result);
        
        const detailRes = await fetch(`https://api.tvmaze.com/shows/${bestMatch.id}?embed[]=seasons&embed[]=cast`);
        const showDetails = await detailRes.json();
        const platform = showDetails.webChannel ? showDetails.webChannel.name : (showDetails.network ? showDetails.network.name : "İnternet");
        let totalEpisodes = 0, totalSeasons = 0;
        if (showDetails._embedded && showDetails._embedded.seasons) {
            totalSeasons = showDetails._embedded.seasons.length;
            totalEpisodes = showDetails._embedded.seasons.reduce((a, s) => a + (s.episodeOrder || 0), 0);
        }
        let castList = [];
        if (showDetails._embedded && showDetails._embedded.cast) {
            castList = showDetails._embedded.cast.slice(0, 8).map(c => ({
                name: c.person.name, role: c.character.name, image: c.person.image ? c.person.image.medium : 'https://via.placeholder.com/60x60.png?text=?'
            }));
        }
        return {
            id: showDetails.id, title: showDetails.name, genre: showDetails.genres.length>0 ? showDetails.genres.join(", ") : "Dizi", rawGenres: showDetails.genres,
            year: showDetails.premiered ? showDetails.premiered.substring(0, 4) : "Belirsiz", rating: showDetails.rating && showDetails.rating.average ? showDetails.rating.average.toFixed(1) : "N/A",
            desc: showDetails.summary ? showDetails.summary.replace(/<[^>]*>?/gm, '') : dict['en'].desc_none,
            posterUrl: showDetails.image && showDetails.image.original ? showDetails.image.original : (showDetails.image?.medium || null),
            trailer: `https://www.youtube.com/results?search_query=${encodeURIComponent(showDetails.name + " tv series trailer")}`,
            platform: platform, status: showDetails.status==="Ended"?"Ended":(showDetails.status==="Running"?"Running":showDetails.status),
            seasonsText: `${totalSeasons} Sezon` + (totalEpisodes>0 ? ` (${totalEpisodes} Bölüm)` : ''), castList: castList
        };
    }
};

const watchlistLogic = {
    getList: function () {
        return JSON.parse(localStorage.getItem('watchlist') || '[]');
    },
    saveList: function (list) {
        localStorage.setItem('watchlist', JSON.stringify(list));
    },
    add: function (id, title, genre) {
        let list = this.getList();
        if (!list.find(x => x.id === id)) {
            list.push({ id, title, genre });
            this.saveList(list);
        }
    },
    remove: function (id) {
        let list = this.getList();
        list = list.filter(x => x.id !== id);
        this.saveList(list);
    },
    has: function (id) {
        return !!this.getList().find(x => x.id === id);
    }
};

document.addEventListener("DOMContentLoaded", () => {

    applyI18n();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js').catch(err => console.log('SW Registration failed: ', err));
        });
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.documentElement.setAttribute('data-theme', e.target.getAttribute('data-set-theme'));
        });
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentLang = e.target.getAttribute('data-set-lang');
            applyI18n();
            updateToggleBtnState();

            if (currentShowDescEn) {
                if (currentLang === 'en') {
                    movieDesc.textContent = currentShowDescEn;
                } else if (currentLang === 'tr') {
                    if (currentShowDescTr) {
                        movieDesc.textContent = currentShowDescTr;
                    } else {
                        movieDesc.textContent = "Çevriliyor...";
                        translateText(currentShowDescEn, 'tr').then(t => {
                            currentShowDescTr = t;
                            movieDesc.textContent = t;
                        });
                    }
                }
            }
        });
    });

    const watchlistModal = document.getElementById('watchlist-modal');
    const openWatchlistBtn = document.getElementById('open-watchlist-btn');
    const closeWatchlistBtn = document.getElementById('close-watchlist-btn');
    const watchlistBody = document.getElementById('watchlist-body');
    const toggleWatchlistBtn = document.getElementById('toggle-watchlist-btn');

    function renderWatchlist() {
        const list = watchlistLogic.getList();
        watchlistBody.innerHTML = '';
        if (list.length === 0) {
            watchlistBody.innerHTML = '<p>Listeniz şu an boş.</p>';
            return;
        }
        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'watchlist-item';
            div.innerHTML = `
                <div class="watchlist-item-info">
                    <h3>${item.title}</h3>
                    <p>${item.genre}</p>
                </div>
                <button class="remove-item-btn" data-id="${item.id}">Kaldır</button>
            `;
            watchlistBody.appendChild(div);
        });
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idStr = e.target.getAttribute('data-id');
                const parsedId = idStr.startsWith('A') ? idStr : parseInt(idStr);
                watchlistLogic.remove(parsedId);
                renderWatchlist();
                if (currentShowId === parsedId) {
                    updateToggleBtnState();
                }
            });
        });
    }

    openWatchlistBtn.addEventListener('click', () => {
        renderWatchlist();
        watchlistModal.classList.remove('hidden');
        anime({
            targets: '.watchlist-modal',
            opacity: [0, 1],
            duration: 300,
            easing: 'linear'
        });
    });

    closeWatchlistBtn.addEventListener('click', () => {
        anime({
            targets: '.watchlist-modal',
            opacity: 0,
            duration: 300,
            easing: 'linear',
            complete: () => watchlistModal.classList.add('hidden')
        });
    });

    function updateToggleBtnState() {
        if (!currentShowId) return;
        if (watchlistLogic.has(currentShowId)) {
            toggleWatchlistBtn.classList.add('active');
            toggleWatchlistBtn.textContent = dict[currentLang].added_watchlist;
        } else {
            toggleWatchlistBtn.classList.remove('active');
            toggleWatchlistBtn.textContent = dict[currentLang].add_watchlist;
        }
    }

    toggleWatchlistBtn.addEventListener('click', () => {
        if (watchlistLogic.has(currentShowId)) {
            watchlistLogic.remove(currentShowId);
        } else {
            watchlistLogic.add(currentShowId, currentShowTitle, currentShowGenre);
        }
        updateToggleBtnState();
    });

    anime.timeline({
        easing: 'easeOutExpo',
    })
        .add({
            targets: '.hero-section',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 1200,
            delay: 200
        })
        .add({
            targets: '.type-selector',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800
        }, '-=800')
        .add({
            targets: '.mood-btn',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: anime.stagger(100)
        }, '-=800')
        .add({
            targets: '.random-container',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800
        }, '-=400');

    const loadAnim = anime({
        targets: '.kinetic::before, .kinetic::after',
        rotate: 360,
        duration: 2000,
        loop: true,
        easing: 'linear',
        direction: 'alternate'
    });

    const moodGrid = document.querySelector('.mood-grid');
    const typeSelector = document.querySelector('.type-selector');
    const randomContainer = document.querySelector('.random-container');
    const randomBtnObj = document.getElementById('random-btn');
    const loaderContainer = document.querySelector('.loader-container');
    const resultContainer = document.querySelector('.result-container');
    const resetBtn = document.getElementById('main-reset-btn');
    const similarBtn = document.getElementById('similar-btn');
    const ambientBg = document.getElementById('ambient-bg');

    const errorContainer = document.getElementById('error-container');
    const errorBackBtn = document.getElementById('error-back-btn');
    const errorMessage = document.getElementById('error-message');
    const shareBtn = document.getElementById('movie-share-btn');

    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    const castToggleBtn = document.getElementById('cast-toggle-btn');
    const castContainer = document.getElementById('cast-container');

    const trailerModal = document.getElementById('trailer-modal');
    const iframeWrapper = document.getElementById('iframe-wrapper');
    const closeTrailerBtn = document.getElementById('close-trailer-btn');

    const movieTitle = document.getElementById('movie-title');
    const movieDesc = document.getElementById('movie-desc');
    const movieGenre = document.getElementById('movie-genre');
    const movieYear = document.getElementById('movie-year');
    const movieRating = document.getElementById('movie-rating');
    const movieTrailer = document.getElementById('movie-trailer');
    const moviePoster = document.getElementById('movie-poster');
    const posterTitle = document.getElementById('poster-title');
    const moviePlatform = document.getElementById('movie-platform');
    const movieStatus = document.getElementById('movie-status');
    const movieEpisodes = document.getElementById('movie-episodes');

    function triggerSearch(mood) {
        const mediaType = document.querySelector('input[name="media-type"]:checked').value;

        anime({
            targets: '.hero-section',
            opacity: 0,
            translateY: -20,
            duration: 400,
            easing: 'easeInQuad'
        });

        anime({
            targets: ['.mood-btn', '.random-btn', '.type-selector'],
            scale: 0.8,
            opacity: 0,
            duration: 400,
            easing: 'easeInBack',
            complete: async () => {
                moodGrid.style.display = 'none';
                randomContainer.style.display = 'none';
                typeSelector.style.display = 'none';
                loaderContainer.style.display = 'flex';

                anime({
                    targets: '.loader-container',
                    opacity: [0, 1],
                    scale: [0.9, 1],
                    duration: 600,
                    easing: 'easeOutCubic'
                });

                try {
                    let series;
                    let typeToFetch = mediaType;

                    if (typeToFetch === 'both') {
                        typeToFetch = Math.random() < 0.5 ? 'series' : 'anime';
                    }

                    if (typeToFetch === 'anime') {
                        series = await anilistApiService.fetchRecommendation(mood);
                    } else {
                        series = await seriesApiService.fetchRecommendation(mood);
                    }

                    currentShowId = series.id;
                    currentShowTitle = series.title;
                    currentShowGenre = series.genre;
                    currentShowRawGenres = series.rawGenres || [];
                    currentShowDescEn = series.desc;
                    currentShowDescTr = '';

                    movieTitle.textContent = series.title;
                    movieGenre.textContent = series.genre;
                    movieYear.textContent = series.year;
                    movieRating.textContent = series.rating !== "N/A" ? `⭐ ${series.rating}` : "N/A";
                    movieTrailer.setAttribute('data-trailer-url', series.trailer);
                    moviePlatform.textContent = `📺 ${series.platform}`;
                    movieStatus.textContent = series.status;
                    movieEpisodes.textContent = series.seasonsText;

                    if (currentLang === 'en') {
                        movieDesc.textContent = currentShowDescEn;
                    } else {
                        movieDesc.textContent = "Çevriliyor...";
                        translateText(currentShowDescEn, 'tr').then(t => {
                            currentShowDescTr = t;
                            if (movieTitle.textContent === series.title) {
                                movieDesc.textContent = t;
                            }
                        });
                    }

                    castContainer.innerHTML = '';
                    if (series.castList && series.castList.length > 0) {
                        castToggleBtn.style.display = 'inline-block';
                        castContainer.classList.add('hidden');
                        castToggleBtn.innerHTML = dict[currentLang].show_cast;

                        series.castList.forEach(c => {
                            const div = document.createElement('div');
                            div.className = 'cast-member';
                            div.innerHTML = `
                                <img src="${c.image}" alt="${c.name}">
                                <span class="cast-name" title="${c.name}">${c.name}</span>
                                <span class="cast-role" title="${c.role}">${c.role}</span>
                            `;
                            castContainer.appendChild(div);
                        });
                    } else {
                        castToggleBtn.style.display = 'none';
                        castContainer.classList.add('hidden');
                    }

                    updateToggleBtnState();

                    if (series.posterUrl) {
                        moviePoster.style.backgroundImage = `url(${series.posterUrl})`;
                        moviePoster.style.backgroundSize = 'cover';
                        moviePoster.style.backgroundPosition = 'center';
                        posterTitle.style.display = 'none';
                        ambientBg.style.backgroundImage = `url(${series.posterUrl})`;
                        ambientBg.style.opacity = '0.35';
                    } else {
                        moviePoster.style.backgroundImage = 'linear-gradient(135deg, #18181b, #09090b)';
                        posterTitle.style.display = 'block';
                        posterTitle.textContent = series.title;
                        ambientBg.style.backgroundImage = 'none';
                        ambientBg.style.opacity = '0';
                    }

                    anime({
                        targets: '.loader-container',
                        opacity: 0,
                        scale: 0.9,
                        duration: 400,
                        easing: 'easeInCubic',
                        complete: () => {
                            loaderContainer.style.display = 'none';
                            resultContainer.style.display = 'flex';
                            resultContainer.style.opacity = '1';
                            resultContainer.style.transform = 'none';

                            anime.timeline({
                                easing: 'easeOutExpo'
                            })
                                .add({
                                    targets: '.hero-section',
                                    opacity: 1,
                                    translateY: 0,
                                    duration: 500
                                })
                                .add({
                                    targets: '.movie-card',
                                    translateY: [50, 0],
                                    opacity: [0, 1],
                                    duration: 1000
                                }, '-=500')
                                .add({
                                    targets: ['.genre-badge', '.platform-badge', '.status-badge', '#movie-title', '.meta', '.description', '.action-buttons'],
                                    translateX: [-20, 0],
                                    opacity: [0, 1],
                                    duration: 800,
                                    delay: anime.stagger(100)
                                }, '-=600')
                                .add({
                                    targets: '.reset-btn',
                                    opacity: [0, 1],
                                    duration: 600
                                }, '-=400');
                        }
                    });

                } catch (error) {
                    loaderContainer.style.display = 'none';
                    errorContainer.style.display = 'flex';
                    errorMessage.textContent = error.message || dict[currentLang].error_desc;

                    anime({
                        targets: '.error-container',
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 600,
                        easing: 'easeOutExpo'
                    });
                }
            }
        });
    }

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            triggerSearch(this.getAttribute('data-mood'));
        });
    });

    randomBtnObj.addEventListener('click', function () {
        triggerSearch('random');
    });

    similarBtn.addEventListener('click', () => {
        if(currentShowId) {
            ambientBg.style.opacity = '0';
            anime({
                targets: '.result-container',
                translateY: [0, 20],
                opacity: 0,
                duration: 500,
                easing: 'easeInExpo',
                complete: () => {
                    resultContainer.style.display = 'none';
                    loaderContainer.style.display = 'flex';
                    anime({ targets: '.loader-container', opacity: [0, 1], scale: [0.9, 1], duration: 600, easing: 'easeOutCubic' });
                    
                    setTimeout(async () => {
                        try {
                            let series;
                            const isAnime = String(currentShowId).startsWith("A");
                            if (isAnime) {
                                series = await anilistApiService.fetchSimilar(currentShowId);
                            } else {
                                series = await seriesApiService.fetchSimilar(currentShowRawGenres, currentShowId);
                            }
                            
                            currentShowId = series.id;
                            currentShowTitle = series.title;
                            currentShowGenre = series.genre;
                            currentShowRawGenres = series.rawGenres || [];
                            currentShowDescEn = series.desc;
                            currentShowDescTr = '';
                            
                            movieTitle.textContent = series.title;
                            movieGenre.textContent = series.genre;
                            movieYear.textContent = series.year;
                            movieRating.textContent = series.rating !== "N/A" ? `⭐ ${series.rating}` : "N/A";
                            movieTrailer.setAttribute('data-trailer-url', series.trailer);
                            moviePlatform.textContent = `📺 ${series.platform}`;
                            movieStatus.textContent = series.status;
                            movieEpisodes.textContent = series.seasonsText;
                            
                            if (currentLang === 'en') {
                                movieDesc.textContent = currentShowDescEn;
                            } else {
                                movieDesc.textContent = "Çevriliyor...";
                                translateText(currentShowDescEn, 'tr').then(t => {
                                    currentShowDescTr = t;
                                    if (movieTitle.textContent === series.title) {
                                        movieDesc.textContent = t;
                                    }
                                });
                            }
                            
                            castContainer.innerHTML = '';
                            if (series.castList && series.castList.length > 0) {
                                castToggleBtn.style.display = 'inline-block';
                                castContainer.classList.add('hidden');
                                castToggleBtn.innerHTML = dict[currentLang].show_cast;
                                series.castList.forEach(c => {
                                    const div = document.createElement('div'); div.className = 'cast-member';
                                    div.innerHTML = `<img src="${c.image}" alt="${c.name}"><span class="cast-name" title="${c.name}">${c.name}</span><span class="cast-role" title="${c.role}">${c.role}</span>`;
                                    castContainer.appendChild(div);
                                });
                            } else {
                                castToggleBtn.style.display = 'none';
                                castContainer.classList.add('hidden');
                            }
                            
                            updateToggleBtnState();
                            
                            if (series.posterUrl) {
                                moviePoster.style.backgroundImage = `url(${series.posterUrl})`;
                                moviePoster.style.backgroundSize = 'cover'; moviePoster.style.backgroundPosition = 'center';
                                posterTitle.style.display = 'none';
                                ambientBg.style.backgroundImage = `url(${series.posterUrl})`;
                                ambientBg.style.opacity = '0.35';
                            } else {
                                moviePoster.style.backgroundImage = 'linear-gradient(135deg, #18181b, #09090b)';
                                posterTitle.style.display = 'block'; posterTitle.textContent = series.title;
                                ambientBg.style.backgroundImage = 'none'; ambientBg.style.opacity = '0';
                            }
                            
                            anime({
                                targets: '.loader-container', opacity: 0, scale: 0.9, duration: 400, easing: 'easeInCubic',
                                complete: () => {
                                    loaderContainer.style.display = 'none';
                                    resultContainer.style.display = 'flex'; resultContainer.style.opacity = '1'; resultContainer.style.transform = 'none';
                                    anime.timeline({ easing: 'easeOutExpo' })
                                        .add({ targets: '.movie-card', translateY: [50, 0], opacity: [0, 1], duration: 1000 })
                                        .add({ targets: ['.genre-badge', '.platform-badge', '.status-badge', '#movie-title', '.meta', '.description', '.action-buttons'], translateX: [-20, 0], opacity: [0, 1], duration: 800, delay: anime.stagger(100) }, '-=600')
                                        .add({ targets: '.reset-btn', opacity: [0, 1], duration: 600 }, '-=400');
                                }
                            });
                        } catch (error) {
                            loaderContainer.style.display = 'none';
                            errorContainer.style.display = 'flex';
                            errorMessage.textContent = error.message || dict[currentLang].error_desc;
                            anime({ targets: '.error-container', opacity: [0, 1], translateY: [20, 0], duration: 600, easing: 'easeOutExpo' });
                        }
                    }, 500);
                }
            });
        }
    });

    resetBtn.addEventListener('click', () => {
        ambientBg.style.opacity = '0';
        anime({
            targets: '.result-container',
            translateY: [0, 20],
            opacity: 0,
            duration: 500,
            easing: 'easeInExpo',
            complete: () => {
                resultContainer.style.display = 'none';
                moodGrid.style.display = 'grid';
                randomContainer.style.display = 'flex';
                typeSelector.style.display = 'flex';

                anime({
                    targets: '.type-selector',
                    translateY: [20, 0],
                    opacity: [0, 1],
                    scale: [0.9, 1],
                    duration: 800,
                    easing: 'easeOutExpo'
                });

                anime({
                    targets: '.mood-btn',
                    translateY: [20, 0],
                    scale: [0.9, 1],
                    opacity: [0, 1],
                    duration: 800,
                    delay: anime.stagger(50),
                    easing: 'easeOutElastic(1, .8)'
                });

                anime({
                    targets: '.random-container',
                    translateY: [20, 0],
                    opacity: [0, 1],
                    duration: 800,
                    easing: 'easeOutExpo'
                });

                anime({
                    targets: '.random-btn',
                    scale: [0.9, 1],
                    opacity: [0, 1],
                    duration: 800,
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        });
    });

    errorBackBtn.addEventListener('click', () => {
        anime({
            targets: '.error-container',
            opacity: 0,
            translateY: 20,
            duration: 400,
            easing: 'easeInQuad',
            complete: () => {
                errorContainer.style.display = 'none';
                moodGrid.style.display = 'grid';
                randomContainer.style.display = 'flex';
                typeSelector.style.display = 'flex';

                document.querySelector('.hero-section').style.opacity = '1';
                document.querySelector('.hero-section').style.transform = 'translateY(0)';

                anime({
                    targets: ['.type-selector', '.random-container'],
                    translateY: [20, 0],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutExpo'
                });

                anime({
                    targets: ['.mood-btn', '.random-btn'],
                    scale: [0.9, 1],
                    opacity: [0, 1],
                    duration: 600,
                    delay: anime.stagger(50),
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        });
    });

    shareBtn.addEventListener('click', async () => {
        const text = dict[currentLang].share_text(currentShowTitle, window.location.href);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'DiziBul',
                    text: text,
                    url: window.location.href
                });
            } catch (err) { }
        } else {
            await navigator.clipboard.writeText(text);
            const oldText = shareBtn.textContent;
            shareBtn.textContent = dict[currentLang].shared_btn;
            setTimeout(() => { shareBtn.textContent = oldText; }, 2000);
        }
    });

    likeBtn.addEventListener('click', () => {
        if (currentShowRawGenres) {
            prefLogic.addLike(currentShowRawGenres);
            likeBtn.textContent = '💖';
            setTimeout(() => likeBtn.textContent = '👍', 1000);
        }
    });

    dislikeBtn.addEventListener('click', () => {
        if (currentShowId) {
            prefLogic.addDislike("A" + currentShowId);
            prefLogic.addDislike(currentShowId);
            dislikeBtn.textContent = '🚫';
            setTimeout(() => {
                dislikeBtn.textContent = '👎';
                triggerSearch('random');
            }, 600);
        }
    });

    castToggleBtn.addEventListener('click', () => {
        if (castContainer.classList.contains('hidden')) {
            castContainer.classList.remove('hidden');
            castToggleBtn.innerHTML = dict[currentLang].hide_cast;
            anime({
                targets: '.cast-member',
                translateX: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(50),
                easing: 'easeOutExpo'
            });
        } else {
            castContainer.classList.add('hidden');
            castToggleBtn.innerHTML = dict[currentLang].show_cast;
        }
    });

    movieTrailer.addEventListener('click', (e) => {
        e.preventDefault();
        const trailerUrl = movieTrailer.getAttribute('data-trailer-url');
        if (!trailerUrl) return;

        if (trailerUrl.includes("youtube.com/watch?v=")) {
            const vidId = trailerUrl.split("v=")[1].split("&")[0];
            const iframeSrc = `https://www.youtube.com/embed/${vidId}?autoplay=1`;
            iframeWrapper.innerHTML = `<iframe src="${iframeSrc}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            trailerModal.classList.remove('hidden');
            anime({
                targets: '.trailer-modal',
                opacity: [0, 1],
                duration: 300,
                easing: 'linear'
            });
        } else {
            window.open(trailerUrl, '_blank');
        }
    });

    closeTrailerBtn.addEventListener('click', () => {
        anime({
            targets: '.trailer-modal',
            opacity: 0,
            duration: 300,
            easing: 'linear',
            complete: () => {
                trailerModal.classList.add('hidden');
                iframeWrapper.innerHTML = '';
            }
        });
    });
});
