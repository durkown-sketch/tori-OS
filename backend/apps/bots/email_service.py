"""
Email summary service for ToriOS.
Sends structured meeting summaries to participants and/or organizers.
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def build_summary_html(meeting, insights, transcript) -> str:
    """Build an HTML email body from meeting intelligence."""
    executive_summary = insights.executive_summary if insights else 'Not available.'
    
    action_items_html = ''
    if insights and insights.action_items:
        items = insights.action_items if isinstance(insights.action_items, list) else []
        if items:
            rows = ''.join(
                f'<tr><td style="padding:8px 12px;border-bottom:1px solid #EEF3F9;">'
                f'<span style="color:#012169;font-weight:500;">{i.get("task", i) if isinstance(i, dict) else i}</span></td>'
                f'<td style="padding:8px 12px;border-bottom:1px solid #EEF3F9;color:#5A6E88;">'
                f'{i.get("owner", "") if isinstance(i, dict) else ""}</td></tr>'
                for i in items
            )
            action_items_html = f'''
            <h3 style="font-size:15px;color:#012169;margin:24px 0 10px;">✅ Action Items</h3>
            <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #D0DCE8;border-radius:8px;overflow:hidden;">
              <thead><tr style="background:#F7F9FC;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#5A6E88;font-weight:600;">TASK</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#5A6E88;font-weight:600;">OWNER</th>
              </tr></thead>
              <tbody>{rows}</tbody>
            </table>'''

    decisions_html = ''
    if insights and insights.decisions:
        decisions = insights.decisions if isinstance(insights.decisions, list) else []
        if decisions:
            items_html = ''.join(
                f'<li style="padding:6px 0;color:#1A2B4A;font-size:14px;">{d.get("decision", d) if isinstance(d, dict) else d}</li>'
                for d in decisions
            )
            decisions_html = f'''
            <h3 style="font-size:15px;color:#012169;margin:24px 0 10px;">🔑 Key Decisions</h3>
            <ul style="padding-left:20px;margin:0;">{items_html}</ul>'''

    key_points_html = ''
    if insights and insights.key_points:
        points = insights.key_points if isinstance(insights.key_points, list) else []
        if points:
            items_html = ''.join(
                f'<li style="padding:4px 0;color:#1A2B4A;font-size:14px;">{p}</li>'
                for p in points
            )
            key_points_html = f'''
            <h3 style="font-size:15px;color:#012169;margin:24px 0 10px;">📌 Key Points</h3>
            <ul style="padding-left:20px;margin:0;">{items_html}</ul>'''

    return f'''
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#F7F9FC;font-family:system-ui,-apple-system,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:32px 16px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <!-- Header -->
            <tr><td style="background:#012169;padding:28px 32px;border-radius:12px 12px 0 0;">
              <table width="100%"><tr>
                <td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">ToriOS</span>
                  <br><span style="font-size:11px;color:#B9D9EB;letter-spacing:0.05em;text-transform:uppercase;">Your AI Assistant, Everywhere</span></td>
                <td align="right"><span style="background:rgba(185,217,235,0.15);color:#B9D9EB;font-size:11px;font-weight:600;padding:4px 12px;border-radius:100px;">Meeting Summary</span></td>
              </tr></table>
            </td></tr>

            <!-- Meeting Info Bar -->
            <tr><td style="background:#014BAA;padding:14px 32px;">
              <span style="font-size:16px;font-weight:700;color:#fff;">{meeting.title}</span>
              <br><span style="font-size:12px;color:rgba(185,217,235,0.70);">
                {meeting.recorded_at.strftime('%A, %B %d, %Y at %I:%M %p') if meeting.recorded_at else ''}
              </span>
            </td></tr>

            <!-- Body -->
            <tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #D0DCE8;border-top:none;">
              <h3 style="font-size:15px;color:#012169;margin:0 0 10px;">📋 Executive Summary</h3>
              <p style="font-size:14px;color:#1A2B4A;line-height:1.75;margin:0 0 8px;
                         background:#F7F9FC;border-left:4px solid #1B6AC9;padding:14px 16px;border-radius:0 8px 8px 0;">
                {executive_summary}
              </p>

              {key_points_html}
              {decisions_html}
              {action_items_html}

              <!-- Footer -->
              <div style="margin-top:32px;padding-top:20px;border-top:1px solid #EEF3F9;text-align:center;">
                <p style="font-size:12px;color:#94A3B8;margin:0;">
                  Generated by <strong style="color:#012169;">ToriOS</strong> · AI-powered meeting intelligence<br>
                  <a href="#" style="color:#1B6AC9;">View full transcript</a> ·
                  <a href="#" style="color:#1B6AC9;">View in dashboard</a>
                </p>
              </div>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    '''


def send_meeting_summary_email(
    meeting,
    recipient_emails: list[str],
    insights=None,
    transcript=None,
) -> bool:
    """
    Send a structured HTML meeting summary email.
    Returns True on success, False on failure.
    """
    if not recipient_emails:
        logger.warning('send_meeting_summary_email called with no recipients.')
        return False

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@torios.ai')
    subject = f'[ToriOS] Meeting Summary: {meeting.title}'

    # Fallback plain text
    plain_text = f'ToriOS Meeting Summary\n\n{meeting.title}\n\n'
    if insights and insights.executive_summary:
        plain_text += f'Summary:\n{insights.executive_summary}\n\n'
    plain_text += 'View the full results in your ToriOS dashboard.'

    html_content = build_summary_html(meeting, insights, transcript)

    # Deduplicate
    clean_emails = list({e.strip() for e in recipient_emails if e.strip()})

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=clean_emails,
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)
        logger.info('Meeting summary emailed to %s for meeting %s', clean_emails, meeting.id)
        return True
    except Exception as exc:
        logger.error('Failed to send meeting summary email: %s', exc)
        return False


def collect_recipient_emails(bot_session, meeting=None) -> list[str]:
    """
    Collect all email recipients for a bot session's summary.
    Rules:
      - send_to_organizer → bot owner's email
      - send_to_participants → extract from meeting participants list (if available)
      - participants_email_override → always included
    """
    emails = set()

    if bot_session.send_to_organizer:
        emails.add(bot_session.user.email)

    if bot_session.participants_email_override:
        for addr in bot_session.participants_email_override.split(','):
            addr = addr.strip()
            if addr and '@' in addr:
                emails.add(addr)

    # In future with calendar integration, meeting participant emails would be fetched here.
    # For now, participants email relies on the override field.

    return list(emails)
