from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes_chat, routes_focus, routes_health, routes_progress, routes_rituals, routes_state, routes_users
from app.config import get_settings
from app.db.database import Base, engine


settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


app.include_router(routes_health.router)
app.include_router(routes_users.router)
app.include_router(routes_state.router)
app.include_router(routes_chat.router)
app.include_router(routes_rituals.router)
app.include_router(routes_focus.router)
app.include_router(routes_progress.router)

