import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_client, require_active_coach, require_coach
from app.models.clients import Client, IntakeResponse
from app.models.enums import ClientStatus, UserRole
from app.models.messaging import Thread
from app.models.users import CoachProfile, User
from app.schemas.clients import (
    ClientCreate,
    ClientDetailOut,
    ClientNotesUpdate,
    ClientOut,
    ClientSelfProfileOut,
    ClientSelfProfileUpdate,
    ClientUpdate,
    InviteInfoOut,
)
from app.schemas.intake import IntakeCreate, IntakeOut
from app.security import create_invite_token
from app.utils.time import utcnow

router = APIRouter(prefix="/clients", tags=["clients"])


async def create_client_with_user(
    db: AsyncSession,
    coach: User,
    *,
    name: str,
    email: str,
    phone: str | None,
    program: str | None,
    goals: str | None,
    tags: list[str] | None = None,
    notes: str | None = None,
) -> Client:
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with that email already exists")

    user = User(email=email, name=name, role=UserRole.client, password_hash=None)
    db.add(user)
    await db.flush()

    client = Client(
        coach_id=coach.id,
        user_id=user.id,
        goals=goals,
        program=program,
        tags=tags,
        notes=notes,
        status=ClientStatus.active,
        joined_at=utcnow(),
    )
    db.add(client)
    await db.flush()

    db.add(Thread(coach_id=coach.id, client_id=client.id))

    return client


def _to_client_out(client: Client, user: User) -> ClientOut:
    return ClientOut(
        id=client.id,
        user_id=user.id,
        name=user.name,
        email=user.email,
        program=client.program,
        status=client.status,
        joined_at=client.joined_at,
        invite_pending=user.password_hash is None,
    )


