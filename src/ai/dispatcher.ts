import { FORMULAS } from '../experiments/cong-thuc/formulas';
import { extractFormulaParams, normalizeText } from './extract';

export interface DispatchResult {
  templateId: string;
  extractedParams?: Record<string, number>;
  confidence: number;
  message: string;
}

const NUM = '(\\d+(?:[.,]\\d+)?)';

/** Số đứng ngay trước một trong các đơn vị đã cho (đơn vị không được dính liền chữ khác). */
function numberBefore(text: string, units: string[]): number | undefined {
  const m = text.match(new RegExp(`${NUM}\\s*(?:${units.join('|')})(?![a-zà-ỹ0-9²³])`));
  return m ? parseFloat(m[1].replace(',', '.')) : undefined;
}

function put(target: Record<string, number>, key: string, value: number | undefined) {
  if (value !== undefined && Number.isFinite(value)) target[key] = value;
}

/** Chiết suất đề cho: "n = √3", "n = căn 3", "chiết suất 1,5"... Làm tròn 2 chữ số như thanh điều chỉnh. */
function refractiveIndex(text: string): number | undefined {
  const root = text.match(/(?:n\s*=\s*|chiết suất[^.\d√]{0,40})(?:√|căn\s*(?:bậc hai\s*)?(?:của\s*)?)\s*(\d+(?:[.,]\d+)?)/);
  if (root) return Math.round(Math.sqrt(parseFloat(root[1].replace(',', '.'))) * 100) / 100;
  const plain = text.match(/(?:\bn\s*=\s*|chiết suất[^.\d]{0,40}?(?:là|bằng|=)?\s*)(\d+(?:[.,]\d+)?)/);
  if (!plain) return undefined;
  const n = parseFloat(plain[1].replace(',', '.'));
  return n >= 1 && n <= 3 ? n : undefined;
}

function mediumIndex(text: string): number | undefined {
  if (text.includes('kim cương')) return 2.42;
  if (text.includes('thủy tinh')) return 1.5;
  if (text.includes('nước')) return 1.33;
  return undefined;
}

function liquidWeight(text: string): number | undefined {
  if (text.includes('dầu')) return 8000;
  if (text.includes('nước biển') || text.includes('nước muối')) return 10300;
  if (text.includes('nước')) return 10000;
  return undefined;
}

/** Mẫu công thức: chọn mẫu và trích luôn số liệu, đổi đơn vị, đại lượng cần tìm. */
function formulaResult(templateId: string, prompt: string, confidence: number): DispatchResult {
  const def = FORMULAS.find((f) => f.id === templateId)!;
  return {
    templateId,
    extractedParams: extractFormulaParams(def, prompt),
    confidence,
    message: `Nhận diện: ${def.title} (${def.group})`
  };
}

/** Đề hỏi đúng đại lượng `what`: "tính diện tích...", "tìm thể tích của vật", "độ sâu là bao nhiêu". */
const asks = (what: string) =>
  new RegExp(`(tính|tìm|xác định|hỏi)\\s+(?:(?:giá trị|độ lớn)\\s+)?(?:của\\s+)?${what}|${what}[^.;?!\\d]{0,20}(là|bằng)?\\s*bao nhiêu`);

/**
 * Dạng bài đặc thù, xét trước các thí nghiệm vì từ khóa của chúng dễ bị các thí nghiệm
 * có từ khóa rộng hơn (ánh sáng, điện trở, áp suất, lực đẩy...) bắt nhầm.
 */
