import os
from io import BytesIO
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def generate_contract_pdf(contract):
    """
    Generates a PDF document for a given Contract instance and returns it as a BytesIO object.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading3']
    
    normal_style = styles['Normal']
    
    bold_style = ParagraphStyle(
        name='BoldStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold'
    )

    story = []
    
    # Title
    story.append(Paragraph("SWAP CONTRACT AGREEMENT", title_style))
    story.append(Spacer(1, 20))
    
    # Intro
    intro_text = f"This Swap Contract Agreement (the \"Agreement\") is entered into on <b>{contract.created_at.strftime('%B %d, %Y')}</b>, by and between:"
    story.append(Paragraph(intro_text, normal_style))
    story.append(Spacer(1, 10))
    
    # Parties
    party_data = [
        ["Party A:", contract.party_a.profile.display_name or contract.party_a.username, f"@{contract.party_a.username}"],
        ["Party B:", contract.party_b.profile.display_name or contract.party_b.username, f"@{contract.party_b.username}"]
    ]
    t = Table(party_data, colWidths=[60, 200, 200])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Items
    story.append(Paragraph("1. ITEMS TO BE EXCHANGED", subtitle_style))
    story.append(Spacer(1, 10))
    
    interest = contract.barter_interest
    requested_item = interest.requested_item
    offered_item = interest.offered_item
    
    items_data = []
    if requested_item:
        items_data.append([f"Item provided by Party B:", requested_item.title])
    if offered_item:
        items_data.append([f"Item provided by Party A:", offered_item.title])
    
    if interest.coins_offered > 0:
        items_data.append(["Additional Barter Coins:", f"{interest.coins_offered} Coins"])
        
    t_items = Table(items_data, colWidths=[150, 310])
    t_items.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 20))
    
    # Terms
    story.append(Paragraph("2. TERMS AND CONDITIONS", subtitle_style))
    story.append(Spacer(1, 10))
    
    for i, term in enumerate(contract.terms, 1):
        story.append(Paragraph(f"{i}. {term}", normal_style))
        story.append(Spacer(1, 5))
        
    story.append(Spacer(1, 30))
    
    # Signatures
    story.append(Paragraph("3. SIGNATURES", subtitle_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("By signing electronically, both parties agree to the terms listed above and commit to the swap.", normal_style))
    story.append(Spacer(1, 20))
    
    sig_data = [
        ["Party A Signature:", "Party B Signature:"],
        [
            f"Signed by {contract.party_a.username}" if contract.signed_a else "PENDING",
            f"Signed by {contract.party_b.username}" if contract.signed_b else "PENDING"
        ],
        [
            f"Date: {contract.updated_at.strftime('%Y-%m-%d')}" if contract.signed_a else "",
            f"Date: {contract.updated_at.strftime('%Y-%m-%d')}" if contract.signed_b else ""
        ]
    ]
    
    t_sigs = Table(sig_data, colWidths=[230, 230])
    t_sigs.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.green),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_sigs)
    
    # Build
    doc.build(story)
    
    buffer.seek(0)
    return buffer
