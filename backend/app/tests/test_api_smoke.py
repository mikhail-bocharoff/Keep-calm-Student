from fastapi.testclient import TestClient
from app.main import app


def test_api_smoke_recovery_ritual_focus_progress():
    with TestClient(app) as client:
        user_id = client.post("/api/users", json={"display_name": "Студент"}).json()["user_id"]

        chat = client.post(
            "/api/chat/message",
            json={
                "user_id": user_id,
                "channel": "web",
                "message": "Я дико устал, дедлайн завтра, мозг не работает и ничего не могу",
            },
        ).json()
        assert chat["recommended_mode"] == "recovery"

        ritual = client.post("/api/rituals/start", json={"user_id": user_id, "ritual_type": "cat_mode"}).json()
        assert ritual["ritual_type"] == "cat_mode"
        client.post("/api/rituals/complete", json={"user_id": user_id, "ritual_id": ritual["ritual_id"]})

        focus = client.post("/api/focus/start", json={"user_id": user_id}).json()
        client.post(
            "/api/focus/complete",
            json={"user_id": user_id, "focus_round_id": focus["focus_round_id"], "user_result": "3 вопроса"},
        )

        progress = client.get(f"/api/progress/{user_id}").json()
        assert progress["rest_shards"] == 2
