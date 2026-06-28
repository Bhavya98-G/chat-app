import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.sql_tables import User, Contact
from app.general.schemas import CreateContactResponse, GetAllContact, GetContact, ChangeNickName, BlockPerson, DeleteContact

logger = logging.getLogger(__name__)


async def create_contact(
    owner_id: int,
    contact_id: int,
    nickname: str ,
    db: AsyncSession,
) -> CreateContactResponse:
    if owner_id == contact_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as a contact",
        )

    try:
        user_result = await db.execute(select(User).where(User.id == contact_id))
        target_user = user_result.scalars().first()
        if target_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        existing_result = await db.execute(
            select(Contact).where(
                Contact.owner_id == owner_id,
                Contact.contact_id == contact_id,
            )
        )
        existing_contact = existing_result.scalars().first()

        if existing_contact is not None:
            if existing_contact.nickname != nickname:
                existing_contact.nickname = nickname
                await db.commit()
                await db.refresh(existing_contact)
                return CreateContactResponse(
                    contact_id=existing_contact.contact_id,
                    nickname=existing_contact.nickname,
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Contact already exists",
            )

        new_contact = Contact(
            owner_id=owner_id,
            contact_id=contact_id,
            nickname=nickname,
        )
        db.add(new_contact)
        await db.commit()
        await db.refresh(new_contact)
        return CreateContactResponse(
            contact_id=new_contact.contact_id,
            nickname=new_contact.nickname,
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("create_contact failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contact",
        )

async def get_all_contact(user_id: int, db: AsyncSession) -> list[GetAllContact]:
    try:
        result = await db.execute(
            select(Contact, User)
            .join(User, User.id == Contact.contact_id)
            .where(Contact.owner_id == user_id)
            .order_by(User.first_name)
        )
        return [
            GetAllContact(
                contact_id=c.contact_id,
                nickname=c.nickname,
                first_name=u.first_name,
                last_name=u.last_name,
                is_blocked=c.is_blocked,
            )
            for c, u in result.all()
        ]
    except Exception:
        await db.rollback()
        logger.exception("get_all_contact failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch contacts",
        )

async def get_contact(owner_id: int, contact_id: int, db: AsyncSession) -> GetContact:
    try:
        result = await db.execute(
            select(User, Contact.nickname, Contact.is_blocked)
            .outerjoin(
                Contact,
                (Contact.contact_id == User.id) & (Contact.owner_id == owner_id),
            )
            .where(User.id == contact_id)
        )
        row = result.first()
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        user, nickname, is_blocked = row
        return GetContact(
            nickname=nickname if nickname is not None else None,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone_number=user.phone_number,
            bio=user.bio,
            created_at=user.created_at,
            is_blocked=bool(is_blocked),
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_contact failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch details",
        )

async def change_nickname(owner_id: int, contact_id: int, nickname: str, db: AsyncSession) -> ChangeNickName:
    try:
        contacts = await db.execute(
            select(Contact).where(
                Contact.owner_id == owner_id,
                Contact.contact_id == contact_id,
            )
        )
        contact = contacts.scalars().first()
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="contact not found"
            )
        contact.nickname = nickname
        await db.commit()
        await db.refresh(contact)
        return ChangeNickName(
            contact_id=contact.contact_id,
            nickname=contact.nickname
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("change_nickname failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change nickname",
        )

async def block_person(owner_id: int, contact_id: int, is_blocked: bool, db: AsyncSession) -> BlockPerson:
    try:
        contacts = await db.execute(
            select(Contact).where(
                Contact.owner_id == owner_id,
                Contact.contact_id == contact_id
            )
        )
        contact = contacts.scalars().first()
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="contact not found"
            )
        contact.is_blocked=is_blocked
        await db.commit()
        await db.refresh(contact)
        return BlockPerson(
            contact_id=contact.contact_id,
            is_blocked=contact.is_blocked
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("block_person failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change is_blocked"
        )
    
async def delete_contact(owner_id: int, contact_id: int, db: AsyncSession) -> DeleteContact:
    try:
        contacts = await db.execute(
            select(Contact).where(
                Contact.owner_id==owner_id,
                Contact.contact_id==contact_id
            )
        )
        contact = contacts.scalars().first()
        if not contact:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "contact not found" 
            )
        deleted_id = contact.contact_id
        await db.delete(contact)
        await db.commit()
        return DeleteContact(contact_id=deleted_id)
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("failed to delete contact")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete contact"
        )
    