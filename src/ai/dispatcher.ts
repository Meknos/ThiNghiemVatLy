export interface DispatchResult {
  templateId: string;
  extractedParams?: Record<string, number>;
  confidence: number;
  message: string;
}

export function dispatchContextToTemplate(prompt: string): DispatchResult {
  const text = prompt.toLowerCase();

  // 1. Áp suất chất rắn
  if (
    text.includes('áp suất') ||
    text.includes('ap suat') ||
    text.includes('viên gạch') ||
    text.includes('mặt bị ép') ||
    text.includes('độ lún') ||
    text.includes('áp lực') ||
    text.includes('diện tích tiếp xúc')
  ) {
    const extracted: Record<string, number> = {};
    // Tìm m (kg)
    const mMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilogram)/);
    if (mMatch) extracted.m = parseFloat(mMatch[1].replace(',', '.'));

    // Tìm S (cm2 hoặc m2)
    const sMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:cm2|cm²)/);
    if (sMatch) extracted.S = parseFloat(sMatch[1].replace(',', '.'));

    return {
      templateId: 'ap-suat-chat-ran',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Bài toán Áp suất chất rắn (SGK KHTN 8)'
    };
  }

  // 2. Phản xạ ánh sáng
  if (
    text.includes('phản xạ') ||
    text.includes('phan xa') ||
    text.includes('gương') ||
    text.includes('tia tới') ||
    text.includes('góc tới') ||
    text.includes('ánh sáng') ||
    text.includes('pháp tuyến')
  ) {
    const extracted: Record<string, number> = {};
    const iMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:độ|°|deg)/);
    if (iMatch) extracted.i = parseFloat(iMatch[1].replace(',', '.'));

    return {
      templateId: 'phan-xa-anh-sang',
      extractedParams: extracted,
      confidence: 0.95,
      message: 'Nhận diện: Bài toán Định luật phản xạ ánh sáng (SGK KHTN 7)'
    };
  }

  // 3. Mạch điện đơn giản
  if (
    text.includes('mạch điện') ||
    text.includes('mach dien') ||
    text.includes('bóng đèn') ||
    text.includes('công tắc') ||
    text.includes('pin') ||
    text.includes('đoản mạch') ||
    text.includes('dòng điện')
  ) {
    const extracted: Record<string, number> = {};
    if (text.includes('song song')) extracted.topology = 3;
    else if (text.includes('nối tiếp')) extracted.topology = 2;
    else if (text.includes('đoản mạch')) extracted.topology = 4;

    const uMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:v|volt|vôn)/);
    if (uMatch) extracted.voltage = parseFloat(uMatch[1].replace(',', '.'));

    return {
      templateId: 'mach-dien-don-gian',
      extractedParams: extracted,
      confidence: 0.92,
      message: 'Nhận diện: Bài toán Mạch điện & Tác dụng dòng điện (SGK KHTN 8)'
    };
  }

  // 4. Cơ học - Lực & chuyển động
  if (
    text.includes('chuyển động') ||
    text.includes('lực') ||
    text.includes('va chạm') ||
    text.includes('con lắc') ||
    text.includes('mặt nghiêng') ||
    text.includes('lò xo') ||
    text.includes('rơi tự do') ||
    text.includes('tốc độ')
  ) {
    return {
      templateId: 'luc-va-chuyen-dong',
      confidence: 0.9,
      message: 'Nhận diện: Thí nghiệm Lực, Chuyển động & Cơ năng'
    };
  }

  // Mặc định hoặc chưa hỗ trợ
  return {
    templateId: 'luc-va-chuyen-dong',
    confidence: 0.5,
    message: 'Chưa nhận diện chính xác chủ đề riêng biệt. Đã mở phòng thí nghiệm tương tác tự do (Cơ học & Lực).'
  };
}
