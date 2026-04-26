import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
# Option 1: Using a service account key file (recommended for local dev)
# Download your service account key from Firebase Console:
#   Project Settings → Service accounts → Generate new private key
# Then set the path below:
#
# cred = credentials.Certificate("serviceAccountKey.json")
# firebase_admin.initialize_app(cred)
#
# Option 2: Using default credentials (for Cloud environments)
# firebase_admin.initialize_app()

_app_initialized = False

def initialize_firebase(service_account_path: str = None):
    """Initialize Firebase. Call once at app startup."""
    global _app_initialized
    if _app_initialized:
        return
    
    if service_account_path:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
    else:
        # Try default credentials (works on GCP, or with GOOGLE_APPLICATION_CREDENTIALS env var)
        firebase_admin.initialize_app()
    
    _app_initialized = True

def get_db():
    """Returns a Firestore client instance."""
    return firestore.client()
