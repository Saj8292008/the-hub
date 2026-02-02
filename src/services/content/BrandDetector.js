/**
 * Brand Detector
 * Improved brand detection from listing titles
 * Fixes the "Unknown" brand problem
 */

class BrandDetector {
  constructor() {
    // Comprehensive brand list with aliases
    this.brands = {
      // Grail tier
      'Patek Philippe': ['patek', 'philippe', 'pp'],
      'Audemars Piguet': ['audemars', 'piguet', 'ap', 'royal oak'],
      'Vacheron Constantin': ['vacheron', 'constantin', 'vc'],
      'A. Lange & Söhne': ['lange', 'sohne', 'a.lange', 'alange'],
      'Richard Mille': ['richard mille', 'rm '],
      
      // Luxury tier
      'Rolex': ['rolex', 'submariner', 'datejust', 'daytona', 'gmt-master', 'explorer', 'milgauss', 'yacht-master', 'sky-dweller', 'day-date', 'oyster perpetual'],
      'Omega': ['omega', 'speedmaster', 'seamaster', 'constellation', 'aqua terra', 'moonwatch', 'planet ocean', 'de ville'],
      'Cartier': ['cartier', 'tank', 'santos', 'ballon bleu', 'panthere'],
      'IWC': ['iwc', 'portugieser', 'pilot', 'portofino', 'aquatimer'],
      'Panerai': ['panerai', 'luminor', 'radiomir', 'pam'],
      'Jaeger-LeCoultre': ['jaeger', 'lecoultre', 'jlc', 'reverso', 'master'],
      'Breitling': ['breitling', 'navitimer', 'superocean', 'chronomat', 'avenger'],
      'Blancpain': ['blancpain', 'fifty fathoms'],
      'Zenith': ['zenith', 'el primero', 'defy', 'chronomaster'],
      
      // Enthusiast tier
      'Tudor': ['tudor', 'black bay', 'pelagos', 'ranger'],
      'Grand Seiko': ['grand seiko', 'gs', 'sbg'],
      'Nomos': ['nomos', 'glashutte', 'tangente', 'orion', 'metro'],
      'Oris': ['oris', 'aquis', 'big crown', 'divers sixty-five'],
      'Longines': ['longines', 'hydroconquest', 'conquest', 'master collection', 'spirit'],
      'Sinn': ['sinn', '556', '104', '356', '857', 'u1', 'u50'],
      'Ball': ['ball watch', 'ball engineer'],
      'Glashutte Original': ['glashutte original', 'go '],
      'Moser': ['moser', 'h. moser'],
      'MB&F': ['mb&f', 'mbf'],
      
      // Entry tier
      'Seiko': ['seiko', 'presage', 'prospex', 'alpinist', 'skx', 'srpd', 'sarb', 'turtle', 'samurai', 'king seiko', 'cocktail time'],
      'Hamilton': ['hamilton', 'khaki', 'jazzmaster', 'ventura', 'intra-matic'],
      'Tissot': ['tissot', 'prx', 't-sport', 'gentleman', 'seastar'],
      'Orient': ['orient', 'bambino', 'mako', 'ray', 'kamasu', 'star'],
      'Citizen': ['citizen', 'promaster', 'eco-drive', 'nighthawk'],
      'Casio': ['casio', 'g-shock', 'gshock', 'edifice', 'oceanus', 'protrek'],
      'Bulova': ['bulova', 'precisionist', 'lunar pilot'],
      'Timex': ['timex', 'marlin', 'expedition', 'q timex'],
      
      // Micro/Independent
      'Christopher Ward': ['christopher ward', 'c60', 'c63', 'c65'],
      'Monta': ['monta'],
      'Farer': ['farer'],
      'Halios': ['halios', 'seaforth'],
      'Baltic': ['baltic'],
      'Lorier': ['lorier'],
      'Vaer': ['vaer'],
      'Autodromo': ['autodromo'],
      'Formex': ['formex'],
      'Yema': ['yema'],
      'Squale': ['squale'],
      'Doxa': ['doxa'],
      'Fortis': ['fortis'],
      'Glycine': ['glycine'],
      'Junghans': ['junghans', 'max bill'],
      'Rado': ['rado', 'captain cook'],
      'Mido': ['mido', 'ocean star', 'baroncelli'],
      'Maurice Lacroix': ['maurice lacroix', 'aikon', 'pontos'],
      'Baume & Mercier': ['baume', 'mercier', 'clifton', 'riviera'],
      'Tag Heuer': ['tag heuer', 'carrera', 'monaco', 'aquaracer', 'formula 1'],
      'Frederique Constant': ['frederique constant', 'fc'],
      'Alpina': ['alpina', 'seastrong', 'startimer'],
      'Certina': ['certina', 'ds action'],
      'Movado': ['movado', 'museum'],
      'Montblanc': ['montblanc', 'mont blanc', '1858'],
      'Credor': ['credor'],
      'Nivada': ['nivada', 'grenchen'],
      'Zodiac': ['zodiac', 'super sea wolf'],
      'Aevig': ['aevig'],
      'Borealis': ['borealis'],
      'Dan Henry': ['dan henry'],
      'Steinhart': ['steinhart'],
      'San Martin': ['san martin'],
      'Pagani': ['pagani design'],
      'Invicta': ['invicta'],
      'Stuhrling': ['stuhrling'],
      'Deep Blue': ['deep blue'],
      'Victorinox': ['victorinox'],
      'Luminox': ['luminox'],
      'Kurono': ['kurono', 'kurono tokyo'],
      'Berny': ['berny'],
      'Concord': ['concord', 'saratoga', 'mariner'],
      'Gama': ['gama'],
      'True North': ['true north'],
      'Brew': ['brew'],
      'Vostok': ['vostok', 'amphibia', 'komandirskie'],
      'Raketa': ['raketa'],
      'Poljot': ['poljot'],
      'Skagen': ['skagen'],
      'Mondaine': ['mondaine'],
      'Marathon': ['marathon'],
      'Islander': ['islander'],
      'Nodus': ['nodus'],
      'Zelos': ['zelos'],
      'Ming': ['ming'],
      'Anordain': ['anordain'],
      'Fears': ['fears'],
      'Kudoke': ['kudoke'],
      'Mühle Glashütte': ['muhle', 'mühle'],
      'Laco': ['laco'],
      'Stowa': ['stowa'],
      'Archimede': ['archimede'],
      'Damasko': ['damasko'],
      'Habring': ['habring'],
      'Limes': ['limes'],
      'Hanhart': ['hanhart'],
      'Guinand': ['guinand']
    };
    
    // Build reverse lookup
    this.aliasMap = new Map();
    for (const [brand, aliases] of Object.entries(this.brands)) {
      for (const alias of aliases) {
        this.aliasMap.set(alias.toLowerCase(), brand);
      }
    }
  }

