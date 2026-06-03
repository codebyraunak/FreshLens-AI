from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 18)
        self.cell(0, 10, "FreshLens AI - Development Update Report", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def create_report():
    pdf = PDF()
    pdf.add_page()
    
    # Title & Intro
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "Project Overview", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    overview_text = (
        "FreshLens AI is a smart camera-based fruit and vegetable freshness detection system. "
        "Recently, significant architectural and UI/UX improvements have been made to enhance the robustness "
        "and presentation of the system."
    )
    pdf.multi_cell(0, 8, overview_text)
    pdf.ln(5)

    # Section 1: ML Model Updates
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "1. Machine Learning Model Enhancements", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    ml_text = (
        "- Multi-Input Architecture: The model has been upgraded from a simple Image Classifier to a Multi-Input Model. "
        "It now accepts both the Image of the produce and the Storage Temperature as independent inputs.\n"
        "- Temperature Simulation: A custom Data Generator was written to inject simulated temperature data (ranging from "
        "-5°C to 35°C) during training. This allows the dense layers to learn the correlation between ambient temperature "
        "and shelf-life/freshness.\n"
        "- Model Backbone: We continue to use MobileNetV2 (pre-trained on ImageNet) to extract image features before "
        "concatenating them with the temperature features."
    )
    pdf.multi_cell(0, 8, ml_text)
    pdf.ln(5)

    # Section 2: Frontend Updates
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "2. Premium Frontend Development", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    fe_text = (
        "- Glassmorphism UI: A stunning new frontend was built from scratch using HTML, Vanilla CSS, and JavaScript. "
        "It features a dark mode aesthetic with frosted glass elements and animated background elements.\n"
        "- Interactivity: Added a drag-and-drop file upload zone with image preview capabilities, and a dynamic "
        "slider for the user to input the storage temperature.\n"
        "- API Integration readiness: The JavaScript contains robust logic to communicate with the upcoming Python backend. "
        "Currently, it features a fallback simulation mode that displays an animated result card (Fresh/Stale/Unripe "
        "and Shelf Life estimation) for UI demonstration purposes."
    )
    pdf.multi_cell(0, 8, fe_text)
    pdf.ln(5)

    # Section 3: Next Steps
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "3. Next Steps", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    next_text = (
        "- Dataset Expansion: Introduce images for 'unripe' categories if not already present, and map true "
        "temperature data if a dataset becomes available.\n"
        "- Backend API: Implement the FastAPI/Flask server in backend/main.py to serve the trained model weights "
        "(.h5) and process incoming requests from the new frontend."
    )
    pdf.multi_cell(0, 8, next_text)

    # Save PDF
    pdf.output("docs/Mentor_Update_Report.pdf")

if __name__ == "__main__":
    create_report()
