import os
from typing import Optional, Any
import uuid

import firebase_admin
from firebase_admin import credentials, firestore

from google.adk.sessions.base_session_service import BaseSessionService, ListSessionsResponse, GetSessionConfig
from google.adk.sessions.session import Session
from google.adk.events import Event

# Inicjalizacja klienta Firebase Admin z ADC (Application Default Credentials)
if not firebase_admin._apps:
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"[FirestoreSessionService] Błąd inicjalizacji ADC: {e}. Upewnij się, że używasz gcloud auth application-default login.")

class FirestoreSessionService(BaseSessionService):
    """
    Trwały mechanizm zapisu sesji w oparciu o Google Cloud Firestore.
    Implementuje interfejs `BaseSessionService` z ADK.
    """
    
    def __init__(self, collection_name: str = "adk_sessions"):
        self.collection_name = collection_name
        # Pobieranie klienta od razu wymusi weryfikację uprawnień (ADC).
        # W przypadku błędu (np. brak tokena) rzuci wyjątek, który przechwyci runner (Graceful Degradation).
        self.db = firestore.client()

    async def create_session(
        self,
        *,
        app_name: str,
        user_id: str,
        state: Optional[dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> Session:
        session_id = session_id or str(uuid.uuid4())
        session = Session(
            id=session_id,
            user_id=user_id,
            app_name=app_name,
            state=state or {}
        )
        session_dict = session.model_dump(mode="json")
        self.db.collection(self.collection_name).document(session_id).set(session_dict)
        return session

    async def get_session(
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str,
        config: Optional[GetSessionConfig] = None,
    ) -> Optional[Session]:
        doc = self.db.collection(self.collection_name).document(session_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        if data.get("app_name") != app_name or data.get("user_id") != user_id:
            return None
        return Session.model_validate(data)

    async def list_sessions(
        self, *, app_name: str, user_id: Optional[str] = None
    ) -> ListSessionsResponse:
        query = self.db.collection(self.collection_name).where(filter=firestore.FieldFilter("app_name", "==", app_name))
        if user_id:
            query = query.where(filter=firestore.FieldFilter("user_id", "==", user_id))
            
        docs = query.stream()
        sessions = [Session.model_validate(doc.to_dict()) for doc in docs]
        return ListSessionsResponse(sessions=sessions)

    async def delete_session(
        self, *, app_name: str, user_id: str, session_id: str
    ) -> None:
        doc_ref = self.db.collection(self.collection_name).document(session_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get("app_name") == app_name and data.get("user_id") == user_id:
                doc_ref.delete()

    async def append_event(self, session: Session, event: Event) -> Event:
        # Nadpisujemy append_event, aby po dodaniu eventu do pamięci obiektu Session,
        # zapisać odświeżony stan sesji do Firestore.
        event = await super().append_event(session, event)
        if getattr(event, 'partial', False):
            return event
            
        session_dict = session.model_dump(mode="json")
        self.db.collection(self.collection_name).document(session.id).set(session_dict)
        return event
