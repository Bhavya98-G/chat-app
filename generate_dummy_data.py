import random
import datetime
import os

users = [
    {"id": 1, "username": "alice", "first_name": "Alice", "last_name": "Smith", "email": "alice@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 2, "username": "bob", "first_name": "Bob", "last_name": "Jones", "email": "bob@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 3, "username": "charlie", "first_name": "Charlie", "last_name": "Brown", "email": "charlie@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 4, "username": "david", "first_name": "David", "last_name": "Williams", "email": "david@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 5, "username": "eve", "first_name": "Eve", "last_name": "Davis", "email": "eve@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 6, "username": "frank", "first_name": "Frank", "last_name": "Miller", "email": "frank@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 7, "username": "grace", "first_name": "Grace", "last_name": "Wilson", "email": "grace@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 8, "username": "helen", "first_name": "Helen", "last_name": "Moore", "email": "helen@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 9, "username": "ian", "first_name": "Ian", "last_name": "Taylor", "email": "ian@example.com", "hashed_password": "hashed_pw", "role": "user"},
    {"id": 10, "username": "jane", "first_name": "Jane", "last_name": "Anderson", "email": "jane@example.com", "hashed_password": "hashed_pw", "role": "user"}
]

messages = [
    "Hello there!", "How are you doing?", "I'm good, thanks!", "What have you been up to?", 
    "Not much, just working.", "Did you see the game last night?", "Yes, it was incredible!", 
    "I can't believe they won.", "I know, right?", "Let's catch up soon.", "Sure, sounds good.",
    "Are you free this weekend?", "Yes, I'm free on Saturday.", "Great, let's meet up.",
    "Where should we go?", "How about that new coffee shop?", "Perfect, I love coffee.",
    "See you then!", "Bye!", "Have a good day.", "You too.", "Hey!", "Hi!", "What's up?",
    "Nothing much.", "Just chillin.", "Same here.", "Alright, ttyl.", "Okay, bye."
]

output_file = os.path.join(os.path.dirname(__file__), 'dummy_data.sql')

with open(output_file, 'w') as f:
    f.write("-- Dummy Data for Users\n")
    for u in users:
        f.write(f"INSERT INTO users (id, username, first_name, last_name, email, hashed_password, role) VALUES ({u['id']}, '{u['username']}', '{u['first_name']}', '{u['last_name']}', '{u['email']}', '{u['hashed_password']}', '{u['role']}');\n")
    
    f.write("\n-- Dummy Data for Messages\n")
    
    start_time = datetime.datetime(2023, 1, 1, 12, 0, 0)
    msg_id = 1
    for _ in range(5000): # 5000 messages
        sender_id = random.randint(1, 10)
        receiver_id = random.randint(1, 10)
        while receiver_id == sender_id:
            receiver_id = random.randint(1, 10)
        
        content = random.choice(messages)
        content = content.replace("'", "''")
        timestamp = start_time + datetime.timedelta(minutes=random.randint(1, 60*24*365)) # Random time within a year
        
        f.write(f"INSERT INTO messages (id, sender_id, receiver_id, content, timestamp) VALUES ({msg_id}, {sender_id}, {receiver_id}, '{content}', '{timestamp.strftime('%Y-%m-%d %H:%M:%S')}');\n")
        msg_id += 1

print(f"Dump file generated at {output_file}")
