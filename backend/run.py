import uvicorn
import os
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print(" [LandStack Backend] Member 2 - Central Connection Layer")
    print(" Connecting GIS + Land Records + AI Agent + Frontend")
    print("=" * 60)
    print(" >> Interactive Docs (Swagger): http://127.0.0.1:8000/docs")
    print(" >> Alternative Docs (ReDoc):   http://127.0.0.1:8000/redoc")
    print(" >> Root API Status:            http://127.0.0.1:8000/")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
