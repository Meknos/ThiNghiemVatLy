export interface DispatchResult {
  templateId: string;
  extractedParams?: Record<string, number>;
  confidence: number;
  message: string;
}

export function dispatchContextToTemplate(prompt: string): DispatchResult {
  const text = prompt.toLowerCase();

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
    const vMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:cm3|cm³|ml)/);
    if (vMatch) extracted.V_cm3 = parseFloat(vMatch[1].replace(',', '.'));
    const mMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilogram)/);
    if (mMatch) extracted.m_kg = parseFloat(mMatch[1].replace(',', '.'));

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
    const hMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:cm|centimet)/);
    if (hMatch) extracted.h_cm = parseFloat(hMatch[1].replace(',', '.'));

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
    const mMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gam)/);
    if (mMatch) extracted.m_g = parseFloat(mMatch[1].replace(',', '.'));

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
    text.includes('góc khúc xạ')
  ) {
    const extracted: Record<string, number> = {};
    const iMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:độ|°|deg)/);
    if (iMatch) extracted.i = parseFloat(iMatch[1].replace(',', '.'));

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
    const uMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:v|volt|vôn)/);
    if (uMatch) extracted.U = parseFloat(uMatch[1].replace(',', '.'));
    const rMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ôm|ohm|Ω)/);
    if (rMatch) extracted.R = parseFloat(rMatch[1].replace(',', '.'));

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
    const mMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilogram)/);
    if (mMatch) extracted.m = parseFloat(mMatch[1].replace(',', '.'));
    const sMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:cm2|cm²)/);
    if (sMatch) extracted.S = parseFloat(sMatch[1].replace(',', '.'));

    return {
      templateId: 'ap-suat-chat-ran',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Áp suất chất rắn (SGK KHTN 8)'
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
    const iMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:độ|°|deg)/);
    if (iMatch) extracted.i = parseFloat(iMatch[1].replace(',', '.'));

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
    return {
      templateId: 'mach-dien-don-gian',
      confidence: 0.92,
      message: 'Nhận diện: Mạch điện đơn giản & Tác dụng dòng điện (SGK KHTN 8)'
    };
  }

  // 9. Lực & Chuyển động (Matter.js tương tác tự do)
  return {
    templateId: 'luc-va-chuyen-dong',
    confidence: 0.85,
    message: 'Nhận diện: Phòng thí nghiệm Lực, Đòn bẩy, Lò xo & Chuyển động (KHTN 6, 7, 8)'
  };
}
