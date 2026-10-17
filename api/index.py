try:
    from app.main import app
except Exception as startup_error:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from pydantic import ValidationError

    if isinstance(startup_error, ValidationError):
        reasons = "; ".join(str(e["msg"]).removeprefix("Value error, ") for e in startup_error.errors(include_input=False))
    else:
        reasons = type(startup_error).__name__

    message = f"The server could not start because of its settings: {reasons}. Fix the environment variables in Vercel and redeploy."
    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def misconfigured(path: str):
        return JSONResponse(status_code=500, content={"detail": message})
