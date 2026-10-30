# Điền nội dung hồ sơ AIPLab Studio vào khung 15 trang dựng từ mẫu slide của Ban tổ chức.
# Chạy: python build_slides.py  (đọc khung.pptx, ghi ../AIPLab-Studio-Slide.pptx)
import copy
import re
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.lang import MSO_LANGUAGE_ID
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

HERE = Path(__file__).parent
IMG = HERE.parent / 'anh'
OUT = HERE.parent / 'AIPLab-Studio-Slide.pptx'

FONT = 'Aptos'
NAVY = RGBColor(0x00, 0x00, 0x54)
BLUE = RGBColor(0x0B, 0x5C, 0xD6)
SKY = RGBColor(0xE8, 0xF0, 0xFE)
RED = RGBColor(0xE6, 0x1E, 0x2A)
GREEN = RGBColor(0x0E, 0x7A, 0x52)
MINT = RGBColor(0xE7, 0xF6, 0xEF)
GRAY = RGBColor(0x37, 0x41, 0x51)
LINE = RGBColor(0xC9, 0xD3, 0xE6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
YELLOW = RGBColor(0xFF, 0xEA, 0x00)

FILL_RE = re.compile(r'(\[ĐIỀN[^\]]*\])')


# ---------------------------------------------------------------- tiện ích

def runs_of(text, size, color, bold=False, italic=False):
    """Tách đoạn chữ thành các run; chỗ [ĐIỀN: ...] tô đỏ nghiêng để thầy/cô dễ thấy và điền."""
    out = []
    for part in FILL_RE.split(text):
        if not part:
            continue
        if FILL_RE.fullmatch(part):
            out.append((part, dict(size=size, color=RED, bold=True, italic=True)))
        else:
            out.append((part, dict(size=size, color=color, bold=bold, italic=italic)))
    return out


def set_bullet(paragraph, char='•', indent=0.38, level_indent=0.0):
    pPr = paragraph._p.get_or_add_pPr()
    pPr.set('marL', str(Inches(indent + level_indent)))
    pPr.set('indent', str(-Inches(indent)))
    for tag in ('a:buNone', 'a:buChar', 'a:buAutoNum'):
        for el in pPr.findall(qn(tag)):
            pPr.remove(el)
    bu = pPr.makeelement(qn('a:buChar'), {'char': char})
    pPr.append(bu)


def text(slide, x, y, w, h, paras, size=28, color=NAVY, bold=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, space_after=10, line=1.05, margin=0.05, name=None):
    """paras: danh sách chuỗi hoặc dict {t, size, color, bold, italic, bullet, level, align}."""
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    if name:
        box.name = name
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for side in ('left', 'right', 'top', 'bottom'):
        setattr(tf, f'margin_{side}', Inches(margin))
    for i, p in enumerate(paras):
        if isinstance(p, str):
            p = {'t': p}
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = p.get('align', align)
        para.space_after = Pt(p.get('space_after', space_after))
        para.line_spacing = line
        if p.get('bullet'):
            set_bullet(para, p.get('char', '•'), level_indent=0.45 * p.get('level', 0))
        for t, f in runs_of(p['t'], p.get('size', size), p.get('color', color), p.get('bold', bold), p.get('italic', False)):
            r = para.add_run()
            r.text = t
            r.font.name = FONT
            r.font.size = Pt(f['size'])
            r.font.bold = f['bold']
            r.font.italic = f['italic']
            r.font.color.rgb = f['color']
            r.font.language_id = MSO_LANGUAGE_ID.VIETNAMESE
    return box


def card(slide, x, y, w, h, fill=SKY, line=None, radius=0.06, dashed=False, shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(2)
        if dashed:
            s.line.dash_style = 7  # dash
    s.shadow.inherit = False
    s.text_frame.text = ''
    return s


def badge(slide, x, y, d, label, fill=NAVY, color=WHITE, size=26):
    """Vòng tròn đánh số: điểm nhấn thị giác dùng xuyên suốt bộ slide."""
    s = card(slide, x, y, d, d, fill=fill, shape=MSO_SHAPE.OVAL)
    tf = s.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = True
    r.font.color.rgb = color
    return s


def picture(slide, path, x, y, w, h, border=True, align='center'):
    """Chèn ảnh vừa khít trong khung (giữ tỉ lệ), căn giữa."""
    iw, ih = Image.open(path).size
    scale = min(w / iw, h / ih)
    pw, ph = iw * scale, ih * scale
    px = x + (w - pw) / 2 if align == 'center' else x
    py = y + (h - ph) / 2
    pic = slide.shapes.add_picture(str(path), Inches(px), Inches(py), Inches(pw), Inches(ph))
    if border:
        pic.line.color.rgb = LINE
        pic.line.width = Pt(1.5)
    return pic


def arrow(slide, x1, y1, x2, y2, color=BLUE):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = color
    c.line.width = Pt(4)
    ln = c.line._get_or_add_ln()
    tail = ln.makeelement(qn('a:tailEnd'), {'type': 'triangle', 'w': 'med', 'len': 'med'})
    ln.append(tail)
    return c


def shape_with_text(slide, starts):
    for sh in slide.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip().startswith(starts):
            return sh
    return None


def remove(shape):
    shape._element.getparent().remove(shape._element)


def set_title(slide, title):
    """Đổi chữ tiêu đề nhưng giữ nguyên định dạng của mẫu; nới rộng khung cho tiêu đề dài."""
    for sh in slide.shapes:
        if sh.has_text_frame and abs(sh.top - Inches(1.10)) < Inches(0.15) and sh.text_frame.text.strip():
            tf = sh.text_frame
            first = tf.paragraphs[0].runs[0]
            first.text = title
            # Mẫu chỉ giãn chữ âm cho một đoạn ngắn; áp cho cả tiêu đề thì chữ dính vào nhau
            first.font._rPr.attrib.pop('spc', None)
            first.font.language_id = MSO_LANGUAGE_ID.VIETNAMESE
            for r in tf.paragraphs[0].runs[1:]:
                r._r.getparent().remove(r._r)
            for p in tf.paragraphs[1:]:
                p._p.getparent().remove(p._p)
            sh.width = Inches(18.2)
            return sh
    raise RuntimeError('Không thấy tiêu đề')


def clear_body(slide):
    """Xóa ô hướng dẫn của mẫu (khung chữ lớn bắt đầu ở khoảng y = 2,1–2,3 inch)."""
    for sh in list(slide.shapes):
        if sh.has_text_frame and Inches(2.0) < sh.top < Inches(2.4) and sh.width > Inches(17):
            remove(sh)


def notes(slide, t):
    slide.notes_slide.notes_text_frame.text = t


# ---------------------------------------------------------------- nội dung

prs = Presentation(HERE / 'khung.pptx')
S = list(prs.slides)
assert len(S) == 15, len(S)

# ---------- 1. Bìa
s = S[0]
title = shape_with_text(s, 'TÊN CỦA SẢN PHẨM')
title.top, title.height = Inches(3.45), Inches(3.1)
tf = title.text_frame
tf.word_wrap = True
p0 = tf.paragraphs[0]
r0 = p0.runs[0]
r0.text = 'AIPLAB STUDIO'
r0.font.size = Pt(72)
r0.font._rPr.attrib.pop('spc', None)
for r in p0.runs[1:]:
    r._r.getparent().remove(r._r)
p1 = copy.deepcopy(p0._p)
p0._p.addnext(p1)
sub = tf.paragraphs[1]
sub.runs[0].text = 'Phòng thí nghiệm Vật lý ảo có AI đọc đề bài – Khoa học tự nhiên 6–9'
sub.runs[0].font.size = Pt(36)
sub.runs[0].font.bold = False
sub.runs[0].font.color.rgb = BLUE
sub.runs[0].font.language_id = MSO_LANGUAGE_ID.VIETNAMESE

for sh in s.shapes:
    if sh.shape_type == 6:  # nhóm ảnh và tên giáo viên mẫu
        for c in list(sh.shapes):
            if c.has_text_frame and 'Phạm Chí Thanh' in c.text_frame.text:
                c.text_frame.paragraphs[0].runs[0].text = '[Họ và tên]'
                for r in c.text_frame.paragraphs[0].runs[1:]:
                    r._r.getparent().remove(r._r)
            elif c.shape_type == 6:  # ảnh chân dung của người mẫu: thay bằng ô trống để thầy/cô chèn ảnh
                ph = c
        # Vị trí ảnh trong hệ tọa độ trang
        g = sh._element.find(qn('p:grpSpPr')).find(qn('a:xfrm'))
        off, ext = g.find(qn('a:off')), g.find(qn('a:ext'))
        choff, chext = g.find(qn('a:chOff')), g.find(qn('a:chExt'))
        sx = int(ext.get('cx')) / int(chext.get('cx'))
        sy = int(ext.get('cy')) / int(chext.get('cy'))
        px = int(off.get('x')) + (ph.left - int(choff.get('x'))) * sx
        py = int(off.get('y')) + (ph.top - int(choff.get('y'))) * sy
        pw, phh = ph.width * sx, ph.height * sy
        remove(ph)
        o = card(s, Emu(px) / 914400, Emu(py) / 914400, Emu(pw) / 914400, Emu(phh) / 914400, fill=WHITE, shape=MSO_SHAPE.OVAL)
        o.line.color.rgb = YELLOW
        o.line.width = Pt(2)
        otf = o.text_frame
        otf.vertical_anchor = MSO_ANCHOR.MIDDLE
        op = otf.paragraphs[0]
        op.alignment = PP_ALIGN.CENTER
        orr = op.add_run()
        orr.text = 'Ảnh'
        orr.font.name = FONT
        orr.font.size = Pt(20)
        orr.font.color.rgb = NAVY

unit = shape_with_text(s, 'Đơn vị công tác')
paras = unit.text_frame.paragraphs
paras[1].runs[0].text = '[ĐIỀN: Tên trường]'
for r in paras[1].runs[1:]:
    r._r.getparent().remove(r._r)
paras[2].runs[0].text = '[ĐIỀN: Địa chỉ trường]'
for r in paras[2].runs[1:]:
    r._r.getparent().remove(r._r)
mail = shape_with_text(s, 'Email')
mp = mail.text_frame.paragraphs
mp[-1].runs[0].text = '[ĐIỀN: email]   ·   Dùng thử: thinghiemvatly.pages.dev'
for r in mp[-1].runs[1:]:
    r._r.getparent().remove(r._r)
mail.width = Inches(9.6)
notes(s, 'Kính thưa Hội đồng giám khảo. Tôi là [họ tên], giáo viên Khoa học tự nhiên trường [tên trường]. '
         'Sản phẩm tôi xin trình bày là AIPLab Studio: phòng thí nghiệm Vật lý ảo, giáo viên chỉ cần dán đề bài là AI dựng thí nghiệm mô phỏng đúng số liệu của đề.')

# ---------- 2. Dàn ý
s = S[1]
remove(shape_with_text(s, '[Thêm hình'))
remove(shape_with_text(s, 'Liệt kê'))
picture(s, IMG / 'dien-thoai.jpg', 1.45, 1.4, 6.95, 8.35, border=False)
items = [
    ('1', 'Bối cảnh và vấn đề'),
    ('2', 'Ý tưởng và giải pháp AI'),
    ('3', 'Triển khai thực tế'),
    ('4', 'Kết quả và tác động'),
    ('5', 'Bền vững và nhân rộng'),
    ('6', 'Tài liệu đính kèm'),
]
for i, (n, t) in enumerate(items):
    y = 2.35 + i * 1.22
    badge(s, 10.95, y, 0.85, n, size=28)
    text(s, 12.05, y + 0.08, 7.0, 0.75, [t], size=32, anchor=MSO_ANCHOR.MIDDLE)
notes(s, 'Bài trình bày gồm 6 phần, theo đúng các nội dung Ban tổ chức yêu cầu.')

# ---------- 3. Bối cảnh và vấn đề
s = S[2]
set_title(s, 'BỐI CẢNH VÀ VẤN ĐỀ')
clear_body(s)
text(s, 0.97, 2.25, 10.6, 7.2, [
    {'t': 'Học sinh khó hình dung, giáo viên thiếu điều kiện làm thí nghiệm', 'bold': True, 'size': 30, 'color': BLUE, 'space_after': 18},
    {'t': 'Nhiều hiện tượng Vật lý không làm thí nghiệm thật được trên lớp: tia sáng qua hệ hai gương, áp suất của xe tăng lên mặt đất, áp suất ở độ sâu 50 m dưới biển…', 'bullet': True},
    {'t': 'Phòng thí nghiệm thiếu hoặc hỏng dụng cụ; chuẩn bị một thí nghiệm mất nhiều thời gian trong tiết học 45 phút.', 'bullet': True},
    {'t': 'Học sinh giải bài tập bằng cách “thay số vào công thức”, không thấy hiện tượng nên khó hiểu, dễ nhầm đơn vị.', 'bullet': True},
    {'t': 'Thực tế tại trường: [ĐIỀN: số phòng thí nghiệm, số bộ dụng cụ, ý kiến học sinh hoặc số liệu khảo sát]', 'bullet': True},
], size=28)
text(s, 12.2, 2.25, 6.9, 0.6, ['Đối tượng chính'], size=28, bold=True, color=BLUE)
for i, (who, what) in enumerate([
    ('Học sinh lớp 6–9', 'Thấy được hiện tượng trong chính đề bài, tự thay đổi số liệu để kiểm chứng'),
    ('Giáo viên KHTN', 'Có thí nghiệm minh họa cho đề bài bất kỳ chỉ trong vài giây'),
    ('Nhà trường', 'Bù đắp phần thiếu dụng cụ mà không phải mua sắm thêm'),
]):
    y = 3.0 + i * 2.15
    card(s, 12.2, y, 6.9, 1.95)
    text(s, 12.5, y + 0.18, 6.3, 1.65, [
        {'t': who, 'bold': True, 'size': 28, 'space_after': 4},
        {'t': what, 'size': 24, 'color': GRAY},
    ])
notes(s, '[Kể một tình huống thật trong giờ dạy của thầy/cô.] Ví dụ: khi dạy bài áp suất, học sinh tính được p = F/S nhưng không hình dung vì sao xe tăng cần bản xích rộng để không lún.')

# ---------- 4. Vì sao cần giải pháp mới
s = S[3]
set_title(s, 'VÌ SAO CẦN MỘT GIẢI PHÁP MỚI')
clear_body(s)
cols = [
    ('Thí nghiệm thật', ['Thiếu dụng cụ, tốn thời gian chuẩn bị', 'Nhiều hiện tượng không làm được trên lớp']),
    ('Phần mềm mô phỏng có sẵn', ['Giáo viên tự tìm đúng bài, tự nhập lại số liệu', 'Không gắn với đề bài cụ thể trong SGK']),
    ('Hỏi chatbot AI', ['Có thể giải sai hoặc “bịa” đáp số', 'Chỉ có chữ, không có thí nghiệm để quan sát']),
]
for i, (head, lines) in enumerate(cols):
    x = 0.97 + i * 6.15
    card(s, x, 2.3, 5.8, 4.45, fill=RGBColor(0xF3, 0xF4, 0xF6))
    text(s, x + 0.35, 2.5, 5.1, 1.2, [head], size=28, bold=True)
    text(s, x + 0.35, 3.8, 5.1, 2.8, [{'t': l, 'bullet': True, 'char': '✗'} for l in lines], size=26, color=GRAY)
need = card(s, 0.97, 7.1, 18.1, 2.2, fill=NAVY, radius=0.1)
text(s, 1.4, 7.25, 17.3, 1.95, [
    {'t': 'Nhu cầu', 'bold': True, 'size': 28, 'color': YELLOW, 'space_after': 6},
    {'t': 'Một công cụ miễn phí, dễ dùng: giáo viên dán đề bài là có ngay thí nghiệm đúng số liệu của đề, và đáp số luôn chính xác.', 'size': 28, 'color': WHITE},
], anchor=MSO_ANCHOR.MIDDLE)
notes(s, 'Ba cách làm hiện nay đều có hạn chế. Giáo viên cần một công cụ gắn với chính đề bài trong sách, nhanh và chính xác.')

# ---------- 5. Ý tưởng và giải pháp: 3 bước
s = S[4]
set_title(s, 'Ý TƯỞNG: DÁN ĐỀ – AI ĐỌC ĐỀ – CÓ THÍ NGHIỆM')
clear_body(s)
steps = [
    ('1', 'Dán đề bài', 'Gõ hoặc dán nguyên đề trong sách, kể cả ký hiệu công thức', IMG / 'buoc1-nhap-de.png'),
    ('2', 'AI đọc đề', 'Chọn thí nghiệm phù hợp, lấy số liệu, đổi đơn vị (1,5 m² → 15 000 cm²)', IMG / 'buoc2-ai-doc-de.png'),
    ('3', 'Thí nghiệm hiện ra', 'Đúng số liệu của đề; học sinh kéo, thay đổi và quan sát ngay', IMG / 'buoc3-thi-nghiem.png'),
]
for i, (n, head, desc, img) in enumerate(steps):
    x = 0.97 + i * 6.15
    badge(s, x, 2.3, 0.8, n)
    text(s, x + 0.95, 2.3, 4.9, 0.8, [head], size=30, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x, 3.2, 5.8, 1.3, [desc], size=24, color=GRAY)
    picture(s, img, x, 4.55, 5.8, 3.55)
    if i < 2:
        arrow(s, x + 5.85, 6.3, x + 6.1, 6.3)
text(s, 0.97, 8.45, 18.1, 1.0, [
    '52 dạng bài KHTN lớp 6–9: 11 thí nghiệm mô phỏng trực quan và 41 dạng bài theo công thức, có lời giải từng bước, đồ thị và hình động',
], size=24, bold=True, color=BLUE)
notes(s, 'Ý tưởng cốt lõi rất đơn giản: giáo viên dán đề, AI đọc đề, thí nghiệm hiện ra đúng số liệu của đề. [Demo trực tiếp ở phần video.]')

# ---------- 6. AI hoạt động như thế nào
s = S[5]
set_title(s, 'AI ĐỌC ĐỀ – MÃ NGUỒN TÍNH TOÁN')
clear_body(s)
flow = [
    ('Đề bài của giáo viên', 'Viết tự nhiên, có thể kèm ký hiệu'),
    ('AI (mô hình ngôn ngữ lớn)', 'Hiểu đề, chọn mẫu thí nghiệm, trích và đổi đơn vị số liệu'),
    ('Kiểm tra bằng mã', 'Đối chiếu đơn vị, giới hạn; sai thì hỏi lại AI'),
    ('Mô phỏng và tính đáp số', 'Công thức SGK đã lập trình và kiểm thử'),
]
for i, (head, desc) in enumerate(flow):
    x = 0.97 + i * 4.62
    fill = NAVY if i in (1, 3) else SKY
    col = WHITE if i in (1, 3) else NAVY
    card(s, x, 2.35, 4.2, 2.75, fill=fill)
    text(s, x + 0.25, 2.5, 3.7, 2.5, [
        {'t': head, 'bold': True, 'size': 26, 'color': YELLOW if i in (1, 3) else BLUE, 'space_after': 8},
        {'t': desc, 'size': 22, 'color': col},
    ], anchor=MSO_ANCHOR.MIDDLE)
    if i < 3:
        arrow(s, x + 4.22, 3.72, x + 4.6, 3.72)
text(s, 0.97, 5.55, 8.9, 3.9, [
    {'t': 'Vì sao dùng AI?', 'bold': True, 'size': 28, 'color': BLUE, 'space_after': 10},
    {'t': 'Hiểu đề viết tự nhiên, nhiều ý, kèm ký hiệu công thức', 'bullet': True},
    {'t': 'Tự suy luận: treo vật 500 g thì lực đàn hồi 5 N', 'bullet': True},
    {'t': 'Cách dò từ khóa truyền thống dễ bỏ sót hoặc hiểu nhầm đề', 'bullet': True},
], size=24)
text(s, 10.3, 5.55, 8.8, 3.9, [
    {'t': 'Công nghệ sử dụng', 'bold': True, 'size': 28, 'color': BLUE, 'space_after': 10},
    {'t': 'Mô hình Qwen qua giao thức chuẩn OpenAI, đổi được sang mô hình khác', 'bullet': True},
    {'t': 'Ứng dụng web (React), chạy miễn phí trên Cloudflare', 'bullet': True},
    {'t': 'Mất kết nối AI vẫn dùng được nhờ chế độ dò từ khóa', 'bullet': True},
], size=24)
notes(s, 'Điểm quan trọng nhất: AI chỉ đọc đề. Mọi đáp số do công thức đã lập trình và kiểm thử tính ra, nên AI không thể bịa số.')

# ---------- 7. Tính năng phục vụ tiết học
s = S[6]
set_title(s, 'THIẾT KẾ THEO TIẾN TRÌNH DẠY HỌC KHTN')
clear_body(s)
picture(s, IMG / 'loi-giai-khung.png', 0.97, 2.25, 8.2, 7.2)
feats = [
    ('Dự đoán → Quan sát → Kết luận', 'Có câu hỏi gợi ý cho từng bước'),
    ('Lời giải ở thẻ riêng', 'Học sinh tự giải trước, giáo viên mở dần 4 bước'),
    ('Đồ thị và hình động', 'Kéo điểm trên đồ thị để thấy tỉ lệ thuận, nghịch'),
    ('Dễ dùng cho mọi giáo viên', 'Chữ lớn, nút “Chữ to”, số viết kiểu Việt Nam'),
    ('Chia sẻ và lưu số liệu', 'Gửi đường liên kết qua Zalo, tải số liệu ra Excel'),
]
for i, (head, desc) in enumerate(feats):
    y = 2.25 + i * 1.47
    badge(s, 9.75, y + 0.12, 0.7, str(i + 1), fill=BLUE, size=22)
    text(s, 10.65, y, 8.4, 1.4, [
        {'t': head, 'bold': True, 'size': 26, 'space_after': 2},
        {'t': desc, 'size': 22, 'color': GRAY},
    ])
notes(s, 'Ảnh bên trái là thẻ Lời giải: học sinh làm trước, sau đó giáo viên bấm "Bước tiếp theo" để chữa bài từng bước.')

# ---------- 8. Ví dụ đề khó
s = S[7]
set_title(s, 'VÍ DỤ: ĐỀ BÀI NHIỀU Ý VỀ HỆ HAI GƯƠNG')
clear_body(s)
card(s, 0.97, 2.25, 8.4, 2.85, fill=RGBColor(0xF3, 0xF4, 0xF6))
text(s, 1.25, 2.4, 7.9, 2.6, [
    {'t': 'Đề bài giáo viên dán vào', 'bold': True, 'size': 24, 'color': BLUE, 'space_after': 6},
    {'t': '“Hai gương phẳng G₁, G₂ đặt vuông góc. Tia sáng tới G₁ với góc tới 40°… Chứng minh tia cuối cùng song song ngược chiều tia ban đầu. Nếu góc tới là 55° thì kết luận còn đúng không?”', 'italic': True, 'size': 22},
])
text(s, 0.97, 5.4, 8.4, 4.0, [
    {'t': 'AI nhận ra “hệ hai gương”, điền góc tới 40°, góc giữa hai gương 90°', 'bullet': True},
    {'t': 'Thí nghiệm vẽ đường đi tia sáng, pháp tuyến, các góc 40° và 50°', 'bullet': True},
    {'t': 'Câu d: bấm nút 55°, học sinh tự thấy kết luận vẫn đúng', 'bullet': True},
], size=24)
picture(s, IMG / 'hai-guong-khung.png', 9.75, 2.25, 9.35, 7.2)
notes(s, 'Đây là một đề nhiều ý, có cả ký hiệu công thức. Ứng dụng vẫn dựng đúng thí nghiệm, và học sinh tự kiểm chứng được câu d bằng một nút bấm.')

# ---------- 9. AI có trách nhiệm
s = S[8]
set_title(s, 'ỨNG DỤNG AI CÓ TRÁCH NHIỆM')
clear_body(s)
resp = [
    ('Không bịa đáp số', 'AI chỉ đọc đề; mọi phép tính do mã đã kiểm thử đảm nhận'),
    ('Biết nói “chưa làm được”', 'Đề ngoài phạm vi thì báo rõ, gợi ý thí nghiệm gần nhất'),
    ('Minh bạch', 'Luôn hiện “AI đã điền từ đề: …” để giáo viên kiểm tra'),
    ('Tự kiểm tra số liệu', 'Phát hiện lỗi đổi đơn vị, số vượt giới hạn và sửa hoặc báo lại'),
    ('Không thu thập dữ liệu cá nhân', 'Không cần đăng nhập, không lưu thông tin học sinh'),
    ('Chống lạm dụng', 'Giới hạn số lượt hỏi AI; khóa dịch vụ AI giữ bí mật trên máy chủ'),
]
for i, (head, desc) in enumerate(resp):
    col, row = i % 3, i // 3
    x, y = 0.97 + col * 6.15, 2.3 + row * 3.6
    card(s, x, y, 5.8, 3.3, fill=MINT if row == 0 else SKY)
    badge(s, x + 0.3, y + 0.3, 0.75, '✓', fill=GREEN if row == 0 else BLUE, size=26)
    text(s, x + 1.25, y + 0.3, 4.35, 0.85, [head], size=26, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x + 0.3, y + 1.3, 5.2, 1.85, [desc], size=24, color=GRAY)
notes(s, 'Chúng tôi coi trọng tính chính xác: thà báo "chưa mô phỏng được" còn hơn dựng sai thí nghiệm khiến học sinh hiểu sai hiện tượng.')

# ---------- 10. Triển khai thực tế
s = S[9]
set_title(s, 'TRIỂN KHAI THỰC TẾ')
clear_body(s)
ways = [
    ('Trên lớp', 'Giáo viên chiếu thí nghiệm, học sinh dự đoán rồi quan sát; mở thẻ Lời giải để chữa bài'),
    ('Ở nhà', 'Giáo viên gửi đường liên kết qua Zalo; học sinh tự thay số liệu và làm lại'),
    ('Không cần cài đặt', 'Mở trình duyệt vào thinghiemvatly.pages.dev trên máy tính, máy chiếu, điện thoại'),
]
for i, (head, desc) in enumerate(ways):
    y = 2.3 + i * 1.55
    badge(s, 0.97, y + 0.1, 0.75, str(i + 1))
    text(s, 1.95, y, 9.9, 1.45, [
        {'t': head, 'bold': True, 'size': 26, 'space_after': 2},
        {'t': desc, 'size': 22, 'color': GRAY},
    ])
card(s, 0.97, 7.05, 10.9, 1.85, fill=None, line=RED, dashed=True)
text(s, 1.25, 7.15, 10.4, 1.7, [
    {'t': 'Thời gian triển khai: [ĐIỀN: từ … đến nay]', 'size': 22, 'space_after': 4},
    {'t': 'Đối tượng và số lượng: [ĐIỀN: số lớp, số học sinh, số giáo viên]', 'size': 22, 'space_after': 4},
    {'t': 'Tiết dạy mẫu: [ĐIỀN: tên bài, lớp, ví dụ “Bài Áp suất – lớp 8A”]', 'size': 22},
])
picture(s, IMG / 'dien-thoai.jpg', 12.6, 2.25, 6.5, 7.2, border=True)
notes(s, '[Mô tả tiết dạy thật đã dùng sản phẩm: lớp nào, bài nào, các bước tổ chức.]')

# ---------- 11. Kết quả kiểm thử
s = S[10]
set_title(s, 'KẾT QUẢ KIỂM THỬ SẢN PHẨM')
clear_body(s)
stats = [
    ('52', 'dạng bài KHTN 6–9 có thí nghiệm'),
    ('169', 'bài kiểm tra tự động đều đạt'),
    ('2–5 giây', 'để AI đọc một đề bài'),
    ('0 đồng', 'chi phí cho nhà trường'),
]
for i, (big, label) in enumerate(stats):
    x = 0.97 + i * 4.62
    card(s, x, 2.3, 4.2, 3.0, fill=SKY)
    text(s, x + 0.2, 2.45, 3.8, 1.5, [big], size=60, bold=True, color=BLUE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x + 0.25, 3.95, 3.7, 1.2, [label], size=22, color=GRAY, align=PP_ALIGN.CENTER)
text(s, 0.97, 5.75, 18.1, 3.7, [
    {'t': 'Kiểm thử trên trang web thật', 'bold': True, 'size': 28, 'color': BLUE, 'space_after': 10},
    {'t': 'Mở toàn bộ 52 thí nghiệm: không lỗi, không có kết quả sai lệch.', 'bullet': True},
    {'t': 'Bộ đề mẫu từ dễ đến khó (áp suất, Ác-si-mét, định luật Ôm, tốc độ, nhiệt lượng, thấu kính, lò xo, bản mặt song song, hai gương): AI chọn đúng thí nghiệm, điền đúng số liệu.', 'bullet': True},
    {'t': 'Đề ngoài phạm vi (nam châm, từ trường) được từ chối đúng thay vì dựng sai.', 'bullet': True},
], size=24)
notes(s, 'Trước khi đưa vào lớp, sản phẩm được kiểm thử tự động và kiểm thử với bộ đề mẫu. Những lỗi phát hiện trong quá trình này đều đã được sửa.')

# ---------- 12. Kết quả dùng thử trong lớp
s = S[11]
set_title(s, 'KẾT QUẢ DÙNG THỬ TRONG LỚP HỌC')
clear_body(s)
for i, label in enumerate(['học sinh thấy dễ hiểu hơn', 'học sinh muốn tiếp tục dùng', 'giáo viên đánh giá tiết kiệm thời gian']):
    x = 0.97 + i * 3.75
    card(s, x, 2.3, 3.45, 2.9, fill=None, line=RED, dashed=True)
    text(s, x + 0.15, 2.45, 3.15, 1.3, ['[ĐIỀN] %'], size=44, bold=True, color=RED, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x + 0.2, 3.85, 3.05, 1.2, [label], size=20, color=GRAY, align=PP_ALIGN.CENTER)
card(s, 0.97, 5.5, 10.95, 3.95, fill=None, line=RED, dashed=True)
text(s, 1.25, 5.65, 10.4, 3.7, [
    {'t': 'Quy mô thử nghiệm: [ĐIỀN: số lớp, số học sinh, số tiết, ngày dạy]', 'size': 22, 'space_after': 8},
    {'t': 'So sánh trước – sau: [ĐIỀN: điểm bài kiểm tra ngắn hoặc số học sinh giải đúng]', 'size': 22, 'space_after': 8},
    {'t': 'Biểu đồ kết quả khảo sát: [ĐIỀN: chèn biểu đồ từ Google Form]', 'size': 22},
])
card(s, 12.3, 2.3, 6.8, 7.15, fill=SKY)
text(s, 12.6, 2.5, 6.25, 6.8, [
    {'t': 'Phản hồi người dùng', 'bold': True, 'size': 26, 'color': BLUE, 'space_after': 10},
    {'t': 'Học sinh: “[ĐIỀN: trích nguyên văn]”', 'size': 22, 'space_after': 12},
    {'t': 'Học sinh: “[ĐIỀN: trích nguyên văn]”', 'size': 22, 'space_after': 12},
    {'t': 'Đồng nghiệp: “[ĐIỀN: họ tên, môn – nhận xét]”', 'size': 22},
])
notes(s, 'Chỉ trình bày số liệu thật. Nếu chưa kịp thử nghiệm, đổi tiêu đề thành "Kế hoạch thử nghiệm" và nêu cách đo sẽ dùng.')

# ---------- 13. Thảo luận và tổng kết
s = S[12]
set_title(s, 'THẢO LUẬN VÀ TỔNG KẾT')
clear_body(s)
rows = [
    ('', 'Cách truyền thống', 'AIPLab Studio'),
    ('Chuẩn bị thí nghiệm', 'Nhiều thời gian, cần dụng cụ', 'Vài giây, chỉ cần dán đề'),
    ('Gắn với đề bài SGK', 'Phải tự nhập lại số liệu', 'Đúng số liệu của đề'),
    ('Độ chính xác đáp số', 'Phụ thuộc người tính', 'Mã đã kiểm thử tính'),
    ('Học sinh tự khám phá', 'Hạn chế', 'Kéo, thay số, quan sát'),
    ('Chi phí, thiết bị', 'Mua sắm, bảo quản', 'Miễn phí, điện thoại là đủ'),
]
tbl = s.shapes.add_table(len(rows), 3, Inches(0.97), Inches(2.3), Inches(12.2), Inches(6.6)).table
widths = [3.9, 4.0, 4.3]
for j, wdt in enumerate(widths):
    tbl.columns[j].width = Inches(wdt)
for i, row in enumerate(rows):
    tbl.rows[i].height = Inches(1.1)
    for j, val in enumerate(row):
        cell = tbl.cell(i, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY if i == 0 else (SKY if j == 2 else WHITE)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = cell.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = ''
        r = p.add_run()
        r.text = val
        r.font.name = FONT
        r.font.size = Pt(22)
        r.font.bold = i == 0 or j == 0 or j == 2
        r.font.color.rgb = WHITE if i == 0 else (BLUE if j == 2 else NAVY)
card(s, 13.6, 2.3, 5.5, 6.6, fill=NAVY)
text(s, 13.9, 2.5, 4.95, 6.3, [
    {'t': 'Tính bền vững', 'bold': True, 'size': 28, 'color': YELLOW, 'space_after': 12},
    {'t': 'Chi phí bằng 0 cho nhà trường', 'bullet': True, 'color': WHITE},
    {'t': 'Không phụ thuộc một hãng AI', 'bullet': True, 'color': WHITE},
    {'t': 'Vẫn dùng được khi mất kết nối AI', 'bullet': True, 'color': WHITE},
    {'t': 'Mỗi thí nghiệm tách riêng, có kiểm thử tự động nên dễ bổ sung', 'bullet': True, 'color': WHITE},
], size=22)
notes(s, 'So với cách truyền thống, giải pháp tiết kiệm thời gian, gắn chặt với đề bài và luôn cho đáp số chính xác, với chi phí bằng 0.')

# ---------- 14. Nhân rộng và định hướng
s = S[13]
set_title(s, 'NHÂN RỘNG VÀ ĐỊNH HƯỚNG PHÁT TRIỂN')
clear_body(s)
line = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(2.0), Inches(3.05), Inches(18.0), Inches(3.05))
line.line.color.rgb = LINE
line.line.width = Pt(4)
phases = [
    ('Học kì I', 'Ngắn hạn', ['Dùng tại [ĐIỀN: các lớp/khối] của trường', 'Tập huấn tổ Khoa học tự nhiên']),
    ('2026–2027', 'Trung hạn', ['Bổ sung dạng bài còn thiếu: từ trường, cảm ứng điện từ, ảnh qua gương', 'Chia sẻ cho các trường trong [ĐIỀN: huyện/tỉnh]']),
    ('Dài hạn', 'Mở rộng', ['Thêm phần Hóa học, Sinh học của môn KHTN', 'Ngân hàng thí nghiệm do giáo viên cùng đóng góp']),
]
for i, (when, tag, lines) in enumerate(phases):
    cx = 3.6 + i * 6.4
    badge(s, cx - 0.55, 2.5, 1.1, str(i + 1), size=34)
    text(s, cx - 2.85, 3.8, 5.7, 0.95, [
        {'t': when, 'bold': True, 'size': 28, 'align': PP_ALIGN.CENTER, 'space_after': 0},
        {'t': tag, 'size': 22, 'color': BLUE, 'align': PP_ALIGN.CENTER},
    ])
    card(s, cx - 2.8, 5.05, 5.6, 3.25, fill=SKY)
    text(s, cx - 2.55, 5.25, 5.1, 2.95, [{'t': l, 'bullet': True} for l in lines], size=22)
text(s, 0.97, 8.6, 18.1, 0.8, [
    'Chỉ cần một đường liên kết, không cài đặt, nên mọi giáo viên đều dùng được và lan tỏa rất nhanh.',
], size=24, bold=True, color=BLUE, align=PP_ALIGN.CENTER)
notes(s, 'Sản phẩm được thiết kế để dễ mở rộng: mỗi dạng bài mới là một phần độc lập, có kiểm thử riêng.')

# ---------- 15. Tài liệu đính kèm
s = S[14]
set_title(s, 'TÀI LIỆU VÀ THÔNG TIN ĐÍNH KÈM')
clear_body(s)
links = [
    ('Dùng thử sản phẩm', 'https://thinghiemvatly.pages.dev'),
    ('Mã nguồn', 'https://github.com/Meknos/ThiNghiemVatLy'),
    ('Video thuyết trình', '[ĐIỀN: đường liên kết YouTube/Drive, chế độ công khai]'),
    ('Minh chứng triển khai', '[ĐIỀN: thư mục Drive có ảnh tiết dạy, kết quả khảo sát]'),
    ('Liên hệ', '[ĐIỀN: email, số điện thoại]'),
]
for i, (head, val) in enumerate(links):
    y = 2.3 + i * 1.4
    badge(s, 0.97, y + 0.08, 0.7, str(i + 1), fill=BLUE, size=22)
    text(s, 1.9, y, 10.5, 1.3, [
        {'t': head, 'bold': True, 'size': 26, 'space_after': 2},
        {'t': val, 'size': 22, 'color': GRAY},
    ])
for i, (img, cap) in enumerate([(IMG / 'qr-web.png', 'Dùng thử'), (IMG / 'qr-github.png', 'Mã nguồn')]):
    x = 12.9 + i * 3.2
    picture(s, img, x, 2.5, 2.9, 2.9, border=True)
    text(s, x, 5.5, 2.9, 0.6, [cap], size=22, bold=True, align=PP_ALIGN.CENTER)
text(s, 12.9, 6.5, 6.1, 2.6, [
    'Mỗi đề bài là một thí nghiệm.',
    {'t': 'Xin trân trọng cảm ơn Hội đồng giám khảo!', 'bold': True, 'color': BLUE},
], size=26, align=PP_ALIGN.CENTER)
notes(s, 'Quét mã QR để dùng thử ngay trên điện thoại. Xin trân trọng cảm ơn Hội đồng.')

prs.save(OUT)
print('Đã lưu', OUT)
