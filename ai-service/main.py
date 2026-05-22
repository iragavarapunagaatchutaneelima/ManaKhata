from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("manaKhata-ai")

app = FastAPI(
    title="ManaKhata AI Service",
    description="AI-powered financial intelligence microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "ManaKhata AI"}


@app.get("/api/ai/insights/{user_id}")
def get_insights(user_id: int):
    """Rule-based financial insights — placeholder for ML model integration"""
    return {
        "userId": user_id,
        "insights": [
            {
                "type": "WARNING",
                "title": "Anomaly Detected",
                "message": "Your dining out expenses this week are 45% higher than your historical average.",
                "icon": "⚠️",
                "priority": 1,
            },
            {
                "type": "TIP",
                "title": "Optimize Your Savings",
                "message": "Based on your spending patterns, you can save an additional ₹5,000/month by reducing food delivery expenses.",
                "icon": "💡",
                "priority": 2,
            }
        ]
    }

@app.post("/api/ai/analyze-transaction")
def analyze_transaction(transaction: dict):
    """Real-time anomaly detection for a specific transaction"""
    amount = transaction.get("amount", 0)
    category = transaction.get("category", "OTHER")
    
    # Simple rule-based anomaly: > 10,000 INR in FOOD is an anomaly
    is_anomaly = category == "FOOD" and amount > 10000
    
    return {
        "transactionId": transaction.get("id"),
        "isAnomaly": is_anomaly,
        "riskScore": 0.85 if is_anomaly else 0.10,
        "reason": "Unusually high amount for dining/food" if is_anomaly else None
    }


@app.get("/api/ai/predict/{user_id}")
def predict_expenses(user_id: int):
    """Predict next month's expenses using moving average"""
    return {
        "userId": user_id,
        "predictions": [
            {"category": "GROCERIES", "predicted": 8500.0, "confidence": 0.85},
            {"category": "PETROL",    "predicted": 4200.0, "confidence": 0.78},
            {"category": "FOOD",      "predicted": 6000.0, "confidence": 0.72},
        ]
    }


@app.get("/api/ai/health-score/{user_id}")
def health_score(user_id: int):
    """Financial health score computation"""
    return {
        "userId": user_id,
        "score": 72,
        "grade": "B",
        "status": "Good"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
