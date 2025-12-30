from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="nameo Orchestrator", version="0.1.0")


class UserInfo(BaseModel):
    id: Optional[str] = None
    tier: Optional[str] = None  # beta, free, standard, advanced


class SearchRequest(BaseModel):
    name: str
    user: Optional[UserInfo] = None
    groups: Optional[List[str]] = None  # ["common", "niche", "advanced"]
    modes: Optional[List[str]] = None   # ["basic_availability"], future expansion


class SearchResult(BaseModel):
    service: str
    status: str


class SearchResponse(BaseModel):
    status: str
    name: str
    results: List[SearchResult]


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/v1/search-basic", response_model=SearchResponse)
async def search_basic(body: SearchRequest) -> SearchResponse:
    """Stub endpoint for orchestrated searches.

    For now this just returns an empty result list so we can deploy and
    wire everything up. Later this will:
      - Plan out platform adapters to call
      - Respect user.tier and requested groups/modes
      - Fan out to multiple services and aggregate results
    """
    name = (body.name or "").strip()
    if not name:
        return SearchResponse(status="error", name="", results=[])

    return SearchResponse(status="ok", name=name, results=[])
