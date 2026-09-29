export const VENUES = [
  {
    name: 'PVR IMAX Laser: Phoenix Palladium',
    city: 'Mumbai',
    address: 'Lower Parel, Senapati Bapat Marg, Mumbai',
    screenName: 'IMAX Laser Screen 1',
    audioFormat: 'Dolby Atmos 4K Laser',
  },
  {
    name: 'INOX Insignia: Maison Jio World Drive',
    city: 'Mumbai',
    address: 'Bandra Kurla Complex (BKC), Mumbai',
    screenName: 'Insignia Luxe Hall 2',
    audioFormat: 'DTS:X Surround',
  },
  {
    name: 'Cinepolis VIP: Nexus Seawoods',
    city: 'Navi Mumbai',
    address: 'Sector 40, Nerul, Navi Mumbai',
    screenName: 'ONYX Cinema LED 3',
    audioFormat: 'Dolby 7.1',
  },
  {
    name: 'Royal Opera & Grand Stadium Arena',
    city: 'Mumbai',
    address: 'Marine Drive & Wankhede Precinct, Mumbai',
    screenName: 'Main Championship Arena',
    audioFormat: 'L-Acoustics Live Array',
  },
];

export const SEED_EVENTS = [
  {
    title: 'Chronos: Eclipse of Eternity',
    slug: 'chronos-eclipse-of-eternity',
    tagline: 'Time does not heal all wounds. Sometimes it fractures reality.',
    description:
      'When a deep-space temporal relay begins broadcasting signals from forty years in the future, Commander Elara Vance must lead a rogue crew across a collapsing wormhole before Earth is erased from the timeline.',
    category: 'Movie',
    genre: ['Sci-Fi', 'Action', 'Thriller'],
    language: 'English',
    durationMins: 164,
    rating: 9.2,
    ageRating: 'UA 13+',
    releaseDate: new Date('2026-09-15'),
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/YoHD9XEInc0',
    director: 'Denis Villeneuve',
    isTrending: true,
    isFeatured: true,
    cast: [
      {
        name: 'Rebecca Ferguson',
        role: 'Cmdr. Elara Vance',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rebecca',
      },
      {
        name: 'Cillian Murphy',
        role: 'Dr. Julian Thorne',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cillian',
      },
      {
        name: 'Dev Patel',
        role: 'Lt. Kaelen Rao',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevPatel',
      },
    ],
  },
  {
    title: 'Bombay Velvet: Midnight Jazz Heist',
    slug: 'bombay-velvet-midnight-jazz-heist',
    tagline: 'In the city of dreams, fortune favors the bold.',
    description:
      'Set against the glittering jazz clubs and dockyards of vintage Bombay, a charismatic street fighter and a enigmatic jazz singer orchestrate the most daring gold reserve heist of the century.',
    category: 'Movie',
    genre: ['Crime', 'Thriller', 'Drama'],
    language: 'Hindi',
    durationMins: 149,
    rating: 9.0,
    ageRating: 'UA 16+',
    releaseDate: new Date('2026-09-22'),
    posterUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/NgBoMJy386M',
    director: 'Anurag Kashyap',
    isTrending: true,
    isFeatured: true,
    cast: [
      {
        name: 'Ranbir Kapoor',
        role: 'Johnny Balraj',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ranbir',
      },
      {
        name: 'Anushka Sharma',
        role: 'Rosie Noronha',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anushka',
      },
    ],
  },
  {
    title: 'Borderlands: Echoes of Pandora',
    slug: 'borderlands-echoes-of-pandora',
    tagline: 'Chaos is the only law on the edge of the galaxy.',
    description:
      'An outlaw treasure hunter returns to her home planet of Pandora and forms an unlikely alliance with a team of misfits to unlock an alien vault containing unimaginable cosmic power.',
    category: 'Movie',
    genre: ['Action', 'Sci-Fi', 'Adventure'],
    language: 'English',
    durationMins: 138,
    rating: 8.7,
    ageRating: 'UA 13+',
    releaseDate: new Date('2026-09-23'),
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/gCcx85zbxz4',
    director: 'Eli Roth',
    isTrending: true,
    isFeatured: false,
    cast: [
      {
        name: 'Cate Blanchett',
        role: 'Lilith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cate',
      },
      {
        name: 'Kevin Hart',
        role: 'Roland',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin',
      },
    ],
  },
  {
    title: 'Neon Samurai: Cyber Kyoto',
    slug: 'neon-samurai-cyber-kyoto',
    tagline: 'Honor forged in steel. Vengeance wired in neon.',
    description:
      'In a rain-drenched Neo-Kyoto ruled by synthetic syndicates, a cybernetically resurrected ronin uncovers the conspiracy behind his clan’s betrayal in breathtaking high-octane swordplay.',
    category: 'Movie',
    genre: ['Action', 'Sci-Fi', 'Cyberpunk'],
    language: 'Japanese',
    durationMins: 142,
    rating: 8.9,
    ageRating: 'A 18+',
    releaseDate: new Date('2026-09-20'),
    posterUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/gCcx85zbxz4',
    director: 'Shinichiro Watanabe',
    isTrending: true,
    isFeatured: true,
    cast: [
      {
        name: 'Hiroyuki Sanada',
        role: 'Kenshin Zero',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroyuki',
      },
      {
        name: 'Rinko Kikuchi',
        role: 'Akira Vex',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rinko',
      },
    ],
  },
  {
    title: 'Coldplay: Spheres of Aurora Live',
    slug: 'coldplay-spheres-of-aurora-live',
    tagline: 'An immersive stadium symphony of light, lasers, and euphoria.',
    description:
      'Experience the global phenomenon live on stage with LED kinetic wristbands, pyrotechnics, floating planets, and 2.5 hours of unforgettable anthems.',
    category: 'Concert',
    genre: ['Pop', 'Rock', 'Live Music'],
    language: 'English',
    durationMins: 150,
    rating: 9.7,
    ageRating: 'All Ages',
    releaseDate: new Date('2026-09-25'),
    posterUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/3lfnR7OhZY8',
    director: 'Live Nation Touring',
    isTrending: true,
    isFeatured: true,
    cast: [
      {
        name: 'Chris Martin',
        role: 'Lead Vocals & Piano',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChrisM',
      },
      {
        name: 'Jonny Buckland',
        role: 'Lead Guitar',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JonnyB',
      },
    ],
  },
  {
    title: 'The Velvet Heist: Monte Carlo',
    slug: 'the-velvet-heist-monte-carlo',
    tagline: 'Seven master illusionists. One impenetrable royal vault.',
    description:
      'During the Monaco Grand Prix gala, an international crew of art thieves and sleight-of-hand prodigies attempt to steal a priceless Romanov diamond under the eyes of Interpol.',
    category: 'Movie',
    genre: ['Crime', 'Thriller', 'Mystery'],
    language: 'English',
    durationMins: 136,
    rating: 8.6,
    ageRating: 'UA 16+',
    releaseDate: new Date('2026-09-10'),
    posterUrl:
      'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/8ugaeA-nMTc',
    director: 'Steven Soderbergh',
    isTrending: false,
    isFeatured: false,
    cast: [
      {
        name: 'Ana de Armas',
        role: 'Celine Moreau',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
      },
      {
        name: 'Idris Elba',
        role: 'Viktor Cross',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Idris',
      },
    ],
  },
  {
    title: 'Vikramaditya: Crown of Fire',
    slug: 'vikramaditya-crown-of-fire',
    tagline: 'An empire rises from the ashes of legend.',
    description:
      'A sweeping historical epic chronicling the legendary warrior emperor who united warring kingdoms against an overwhelming naval invasion.',
    category: 'Movie',
    genre: ['Action', 'Drama', 'Historical'],
    language: 'Hindi',
    durationMins: 172,
    rating: 9.1,
    ageRating: 'UA 13+',
    releaseDate: new Date('2026-09-18'),
    posterUrl:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/NgBoMJy386M',
    director: 'S. S. Rajamouli',
    isTrending: true,
    isFeatured: true,
    cast: [
      {
        name: 'Ranveer Singh',
        role: 'Emperor Vikramaditya',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ranveer',
      },
      {
        name: 'Deepika Padukone',
        role: 'Queen Avantika',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepika',
      },
    ],
  },
  {
    title: 'A.R. Rahman: Symphony of Souls',
    slug: 'ar-rahman-symphony-of-souls',
    tagline: 'Three decades of timeless cinema magic performed with a 90-piece orchestra.',
    description:
      'Academy Award winner A.R. Rahman brings an extraordinary orchestral fusion concert featuring Sufi classics, contemporary anthems, and 3D holographic projection mapping.',
    category: 'Concert',
    genre: ['Orchestral', 'Fusion', 'Live Music'],
    language: 'Hindi',
    durationMins: 160,
    rating: 9.6,
    ageRating: 'All Ages',
    releaseDate: new Date('2026-09-22'),
    posterUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/jHNNMj5bNQw',
    director: 'Madras Mozart Live',
    isTrending: true,
    isFeatured: false,
    cast: [
      {
        name: 'A.R. Rahman',
        role: 'Composer & Maestro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ARRahman',
      },
    ],
  },
  {
    title: 'Phantom of the Grand Opera',
    slug: 'phantom-of-the-grand-opera',
    tagline: 'The timeless Broadway theatrical masterpiece on the Royal Stage.',
    description:
      'A lavish West End and Broadway production featuring a descending crystal chandelier, 45 stage actors, and live orchestral accompaniment.',
    category: 'Theater',
    genre: ['Musical', 'Drama', 'Romance'],
    language: 'English',
    durationMins: 155,
    rating: 9.4,
    ageRating: 'UA 7+',
    releaseDate: new Date('2026-09-14'),
    posterUrl:
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/N9ero07F2gM',
    director: 'Royal Theatre Company',
    isTrending: false,
    isFeatured: false,
    cast: [
      {
        name: 'Ramin Karimloo',
        role: 'The Phantom',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramin',
      },
      {
        name: 'Sierra Boggess',
        role: 'Christine Daaé',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sierra',
      },
    ],
  },
  {
    title: 'Zakir Khan: Tathastu Encore Tour',
    slug: 'zakir-khan-tathastu-encore-tour',
    tagline: 'Heartfelt storytelling, nostalgia, and non-stop laughter.',
    description:
      'India’s favorite storyteller returns with an all-new two-hour stand-up special blending middle-class nostalgia, observational humor, and poetic warmth.',
    category: 'Comedy',
    genre: ['Stand-Up', 'Comedy', 'Storytelling'],
    language: 'Hindi',
    durationMins: 120,
    rating: 9.3,
    ageRating: 'UA 16+',
    releaseDate: new Date('2026-09-19'),
    posterUrl:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/2qCpY38ompo',
    director: 'OML Live',
    isTrending: true,
    isFeatured: false,
    cast: [
      {
        name: 'Zakir Khan',
        role: 'Stand-up Comedian',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zakir',
      },
    ],
  },
  {
    title: 'Champions Masters Finals: Night Derby',
    slug: 'champions-masters-finals-night-derby',
    tagline: 'Floodlights, 60,000 roaring fans, and the ultimate championship trophy.',
    description:
      'Witness the electrifying European Football Championship showdown live from the VIP hospitality stands and giant stadium arena with live halftime pyrotechnics.',
    category: 'Sports',
    genre: ['Football', 'Live Sports', 'Tournament'],
    language: 'English',
    durationMins: 135,
    rating: 9.4,
    ageRating: 'All Ages',
    releaseDate: new Date('2026-09-26'),
    posterUrl:
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    director: 'Premier Sports League',
    isTrending: true,
    isFeatured: false,
    cast: [
      {
        name: 'All-Star XI',
        role: 'Championship Finalists',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Football',
      },
    ],
  },
  {
    title: 'IPL T20 Grand Finale: Mumbai vs Chennai',
    slug: 'ipl-t20-grand-finale-mumbai-vs-chennai',
    tagline: 'The biggest cricket rivalry under the stadium lights.',
    description:
      'Experience every six, boundary, and last-over thriller from the premium hospitality box or live stadium fan deck as the two titans clash for the T20 Championship Crown.',
    category: 'Sports',
    genre: ['Cricket', 'Live Sports', 'Tournament'],
    language: 'Hindi',
    durationMins: 210,
    rating: 9.6,
    ageRating: 'All Ages',
    releaseDate: new Date('2026-09-27'),
    posterUrl:
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    director: 'BCCI Live Arena',
    isTrending: true,
    isFeatured: false,
    cast: [
      {
        name: 'Championship Captains',
        role: 'Finalists',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cricket',
      },
    ],
  },
  {
    title: 'Box Office Boxing: Undisputed Heavyweight Night',
    slug: 'box-office-boxing-undisputed-heavyweight-night',
    tagline: 'Twelve rounds for undisputed world supremacy.',
    description:
      'Ringside VIP access and giant IMAX live broadcast of the world heavyweight title unification bout featuring pyrotechnic ring walks and championship undercards.',
    category: 'Sports',
    genre: ['Boxing', 'Live Sports', 'Action'],
    language: 'English',
    durationMins: 150,
    rating: 9.1,
    ageRating: 'UA 16+',
    releaseDate: new Date('2026-09-28'),
    posterUrl:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    director: 'World Championship Boxing',
    isTrending: false,
    isFeatured: false,
    cast: [
      {
        name: 'Heavyweight Champions',
        role: 'Main Event',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Boxing',
      },
    ],
  },
  {
    title: 'Kantara: Legend of the Sacred Forest',
    slug: 'kantara-legend-of-the-sacred-forest',
    tagline: 'A visceral folklore roar where myth and nature collide.',
    description:
      'Set in the mystical coastal woodlands, an ancient guardian pact is awakened when greed threatens the sacred grove.',
    category: 'Movie',
    genre: ['Action', 'Folklore', 'Thriller'],
    language: 'Kannada',
    durationMins: 148,
    rating: 9.4,
    ageRating: 'UA 16+',
    releaseDate: new Date('2026-09-16'),
    posterUrl:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/embed/8mrVmf239GU',
    director: 'Rishab Shetty',
    isTrending: true,
    isFeatured: false,
    cast: [
      {
        name: 'Rishab Shetty',
        role: 'Kaadubettu Shiva',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rishab',
      },
    ],
  },
];
