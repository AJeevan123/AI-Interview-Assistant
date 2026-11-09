import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportService:
    @staticmethod
    def generate_pdf_report(interview_detail: Dict[str, Any], candidate_name: str = "Candidate") -> bytes:
        """Builds an executive PDF interview evaluation report using ReportLab."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        
        # Custom palette & styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0ea5e9')
        )
        subtitle_style = ParagraphStyle(
            'ReportSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#64748b')
        )
        section_style = ParagraphStyle(
            'ReportSection',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )
        bold_body = ParagraphStyle(
            'ReportBoldBody',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        story = []

        # 1. Header
        story.append(Paragraph("AI Interview Coach — Performance Report", title_style))
        story.append(Paragraph(f"Candidate: <b>{candidate_name}</b> | Role: <b>{interview_detail.get('role', 'N/A')}</b> | Format: {interview_detail.get('interview_type', 'Technical')} | Difficulty: {interview_detail.get('difficulty', 'Medium')}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0ea5e9'), spaceAfter=14))

        # 2. Executive Score Summary Table
        score = interview_detail.get("overall_score", 0.0)
        tech = interview_detail.get("technical_score", 0.0)
        clarity = interview_detail.get("clarity_score", 0.0)
        relevance = interview_detail.get("relevance_score", 0.0)
        completeness = interview_detail.get("completeness_score", 0.0)

        score_table_data = [
            [
                Paragraph("<b>Overall Score</b>", bold_body),
                Paragraph("<b>Technical (40%)</b>", bold_body),
                Paragraph("<b>Relevance (25%)</b>", bold_body),
                Paragraph("<b>Clarity (20%)</b>", bold_body),
                Paragraph("<b>Problem-Solving (15%)</b>", bold_body)
            ],
            [
                Paragraph(f"<font size=14 color='#0284c7'><b>{score}%</b></font>", body_style),
                Paragraph(f"<b>{tech}%</b>", body_style),
                Paragraph(f"<b>{relevance}%</b>", body_style),
                Paragraph(f"<b>{clarity}%</b>", body_style),
                Paragraph(f"<b>{completeness}%</b>", body_style)
            ]
        ]
        score_table = Table(score_table_data, colWidths=[110, 105, 105, 105, 105])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f9ff')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(score_table)
        story.append(Spacer(1, 14))

        # 3. Qualitative Assessment (Summary, Strengths, Weaknesses)
        story.append(Paragraph("Performance Assessment", section_style))
        summary_text = interview_detail.get("summary") or "Good technical demonstration across core competency areas."
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 10))

        # Strengths & Weaknesses side-by-side or stacked
        strengths = interview_detail.get("strengths", [])
        weaknesses = interview_detail.get("weaknesses", [])

        if strengths:
            story.append(Paragraph("<b>Key Strengths:</b>", bold_body))
            for s in strengths:
                story.append(Paragraph(f"• {s}", body_style))
            story.append(Spacer(1, 6))

        if weaknesses:
            story.append(Paragraph("<b>Areas for Improvement:</b>", bold_body))
            for w in weaknesses:
                story.append(Paragraph(f"• {w}", body_style))
            story.append(Spacer(1, 6))

        # 4. Question Breakdown
        questions = interview_detail.get("questions", [])
        if questions:
            story.append(Spacer(1, 10))
            story.append(Paragraph("Detailed Question Breakdown", section_style))
            story.append(Spacer(1, 6))

            for idx, q_item in enumerate(questions, 1):
                # Handle either dict or pydantic model
                q = q_item.get("question") if isinstance(q_item, dict) else q_item.question
                ans = q_item.get("answer") if isinstance(q_item, dict) else q_item.answer

                q_text = q.get("question_text") if isinstance(q, dict) else q.question_text
                topic = q.get("topic") if isinstance(q, dict) else q.topic
                
                ans_text = "No answer provided"
                ans_score = 0.0
                feedback = "Not evaluated"
                if ans:
                    ans_text = ans.get("answer_text") if isinstance(ans, dict) else ans.answer_text
                    ans_score = ans.get("score") if isinstance(ans, dict) else ans.score
                    feedback = ans.get("feedback") if isinstance(ans, dict) else ans.feedback

                q_box = [
                    [Paragraph(f"<b>Question {idx}: {topic}</b> (Score: {ans_score}/10)", bold_body)],
                    [Paragraph(f"<i>Prompt:</i> {q_text}", body_style)],
                    [Paragraph(f"<i>Candidate Answer:</i> {ans_text}", body_style)],
                    [Paragraph(f"<i>AI Evaluation:</i> {feedback}", body_style)]
                ]
                q_table = Table(q_box, colWidths=[530])
                q_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ]))
                story.append(q_table)
                story.append(Spacer(1, 8))

        # 5. Academic Project Credits Footer
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=8))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, leading=11, textColor=colors.HexColor('#94a3b8'), alignment=1)
        story.append(Paragraph("AI Interview Coach • Production Backend • Supervisor: Dr. A V S Pavan Kumar | Section: AIML-B | Group: 18", footer_style))
        story.append(Paragraph("Team: D. ABHAY (24CSEAIML243), KORADA SRAVANTH KUMAR (24CSEAIML256), KODI JANAKI RAO (24CSEAIML261)", footer_style))

        doc.build(story)
        return buffer.getvalue()

    @staticmethod
    def generate_full_report_download_text(detail: Dict[str, Any], candidate_name: str) -> str:
        """Generates comprehensive plain-text report for download compatibility."""
        score = detail.get("overall_score", 0.0)
        lines = [
            "================================================================================",
            "                   AI INTERVIEW COACH — PERFORMANCE REPORT                     ",
            "================================================================================",
            f"Candidate:        {candidate_name}",
            f"Target Role:      {detail.get('role', 'N/A')}",
            f"Interview Format: {detail.get('interview_type', 'Technical')}",
            f"Difficulty:       {detail.get('difficulty', 'Medium')}",
            f"Generated On:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
            "--------------------------------------------------------------------------------",
            "EXECUTIVE SCORING SUMMARY",
            "--------------------------------------------------------------------------------",
            f"Composite Final Score:  {score}%",
            f"Technical Accuracy:     {detail.get('technical_score', 0.0)}%",
            f"Communication Clarity:  {detail.get('clarity_score', 0.0)}%",
            f"Answer Relevance:       {detail.get('relevance_score', 0.0)}%",
            f"Answer Completeness:    {detail.get('completeness_score', 0.0)}%",
            "",
            "PERFORMANCE SUMMARY",
            f"{detail.get('summary', 'Session successfully completed.')}",
            "",
            "KEY STRENGTHS:"
        ]
        for s in detail.get("strengths", []):
            lines.append(f"  [+] {s}")
        lines.append("")
        lines.append("AREAS FOR IMPROVEMENT:")
        for w in detail.get("weaknesses", []):
            lines.append(f"  [-] {w}")
        lines.append("")
        lines.append("RECOMMENDED PRACTICE TOPICS:")
        for r in detail.get("recommendations", []):
            lines.append(f"  [*] {r}")
        lines.append("")
        lines.append("================================================================================")
        lines.append("QUESTION-BY-QUESTION BREAKDOWN")
        lines.append("================================================================================")

        for idx, q_item in enumerate(detail.get("questions", []), 1):
            q = q_item.get("question") if isinstance(q_item, dict) else q_item.question
            ans = q_item.get("answer") if isinstance(q_item, dict) else q_item.answer

            q_text = q.get("question_text") if isinstance(q, dict) else q.question_text
            topic = q.get("topic") if isinstance(q, dict) else q.topic
            ans_text = ans.get("answer_text", "No answer recorded") if (ans and isinstance(ans, dict)) else (ans.answer_text if ans else "No answer recorded")
            score_val = ans.get("score", 0.0) if (ans and isinstance(ans, dict)) else (ans.score if ans else 0.0)
            fb_text = ans.get("feedback", "Not evaluated") if (ans and isinstance(ans, dict)) else (ans.feedback if ans else "Not evaluated")

            lines.append(f"QUESTION #{idx} [{topic}]")
            lines.append(f"Prompt:    {q_text}")
            lines.append(f"Response:  {ans_text}")
            lines.append(f"Score:     {score_val}/10")
            lines.append(f"Feedback:  {fb_text}")
            lines.append("-" * 80)

        lines.extend([
            "",
            "ACADEMIC CREDITS & SUPERVISION",
            "Supervisor: Dr. A V S Pavan Kumar",
            "Department: AIML-B | Group: 18",
            "Students:",
            "  - D. ABHAY (24CSEAIML243 | 24UG010737)",
            "  - KORADA SRAVANTH KUMAR (24CSEAIML256 | 24UG010749)",
            "  - KODI JANAKI RAO (24CSEAIML261 | 24UG010753)",
            "================================================================================"
        ])
        return "\n".join(lines)

    @staticmethod
    def generate_question_download_text(
        question_number: int,
        question_text: str,
        answer_text: str,
        feedback: str,
        score: float,
        date_str: str,
        role: str
    ) -> str:
        """Generates single question download text matching frontend DownloadButton."""
        return f"""================================================================================
AI INTERVIEW COACH - SINGLE QUESTION EVALUATION
================================================================================
Question Number:  #{question_number}
Target Role:      {role}
Date Recorded:    {date_str}
Score Awarded:    {score}/10
--------------------------------------------------------------------------------
QUESTION:
{question_text}

CANDIDATE RESPONSE:
{answer_text}

AI EVALUATION & FEEDBACK:
{feedback}
================================================================================
"""
