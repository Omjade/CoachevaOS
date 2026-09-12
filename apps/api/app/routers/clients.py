import secrets
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import check_client_cap, get_current_client, get_current_user, require_active_coach, require_coach
from app.models.clients import Client, IntakeResponse
from app.models.enums import ClientStatus, UserRole
from app.models.messaging import Thread
from app.models.users import CoachProfile, User
from app.storage import save_upload
from app.schemas.clients import (
    ClientCreate,
    ClientDetailOut,
    ClientNotesUpdate,
    ClientOut,
    ClientPortalLinkOut,
    ClientSelfProfileOut,
    ClientSelfProfileUpdate,
    ClientUpdate,
    CoachingDatesUpdate,
    InviteInfoOut,
)
from app.schemas.intake import IntakeCreate, IntakeOut
from app.routers.billing import _compute_status
from app.utils.time import utcnow

router = APIRouter(prefix="/clients", tags=["clients"])

INVITE_VALIDITY = timedelta(days=14)


async def _generate_unique_invite_code(db: AsyncSession) -> str:
    for _ in range(5):
        code = secrets.token_urlsafe(6)
        existing = await db.execute(select(Client.id).where(Client.invite_code == code))
        if existing.scalar_one_or_none() is None:
            return code
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not generate an invite link. Try again.")


async def _generate_unique_portal_code(db: AsyncSession) -> str:
    for _ in range(5):
        code = secrets.token_urlsafe(6)
        existing = await db.execute(select(Client.id).where(Client.portal_code == code))
        if existing.scalar_one_or_none() is None:
            return code
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not generate a portal link. Try again.")


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
    # Coach-scoped dedup, not global — the same email may legitimately already
    # be a client of a DIFFERENT coach (switched coaches, or works with two at
    # once). Only reject if THIS coach already has that email as a client.
    existing_for_coach = await db.execute(
        select(Client)
        .join(User, User.id == Client.user_id)
        .where(User.email == email, Client.coach_id == coach.id)
    )
    if existing_for_coach.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This is already one of your clients")

    await check_client_cap(db, coach.id)

    # Reuse an existing User (any role, any other coach) rather than trying to
    # create a second one — users.email has a real global-unique constraint,
    # so a duplicate insert would fail outright regardless.
    existing_user = await db.execute(select(User).where(User.email == email))
    user = existing_user.scalar_one_or_none()
    if user is None:
        user = User(email=email, name=name, role=UserRole.client, password_hash=None)
        db.add(user)
        await db.flush()

    client = Client(
        coach_id=coach.id,
        user_id=user.id,
        phone=phone,
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
        phone=client.phone,
        program=client.program,
        status=client.status,
        joined_at=client.joined_at,
        # Not user.password_hash is None — a reused existing User (shared
        # identity across coaches, see create_client_with_user) may already
        # have a password from another coach's relationship while THIS
        # specific coach's invite is still unaccepted.
        invite_pending=client.invite_accepted_at is None,
        niche=client.niche,
        client_type=client.client_type,
        subscription_valid_until=client.subscription_valid_until,
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
        .where(Client.coach_id == coach.id, Client.status != ClientStatus.deleted)
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
        id=client.id,
        name=me.name,
        email=me.email,
        timezone=me.timezone,
        goals=client.goals,
        program=client.program,
        coach_name=coach.name,
        portal_slug=profile.portal_slug if profile else None,
        subscription_valid_from=client.subscription_valid_from,
        subscription_valid_until=client.subscription_valid_until,
        billing_status=_compute_status(client.subscription_valid_until),
        niche=client.niche,
        phone=client.phone,
        status=client.status,
        billing_currency=client.billing_currency,
        coaching_start_date=client.coaching_start_date,
        coaching_end_date=client.coaching_end_date,
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
        id=client.id,
        name=me.name,
        email=me.email,
        timezone=me.timezone,
        goals=client.goals,
        program=client.program,
        coach_name=coach.name,
        portal_slug=profile.portal_slug if profile else None,
        subscription_valid_from=client.subscription_valid_from,
        subscription_valid_until=client.subscription_valid_until,
        billing_status=_compute_status(client.subscription_valid_until),
        niche=client.niche,
        phone=client.phone,
        status=client.status,
        billing_currency=client.billing_currency,
        coaching_start_date=client.coaching_start_date,
        coaching_end_date=client.coaching_end_date,
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
    user: User = Depends(get_current_user),
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
    if body.country_code:
        user.country_code = body.country_code
    if body.timezone:
        user.timezone = body.timezone
    await db.commit()
    await db.refresh(intake)

    # Local import: app.routers.automation -> app.routers.programs ->
    # app.routers.clients would be a circular import at module load time
    # otherwise. By call time every module is already fully loaded.
    from app.routers.automation import run_auto_onboarding

    coach = await db.get(User, client.coach_id)
    if coach is not None:
        await run_auto_onboarding(db, coach, client, user)

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
        tags=client.tags,
        notes=client.notes,
        thread_id=await _thread_id_for_client(db, client.id),
        timezone=user.timezone,
        billing_currency=client.billing_currency,
        coaching_start_date=client.coaching_start_date,
        coaching_end_date=client.coaching_end_date,
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
    if body.email is not None and body.email != user.email:
        # Email doubles as this client's login credential (User.email is the
        # unique lookup key in /auth/login) — reject a change that would
        # collide with a different account rather than silently reassigning
        # someone else's login.
        existing = await db.execute(select(User).where(User.email == body.email))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "That email is already in use")
        user.email = body.email
    if body.phone is not None:
        client.phone = body.phone
    if body.goals is not None:
        client.goals = body.goals
    if body.program is not None:
        client.program = body.program
    if body.niche is not None:
        client.niche = body.niche
    if body.billing_currency is not None:
        client.billing_currency = body.billing_currency
    if body.tags is not None:
        client.tags = body.tags
    if body.status is not None:
        if body.status == ClientStatus.active and client.status != ClientStatus.active:
            await check_client_cap(db, coach.id)
        client.status = body.status
    await db.commit()
    base = _to_client_out(client, user)
    return ClientDetailOut(
        **base.model_dump(),
        goals=client.goals,
        tags=client.tags,
        notes=client.notes,
        thread_id=await _thread_id_for_client(db, client.id),
        timezone=user.timezone,
        billing_currency=client.billing_currency,
        coaching_start_date=client.coaching_start_date,
        coaching_end_date=client.coaching_end_date,
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
        tags=client.tags,
        thread_id=await _thread_id_for_client(db, client.id),
        notes=client.notes,
        timezone=user.timezone,
        billing_currency=client.billing_currency,
        coaching_start_date=client.coaching_start_date,
        coaching_end_date=client.coaching_end_date,
    )


