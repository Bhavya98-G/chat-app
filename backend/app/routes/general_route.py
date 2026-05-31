from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.services import get_current_user
from app.general import contact, personal
from app.general import schemas
from app.core.database import get_db
from app.models.sql_tables import User

router = APIRouter(tags=["contacts"], prefix="/general")


@router.post("/create_contact", response_model=schemas.CreateContactResponse)
async def create_contact(
    payload: schemas.CreateContact,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await contact.create_contact(
        owner_id=current_user.id,
        contact_id=payload.contact_id,
        nickname=payload.nickname,
        db=db,
    )

@router.get("/all_contact", response_model=list[schemas.GetAllContact])
async def get_all_contact(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await contact.get_all_contact(
        user_id=current_user.id,
        db=db
    )

@router.get("/contact/{contact_id}", response_model=schemas.GetContact)
async def get_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await contact.get_contact(
        owner_id=current_user.id,
        contact_id=contact_id,
        db=db
    )

@router.patch("/change_nickname", response_model=schemas.ChangeNickName)
async def change_nickname(
    payload: schemas.ChangeNickName,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await contact.change_nickname(
        owner_id=current_user.id,
        contact_id=payload.contact_id,
        nickname=payload.nickname,
        db=db
    )

@router.patch("/block_person", response_model=schemas.BlockPerson)
async def block_person(
    payload: schemas.BlockPerson,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await contact.block_person(
        owner_id=current_user.id,
        contact_id=payload.contact_id,
        is_blocked=payload.is_blocked,
        db=db
    )


@router.delete("/delete_contact/{contact_id}", response_model=schemas.DeleteContact)
async def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await contact.delete_contact(
        owner_id=current_user.id,
        contact_id=contact_id,
        db=db
    )

@router.post("/add_number", response_model=schemas.ResponsePhoneNumber)
async def add_number(
    payload: schemas.RequestPhoneNumber,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await personal.add_number(user_id=current_user.id,
                                     phone_number=payload.phone_number,
                                     db=db)

@router.patch("/update_number", response_model=schemas.ResponsePhoneNumber)
async def update_number(
    payload: schemas.RequestPhoneNumber,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await personal.update_number(user_id=current_user.id,
                                     phone_number=payload.phone_number,
                                     db=db)

@router.delete("/delete_number", response_model=schemas.DeletePhoneNumber)
async def delete_number(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await personal.delete_number(user_id=current_user.id,
                                     db=db)

@router.post("/add_bio", response_model=schemas.ResponseBio)
async def add_bio(
    payload: schemas.RequestBio,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await personal.add_bio(user_id=current_user.id,
                                     bio=payload.bio,
                                     db=db)

@router.patch("/update_bio", response_model=schemas.ResponseBio)
async def update_bio(
    payload: schemas.RequestBio,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await personal.update_bio(user_id=current_user.id,
                                     bio=payload.bio,
                                     db=db)


@router.delete("/delete_bio", response_model=schemas.DeleteBio)
async def delete_bio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await personal.delete_bio(user_id=current_user.id,
                                     db=db)