import json
import uuid
from datetime import timedelta

from livekit import api

from .config import Settings


def issue_token(s: Settings) -> dict:
    """Mint a one-session token: unique room + identity, mic-only publish, agent auto-dispatch."""
    room = f"call-{uuid.uuid4().hex[:16]}"
    identity = f"web-{uuid.uuid4().hex[:12]}"
    token = (
        api.AccessToken(s.livekit_api_key, s.livekit_api_secret)
        .with_identity(identity)
        .with_name("Visitor")
        .with_ttl(timedelta(seconds=s.token_ttl_seconds))
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room,  # bound to this room only: session isolation
                can_publish=True,
                can_subscribe=True,
                can_publish_data=False,
                can_publish_sources=["microphone"],
            )
        )
        .with_room_config(
            api.RoomConfiguration(
                agents=[api.RoomAgentDispatch(
                    agent_name=s.agent_name,
                    metadata=json.dumps({"persona": s.agent_persona}) if s.agent_persona else "",
                )],
                max_participants=3,  # visitor + agent + headroom
                empty_timeout=20,
                departure_timeout=10,
            )
        )
        .to_jwt()
    )
    return {"token": token, "url": s.livekit_url, "room": room, "identity": identity, "expires_in": s.token_ttl_seconds}
