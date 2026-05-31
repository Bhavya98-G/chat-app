import sys
import os

# Add the parent directory (backend) to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from core.database import engine

import asyncio

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("select * from users"))
        for row in result:
            print(row)
        await conn.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
    