@router.get("/{client_id}/invite", response_model=InviteInfoOut)
async def get_client_invite(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> InviteInfoOut:
    client, user = await _get_owned_client(db, coach, client_id)
    if client.invite_accepted_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This client has already joined")
    if client.invite_code is None:
        client.invite_code = await _generate_unique_invite_code(db)
    # Re-requesting the link (e.g. "copy link" clicked again later) refreshes
    # the validity window rather than rotating the code, so a previously
    # shared link keeps working once renewed.
    client.invite_expires_at = utcnow() + INVITE_VALIDITY
    await db.commit()
    return InviteInfoOut(invite_token=client.invite_code, invite_path=f"/invite/{client.invite_code}")


@router.get("/{client_id}/portal-link", response_model=ClientPortalLinkOut)
async def get_client_portal_link(
    client_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientPortalLinkOut:
    """A permanent personal bookmark link for an already-joined client — landing
    there resolves their identity and sends them into the normal login flow
    pre-filled, or straight to their dashboard if already signed in. Distinct
    from the pre-signup /invite/{code} link, which stops working once accepted."""
    client, user = await _get_owned_client(db, coach, client_id)
    if client.invite_accepted_at is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Share the invite link first. This client hasn't joined yet."
        )
    if client.portal_code is None:
        client.portal_code = await _generate_unique_portal_code(db)
        await db.commit()

    profile = await db.get(CoachProfile, coach.id)
    slug = profile.portal_slug if profile else ""
    return ClientPortalLinkOut(portal_code=client.portal_code, portal_path=f"/{slug}/c/{client.portal_code}")


@router.post("/{client_id}/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def upload_client_avatar(
    client_id: uuid.UUID,
    file: UploadFile,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Coach-side photo upload for a client — same storage pattern as the
    client's own self-service avatar upload (POST /auth/me/avatar)."""
    _, user = await _get_owned_client(db, coach, client_id)
    key, file_type = await save_upload(file)
    if file_type != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please upload an image file")
    user.avatar_url = key
    await db.commit()


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


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Archives, never a real cascade delete -- sets status=deleted, which
    every client-list query already excludes. Messages/documents/invoices
    are left intact, same reasoning as the existing account-anonymize
    pattern (preserves the coach's own history)."""
    client, _user = await _get_owned_client(db, coach, client_id)
    client.status = ClientStatus.deleted
    await db.commit()


@router.patch("/{client_id}/coaching-dates", response_model=ClientDetailOut)
async def update_coaching_dates(
    client_id: uuid.UUID,
    body: CoachingDatesUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientDetailOut:
    """Always assigns both dates (never skips None) so either can be
    cleared once set -- mirrors billing.py's update_client_subscription."""
    client, user = await _get_owned_client(db, coach, client_id)
    client.coaching_start_date = body.coaching_start_date
    client.coaching_end_date = body.coaching_end_date
    await db.commit()
    base = _to_client_out(client, user)
    return ClientDetailOut(
        **base.model_dump(),
        goals=client.goals,
        tags=client.tags,
        notes=client.notes,
        thread_id=await _thread_id_for_client(db, client.id),
        timezone=user.timezone,
        billing_currency=client.billing_currency,
        coaching_start_date=client.coaching_start_date,
        coaching_end_date=client.coaching_end_date,
    )
