from langchain_core.tools import tool


@tool
async def get_history_with_contact(user_id: int, contact_username: str):
    """ Fetch the chat history between the user and the contact """
    pass

@tool
async def get_message_to_user(content: str, target_username: str):
    """ Send a message to another user on behalf of the sender """
    pass
