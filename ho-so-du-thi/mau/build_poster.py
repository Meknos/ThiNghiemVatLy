# Điền nội dung AIPLab Studio vào mẫu poster (khổ A0 đứng) của Ban tổ chức.
# Chạy: python build_poster.py  (đọc poster-mau.pptx, ghi ../AIPLab-Studio-Poster.pptx)
import re
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.lang import MSO_LANGUAGE_ID
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

HERE = Path(__file__).parent
IMG = HERE.parent / 'anh'
OUT = HERE.parent / 'AIPLab-Studio-Poster.pptx'

FONT = 'Aptos'
NAVY = RGBColor(0x09, 0x00, 0x81)
DEEP = RGBColor(0x00, 0x00, 0x54)
BLUE = RGBColor(0x0B, 0x5C, 0xD6)
SKY = RGBColor(0xE8, 0xF0, 0xFE)
MINT = RGBColor(0xE7, 0xF6, 0xEF)
GREEN = RGBColor(0x0E, 0x7A, 0x52)
RED = RGBColor(0xE6, 0x1E, 0x2A)
GRAY = RGBColor(0x37, 0x41, 0x51)
LINE = RGBColor(0xC9, 0xD3, 0xE6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
YELLOW = RGBColor(0xFF, 0xEA, 0x00)

FILL_RE = re.compile(r'(\[ĐIỀN[^\]]*\])')

# Vùng nội dung theo khung nét đứt của mẫu
L, R = 1.96, 31.15
W = R - L


def set_bullet(paragraph, char='•', indent=0.6):
    pPr = paragraph._p.get_or_add_pPr()
    pPr.set('marL', str(Inches(indent)))
    pPr.set('indent', str(-Inches(indent)))
    pPr.append(pPr.makeelement(qn('a:buChar'), {'char': char}))


def text(slide, x, y, w, h, paras, size=38, color=DEEP, bold=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, space_after=14, margin=0.05):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
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
        para.line_spacing = 1.05
        if p.get('bullet'):
            set_bullet(para, p.get('char', '•'))
        for part in FILL_RE.split(p['t']):
            if not part:
                continue
            fill = bool(FILL_RE.fullmatch(part))
            r = para.add_run()
            r.text = part
            r.font.name = FONT
            r.font.size = Pt(p.get('size', size))
            r.font.bold = True if fill else p.get('bold', bold)
            r.font.italic = fill or p.get('italic', False)
            r.font.color.rgb = RED if fill else p.get('color', color)
            r.font.language_id = MSO_LANGUAGE_ID.VIETNAMESE
    return box


def card(slide, x, y, w, h, fill=SKY, line=None, radius=0.05, shape=MSO_SHAPE.ROUNDED_RECTANGLE, dashed=False):
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
        s.line.width = Pt(3)
        if dashed:
            s.line.dash_style = 7
    s.shadow.inherit = False
    return s


def badge(slide, x, y, d, label, fill=DEEP, size=44):
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
    r.font.color.rgb = WHITE
    return s


def picture(slide, path, x, y, w, h, border=True):
    iw, ih = Image.open(path).size
    k = min(w / iw, h / ih)
    pw, ph = iw * k, ih * k
    pic = slide.shapes.add_picture(str(path), Inches(x + (w - pw) / 2), Inches(y + (h - ph) / 2), Inches(pw), Inches(ph))
    if border:
        pic.line.color.rgb = LINE
        pic.line.width = Pt(2)
    return pic


def arrow(slide, x1, y1, x2, y2, color=BLUE, width=7):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = color
    c.line.width = Pt(width)
    ln = c.line._get_or_add_ln()
    ln.append(ln.makeelement(qn('a:tailEnd'), {'type': 'triangle', 'w': 'med', 'len': 'med'}))


def section(slide, x, y, w, n, title):
    """Tiêu đề mục: vòng tròn đánh số và chữ đậm, dùng thống nhất trên toàn poster."""
    badge(slide, x, y, 1.15, n)
    text(slide, x + 1.45, y, w - 1.45, 1.15, [title], size=54, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)


prs = Presentation(HERE / 'poster-mau.pptx')
s = prs.slides[0]

# Xóa khung nét đứt và đoạn hướng dẫn của mẫu (mẫu yêu cầu xóa sau khi dàn nội dung)
for sh in list(s.shapes):
    if sh.name in ('Group 2', 'TextBox 5'):
        sh._element.getparent().remove(sh._element)

# Tên sản phẩm, giáo viên, đơn vị
for sh in s.shapes:
    if sh.name == 'TextBox 7':
        runs = sh.text_frame.paragraphs[0].runs
        runs[0].text = 'AIPLAB STUDIO – PHÒNG THÍ NGHIỆM VẬT LÝ ẢO CÓ AI ĐỌC ĐỀ BÀI'
        runs[0].font.size = Pt(64)
        # Mẫu giãn chữ rộng: tên dài sẽ xuống dòng và đè lên dòng thông tin giáo viên
        runs[0].font._rPr.attrib.pop('spc', None)
        runs[0].font.language_id = MSO_LANGUAGE_ID.VIETNAMESE
        for r in runs[1:]:
            r._r.getparent().remove(r._r)
    if sh.name == 'TextBox 8':
        p0, p1 = sh.text_frame.paragraphs[:2]
        p0.runs[1].text = '[ĐIỀN: Họ và tên]'
        p1.runs[1].text = '[ĐIỀN: Tên trường, địa chỉ]'
        for r in (p0.runs[1], p1.runs[1]):
            r.font.color.rgb = RED
            r.font.italic = True
            r.font.language_id = MSO_LANGUAGE_ID.VIETNAMESE

# ---------- 1. Ý tưởng: 3 bước
y = 11.0
section(s, L, y, W, '1', 'Dán đề bài – AI đọc đề – Thí nghiệm hiện ra')
steps = [
    ('Dán đề bài', 'Gõ hoặc dán nguyên đề trong sách, kể cả ký hiệu công thức', IMG / 'buoc1-nhap-de.png'),
    ('AI đọc đề', 'Chọn thí nghiệm, lấy số liệu, đổi đơn vị (1,5 m² → 15 000 cm²)', IMG / 'buoc2-ai-doc-de.png'),
    ('Thí nghiệm hiện ra', 'Đúng số liệu của đề; học sinh kéo, thay đổi, quan sát', IMG / 'buoc3-thi-nghiem.png'),
]
cw = (W - 2 * 0.9) / 3
for i, (head, desc, img) in enumerate(steps):
    x = L + i * (cw + 0.9)
    text(s, x, y + 1.5, cw, 0.8, [head], size=42, bold=True, color=BLUE)
    text(s, x, y + 2.35, cw, 1.4, [desc], size=32, color=GRAY)
    picture(s, img, x, y + 3.85, cw, cw / 1.89)
    if i < 2:
        arrow(s, x + cw + 0.1, y + 3.85 + cw / 3.78, x + cw + 0.8, y + 3.85 + cw / 3.78)
y_after = y + 3.85 + cw / 1.89 + 0.3
text(s, L, y_after, W, 0.9, [
    '52 dạng bài KHTN lớp 6–9 · 11 thí nghiệm mô phỏng trực quan · 41 dạng bài theo công thức có lời giải từng bước, đồ thị, hình động',
], size=32, bold=True, color=NAVY, align=PP_ALIGN.CENTER)

# ---------- 2. Bối cảnh  |  3. Giải pháp AI
y = y_after + 1.2
colw = (W - 1.0) / 2
xl, xr = L, L + colw + 1.0
section(s, xl, y, colw, '2', 'Bối cảnh và vấn đề')
text(s, xl, y + 1.45, colw, 5.9, [
    {'t': 'Nhiều hiện tượng không làm thí nghiệm thật được trên lớp: tia sáng qua hai gương, áp suất xe tăng, áp suất ở độ sâu 50 m…', 'bullet': True},
    {'t': 'Phòng thí nghiệm thiếu dụng cụ; chuẩn bị mất nhiều thời gian trong tiết 45 phút.', 'bullet': True},
    {'t': 'Học sinh “thay số vào công thức” mà không thấy hiện tượng nên khó hiểu, dễ nhầm đơn vị.', 'bullet': True},
    {'t': 'Thực tế tại trường: [ĐIỀN: số liệu hoặc ý kiến khảo sát]', 'bullet': True},
], size=31, space_after=10)
card(s, xl, y + 6.75, colw, 1.6, fill=SKY)
text(s, xl + 0.4, y + 6.8, colw - 0.8, 1.5, [
    {'t': 'Đối tượng: học sinh lớp 6–9, giáo viên Khoa học tự nhiên, nhà trường thiếu dụng cụ thí nghiệm', 'size': 30, 'bold': True},
], anchor=MSO_ANCHOR.MIDDLE)

section(s, xr, y, colw, '3', 'Giải pháp AI có trách nhiệm')
flow = [
    ('AI đọc đề', 'Mô hình ngôn ngữ lớn hiểu đề, chọn mẫu, trích số liệu'),
    ('Mã nguồn kiểm tra', 'Đối chiếu đơn vị, giới hạn; sai thì hỏi lại AI'),
    ('Mã nguồn tính toán', 'Công thức SGK đã kiểm thử: AI không thể “bịa” đáp số'),
]
for i, (head, desc) in enumerate(flow):
    yy = y + 1.45 + i * 1.75
    card(s, xr, yy, colw, 1.6, fill=DEEP if i != 1 else SKY)
    text(s, xr + 0.4, yy + 0.02, colw - 0.8, 1.56, [
        {'t': head, 'bold': True, 'size': 34, 'color': YELLOW if i != 1 else BLUE, 'space_after': 4},
        {'t': desc, 'size': 28, 'color': WHITE if i != 1 else DEEP},
    ], anchor=MSO_ANCHOR.MIDDLE)
text(s, xr, y + 6.75, colw, 1.6, [
    {'t': 'Đề ngoài phạm vi thì báo “chưa mô phỏng được”, không dựng sai', 'bullet': True, 'char': '✓'},
    {'t': 'Không cần đăng nhập, không lưu thông tin học sinh', 'bullet': True, 'char': '✓'},
], size=28, color=GREEN, space_after=6)

# ---------- 4. Minh họa
y = y + 8.4
section(s, L, y, W, '4', 'Minh họa: thí nghiệm và lời giải từng bước')
ih = 6.4
shots = [
    (IMG / 'hai-guong-khung.png', 'Hai gương phẳng: AI điền góc tới 40°, hai gương vuông góc'),
    (IMG / 'ban-mat-khung.png', 'Bản mặt song song: n = √3, góc khúc xạ 30°'),
    (IMG / 'loi-giai-khung.png', 'Thẻ “Lời giải” riêng: giáo viên mở dần 4 bước'),
]
for i, (img, cap) in enumerate(shots):
    x = L + i * (cw + 0.9)
    picture(s, img, x, y + 1.5, cw, ih)
    text(s, x, y + 1.5 + ih + 0.05, cw, 0.8, [cap], size=26, color=GRAY, align=PP_ALIGN.CENTER)

# ---------- 5. Kết quả  |  6. Bền vững, nhân rộng
y = y + 1.5 + ih + 1.1
section(s, xl, y, colw, '5', 'Kết quả và tác động')
stats = [('52', 'dạng bài có thí nghiệm'), ('169', 'bài kiểm tra tự động đạt'), ('2–5 giây', 'AI đọc một đề'), ('0 đồng', 'chi phí cho nhà trường')]
sw = (colw - 0.5) / 2
for i, (big, label) in enumerate(stats):
    x = xl + (i % 2) * (sw + 0.5)
    yy = y + 1.4 + (i // 2) * 2.0
    card(s, x, yy, sw, 1.85, fill=SKY)
    text(s, x + 0.2, yy + 0.05, sw - 0.4, 1.1, [big], size=54, bold=True, color=BLUE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x + 0.2, yy + 1.15, sw - 0.4, 0.65, [label], size=24, color=GRAY, align=PP_ALIGN.CENTER)
card(s, xl, y + 5.45, colw, 1.1, fill=None, line=RED, dashed=True)
text(s, xl + 0.3, y + 5.5, colw - 0.6, 1.0, ['Dùng thử trong lớp: [ĐIỀN: số lớp, số học sinh, % học sinh thấy dễ hiểu hơn]'], size=26, anchor=MSO_ANCHOR.MIDDLE)

section(s, xr, y, colw, '6', 'Bền vững và nhân rộng')
text(s, xr, y + 1.4, colw - 4.2, 5.2, [
    {'t': 'Miễn phí, không cài đặt, chạy trên điện thoại', 'bullet': True},
    {'t': 'Đổi được mô hình AI; mất kết nối AI vẫn dùng được', 'bullet': True},
    {'t': 'Bổ sung dạng bài mới: từ trường, cảm ứng điện từ…', 'bullet': True},
    {'t': 'Mở rộng sang Hóa học, Sinh học của môn KHTN', 'bullet': True},
], size=28, space_after=8)
picture(s, IMG / 'qr-web.png', xr + colw - 3.7, y + 1.45, 3.7, 3.7)
text(s, xr + colw - 4.2, y + 5.2, 4.7, 1.4, [
    {'t': 'Quét để dùng thử', 'bold': True, 'size': 28, 'align': PP_ALIGN.CENTER, 'space_after': 2},
    {'t': 'thinghiemvatly.pages.dev', 'size': 24, 'color': BLUE, 'align': PP_ALIGN.CENTER},
])

print('Đáy nội dung ở', round(y + 6.6, 2), 'inch (trang cao 46,8 inch)')
prs.save(OUT)
print('Đã lưu', OUT)
