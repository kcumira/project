from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.inventory_routes import router as inventory_router
from app.routes.home_routes import router as home_router
from app.routes.auth_routes import router as auth_router
from app.routes.sharing_routes import router as sharing_router
from app.routes.recipe_routes import router as recipe_router
from app.routes.scan_routes import router as scan_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"message": "pong"}

app.include_router(inventory_router)
app.include_router(home_router)
app.include_router(auth_router)
app.include_router(sharing_router)
app.include_router(recipe_router)
app.include_router(scan_router)