const EARLY_FORMULA_ROUTES: [(text: string) => boolean, string][] = [
  // Quang học
  [(t) => /thấu kính phân k[ìỳ]/.test(t), 'thau-kinh-phan-ki'],
  [(t) => /kính lúp|số bội giác/.test(t), 'kinh-lup'],
  [(t) => /thấu kính|tiêu cự/.test(t) && /chiều cao (của )?ảnh|ảnh cao/.test(t) && /ảnh cách|cách thấu kính.*ảnh|d'/.test(t) && !/tiêu cự/.test(t), 'chieu-cao-anh'],
  [(t) => /thấu kính|tiêu cự/.test(t), 'thau-kinh-hoi-tu'],
  // n = c/v chỉ khi đề nói tới tốc độ ánh sáng; đề có góc tới/khúc xạ thì để thí nghiệm khúc xạ xử lý
  [(t) => /chiết suất/.test(t) && /(tốc độ|vận tốc|km\/s|m\/s|truyền nhanh|truyền chậm)/.test(t) && !/góc (tới|khúc xạ)/.test(t), 'chiet-suat'],
  // Âm học
  [(t) => /tiếng vang|vang lại|phản xạ âm|âm phản xạ|siêu âm|sonar|dội lại/.test(t), 'tieng-vang'],
  [(t) => /tần số|\bhz\b|héc|\d\s*dao động/.test(t), 'tan-so-dao-dong'],
  // Điện học
  [(t) => /máy biến (áp|thế)|cuộn sơ cấp|cuộn thứ cấp/.test(t), 'may-bien-ap'],
  [(t) => /hao phí|truyền tải điện|đường dây tải/.test(t), 'cong-suat-hao-phi'],
  [(t) => /điện năng|số điện|kw\s*·?\s*h|kwh/.test(t), 'dien-nang'],
  [(t) => /điện trở suất|tiết diện|dây (dẫn )?(bằng |làm bằng )?(đồng|nhôm|nikelin|constantan|vonfram|nicrom|sắt)/.test(t), 'dien-tro-day-dan'],
  [(t) => /song song/.test(t) && /điện trở|r1|ω/.test(t) && !/bóng đèn|đèn/.test(t), 'dien-tro-song-song'],
  [(t) => /nối tiếp/.test(t) && /điện trở|r1|ω/.test(t) && !/bóng đèn|đèn/.test(t), 'dien-tro-noi-tiep'],
  [(t) => /jun|len-?xơ|joule/.test(t) || (/nhiệt lượng tỏa ra/.test(t) && /điện trở|dòng điện|ω|\d\s*a\b/.test(t)), 'nhiet-luong-toa-ra'],
  [(t) => asks('(điện trở|hiệu điện thế)').test(t) && /\d\s*(a|ma)\b|cường độ/.test(t), 'dinh-luat-ohm-ct'],
  // Nhiệt học
  [(t) => /năng suất tỏa nhiệt|đốt cháy/.test(t), 'nhiet-luong-nhien-lieu'],
  [(t) => /cân bằng nhiệt|nhiệt độ (khi|lúc|sau khi) cân bằng/.test(t) || (/(thả|pha|đổ|trộn)/.test(t) && (t.match(/\d\s*(°c|độ c|oc)/g) ?? []).length >= 2), 'can-bang-nhiet'],
  [(t) => /°f|độ f\b|fahrenheit|farenhai/.test(t), 'doi-nhiet-do'],
  [(t) => /kelvin|\d\s*k\b/.test(t), 'nhiet-do-kelvin'],
  // Cơ học
  [(t) => /máy (nén|ép) thủy lực|kích thủy lực|pít-?tông|pittông/.test(t), 'may-nen-thuy-luc'],
  [(t) => /mặt phẳng nghiêng|tấm ván nghiêng/.test(t), 'mat-phang-nghieng'],
  [(t) => /hiệu suất/.test(t), 'hieu-suat'],
  [(t) => /cơ năng/.test(t) && /\d\s*(j|kj)\b/.test(t), 'co-nang'],
  [(t) => /lò xo/.test(t) && /độ cứng|n\/m|n\/cm/.test(t), 'luc-dan-hoi'],
  [(t) => /đòn bẩy|điểm tựa|bập bênh|xà beng/.test(t) && /\d\s*(n|kg|cm|m|dm)\b/.test(t), 'don-bay'],
  [(t) => /tốc độ trung bình|vận tốc trung bình/.test(t) && /(đầu|thứ nhất|nửa|lên dốc|lúc đi)/.test(t), 'toc-do-trung-binh'],
  [(t) => /công suất/.test(t) && /lực kéo|lực đẩy|kéo/.test(t) && /km\/h|m\/s/.test(t), 'cong-suat-keo'],
  [(t) => /trọng lượng riêng/.test(t) && /kg\/m|khối lượng riêng/.test(t) && !/(bình chia độ|ống đong|thể tích|chìm|nhúng)/.test(t), 'trong-luong-rieng'],
  [(t) => /khối lượng riêng/.test(t) && asks('(khối lượng|thể tích)(?! riêng)').test(t) && !/(bình chia độ|ống đong)/.test(t), 'khoi-luong-rieng-ct'],
  [(t) => /(ác-si-mét|ac-si-met|archimedes|lực đẩy)/.test(t) && asks('(thể tích|trọng lượng riêng)').test(t), 'luc-day-ac-si-met-ct'],
  [(t) => /áp suất/.test(t) && (asks('(độ sâu|chiều cao cột)').test(t) || /độ sâu bao nhiêu|sâu bao nhiêu/.test(t)), 'ap-suat-chat-long-ct'],
  [(t) => /áp suất/.test(t) && asks('(diện tích|áp lực|khối lượng|trọng lượng)').test(t) && !/chất lỏng|độ sâu|nước|dầu/.test(t), 'ap-suat']
];

export function dispatchContextToTemplate(prompt: string): DispatchResult {
  const text = normalizeText(prompt);

  // Bản mặt song song: nhận trước cả các mẫu công thức vì đề hay nhắc "chiết suất"
  if (/(hai|2) mặt song song|mặt song song|bản mặt/.test(text) && /(tia sáng|ánh sáng|chiết suất|khúc xạ|thủy tinh)/.test(text)) {
    const extracted: Record<string, number> = {};
    const iMatch = text.match(/góc tới[^\d.;]{0,30}(\d+(?:[.,]\d+)?)\s*(?:°|độ)/);
    put(extracted, 'i', iMatch ? parseFloat(iMatch[1].replace(',', '.')) : numberBefore(text, ['độ', '°']));
    put(extracted, 'n', refractiveIndex(text) ?? mediumIndex(text));
    put(extracted, 'e', numberBefore(text, ['cm']) ?? (numberBefore(text, ['mm']) ?? NaN) / 10);
    return {
      templateId: 'ban-mat-song-song',
      extractedParams: extracted,
      confidence: 0.9,
      message: 'Nhận diện: Tia sáng qua bản mặt song song (SGK KHTN 9)'
    };
  }

  for (const [match, templateId] of EARLY_FORMULA_ROUTES) {
    if (match(text)) return formulaResult(templateId, prompt, 0.8);
  }

  // 1. Lực đẩy Ác-si-mét
  if (
    text.includes('ác-si-mét') ||
    text.includes('ac-si-met') ||
    text.includes('archimedes') ||
    text.includes('lực đẩy') ||
    text.includes('nhúng trong nước') ||
    text.includes('nhúng vào nước') ||
    text.includes('chìm') ||
    text.includes('nổi')
  ) {
    const extracted: Record<string, number> = {};
    put(extracted, 'V_cm3', numberBefore(text, ['cm3', 'cm³', 'ml']));
    put(extracted, 'm_kg', numberBefore(text, ['kg', 'kilogram']));
    put(extracted, 'd_liquid', liquidWeight(text));

    return {
      templateId: 'luc-day-archimedes',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Lực đẩy Ác-si-mét & Điều kiện chìm nổi (SGK KHTN 8)'
    };
  }

  // 2. Áp suất chất lỏng
  if (
    text.includes('áp suất chất lỏng') ||
    text.includes('độ sâu') ||
    text.includes('đáy bình') ||
    text.includes('tia nước') ||
    text.includes('cột nước')
  ) {
    const extracted: Record<string, number> = {};
    const h_m = numberBefore(text, ['m']);
    put(extracted, 'h_cm', numberBefore(text, ['cm', 'centimet']) ?? (h_m !== undefined ? h_m * 100 : undefined));
    put(extracted, 'd_liquid', liquidWeight(text));

    return {
      templateId: 'ap-suat-chat-long',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Áp suất chất lỏng & Độ sâu h (SGK KHTN 8)'
    };
  }

  // 3. Khối lượng riêng & Bình chia độ
  if (
    text.includes('khối lượng riêng') ||
    text.includes('trọng lượng riêng') ||
    text.includes('bình chia độ') ||
    text.includes('ống đong') ||
    text.includes('thể tích vật') ||
    text.includes('cân điện tử')
  ) {
    const extracted: Record<string, number> = {};
    put(extracted, 'm_g', numberBefore(text, ['g', 'gam']));
    const V = numberBefore(text, ['cm3', 'cm³', 'ml']);
    if (V !== undefined) {
      // Đề cho sẵn thể tích vật: đặt mực nước đầu 50 cm³, mực sau dâng thêm đúng V
      extracted.V1_cm3 = 50;
      extracted.V2_cm3 = 50 + V;
    }

    return {
      templateId: 'khoi-luong-rieng',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Xác định khối lượng riêng D = m/V (SGK KHTN 8)'
    };
  }

  // 4. Khúc xạ ánh sáng
  if (
    text.includes('khúc xạ') ||
    text.includes('khuc xa') ||
    text.includes('chiếu vào nước') ||
    text.includes('chiếu vào thủy tinh') ||
    text.includes('góc khúc xạ') ||
    text.includes('phản xạ toàn phần') ||
    // tia sáng đi từ môi trường này sang môi trường khác
    (/tia sáng|ánh sáng|laser|laze/.test(text) &&
      /vào (trong )?(nước|thủy tinh|kim cương)|(từ|ra|sang) không khí/.test(text))
  ) {
    const extracted: Record<string, number> = {};
    put(extracted, 'i', numberBefore(text, ['độ', '°', 'deg']));
    put(extracted, 'n', refractiveIndex(text) ?? mediumIndex(text));
    if (/(ra|sang) không khí/.test(text) || text.includes('phản xạ toàn phần')) extracted.direction = 2;

    return {
      templateId: 'khuc-xa-anh-sang',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Hiện tượng khúc xạ ánh sáng (SGK KHTN 9)'
    };
  }

  // 5. Định luật Ôm
  if (
    text.includes('định luật ôm') ||
    text.includes('dinh luat ohm') ||
    text.includes('định luật ohm') ||
    text.includes('điện trở') ||
    text.includes('ampe kế') ||
    text.includes('vôn kế')
  ) {
    const extracted: Record<string, number> = {};
    put(extracted, 'U', numberBefore(text, ['v', 'volt', 'vôn']));
    put(extracted, 'R', numberBefore(text, ['ôm', 'ohm', 'ω']));

    return {
      templateId: 'dinh-luat-ohm',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Định luật Ôm đối với đoạn mạch I = U/R (SGK KHTN 9)'
    };
  }

  // 6. Áp suất chất rắn
  if (
    text.includes('áp suất') ||
    text.includes('viên gạch') ||
    text.includes('mặt bị ép') ||
    text.includes('độ lún') ||
    text.includes('áp lực') ||
    text.includes('diện tích tiếp xúc')
  ) {
    const extracted: Record<string, number> = {};
    const F = numberBefore(text, ['n', 'niutơn', 'newton']);
    // Đề cho áp lực F thay vì khối lượng: m = F / 10
    put(extracted, 'm', numberBefore(text, ['kg', 'kilogram']) ?? (F !== undefined ? F / 10 : undefined));
    const S_m2 = numberBefore(text, ['m2', 'm²']);
    put(extracted, 'S', numberBefore(text, ['cm2', 'cm²']) ?? (S_m2 !== undefined ? S_m2 * 10000 : undefined));

    return {
      templateId: 'ap-suat-chat-ran',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Áp suất chất rắn (SGK KHTN 8)'
    };
  }

  // 7a. Hệ hai gương phẳng
  if (/(hai|2) gương|gương g1[^.]*g2|g1 và g2[^.]*gương/.test(text)) {
    const extracted: Record<string, number> = {};
    const thetaMatch = text.match(/(?:hợp với nhau|hợp thành|tạo với nhau|hợp)\s*(?:một\s*)?(?:góc\s*)?(?:θ\s*=?\s*)?(\d+(?:[.,]\d+)?)\s*(?:°|độ)/);
    const theta = /vuông góc/.test(text) ? 90 : thetaMatch ? parseFloat(thetaMatch[1].replace(',', '.')) : undefined;
    const iMatch = text.match(/góc tới[^\d.;]{0,25}(\d+(?:[.,]\d+)?)\s*(?:°|độ)/);
    put(extracted, 'theta', theta);
    put(extracted, 'i', iMatch ? parseFloat(iMatch[1].replace(',', '.')) : undefined);

    return {
      templateId: 'hai-guong-phang',
      extractedParams: extracted,
      confidence: 0.9,
      message: 'Nhận diện: Hệ hai gương phẳng (SGK KHTN 7)'
    };
  }

  // 7. Phản xạ ánh sáng
  if (
    text.includes('phản xạ') ||
    text.includes('gương') ||
    text.includes('tia tới') ||
    text.includes('góc tới') ||
    text.includes('ánh sáng')
  ) {
    const extracted: Record<string, number> = {};
    const angle = numberBefore(text, ['độ', '°', 'deg']);
    // "Góc hợp bởi tia tới và mặt gương" là góc phụ của góc tới
    const withMirror = /(hợp|tạo) (bởi|với).*(mặt gương|gương)/.test(text) && !/góc tới\s*(i\s*)?(=|là|bằng)?\s*\d/.test(text);
    put(extracted, 'i', angle !== undefined && withMirror ? 90 - angle : angle);

    return {
      templateId: 'phan-xa-anh-sang',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Định luật phản xạ ánh sáng (SGK KHTN 7)'
    };
  }

  // 8. Mạch điện đơn giản
  if (
    text.includes('mạch điện') ||
    text.includes('bóng đèn') ||
    text.includes('công tắc') ||
    text.includes('pin') ||
    text.includes('đoản mạch')
  ) {
    const extracted: Record<string, number> = {};
    put(extracted, 'voltage', numberBefore(text, ['v', 'volt', 'vôn']));
    const twoBulbs = /(2|hai) (bóng )?đèn/.test(text);
    if (text.includes('đoản mạch') || text.includes('nối tắt')) extracted.topology = 4;
    else if (text.includes('song song')) extracted.topology = 3;
    else if (twoBulbs && text.includes('nối tiếp')) extracted.topology = 2;
    else extracted.topology = 1;
    if (text.includes('công tắc mở') || text.includes('mở công tắc') || text.includes('ngắt công tắc')) extracted.switchClosed = 0;
    if (text.includes('đứt dây') || text.includes('dây đứt')) extracted.wireBroken = 1;

    return {
      templateId: 'mach-dien-don-gian',
      extractedParams: extracted,
      confidence: 0.92,
      message: 'Nhận diện: Mạch điện đơn giản (SGK KHTN 8)'
    };
  }

  // 9. Các bài tính theo công thức (chỉ chọn mẫu; việc trích số liệu và đổi đơn vị dành cho AI)
  const formulaRoutes: [RegExp, string, string][] = [
    [/nhiệt lượng|nhiệt dung riêng|đun (nóng|sôi)/, 'nhiet-luong', 'Nhiệt lượng Q = m·c·Δt'],
    [/điện năng|số điện|kw\s*·?\s*h|kwh/, 'dien-nang', 'Năng lượng điện W = 𝒫·t'],
    [/công suất (điện|định mức)|bàn là|ấm điện/, 'cong-suat-dien', 'Công suất điện 𝒫 = U·I'],
    [/công suất/, 'cong-suat', 'Công suất 𝒫 = A/t'],
    [/động năng/, 'dong-nang', 'Động năng'],
    [/thế năng/, 'the-nang', 'Thế năng'],
    [/mô men|mô-men|momen/, 'mo-men-luc', 'Mô men lực M = F·d'],
    [/(tính|thực hiện|sinh) (một )?công|công cơ học/, 'cong-co-hoc', 'Công cơ học A = F·s'],
    [/km\/h|m\/s|quãng đường|đi (được|hết)|tốc độ trung bình|(tính|tìm) (tốc độ|vận tốc|thời gian)|\d\s*k?m\b[^.]*trong\s*\d/, 'toc-do', 'Tốc độ v = s/t'],
    [/trọng lượng/, 'trong-luong', 'Trọng lượng P = 10·m']
  ];
  const isLabScene = /lò xo|ma sát|cổng quang|đòn bẩy|điểm tựa|bập bênh|con lắc|cơ năng/.test(text);
  if (!isLabScene) {
    for (const [pattern, templateId, name] of formulaRoutes) {
      if (pattern.test(text)) return { ...formulaResult(templateId, prompt, 0.7), message: `Nhận diện: ${name}` };
    }
  }

  // 10. Lực & chuyển động: chọn bài theo nội dung đề
  let scene = 1;
  if (text.includes('ma sát') || text.includes('nhám') || text.includes('trơn')) scene = 2;
  else if (text.includes('tốc độ') || text.includes('cổng quang') || text.includes('vận tốc')) scene = 3;
  else if (text.includes('đòn bẩy') || text.includes('điểm tựa') || text.includes('mô men') || text.includes('bập bênh')) scene = 4;
  else if (text.includes('động năng') || text.includes('thế năng') || text.includes('cơ năng') || text.includes('con lắc')) scene = 5;

  return {
    templateId: 'luc-va-chuyen-dong',
    extractedParams: { scene },
    confidence: 0.85,
    message: 'Nhận diện: Phòng thí nghiệm Lực & Chuyển động (KHTN 6–9)'
  };
}
