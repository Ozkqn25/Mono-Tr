const SQUARES = [
  // Köşeler ve özel kareler
  { id: 0,  type: 'corner',   name: 'BAŞLANGIÇ',        icon: '🏁' },
  { id: 1,  type: 'property', name: 'Giresun',           color: 'brown',  price: 600,    rent: [50,250,750,2250,4000,5500],   houseCost: 500,  mortgage: 300 },
  { id: 2,  type: 'chest',    name: 'Toplum Sandığı',    icon: '📦' },
  { id: 3,  type: 'property', name: 'Artvin',            color: 'brown',  price: 600,    rent: [60,300,900,2700,4000,5500],   houseCost: 500,  mortgage: 300 },
  { id: 4,  type: 'tax',      name: 'Gelir Vergisi',     icon: '💸',  amount: 2000 },
  { id: 5,  type: 'station',  name: 'Haydarpaşa Garı',  icon: '🚂',  price: 2000,   rent: [250,500,1000,2000] },
  { id: 6,  type: 'property', name: 'Samsun',            color: 'lblue',  price: 1000,   rent: [100,500,1500,4500,6250,7500], houseCost: 1000, mortgage: 500 },
  { id: 7,  type: 'chance',   name: 'Şans',              icon: '🎴' },
  { id: 8,  type: 'property', name: 'Trabzon',           color: 'lblue',  price: 1000,   rent: [100,500,1500,4500,6250,7500], houseCost: 1000, mortgage: 500 },
  { id: 9,  type: 'property', name: 'Ordu',              color: 'lblue',  price: 1200,   rent: [120,600,1800,5000,7000,9000], houseCost: 1000, mortgage: 600 },
  { id: 10, type: 'corner',   name: 'SADECE ZİYARET',   icon: '⛓️' },
  { id: 11, type: 'property', name: 'Konya',             color: 'pink',   price: 1400,   rent: [100,600,1800,5000,7000,9000], houseCost: 1500, mortgage: 700 },
  { id: 12, type: 'utility',  name: 'Türkiye Elektrik', icon: '⚡',  price: 1500 },
  { id: 13, type: 'property', name: 'Bursa',             color: 'pink',   price: 1400,   rent: [100,600,1800,5000,7000,9000], houseCost: 1500, mortgage: 700 },
  { id: 14, type: 'property', name: 'Eskişehir',         color: 'pink',   price: 1600,   rent: [120,700,2000,5500,7500,9500], houseCost: 1500, mortgage: 800 },
  { id: 15, type: 'station',  name: 'Ankara Garı',      icon: '🚂',  price: 2000,   rent: [250,500,1000,2000] },
  { id: 16, type: 'property', name: 'Kayseri',           color: 'orange', price: 1800,   rent: [140,700,2000,5500,7500,9500], houseCost: 2000, mortgage: 900 },
  { id: 17, type: 'chest',    name: 'Toplum Sandığı',   icon: '📦' },
  { id: 18, type: 'property', name: 'Diyarbakır',        color: 'orange', price: 1800,   rent: [140,700,2000,5500,7500,9500], houseCost: 2000, mortgage: 900 },
  { id: 19, type: 'property', name: 'Gaziantep',         color: 'orange', price: 2000,   rent: [160,800,2200,6000,8000,10000],houseCost: 2000, mortgage: 1000 },
  { id: 20, type: 'corner',   name: 'BEDAVA PARK',      icon: '🅿️' },
  { id: 21, type: 'property', name: 'Mersin',            color: 'red',    price: 2200,   rent: [180,900,2500,7000,8750,10500],houseCost: 2500, mortgage: 1100 },
  { id: 22, type: 'chance',   name: 'Şans',             icon: '🎴' },
  { id: 23, type: 'property', name: 'Antalya',           color: 'red',    price: 2200,   rent: [180,900,2500,7000,8750,10500],houseCost: 2500, mortgage: 1100 },
  { id: 24, type: 'property', name: 'Adana',             color: 'red',    price: 2400,   rent: [200,1000,3000,7500,9250,11000],houseCost: 2500, mortgage: 1200 },
  { id: 25, type: 'station',  name: 'İzmir Alsancak',   icon: '🚂',  price: 2000,   rent: [250,500,1000,2000] },
  { id: 26, type: 'property', name: 'Ege Bölgesi',       color: 'yellow', price: 2600,   rent: [220,1100,3300,8000,9750,11500],houseCost: 3000, mortgage: 1300 },
  { id: 27, type: 'property', name: 'İzmir',             color: 'yellow', price: 2600,   rent: [220,1100,3300,8000,9750,11500],houseCost: 3000, mortgage: 1300 },
  { id: 28, type: 'utility',  name: 'Su İdaresi',       icon: '💧',  price: 1500 },
  { id: 29, type: 'property', name: 'Bodrum',            color: 'yellow', price: 2800,   rent: [240,1200,3600,8500,10250,12000],houseCost: 3000, mortgage: 1400 },
  { id: 30, type: 'corner',   name: 'HAPSE GİT',        icon: '🚔' },
  { id: 31, type: 'property', name: 'Ankara',            color: 'green',  price: 3000,   rent: [260,1300,3900,9000,11000,12750],houseCost: 3500, mortgage: 1500 },
  { id: 32, type: 'property', name: 'Marmaris',          color: 'green',  price: 3000,   rent: [260,1300,3900,9000,11000,12750],houseCost: 3500, mortgage: 1500 },
  { id: 33, type: 'chest',    name: 'Toplum Sandığı',   icon: '📦' },
  { id: 34, type: 'property', name: 'Beşiktaş',          color: 'green',  price: 3200,   rent: [280,1500,4500,10000,12000,14000],houseCost: 3500, mortgage: 1600 },
  { id: 35, type: 'station',  name: 'Sirkeci Garı',     icon: '🚂',  price: 2000,   rent: [250,500,1000,2000] },
  { id: 36, type: 'chance',   name: 'Şans',             icon: '🎴' },
  { id: 37, type: 'property', name: 'Kadıköy',           color: 'dblue',  price: 3500,   rent: [350,1750,5000,11000,13000,15000],houseCost: 4000, mortgage: 1750 },
  { id: 38, type: 'tax',      name: 'Lüks Vergisi',     icon: '💰',  amount: 1000 },
  { id: 39, type: 'property', name: 'İstanbul/Boğaz',   color: 'dblue',  price: 4000,   rent: [500,2000,6000,14000,17000,20000],houseCost: 4000, mortgage: 2000 }
];

