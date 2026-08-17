from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Any, Sequence
import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings
from app.shared.logger import log


class EmailService:
    """
    Unified asynchronous email service powered by Jinja2 templating and aiosmtplib.

    Provides asynchronous HTML template rendering with XSS autoescaping and
    non-blocking SMTP email delivery, supporting multi-recipient dispatch (TO, CC, BCC),
    global context injection, and strict RFC 2822 compliance.
    """

    def __init__(self) -> None:
        """
        Initialize the Jinja2 asynchronous template environment.

        Configures the template loader to resolve files from the application's template
        directory, enforces HTML/XML autoescaping for XSS prevention, and enables
        asynchronous execution alongside whitespace trimming optimizations.
        """
        self._template_env = Environment(
            loader=FileSystemLoader(searchpath=settings.TEMPLATES_DIR),
            autoescape=select_autoescape(["html", "xml"]),
            enable_async=True,
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def _build_sender_header(self) -> str:
        """
        Construct an RFC 2822 compliant 'From' header string.

        Encodes the configured sender display name using UTF-8 and formats
        it alongside the sender email address into a standard mailbox format.

        Returns:
            A formatted sender string (e.g., `"Project Name <noreply@example.com>"`).
        """
        return formataddr((str(Header(settings.SMTP_FROM_NAME, "utf-8")), settings.SMTP_FROM_EMAIL))


    async def render_template(self, template_name: str, context: dict[str, Any]) -> str:
        """
        Render an asynchronous Jinja2 HTML template with contextual variables.

        Injects system-level global configuration variables (such as `project_title`)
        into the supplied context dictionary before executing asynchronous template evaluation.

        Args:
            template_name: Relative path to the template file inside the configured templates directory.
            context: Key-value mapping representing template variables.

        Returns:
            The fully rendered HTML string ready for email transmission.

        Raises:
            Exception: If template loading, compilation, or async rendering fails.
        """
        try:
            full_context = {
                "project_title": settings.PROJECT_TITLE,
                **context,
            }
            
            template = self._template_env.get_template(template_name)
            return await template.render_async(**full_context)
            
        except Exception as exc:
            log.error(f"Failed to render email template '{template_name}': {exc}")
            raise exc

    async def send_email(
        self,
        to: str | Sequence[str],
        subject: str,
        template_name: str,
        context: dict[str, Any],
        cc: Sequence[str] | None = None,
        bcc: Sequence[str] | None = None,
    ) -> None:
        """
        Render an HTML template and asynchronously dispatch an email via SMTP.

        Constructs a multipart MIME message with UTF-8 encoding, aggregates
        envelope recipients (TO, CC, BCC), and transmits the payload over an
        asynchronous TLS/STARTTLS SMTP socket without blocking the event loop.

        Args:
            to: Primary recipient address or sequence of recipient addresses.
            subject: Subject line of the email.
            template_name: Path to the Jinja2 HTML template (e.g., `"auth/welcome.html"`).
            context: Dictionary of dynamic parameters to inject into the template.
            cc: Optional sequence of Carbon Copy recipient addresses.
            bcc: Optional sequence of Blind Carbon Copy recipient addresses.

        Raises:
            Exception: If rendering fails, SMTP handshake times out, or delivery fails.
        """
        recipients = [to] if isinstance(to, str) else list(to)
        rendered_html = await self.render_template(template_name, context)

        message = MIMEMultipart("alternative")
        message["Subject"] = Header(subject, "utf-8")
        message["From"] = self._build_sender_header()
        message["To"] = ", ".join(recipients)

        if cc:
            message["Cc"] = ", ".join(cc)
            recipients.extend(cc)

        if bcc:
            recipients.extend(bcc)

        html_part = MIMEText(rendered_html, "html", "utf-8")
        message.attach(html_part)

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER if settings.SMTP_USER else None,
                password=settings.SMTP_PASSWORD if settings.SMTP_PASSWORD else None,
                start_tls=settings.SMTP_STARTTLS,
                use_tls=settings.SMTP_SSL,
                timeout=settings.SMTP_TIMEOUT,
            )
            
            log.info(f"Email successfully sent to {recipients} | Subject: '{subject}'")
            
        except Exception as exc:
            log.error(f"Failed to send email via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT}) to {recipients}: {exc}")
            raise exc


email_service = EmailService()