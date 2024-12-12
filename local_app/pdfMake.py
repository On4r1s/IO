import os
from fpdf import FPDF
from PIL import Image
from datetime import datetime

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

async def create_pdf(transcripts, data_path):
    screenshots_folder = os.path.join(data_path, '.temp\\imgs')
    output_folder = os.path.join(data_path, 'transcriptions')
    output_pdf = f"{datetime.now().strftime('%d.%m.%Y-%H.%M')}.pdf"

    #list of images
    images = [f for f in os.listdir(screenshots_folder) if f.endswith('.png')]

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
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

        if i < len(images):
            img_path = images[i]
            current_y = add_image_to_pdf(pdf, os.path.join(screenshots_folder, img_path), current_x, current_y, max_y, y_margin)

    # Add any remaining images (if there is silence yet more different images left)
    for j in range(len(transcripts), len(images)):
        img_path = images[j]
        current_y = add_image_to_pdf(pdf, os.path.join(screenshots_folder, img_path), current_x, current_y, max_y, y_margin)

    pdf.output(os.path.join(output_folder, output_pdf))
    print("PDF created successfully.")