async def _get_owned_client(
    db: AsyncSession, coach: User, client_id: uuid.UUID
) -> tuple[Client, User]:
    result = await db.execute(
        select(Client, User).join(User, User.id == Client.user_id).where(
            Client.id == client_id, Client.coach_id == coach.id
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return row


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientOut:
    client = await create_client_with_user(
        db,
        coach,
        name=body.name,
        email=body.email,
        phone=body.phone,
        program=body.program,
        goals=body.goals,
    )
    await db.commit()
    user = await db.get(User, client.user_id)
    assert user is not None
    return _to_client_out(client, user)


@router.get("", response_model=list[ClientOut])
async def list_clients(
    limit: int = 100,
    offset: int = 0,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> list[ClientOut]:
    result = await db.execute(
        select(Client, User)
        .join(User, User.id == Client.user_id)
        .where(Client.coach_id == coach.id)
        .order_by(Client.joined_at.desc())
        .limit(min(limit, 500))
        .offset(offset)
    )
    return [_to_client_out(c, u) for c, u in result.all()]


@router.get("/me/portal")
async def get_my_portal(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> dict:
    profile = await db.get(CoachProfile, client.coach_id)
    return {"portal_slug": profile.portal_slug if profile else None}


@router.get("/me/profile", response_model=ClientSelfProfileOut)
async def get_my_client_profile(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> ClientSelfProfileOut:
    me = await db.get(User, client.user_id)
    coach = await db.get(User, client.coach_id)
    profile = await db.get(CoachProfile, client.coach_id)
    assert me is not None and coach is not None
    return ClientSelfProfileOut(
        name=me.name,
        email=me.email,
        timezone=me.timezone,
        goals=client.goals,
        program=client.program,
        coach_name=coach.name,
        portal_slug=profile.portal_slug if profile else None,
    )


@router.patch("/me/profile", response_model=ClientSelfProfileOut)
async def update_my_client_profile(
    body: ClientSelfProfileUpdate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> ClientSelfProfileOut:
    me = await db.get(User, client.user_id)
    assert me is not None
    if body.name is not None:
        me.name = body.name
    if body.timezone is not None:
        me.timezone = body.timezone
    await db.commit()
    await db.refresh(me)
    coach = await db.get(User, client.coach_id)
    profile = await db.get(CoachProfile, client.coach_id)
    assert coach is not None
    return ClientSelfProfileOut(
        name=me.name,
        email=me.email,
        timezone=me.timezone,
        goals=client.goals,
        program=client.program,
        coach_name=coach.name,
        portal_slug=profile.portal_slug if profile else None,
    )


@router.get("/me/intake", response_model=IntakeOut)
async def get_my_intake(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> IntakeOut:
    result = await db.execute(
        select(IntakeResponse).where(IntakeResponse.client_id == client.id)
    )
    intake = result.scalar_one_or_none()
    if intake is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not submitted yet")
    return intake


@router.post("/me/intake", response_model=IntakeOut, status_code=status.HTTP_201_CREATED)
async def submit_my_intake(
    body: IntakeCreate,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> IntakeOut:
    existing = await db.execute(
        select(IntakeResponse).where(IntakeResponse.client_id == client.id)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Intake already submitted")

    intake = IntakeResponse(
        client_id=client.id,
        goals=body.goals,
        experience=body.experience,
        availability=body.availability,
        notes=body.notes,
        submitted_at=utcnow(),
    )
    db.add(intake)
    await db.commit()
    await db.refresh(intake)
    return intake


async def _thread_id_for_client(db: AsyncSession, client_id: uuid.UUID) -> uuid.UUID | None:
    result = await db.execute(select(Thread.id).where(Thread.client_id == client_id))
    return result.scalar_one_or_none()


@router.get("/{client_id}", response_model=ClientDetailOut)
async def get_client(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientDetailOut:
    client, user = await _get_owned_client(db, coach, client_id)
    base = _to_client_out(client, user)
    return ClientDetailOut(
        **base.model_dump(),
        goals=client.goals,
        subscription_valid_until=client.subscription_valid_until,
        tags=client.tags,
        notes=client.notes,
        thread_id=await _thread_id_for_client(db, client.id),
        timezone=user.timezone,
    )


@router.patch("/{client_id}", response_model=ClientDetailOut)
async def update_client(
    client_id: uuid.UUID,
    body: ClientUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientDetailOut:
    client, user = await _get_owned_client(db, coach, client_id)
    if body.name is not None:
        user.name = body.name
    if body.goals is not None:
        client.goals = body.goals
    if body.program is not None:
        client.program = body.program
    if body.tags is not None:
        client.tags = body.tags
    if body.status is not None:
        client.status = body.status
    await db.commit()
    base = _to_client_out(client, user)
    return ClientDetailOut(
        **base.model_dump(),
        goals=client.goals,
        subscription_valid_until=client.subscription_valid_until,
        tags=client.tags,
        notes=client.notes,
        thread_id=await _thread_id_for_client(db, client.id),
        timezone=user.timezone,
    )


@router.patch("/{client_id}/notes", response_model=ClientDetailOut)
async def update_client_notes(
    client_id: uuid.UUID,
    body: ClientNotesUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientDetailOut:
    client, user = await _get_owned_client(db, coach, client_id)
    client.notes = body.notes
    await db.commit()
    base = _to_client_out(client, user)
    return ClientDetailOut(
        **base.model_dump(),
        goals=client.goals,
        subscription_valid_until=client.subscription_valid_until,
        tags=client.tags,
        thread_id=await _thread_id_for_client(db, client.id),
        notes=client.notes,
        timezone=user.timezone,
    )


@router.get("/{client_id}/invite", response_model=InviteInfoOut)
async def get_client_invite(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> InviteInfoOut:
    client, user = await _get_owned_client(db, coach, client_id)
    if user.password_hash is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This client has already joined")
    token = create_invite_token(user.id)
    return InviteInfoOut(invite_token=token, invite_path=f"/invite/{token}")


@router.get("/{client_id}/intake", response_model=IntakeOut)
async def get_client_intake(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> IntakeOut:
    client, _ = await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(IntakeResponse).where(IntakeResponse.client_id == client.id)
    )
    intake = result.scalar_one_or_none()
    if intake is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not submitted yet")
    return intake