  /**
   * Detect brand from title
   * @param {string} title - Listing title
   * @returns {string} - Detected brand or 'Unknown'
   */
  detect(title) {
    if (!title) return 'Unknown';
    
    const lower = title.toLowerCase();
    
    // Try exact brand name matches first (longer = more specific)
    const sortedBrands = Object.keys(this.brands).sort((a, b) => b.length - a.length);
    
    for (const brand of sortedBrands) {
      if (lower.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    // Try alias matches
    for (const [alias, brand] of this.aliasMap) {
      // Use word boundary check for short aliases
      if (alias.length <= 3) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(lower)) {
          return brand;
        }
      } else if (lower.includes(alias)) {
        return brand;
      }
    }
    
    return 'Unknown';
  }

  /**
   * Get brand tier
   */
  getTier(brand) {
    const grail = ['Patek Philippe', 'Audemars Piguet', 'Vacheron Constantin', 'A. Lange & Söhne', 'Richard Mille'];
    const luxury = ['Rolex', 'Omega', 'Cartier', 'IWC', 'Panerai', 'Jaeger-LeCoultre', 'Breitling', 'Blancpain', 'Zenith'];
    const enthusiast = ['Tudor', 'Grand Seiko', 'Nomos', 'Oris', 'Longines', 'Sinn', 'Ball', 'Glashutte Original', 'Moser', 'MB&F', 'Tag Heuer'];
    
    if (grail.includes(brand)) return 'grail';
    if (luxury.includes(brand)) return 'luxury';
    if (enthusiast.includes(brand)) return 'enthusiast';
    return 'entry';
  }

  /**
   * Test detection on a batch of titles
   */
  testBatch(titles) {
    const results = { detected: 0, unknown: 0, examples: [] };
    
    for (const title of titles) {
      const brand = this.detect(title);
      if (brand === 'Unknown') {
        results.unknown++;
        results.examples.push({ title: title.substring(0, 60), brand });
      } else {
        results.detected++;
      }
    }
    
    results.rate = Math.round((results.detected / titles.length) * 100);
    return results;
  }
}

module.exports = BrandDetector;
