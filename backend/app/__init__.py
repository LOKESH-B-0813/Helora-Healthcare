import logging
from flask import Flask
from .config import Config
from .extensions import cors
from .firebase_admin_init import init_firebase
from .appwrite_init import check_appwrite_resources, init_appwrite

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Logging
    logging.basicConfig(level=logging.INFO)

    # Initialize extensions
    configured_origin = app.config.get('FRONTEND_ORIGIN')
    allowed_origins = [origin for origin in {
        configured_origin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    } if origin]
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})

    # Initialize Firebase Admin SDK
    init_firebase(app)
    # Initialize Appwrite clients for the staged platform migration.
    init_appwrite(app)

    # Simple health route
    @app.route('/api/health')
    def health():
        return {"success": True, "uptime": True}

    @app.route('/api/health/appwrite')
    def appwrite_health():
        result = check_appwrite_resources(app)
        return result, (200 if result.get('ok') else 503)

    from .registration_routes import registration_bp
    app.register_blueprint(registration_bp, url_prefix='/api')

    # Register blueprints (to be added)
    from .reports import reports_bp
    app.register_blueprint(reports_bp, url_prefix='/api')
    from .health_routes import health_bp
    app.register_blueprint(health_bp, url_prefix='/api')
    from .domain_routes import domain_bp
    app.register_blueprint(domain_bp, url_prefix='/api')
    # Admin API (RBAC, auth, management)
    from .admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api')
    # Medi-AI Chat routes
    from .chat_routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api')

    # Medi-AI modular subsystem (safety-routed, provider abstraction)
    from .medi_ai.routes import medi_ai_bp
    app.register_blueprint(medi_ai_bp, url_prefix='/api/medi-ai')

    # Initialize local SQLite schema (conversations, usage logging) on startup.
    from .database import init_db
    init_db(app)

    return app
