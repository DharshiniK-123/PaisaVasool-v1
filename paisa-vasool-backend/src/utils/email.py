from email.message import EmailMessage
import aiosmtplib
from src.config.settings import settings


async def send_otp_email(to_email: str, otp: str) -> None:
    """
    Send OTP email asynchronously
    """
    message = EmailMessage()
    message["From"] = settings.SMTP_EMAIL
    message["To"] = to_email
    message["Subject"] = "Verify your PaisaVasool account"

    message.set_content(
        f"""
            Hello,

            Your OTP for PaisaVasool signup is:

            {otp}

            This OTP is valid for 5 minutes.
            Do not share it with anyone.

            – PaisaVasool Team
            """
                )

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_SERVER,
        port=settings.SMTP_PORT,
        start_tls=True,
        username=settings.SMTP_EMAIL,
        password=settings.SMTP_PASSWORD,
        timeout=10
    )