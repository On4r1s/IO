import os
from fpdf import FPDF
from PIL import Image


def add_image_to_pdf(pdf, img_path, current_x, current_y, max_y, y_margin):
    img = Image.open(img_path)
    img_width = 150
    img_height = img.height * (img_width / img.width)
    if current_y + img_height > max_y:
        pdf.add_page()
        current_y = y_margin

    pdf.image(img_path, x=current_x, y=current_y, w=img_width)
    current_y += img_height + 10
    return current_y


def create_pdf(transcripts, data_path, photos, stamp):
    screenshots_folder = os.path.join(data_path, '.temp\\imgs')
    output_folder = os.path.join(data_path, 'transcripts')
    output_pdf = f"{stamp}.pdf"

    #list of images
    try:
        image_paths = [os.path.join(screenshots_folder, f"{name}.png") for name in list(photos.values())[0]]
    except IndexError:
        image_paths = []

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_font('DejaVu', '', 'DejaVuSansCondensed.ttf', uni=True)
    pdf.set_font("DejaVu", size=12)
    pdf.add_page()

    x_margin = 10
    y_margin = 10
    max_y = 280  # Maximum y-coordinate for content before adding a new page
    current_x = x_margin
    current_y = y_margin

    for i, text in enumerate(transcripts):
        # Add the text
        if text == "'":
            continue
        pdf.set_xy(current_x, current_y)
        pdf.multi_cell(0, 10, text)
        current_y = pdf.get_y() + 5  # Update current y-position with some spacing

        if i < len(image_paths):
            current_y = add_image_to_pdf(pdf, image_paths[i], current_x, current_y, max_y, y_margin)

    # Add any remaining images (if there is silence yet more different images left)
    for j in range(len(transcripts), len(image_paths)):
        current_y = add_image_to_pdf(pdf, image_paths[j], current_x, current_y, max_y, y_margin)

    pdf.output(os.path.join(output_folder, output_pdf))