const COLOR_GROUPS = {
  brown:  { name: 'Kahverengi', squares: [1,3],      color: '#8B4513' },
  lblue:  { name: 'Açık Mavi',  squares: [6,8,9],    color: '#87CEEB' },
  pink:   { name: 'Pembe',      squares: [11,13,14], color: '#FF69B4' },
  orange: { name: 'Turuncu',    squares: [16,18,19], color: '#FF8C00' },
  red:    { name: 'Kırmızı',    squares: [21,23,24], color: '#DC143C' },
  yellow: { name: 'Sarı',       squares: [26,27,29], color: '#FFD700' },
  green:  { name: 'Yeşil',      squares: [31,32,34], color: '#228B22' },
  dblue:  { name: 'Koyu Mavi',  squares: [37,39],    color: '#00008B' }
};

const CHANCE_CARDS = [
  { text: '🏆 En yakın istasyona ilerle, kirası iki katı öde!', action: 'nearest_station' },
  { text: '💰 Banka hatası — senin lehine! 2000₺ al.', action: 'collect', amount: 2000 },
  { text: '🎉 Yatırımlarından temettü: 500₺ al.', action: 'collect', amount: 500 },
  { text: '🚔 Hapse git! Doğrudan git, 1500₺ alma!', action: 'go_to_jail' },
  { text: '🏠 Başlangıca dön, 1500₺ al.', action: 'go_to_start' },
  { text: '🔙 3 kare geri git.', action: 'move', amount: -3 },
  { text: '🏗️ Onarım masrafı: her ev için 250₺, her otel için 1000₺ öde.', action: 'repair', house: 250, hotel: 1000 },
  { text: '💳 Trafik cezası: 150₺ öde.', action: 'pay', amount: 150 },
  { text: '🎓 Üniversite bursunu al: 150₺.', action: 'collect', amount: 150 },
  { text: '🏥 Hastane masrafı: 500₺ öde.', action: 'pay', amount: 500 },
  { text: '🎴 Hapishaneden Çıkış — ücretsiz!', action: 'get_out_jail' },
  { text: '📍 Kadıköy\'e git!', action: 'go_to', square: 37 },
];

const CHEST_CARDS = [
  { text: '💰 Banka hatası — senin lehine! 2000₺ al.', action: 'collect', amount: 2000 },
  { text: '🎂 Doğum günün kutlu olsun! Her oyuncudan 500₺ al.', action: 'birthday', amount: 500 },
  { text: '🚔 Hapse git!', action: 'go_to_jail' },
  { text: '🏠 Başlangıca dön, 1500₺ al.', action: 'go_to_start' },
  { text: '💊 Doktor masrafı: 500₺ öde.', action: 'pay', amount: 500 },
  { text: '📦 Satış komisyonu: 250₺ al.', action: 'collect', amount: 250 },
  { text: '🏛️ Miras kaldı: 1000₺ al.', action: 'collect', amount: 1000 },
  { text: '🎴 Hapishaneden Çıkış — ücretsiz!', action: 'get_out_jail' },
  { text: '🏗️ Sokak onarımı: her ev 400₺, her otel 1150₺ öde.', action: 'repair', house: 400, hotel: 1150 },
  { text: '📈 Hisse senedi satışı: 500₺ al.', action: 'collect', amount: 500 },
  { text: '💸 Okul vergisi: 1500₺ öde.', action: 'pay', amount: 1500 },
  { text: '🎖️ İkinci ödül: 100₺ al.', action: 'collect', amount: 100 },
];

const TOKENS = ['🚗','⛵','🎩','🐶','👢','🚂','🏦','⚓'];
const STARTING_MONEY = 15000;

module.exports = { SQUARES, COLOR_GROUPS, CHANCE_CARDS, CHEST_CARDS, TOKENS, STARTING_MONEY };
