import { Hotel } from '../types';

export const mockHotels: Hotel[] = [
  {
    id: 'h1',
    name: 'The Mulia Resort & Villas',
    tagline: 'Mewewah di Tepi Pantai Nusa Dua dengan Pemandangan Samudra',
    location: 'Nusa Dua, Bali',
    city: 'Bali',
    address: 'Jl. Raya Nusa Dua Selatan No.8, Benoa, Kec. Kuta Sel., Kabupaten Badung, Bali 80363',
    coordinates: { lat: -8.803, lng: 115.228 },
    rating: 4.9,
    reviewsCount: 1280,
    pricePerNight: 3850000,
    originalPrice: 4800000,
    stars: 5,
    category: 'Resort',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Kolam Renang Infinity', 'Akses Pantai Pribadi', 'Spa Luxury', 'Koleksi 5 Restoran', 'WiFi Cepat', 'Gym 24/7', 'Antar Jemput Bandara', 'Sarapan Gratis'],
    description: 'Terletak di sepanjang pantai pasir putih Nusa Dua, The Mulia Resort menawarkan pengalaman menginap mewah tak tertandingi. Dilengkapi kolam renang infinity tepi pantai yang ikonis, kamar-kamar luas berdesain kontemporer elegan, dan pelayanan butler kelas dunia.',
    featured: true,
    discountPercentage: 20,
    rooms: [
      {
        id: 'r1_1',
        name: 'Mulia Deluxe Ocean Suite',
        size: '58 m²',
        bedType: '1 Super King Bed',
        maxOccupancy: 2,
        pricePerNight: 3850000,
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
        features: ['Balkon Private', 'Pemandangan Laut', 'Bathtub Whirlpool', 'Mesin Espresso', 'Smart TV 65"'],
        availableRooms: 4
      },
      {
        id: 'r1_2',
        name: 'Royal Ocean View Villa with Private Pool',
        size: '120 m²',
        bedType: '1 King Bed + Sunbed',
        maxOccupancy: 3,
        pricePerNight: 6500000,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        features: ['Private Plunge Pool', 'Personal Butler 24 Jam', 'Akses Lounge VIP', 'Bathtub Marmer Outdoor'],
        availableRooms: 2
      }
    ],
    reviews: [
      {
        id: 'rev1',
        userName: 'Budi Santoso',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '24 Juli 2026',
        comment: 'Pengalaman menginap luar biasa untuk honeymoon kami. Kolam renang pantai sangat cantik dan sarapan buffet sangat melimpah!'
      },
      {
        id: 'rev2',
        userName: 'Clarissa Maharani',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        rating: 4.8,
        date: '10 Juli 2026',
        comment: 'Pelayanan butler luar biasa cepat dan ramah. Kamar sangat bersih dan tenang.'
      }
    ]
  },
  {
    id: 'h2',
    name: 'Hotel Indonesia Kempinski',
    tagline: 'Ikon Kemewahan Modern dan Bersejarah di Pusat Kota Jakarta',
    location: 'Bundaran HI, Jakarta Pusat',
    city: 'Jakarta',
    address: 'Jl. M.H. Thamrin No.1, Menteng, Kota Jakarta Pusat, DKI Jakarta 10310',
    coordinates: { lat: -6.195, lng: 106.823 },
    rating: 4.8,
    reviewsCount: 940,
    pricePerNight: 2450000,
    originalPrice: 2900000,
    stars: 5,
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Pemandangan Bundaran HI', 'Akses Langsung Mall Grand Indonesia', 'Rooftop Pool', 'Spa & Wellness', 'Restoran Paulaner Brauhaus', 'Parkir Valet Gratis'],
    description: 'Berada tepat di jantung ibukota dengan pemandangan langsung ke Ikon Bundaran HI. Menawarkan kombinasi warisan sejarah Indonesia dan standar hospitalitas bintang 5 Eropa.',
    featured: true,
    discountPercentage: 15,
    rooms: [
      {
        id: 'r2_1',
        name: 'Grand Deluxe City View',
        size: '44 m²',
        bedType: '1 King Bed or 2 Twin Beds',
        maxOccupancy: 2,
        pricePerNight: 2450000,
        image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
        features: ['Pemandangan Bundaran HI', 'Meja Kerja Ergonomis', 'Kamar Mandi Marmer', 'Minibar Gratis'],
        availableRooms: 6
      },
      {
        id: 'r2_2',
        name: 'Executive Suite Lounge Access',
        size: '64 m²',
        bedType: '1 King Bed',
        maxOccupancy: 2,
        pricePerNight: 3900000,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        features: ['Akses Executive Club Lounge', 'Afternoon Tea Gratis', 'Cocktail Malam Jam 6-8', 'Layanan Laundry 2 Baju/Hari'],
        availableRooms: 3
      }
    ],
    reviews: [
      {
        id: 'rev3',
        userName: 'Rian Pratama',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '02 Agustus 2026',
        comment: 'Lokasi paling strategis di Jakarta. Langsung terhubung ke Mall Grand Indonesia!'
      }
    ]
  },
  {
    id: 'h3',
    name: 'Padma Hotel Bandung',
    tagline: 'Resort Lembah Hijau Asri dengan Udara Sejuk Pegunungan Ciumbuleuit',
    location: 'Ciumbuleuit, Bandung',
    city: 'Bandung',
    address: 'Jl. R.E. Martadinata No.56 / Jl. Ranca Bentang No.56-58, Ciumbuleuit, Bandung',
    coordinates: { lat: -6.862, lng: 107.608 },
    rating: 4.9,
    reviewsCount: 1520,
    pricePerNight: 1950000,
    originalPrice: 2300000,
    stars: 5,
    category: 'Resort',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Kolam Air Hangat Heated Pool', 'Pemandangan Lembah Hijau', 'Mini Zoo & Feeding Animal', 'Adventure Park', 'Afternoon Tea Gratis', 'Spa Nature'],
    description: 'Resort spektakuler di atas bukit Ciumbuleuit dengan pemandangan lembah bukit hijau yang menakjubkan. Udara segar dan fasilitas keluarga terlengkap di Bandung.',
    featured: true,
    discountPercentage: 15,
    rooms: [
      {
        id: 'r3_1',
        name: 'Deluxe Hill View Room',
        size: '38 m²',
        bedType: '1 King Bed',
        maxOccupancy: 2,
        pricePerNight: 1950000,
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
        features: ['Jendela Kaca Floor-to-Ceiling', 'Pemandangan Bukit', 'Balkon Santai', 'WiFi Cepat'],
        availableRooms: 5
      },
      {
        id: 'r3_2',
        name: 'Premier Valley Suite',
        size: '52 m²',
        bedType: '1 King Bed + Daybed',
        maxOccupancy: 3,
        pricePerNight: 2850000,
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        features: ['Bathtub Lembah View', 'Balkon Private Luas', 'Mesin Kopi Capsule'],
        availableRooms: 3
      }
    ],
    reviews: [
      {
        id: 'rev4',
        userName: 'Dewi Lestari',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '18 Juli 2026',
        comment: 'Kolam renang air hangatnya juara banget pas malam hari! Anak-anak sangat senang feeding kelinci dan alpaka.'
      }
    ]
  },
  {
    id: 'h4',
    name: 'Plataran Borobudur Resort & Spa',
    tagline: 'Ketenangan Budaya dan Kemewahan Berlatar Belakang Candi Borobudur',
    location: 'Magelang, Yogyakarta / Jawa Tengah',
    city: 'Yogyakarta',
    address: 'Dusun Tanjungan, Kec. Borobudur, Magelang, Jawa Tengah 56553',
    coordinates: { lat: -7.61, lng: 110.203 },
    rating: 4.95,
    reviewsCount: 810,
    pricePerNight: 3200000,
    originalPrice: 3800000,
    stars: 5,
    category: 'Villa',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Pemandangan Candi Borobudur', 'Private Pool Villa', 'Padma Spa Traditional', 'Patio Deck Sunrise Picnic', 'Sepeda Gratis', 'Yoga Deck'],
    description: 'Suasana magis khas Jawa kuno dikelilingi perbukitan Menoreh dan pemandangan megah Candi Borobudur. Menawarkan vila kayu ukir tradisional lengkap dengan kolam pribadi.',
    featured: false,
    discountPercentage: 16,
    rooms: [
      {
        id: 'r4_1',
        name: 'Garden Sanctuary Villa',
        size: '80 m²',
        bedType: '1 King Bed Javanese Antique',
        maxOccupancy: 2,
        pricePerNight: 3200000,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        features: ['Teras Joglo Tradisional', 'Taman Tropis Pribadi', 'Outdoor Shower Marmer'],
        availableRooms: 3
      }
    ],
    reviews: [
      {
        id: 'rev5',
        userName: 'Ahmad Fauzi',
        userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '01 Agustus 2026',
        comment: 'Sunrise picnic dengan latar belakangan Candi Borobudur adalah momen paling berkesan sepanjang hidup.'
      }
    ]
  },
  {
    id: 'h5',
    name: 'Vasa Hotel Surabaya',
    tagline: 'Hotel Bisnis Bintang 5 Elegan di Kawasan Elit Surabaya Barat',
    location: 'HR Muhammad, Surabaya',
    city: 'Surabaya',
    address: 'Jl. HR Muhammad No.31, Putat Gede, Kec. Sukomanunggal, Surabaya',
    coordinates: { lat: -7.288, lng: 112.705 },
    rating: 4.7,
    reviewsCount: 620,
    pricePerNight: 1250000,
    originalPrice: 1500000,
    stars: 5,
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Outdoor Pool', 'Restoran Xiang Fu Hai', 'Helipad', 'Ballroom Mewah', 'WiFi Ultra-Fast', 'Gym 24 Jam'],
    description: 'Menyajikan kenyamanan mewah modern untuk wisatawan bisnis maupun liburan keluarga di Surabaya Barat.',
    featured: false,
    discountPercentage: 16,
    rooms: [
      {
        id: 'r5_1',
        name: 'Select Executive Room',
        size: '36 m²',
        bedType: '1 King Bed',
        maxOccupancy: 2,
        pricePerNight: 1250000,
        image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
        features: ['Smart Room Control', 'Meja Kerja Komplit', 'Nespresso Coffee Maker'],
        availableRooms: 8
      }
    ],
    reviews: []
  },
  {
    id: 'h6',
    name: 'Park Hyatt Tokyo',
    tagline: 'Oase Kemewahan di Puncak Pencakar Langit Shinjuku',
    location: 'Shinjuku, Tokyo, Jepang',
    city: 'Tokyo',
    address: '3-7-1-2 Nishi-Shinjuku, Shinjuku-ku, Tokyo 163-1055',
    coordinates: { lat: 35.685, lng: 139.691 },
    rating: 4.9,
    reviewsCount: 1450,
    pricePerNight: 7800000,
    originalPrice: 9000000,
    stars: 5,
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Pemandangan Gunung Fuji', 'Sky Pool Lantai 47', 'New York Grill Restaurant', 'Spa Club on the Park', 'Layanan Concierge Jepang'],
    description: 'Menguasai lantai atas 3-7-1 Nishi-Shinjuku Tower, Park Hyatt Tokyo menyajikan panorama spektakuler Kota Tokyo dan Gunung Fuji.',
    featured: true,
    discountPercentage: 13,
    rooms: [
      {
        id: 'r6_1',
        name: 'Park View King Suite',
        size: '60 m²',
        bedType: '1 Custom King Bed',
        maxOccupancy: 2,
        pricePerNight: 7800000,
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
        features: ['Panorama Mount Fuji', 'Yukata Traditional Robe', 'Soaking Bathtub Deep Wood'],
        availableRooms: 2
      }
    ],
    reviews: []
  }
];

export const citiesList = ['Semua Kota', 'Bali', 'Jakarta', 'Bandung', 'Yogyakarta', 'Surabaya', 'Tokyo'];
