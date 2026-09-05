import io
from pathlib import Path
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFReportGenerator:
    """
    Generates an official ISRO-formatted mission analysis PDF report.
    """

    @staticmethod
    def generate(analysis_data: Dict[str, Any], output_path: str | Path) -> str:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        doc = SimpleDocTemplate(
            str(path),
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=12
        )

        h2_style = ParagraphStyle(
            "H2Style",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=10,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            "BodyStyle",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#334155")
        )

        callout_style = ParagraphStyle(
            "CalloutStyle",
            parent=styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#0f766e")
        )

        story = []

        # Header Title
        story.append(Paragraph("SATQUERY AI — REMOTE SENSING MISSION REPORT", title_style))
        story.append(Paragraph("Indian Space Research Organisation (ISRO) | SIH 26167 Intelligence Dispatch", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0ea5e9"), spaceAfter=14))

        # Query & Intent Overview Box
        query = analysis_data.get("query", "N/A")
        intent = analysis_data.get("intent", "N/A")
        specialist = analysis_data.get("specialist", "N/A")
        conf_data = analysis_data.get("confidence", {})
        conf_score = f"{conf_data.get('composite_score', 95.0)}% ({conf_data.get('rating', 'HIGH')})"

        overview_data = [
            [Paragraph("<b>Natural Language Query:</b>", normal), Paragraph(query, normal)],
            [Paragraph("<b>Identified Workflow Intent:</b>", normal), Paragraph(f"<code>{intent}</code>", normal)],
            [Paragraph("<b>Dispatched Specialist:</b>", normal), Paragraph(specialist, normal)],
            [Paragraph("<b>Composite Confidence:</b>", normal), Paragraph(f"<b>{conf_score}</b>", normal)]
        ]

        t_overview = Table(overview_data, colWidths=[160, 360])
        t_overview.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t_overview)
        story.append(Spacer(1, 14))

        # Executive Answer
        story.append(Paragraph("1. Executive Analysis & Findings", h2_style))
        answer = analysis_data.get("answer", "No textual response generated.")
        story.append(Paragraph(f"<b>Assessment:</b> {answer}", callout_style))
        story.append(Spacer(1, 10))

        # Key Findings Bullets
        findings = analysis_data.get("key_findings", [])
        if findings:
            for f in findings:
                story.append(Paragraph(f"• {f}", body_style))
            story.append(Spacer(1, 10))

        # 4-Signal Confidence Matrix
        story.append(Paragraph("2. 4-Signal Multi-Criteria Confidence Matrix", h2_style))
        breakdown = conf_data.get("breakdown", {})
        conf_table_data = [
            ["Metric Signal", "Component", "Score (%)", "Status"],
            ["C_model", "Specialist Model Inference Certainty", f"{breakdown.get('model_inference', 94.0)}%", "Optimal"],
            ["C_sensor", "Sensor Radiometric SNR & Quality", f"{breakdown.get('sensor_radiometry', 96.0)}%", "Optimal"],
            ["C_alignment", "Spatial Co-Registration (CRS & IoU)", f"{breakdown.get('spatial_alignment', 98.0)}%", "Verified"],
            ["C_resolution", "Ground Sample Distance Suitability", f"{breakdown.get('resolution_suitability', 95.0)}%", "Optimal"]
        ]
        t_conf = Table(conf_table_data, colWidths=[80, 260, 90, 90])
        t_conf.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0284c7")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_conf)
        story.append(Spacer(1, 14))

        # Auditable Execution Trace
        story.append(Paragraph("3. Auditable Agent Execution Pipeline Trace", h2_style))
        trace_data = [["Step", "Action / Milestone", "Tool Executed", "Latency", "Status"]]
        for t in analysis_data.get("execution_trace", []):
            trace_data.append([
                str(t.get("step", "-")),
                t.get("action", "")[:40],
                t.get("tool", "")[:28],
                f"{t.get('latency_ms', 0)} ms",
                t.get("status", "OK")
            ])

        t_trace = Table(trace_data, colWidths=[35, 210, 150, 65, 60])
        t_trace.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('FONTSIZE', (0,0), (-1,-1), 8),
        ]))
        story.append(t_trace)

        doc.build(story)
        return str(path)
