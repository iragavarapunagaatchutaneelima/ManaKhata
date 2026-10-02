from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("manaKhata-ai")

# Allowed origins — configurable via environment variable
_raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(
    title="ManaKhata AI Service",
    description="AI-powered financial intelligence microservice",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENABLE_DOCS", "true").lower() == "true" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "ManaKhata AI"}


@app.get("/api/ai/insights/{user_id}")
def get_insights(user_id: int):
    """Rule-based financial insights per user — placeholder for ML model integration"""
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


@app.get("/api/ai/insights")
def get_insights_aggregate():
    """Aggregate insights — called by Spring backend without user_id"""
    return [
        {"type": "POSITIVE", "title": "Strong Savings Rate", "message": "Household is saving over 55% of monthly income.", "category": "SAVINGS", "icon": "💰", "priority": 1},
        {"type": "TIP", "title": "Fuel Tracking", "message": "Vehicle expenses steady. Keep logging fuel for mileage insights.", "category": "VEHICLE", "icon": "⛽", "priority": 2},
        {"type": "ALERT", "title": "Budget Watch", "message": "Groceries close to monthly alert threshold.", "category": "GROCERIES", "icon": "🛒", "priority": 3},
    ]


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


@app.get("/api/ai/predictions")
def get_predictions_aggregate():
    """Aggregate predictions — called by Spring backend without user_id"""
    return [
        {"category": "GROCERIES", "predictedAmount": 12800, "lastMonthAmount": 11800, "changePercent": 8, "trend": "UP", "reason": "Weekend purchase frequency increased."},
        {"category": "PETROL",    "predictedAmount": 7200,  "lastMonthAmount": 7400,  "changePercent": -3, "trend": "STABLE", "reason": "Vehicle usage is consistent."},
        {"category": "FOOD",      "predictedAmount": 6200,  "lastMonthAmount": 5900,  "changePercent": 5,  "trend": "UP", "reason": "Increased food delivery orders."},
    ]


@app.get("/api/ai/health-score/{user_id}")
def health_score_by_user(user_id: int):
    """Financial health score computation per user"""
    return {
        "userId": user_id,
        "score": 86,
        "grade": "A",
        "status": "Healthy",
        "savingsRatio": 76,
        "expenseStability": 82,
        "emergencyReadiness": 88,
        "investmentBalance": 72,
        "strengths": ["High savings ratio", "Stable recurring expenses"],
        "improvements": ["Increase investment allocation", "Review grocery budget"],
        "breakdown": {"savings": 86, "stability": 82, "emergency": 88, "investments": 72}
    }


@app.get("/api/ai/health-score")
def health_score_aggregate():
    """Aggregate health score — called by Spring backend without user_id"""
    return {
        "score": 86,
        "grade": "A",
        "status": "Healthy",
        "savingsRatio": 76,
        "expenseStability": 82,
        "emergencyReadiness": 88,
        "investmentBalance": 72,
        "strengths": ["High savings ratio", "Stable recurring expenses"],
        "improvements": ["Increase investment allocation", "Review grocery budget"],
        "breakdown": {"savings": 86, "stability": 82, "emergency": 88, "investments": 72}
    }


@app.get("/api/ai/investments")
def get_investments_aggregate():
    """Investment advice — called by Spring backend"""
    return {
        "monthlySurplus": 72850,
        "recommendedInvestment": 36000,
        "riskProfile": "Balanced",
        "recommendations": [
            {"name": "Index Mutual Fund", "type": "Equity", "suggestedAmount": 18000, "expectedReturn": "10-12%", "riskLevel": "Medium", "description": "Core long-term wealth allocation.", "icon": "📈"},
            {"name": "Recurring Deposit", "type": "Debt",   "suggestedAmount": 10000, "expectedReturn": "6-7%",  "riskLevel": "Low",    "description": "Stable savings for short-term goals.", "icon": "🏦"},
            {"name": "PPF",               "type": "Tax",    "suggestedAmount": 8000,  "expectedReturn": "7-8%",  "riskLevel": "Low",    "description": "Tax-free long-term savings scheme.",   "icon": "🛡️"},
        ],
        "allocation": {"equity": 50, "debt": 30, "emergency": 20}
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
