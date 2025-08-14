import hmac
import hashlib
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

app = FastAPI()

BOT_TOKEN = "8375301739:AAEQdhCFl10SHCWy62YMubHJYhwiMe63l1s"  # замени на свой токен из @BotFather

def check_telegram_auth(data: dict) -> bool:
    auth_data = data.copy()
    hash_ = auth_data.pop('hash', None)
    if not hash_:
        return False
    data_check_string = "\n".join([f"{k}={v}" for k, v in sorted(auth_data.items())])
    secret_key = hashlib.sha256(BOT_TOKEN.encode()).digest()
    hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac_hash == hash_

@app.get("/auth/telegram")
async def telegram_auth(request: Request):
    data = dict(request.query_params)
    if check_telegram_auth(data):
        first_name = data.get("first_name", "Unknown")
        return HTMLResponse(f"<h1>Привет, {first_name}!</h1>")
    return HTMLResponse("<h1>Ошибка авторизации</h1>", status_code=403)
