import os
import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from dotenv import load_dotenv

load_dotenv()

class OmegaMailClient:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.imap_server = os.getenv("IMAP_SERVER", "imap.gmail.com")
        self.imap_port = int(os.getenv("IMAP_PORT", 993))
        
        self.email_address = os.getenv("EMAIL_ADDRESS")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        
        if not self.email_address or not self.email_password:
            raise ValueError("Brak konfiguracji EMAIL_ADDRESS lub EMAIL_PASSWORD w pliku .env")
            
    def send_email(self, to_address: str, subject: str, body: str):
        msg = MIMEMultipart()
        msg['From'] = self.email_address
        msg['To'] = to_address
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_address, self.email_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"[MAIL CLIENT ERROR] Błąd podczas wysyłania: {e}")
            return False

    def fetch_unread_replies(self):
        replies = []
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            mail.login(self.email_address, self.email_password)
            mail.select("inbox")
            
            # Wyszukujemy nieprzeczytane wiadomości
            status, response = mail.search(None, "UNSEEN")
            if status == "OK":
                unread_msg_nums = response[0].split()
                for num in unread_msg_nums:
                    status, data = mail.fetch(num, "(RFC822)")
                    if status == "OK":
                        raw_email = data[0][1]
                        msg = email.message_from_bytes(raw_email)
                        
                        subject, encoding = decode_header(msg["Subject"])[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")
                            
                        sender = msg.get("From")
                        
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() == "text/plain":
                                    try:
                                        body = part.get_payload(decode=True).decode()
                                    except Exception:
                                        pass
                        else:
                            try:
                                body = msg.get_payload(decode=True).decode()
                            except Exception:
                                pass
                                
                        replies.append({
                            "from": sender,
                            "subject": subject,
                            "body": body.strip(),
                            "msg_id": num
                        })
            mail.close()
            mail.logout()
        except Exception as e:
            print(f"[MAIL CLIENT ERROR] Błąd podczas odbierania: {e}")
            
        return replies
