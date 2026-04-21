# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.config import settings
# from app.routers import dashboard, insights
# from app.services.data_service import DataService

# app = FastAPI(
#     title=settings.app_name,
#     version=settings.app_version,
#     docs_url="/docs",
#     redoc_url="/redoc",
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.cors_origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(dashboard.router)
# app.include_router(insights.router)


# @app.on_event("startup")
# def startup():
#     # Pre-warm the DataService singleton so first request is fast
#     DataService.get()


# @app.get("/health")
# def health():
#     svc = DataService.get()
#     return {
#         "status": "ok",
#         "records": len(svc.raw),
#         "version": settings.app_version,
#     }


# -------------------new


"""
SAP Analytics Layer - Cloud Backend
Finance & Treasury: Dashboard

Endpoints:
  POST /auth/token              - Validates SAP environment (HMAC + whitelist), returns signed JWT
  POST /session/create          - Stores raw SAP data server-side, returns session_id (JWT required)
  POST /data/query              - Runs calculations on session data, returns chart-ready JSON (JWT required)
  POST /api/query/cof_dashboard - Direct COF dashboard query (JWT required)
  GET  /health                  - Health check
"""

import os
import hmac
import hashlib
import time
import uuid
from typing import Any, Optional
import json

import jwt  # PyJWT
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, root_validator
from datetime import datetime

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY",    "CHANGE_ME_IN_PRODUCTION")
SHARED_SECRET = os.getenv("SHARED_SECRET", "CHANGE_ME_IN_PRODUCTION")

# localhost
# SECRET_KEY = "921a5f127bcce6a6e71a0f0027ae6fbc3614061bf18f9b37ec844ea168542ae6"
# SHARED_SECRET = "658ebbd2998e6e43dee75b64d23dc3f075a8a1bdfc08fa5fb85eba457e8782b6"

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_SECONDS = 900000 # 15 minutes

WHITELISTED_ENVIRONMENTS: dict[str, list[str]] = {
    "DEV": ["100", "200"],
    "QAS": ["100"],
    "PRD": ["100"],
}

# ---------------------------------------------------------------------------
# In-memory session store
# Keyed by session_id (UUID). Each entry expires with the JWT (15 min).
# In production: replace with Redis via azure-cache-for-redis or similar.
# ---------------------------------------------------------------------------
_SESSION_STORE: dict[str, dict] = {}
_TOKEN_SESSION_MAP: dict[str, str] = {}  # Maps JWT jti to session_id for efficient cleanup on token expiry

def _purge_expired_sessions():
    """Remove sessions older than JWT_EXPIRY_SECONDS. Called on every write."""
    now = int(time.time())
    expired = [k for k, v in _SESSION_STORE.items() if v.get(
        "expires_at", 0) < now]
    for k in expired:
        del _SESSION_STORE[k]


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SAP Analytics Layer",
    version="2.0.0",
    docs_url=None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class AuthRequest(BaseModel):
    sap_sid:    str
    sap_client: str
    sap_user:   str
    timestamp:  int
    hmac_sig:   str


class SessionCreateRequest(BaseModel):
    raw_data:  Optional[list] = None
    rows:      Optional[list] = None
    data:      Optional[list] = None
    dashboard: str = "cof_dashboard"
    filters:   dict = {}

    @root_validator(pre=True)
    def normalize_raw_data(cls, values):
        if not values.get("raw_data"):
            for key in ("rows", "data"):
                if values.get(key):
                    values["raw_data"] = values[key]
                    break
        return values


class DataQueryRequest(BaseModel):
    query_type: str
    # used by COF and any session-backed dashboard
    session_id: Optional[str] = None
    filters:    dict = {}
    # fallback: direct payload (local dev / testing)
    raw_data:   Optional[list] = None
    rows:       Optional[list] = None
    data:       Optional[list] = None

    @root_validator(pre=True)
    def normalize_raw_data(cls, values):
        if not values.get("raw_data"):
            for key in ("rows", "data"):
                if values.get(key):
                    values["raw_data"] = values[key]
                    break
        return values


class CofDashboardRequest(BaseModel):
    filters:  dict = {}
    rows:     Optional[list] = None
    raw_data: Optional[list] = None
    data:     Optional[list] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def verify_hmac(sap_sid: str, sap_client: str, timestamp: int, sig: str) -> bool:
    msg = f"{sap_sid}{sap_client}{timestamp}".encode()
    expected = hmac.new(SHARED_SECRET.encode(), msg,
                        hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig.lower())


def decode_jwt(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, detail="Token expired — relaunch from SAP")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

def _extract_cof_rows(payload: Any) -> list:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("rows", "raw_data", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    return []


def _extract_cof_filters(payload: Any) -> dict:
    if isinstance(payload, dict) and isinstance(payload.get("filters"), dict):
        return payload["filters"]
    return {}


def _to_float(value: Any) -> float:
    try:
        if value is None or value == "":
            return 0.0
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0

def format_date_yyyy_mm_dd(value):
    if not value:
        return ""

    value = str(value)

    for fmt in ("%Y%m%d", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return value 

def _safe_date(value: Any) -> str:
    if value is None:
        return ""
    raw = str(value).strip()
    if len(raw) >= 8 and raw[:8].isdigit():
        return raw[:8]
    if len(raw) == 10 and raw[2] == "." and raw[5] == ".":
        return f"{raw[6:10]}{raw[3:5]}{raw[0:2]}"
    return ""


def _fmt_date(value: Any) -> str:
    raw = _safe_date(value)
    if len(raw) < 8:
        return raw or "—"
    return f"{raw[6:8]}/{raw[4:6]}/{raw[0:4]}"


def _require_cof_rows(rows: Optional[list]) -> list:
    if not rows:
        raise HTTPException(
            status_code=400,
            detail="COF dashboard requires raw rows. Pass them via session_id or raw_data.",
        )
    return rows

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok", "ts": int(time.time()), "version": "2.0.0", "message": "Health Endpoint works!"}


@app.post("/auth/token")
def get_token(req: AuthRequest):
    now = int(time.time())

    if abs(now - req.timestamp) > 300:
        raise HTTPException(
            status_code=401, detail="Request timestamp too old — replay blocked")

    if not verify_hmac(req.sap_sid, req.sap_client, req.timestamp, req.hmac_sig):
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")

    allowed = WHITELISTED_ENVIRONMENTS.get(req.sap_sid.upper(), [])
    if req.sap_client not in allowed:
        raise HTTPException(
            status_code=403,
            detail=f"SAP environment {req.sap_sid}/{req.sap_client} is not licensed",
        )

    payload = {
        "sap_sid":    req.sap_sid.upper(),
        "sap_client": req.sap_client,
        "sap_user":   req.sap_user,
        "scope":      "dashboard",
        "iat":        now,
        "exp":        now + JWT_EXPIRY_SECONDS,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type":   "Bearer",
        "expires_in":   JWT_EXPIRY_SECONDS,
        "env":          f"{req.sap_sid.upper()}/{req.sap_client}",
    }

# REACT_APP_URL = "http://localhost:5173/"
REACT_APP_URL = "https://green-hill-0732a7b00.2.azurestaticapps.net"


@app.post("/session/create")
def session_create(
    req: SessionCreateRequest,
    authorization: Optional[str] = Header(None),
):
    claims = decode_jwt(authorization)
    _purge_expired_sessions()

    token = authorization.split(" ")[1]

    existing_session_id = _TOKEN_SESSION_MAP.get(token)

    if existing_session_id:
        session = _SESSION_STORE.get(existing_session_id)

        if session and session["expires_at"] > int(time.time()):
            session["raw_data"] = req.raw_data
            session["dashboard"] = req.dashboard
            session["filters"] = req.filters

            frontend_url = (
                f"{REACT_APP_URL}"
                f"?token={token}"
                f"&sid={claims['sap_sid']}"
                f"&client={claims['sap_client']}"
                f"&dashboard={req.dashboard}"
                f"&session_id={existing_session_id}"
            )

            return {
                "session_id": existing_session_id,
                "frontend_url": frontend_url,
                "row_count": len(req.raw_data),
                "expires_in": session["expires_at"] - int(time.time()),
                "reused": True   # optional flag
            }

    session_id = str(uuid.uuid4())

    _SESSION_STORE[session_id] = {
        "raw_data":   req.raw_data,
        "dashboard":  req.dashboard,
        "filters":    req.filters,
        "sap_sid":    claims["sap_sid"],
        "sap_user":   claims["sap_user"],
        "created_at": int(time.time()),
        "expires_at": claims["exp"],
    }

    _TOKEN_SESSION_MAP[token] = session_id

    frontend_url = (
        f"{REACT_APP_URL}"
        f"?token={token}"
        f"&sid={claims['sap_sid']}"
        f"&client={claims['sap_client']}"
        f"&dashboard={req.dashboard}"
        f"&session_id={session_id}"
    )

    return {
        "session_id": session_id,
        "frontend_url": frontend_url,
        "row_count": len(req.raw_data),
        "expires_in": claims["exp"] - int(time.time()),
        "reused": False
    }

@app.post("/data/query")
def data_query(
    req: DataQueryRequest,
    authorization: Optional[str] = Header(None),
):
    claims = decode_jwt(authorization)

    resolved_raw_data = None

    if req.session_id:
        session = _SESSION_STORE.get(req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session expired")
        resolved_raw_data = session.get("raw_data")

    elif req.raw_data:
        resolved_raw_data = _extract_cof_rows(req.raw_data)

    if not resolved_raw_data:
        raise HTTPException(
            status_code=400,
            detail="No data provided",
        )

    # Calculate
    result = calculate_cof_dashboard(req.filters or {}, resolved_raw_data)

    token = authorization.split(" ", 1)[1] if authorization and authorization.startswith("Bearer ") else ""

    frontend_url = (
        f"{REACT_APP_URL}"
        f"?token={token}"
        f"&sid={claims.get('sap_sid', '')}"
        f"&client={claims.get('sap_client', '')}"
        f"&dashboard=cof_dashboard"

    )

    result["frontend_url"] = frontend_url
    result["session_id"] = None

    return result

# ---------------------------------------------------------------------------
# Calculation Engine
# ---------------------------------------------------------------------------
def calculate_borrowings_summary(filters: dict, raw_data=None):
    year = filters.get("year", 2024)
    monthly = [
        {"month": "Jan", "drawn": 142.5, "undrawn": 57.5, "interest": 1.18},
        {"month": "Feb", "drawn": 138.2, "undrawn": 61.8, "interest": 1.14},
        {"month": "Mar", "drawn": 155.0, "undrawn": 45.0, "interest": 1.28},
        {"month": "Apr", "drawn": 161.3, "undrawn": 38.7, "interest": 1.33},
        {"month": "May", "drawn": 158.7, "undrawn": 41.3, "interest": 1.31},
        {"month": "Jun", "drawn": 172.1, "undrawn": 27.9, "interest": 1.42},
        {"month": "Jul", "drawn": 168.4, "undrawn": 31.6, "interest": 1.39},
        {"month": "Aug", "drawn": 163.9, "undrawn": 36.1, "interest": 1.35},
        {"month": "Sep", "drawn": 175.2, "undrawn": 24.8, "interest": 1.45},
        {"month": "Oct", "drawn": 181.6, "undrawn": 18.4, "interest": 1.50},
        {"month": "Nov", "drawn": 178.3, "undrawn": 21.7, "interest": 1.47},
        {"month": "Dec", "drawn": 185.0, "undrawn": 15.0, "interest": 1.53},
    ]
    avg_drawn = round(sum(m["drawn"] for m in monthly) / 12, 1)
    ytd_interest = round(sum(m["interest"] for m in monthly), 2)
    total_drawn_sum = sum(m["drawn"] for m in monthly)
    total_capacity = sum(m["drawn"]+m["undrawn"] for m in monthly)
    utilisation = round(total_drawn_sum / total_capacity * 100, 1)
    return {
        "query_type": "borrowings_summary",
        "year": year,
        "kpis": {
            "total_drawn_mln":       avg_drawn,
            "total_facility_mln":    200.0,
            "utilisation_pct":       utilisation,
            "ytd_interest_mln":      ytd_interest,
            "weighted_avg_rate_pct": 3.85,
            "facilities_count":      6,
        },
        "chart_data": {
            "labels":   [m["month"] for m in monthly],
            "drawn":    [m["drawn"] for m in monthly],
            "undrawn":  [m["undrawn"] for m in monthly],
            "interest": [m["interest"] for m in monthly],
        },
    }


def calculate_maturity_profile(filters: dict, raw_data=None):
    return {
        "query_type": "maturity_profile",
        "chart_data": {
            "labels":  ["< 3M", "3–6M", "6–12M", "1–2Y", "2–3Y", "> 3Y"],
            "amounts": [25.0, 40.5, 32.0, 55.0, 28.5, 19.0],
            "unit":    "USD millions",
        },
    }


def calculate_interest_rate_mix(filters: dict, raw_data=None):
    return {
        "query_type": "interest_rate_mix",
        "chart_data": {
            "labels":  ["Fixed Rate", "Floating (SOFR+)", "Floating (EURIBOR+)", "Mixed"],
            "amounts": [72.0, 55.5, 38.0, 34.5],
        },
    }


def calculate_currency_exposure(filters: dict, raw_data=None):
    return {
        "query_type": "currency_exposure",
        "chart_data": {
            "labels":  ["USD", "EUR", "GBP", "SGD", "Other"],
            "amounts": [95.0, 52.5, 28.0, 18.5, 6.0],
        },
    }


def _norm_date(value: Any) -> str:
    """Convert DD.MM.YYYY or YYYYMMDD → YYYYMMDD string."""
    if not value:
        return ""
    raw = str(value).strip()
    if len(raw) >= 8 and raw[:8].isdigit():
        return raw[:8]
    if len(raw) == 10 and raw[2] == "." and raw[5] == ".":
        return f"{raw[6:10]}{raw[3:5]}{raw[0:2]}"
    if len(raw) == 10 and raw[4] == "-" and raw[7] == "-":
        return raw.replace("-", "")
    return ""


def calculate_cof_dashboard(filters: dict, raw_data=None):
    """
    COF calculation — aggregates raw rows into the new structured format
    """
    rows = _extract_cof_rows(raw_data)
    rows = _require_cof_rows(rows)
    today = datetime.today()
    total_remaining_days = 0
    remaining_count = 0
    # Initialize aggregations
    total_sanction = 0.0
    total_os_amt = 0.0
    total_prin_rec = 0.0
    total_exposure = 0.0
    total_int_rec = 0.0
    total_upcoming_int = 0.0
    total_interest_rate = 0.0
    min_interest_rate = float("inf")
    max_interest_rate = float("-inf")
    min_sanc_amt = float("inf")
    max_sanc_amt = float("-inf")
    total_int_due = 0.0
    tl_os_amt = 0.0
    deb_os_amt = 0.0
    total_sanction_2026 = 0.0
    customer_set = set()
    disb_set = set()
    fy_2026_disb_set = set()
    bp_summary_map = {}
    product_counts = {}
    proposal_set = set()
    tenor_buckets = {"0-5 Years": set(),"5-10 Years": set(),"10-15 Years": set(),"15-20 Years": set(),"20-25 Years": set(),"25-30 Years": set(),">30 Years": set()}    
    rate_buckets = {"<7 %": 0, "7-9 %": 0, "9-12 %": 0, ">12 %": 0}
    rate_buckets_disb = {"<7%": set(), "7-8%": set(), "8-8.5%": set(), "8.5-9%": set(), "9-9.5%": set(), "9.5-10%": set(),">10%": set()}
    sanction_buckets_disb = {
        "<5 Cr": set(),
        "5-10 Cr": set(),
        "10-15 Cr": set(),
        "15-20 Cr": set(),
        "20-25 Cr": set(),
        "25+ Cr": set()
    }
    disbursements_activity = {}
    disbursements_by_year = {}
    disbursments_by_quarter = {}
    transaction_table = []
    exposure_table = []
    customer_table = []

    for row in rows:
        if not isinstance(row, dict):
            continue

        # Basic amounts
        sanction_amt = _to_float(row.get("Sanc Amt"))
        os_amt = _to_float(row.get("O/S Amt"))
        prin_rec = _to_float(row.get("Principal Received"))
        exp_amt = _to_float(row.get("Exp Amt"))
        int_rec = _to_float(row.get("Interest Received"))
        interest_rate = _to_float(row.get("Int Rate"))
        loan_amt = _to_float(row.get("Loan Amt"))
        upcoming_int = _to_float(row.get("Upcoming Int"))
        interest_due = _to_float(row.get("Interest Due"))
        end_date_str = format_date_yyyy_mm_dd(row.get("End Date"))
        tenor_yrs = 0
        # Totals
        total_sanction += sanction_amt
        total_os_amt += os_amt
        total_prin_rec += prin_rec
        total_exposure += exp_amt
        total_int_rec += int_rec
        total_upcoming_int += upcoming_int
        total_int_due += interest_due
        if interest_rate > 0:  
            min_interest_rate = min(min_interest_rate, interest_rate)
            max_interest_rate = max(max_interest_rate, interest_rate)
        if sanction_amt > 0:  
            min_sanc_amt = min(min_sanc_amt, sanction_amt)
            max_sanc_amt = max(max_sanc_amt, sanction_amt)    
        total_interest_rate += interest_rate
        # Customer and disbursement tracking
        customer = str(row.get("Customer Name") or "")
        customer_set.add(customer)
        disb_no = str(row.get("Dis No") or "")
        proposal_no = str(row.get("Proposal No") or "")
        
        # Disb No Count
        if disb_no:
            disb_set.add(disb_no)

        # Proposal No count
        if proposal_no:
            proposal_set.add(proposal_no)

        # BP Group summary
        bp_group = str(row.get("BP Grp Name") or "Others")
        if bp_group not in bp_summary_map:
            bp_summary_map[bp_group] = {
                "loan_count": 0,
                "sanction_amt": 0.0,
                "loan_amt": 0.0,
                "outstanding_amt": 0.0,
                "exposure_amt": 0.0,
                "principle_recv": 0.0,
                "int_recv": 0.0,
                "upcoming_int": 0.0
            }

        bp_summary_map[bp_group]["loan_count"] += 1
        bp_summary_map[bp_group]["sanction_amt"] += sanction_amt
        bp_summary_map[bp_group]["loan_amt"] += _to_float(row.get("Loan Amt"))
        bp_summary_map[bp_group]["outstanding_amt"] += os_amt
        bp_summary_map[bp_group]["exposure_amt"] += exp_amt
        bp_summary_map[bp_group]["principle_recv"] += prin_rec
        bp_summary_map[bp_group]["int_recv"] += int_rec
        bp_summary_map[bp_group]["upcoming_int"] += _to_float(row.get("Upcoming Int"))

        # Product counts
        prd_desc = str(row.get("Prd Type Desc") or "")
        if prd_desc:
            product_counts[prd_desc] = product_counts.get(prd_desc, 0) + 1
        prd_desc_upper = prd_desc.upper()

        if "TL" in prd_desc_upper:
            tl_os_amt += os_amt
        elif "DEB" in prd_desc_upper:
            deb_os_amt += os_amt
        # Rate distribution
        if interest_rate < 7:
            rate_buckets["<7 %"] += 1
        elif interest_rate <= 9:
            rate_buckets["7-9 %"] += 1
        elif interest_rate <= 12:
            rate_buckets["9-12 %"] += 1
        else:
            rate_buckets[">12 %"] += 1

        # Rate buckets for disbursements
        if disb_no:
            if interest_rate < 7:
                rate_buckets_disb["<7%"].add(disb_no)
            elif interest_rate < 8:
                rate_buckets_disb["7-8%"].add(disb_no)
            elif interest_rate < 8.5:
                rate_buckets_disb["8-8.5%"].add(disb_no)
            elif interest_rate < 9:
                rate_buckets_disb["8.5-9%"].add(disb_no)
            elif interest_rate < 9.5:
                rate_buckets_disb["9-9.5%"].add(disb_no)
            elif interest_rate < 10:
                rate_buckets_disb["9.5-10%"].add(disb_no)
            else:
                rate_buckets_disb[">10%"].add(disb_no)

        rate_buckets_disb_counts = {
            k: len(v) for k, v in rate_buckets_disb.items()
        }
        start_date = format_date_yyyy_mm_dd(row.get("Start Date"))

        if start_date:
            try:
                date_obj = datetime.strptime(start_date, "%Y-%m-%d")

                if date_obj.year == 2026:
                    total_sanction_2026 += sanction_amt   
                    if disb_no:
                        fy_2026_disb_set.add(disb_no)
                month_key = date_obj.strftime("%Y-%m-%d")
                year_key = date_obj.strftime("%Y")
                quarter = f"{date_obj.year}Q{(date_obj.month - 1)//3 + 1}"

                if month_key not in disbursements_activity:
                    disbursements_activity[month_key] = {
                        "loan_count": 0,
                        "sanction_amount": 0.0,
                        "outstanding": 0.0,
                        "Quater": f"{date_obj.year} Q{(date_obj.month-1)//3 + 1}",
                        "Year": str(date_obj.year)
                    } 
                disbursements_activity[month_key]["loan_count"] += 1
                disbursements_activity[month_key]["sanction_amount"] += sanction_amt
                disbursements_activity[month_key]["outstanding"] += os_amt

                if year_key not in disbursements_by_year:
                    disbursements_by_year[year_key] = {
                        "loan_count": 0,
                        "sanction_amount": 0.0 
                    }
                disbursements_by_year[year_key]["loan_count"] += 1
                disbursements_by_year[year_key]["sanction_amount"] += sanction_amt   
                if quarter not in disbursments_by_quarter:
                    disbursments_by_quarter[quarter] = {
                        "loan_count": 0,
                        "sanction_amount": 0.0
                    }

                disbursments_by_quarter[quarter]["loan_count"] += 1
                disbursments_by_quarter[quarter]["sanction_amount"] += sanction_amt
            except Exception as e:
                print("Date parsing failed:", start_date, e)
        if start_date and end_date_str:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
                end_date_obj = datetime.strptime(end_date_str, "%Y-%m-%d")

                diff_days = (end_date_obj - start_date_obj).days
                tenor_yrs = diff_days / 365

                if tenor_yrs < 0:
                    tenor_yrs = 0
    
            except Exception as e:
                print("Tenor calculation failed:", e)

        if end_date_str:
            try:
                end_date_obj = datetime.strptime(end_date_str, "%Y-%m-%d")

                remaining_days = abs((end_date_obj - today).days)

                total_remaining_days += remaining_days
                remaining_count += 1
            except Exception as e:
                print("Remaining tenor calc failed:", e)

       # Tenor distribution counts for disbursements
        if disb_no:
            if tenor_yrs <= 5:
                tenor_buckets["0-5 Years"].add(disb_no)
            elif tenor_yrs <= 10:
                tenor_buckets["5-10 Years"].add(disb_no)
            elif tenor_yrs <= 15:
                tenor_buckets["10-15 Years"].add(disb_no)
            elif tenor_yrs <= 20:
                tenor_buckets["15-20 Years"].add(disb_no)
            elif tenor_yrs <= 25:
                tenor_buckets["20-25 Years"].add(disb_no)
            elif tenor_yrs <= 30:
                tenor_buckets["25-30 Years"].add(disb_no)
            else:
                tenor_buckets[">30 Years"].add(disb_no)
        tenor_buckets_disb_counts = {
            k: len(v) for k, v in tenor_buckets.items()
        }
        # Sanction amount buckets for disbursements
        if disb_no:
            amt_cr = sanction_amt / 1e7   # convert to Cr

            if amt_cr < 5:
                sanction_buckets_disb["<5 Cr"].add(disb_no)
            elif amt_cr < 10:
                sanction_buckets_disb["5-10 Cr"].add(disb_no)
            elif amt_cr < 15:
                sanction_buckets_disb["10-15 Cr"].add(disb_no)
            elif amt_cr < 20:
                sanction_buckets_disb["15-20 Cr"].add(disb_no)
            elif amt_cr < 25:
                sanction_buckets_disb["20-25 Cr"].add(disb_no)
            else:
                sanction_buckets_disb["25+ Cr"].add(disb_no)
        sanction_buckets_disb_counts = {
            k: len(v) for k, v in sanction_buckets_disb.items()
        }
        # Transaction table
        transaction_table.append({
            "proposal_id": str(row.get("Sanction No") or ""),
            "customer": customer,
            "group": bp_group,
            "product": prd_desc,
            "start_date": str(row.get("Start Date") or ""),
            "end_date": str(row.get("End Date") or ""),
            "tenor": _to_float(row.get("Tenor Yrs")),
            "sanction_amt": sanction_amt,
            "loan_amt": loan_amt,
            "outstanding_amt": os_amt,
            "exposure_amt": exp_amt,
            "rate": interest_rate,
            "princ_recv": prin_rec,
            "int_recv": int_rec,
            "upcoming_int": _to_float(row.get("Upcoming Int")),
            "asset_class": str(row.get("Asset Classification") or "Standard")
        })
        # Customer table
        customer_table.append({
            "customer": customer,
            "group": bp_group,
            "loan": "",
            "sanction_amt": sanction_amt,
            "outstanding":  os_amt,
            "exposure": exp_amt,
            "princ_recv": prin_rec,
            "int_recv": int_rec,
            "avg_rate": interest_rate
        })
    
    avg_remaining_years = (
    (total_remaining_days / remaining_count) / 365
    if remaining_count else 0
    )
    # Average Interest Rate
    avg_interest_rate = (total_interest_rate / len(rows)) if rows else 0
    # Build exposure table
    for bp_group, data in bp_summary_map.items():
        exposure_table.append({
            "bp_group": bp_group,
            "loan_count": data["loan_count"],
            "sanction_amt": round(data["sanction_amt"], 2),
            "loan_amt": round(data["loan_amt"], 2),
            "outstanding_amt": round(data["outstanding_amt"], 2),
            "exposure_amt": round(data["exposure_amt"], 2),
            "principle_recv": round(data["principle_recv"], 2),
            "int_recv": round(data["int_recv"], 2),
            "upcoming_int": round(data["upcoming_int"], 2)
        })

    # Sort exposure table by outstanding amount
    exposure_table.sort(key=lambda x: x["outstanding_amt"], reverse=True)

    # Build group outstanding & sanction chart
    group_outstanding_sanction = []
    for bp_group, data in bp_summary_map.items():
        group_outstanding_sanction.append({
            "bp_group": bp_group,
            "outstanding": round(data["outstanding_amt"], 2),
            "sanction": round(data["sanction_amt"], 2)
        })
    group_outstanding_sanction.sort(key=lambda x: x["outstanding"], reverse=True)
    # Upcoming Interest by BP Group
    upcoming_interest_by_group = dict(
        sorted(
            ((bp_group, round(data["upcoming_int"], 2)) for bp_group, data in bp_summary_map.items()),
            key=lambda x: x[1],
            reverse=True
        )
    )
    # Sanction Amt & Principal Received by BP Group
    combined_bp_data = [
        {
            "bp_group": bp_group,
            "sanction": round(data["sanction_amt"], 2),
            "principal": round(data["principle_recv"], 2)
        }
        for bp_group, data in bp_summary_map.items()
    ]
    combined_bp_data.sort(key=lambda x: x["sanction"], reverse=True)
    # Product type counts
    product_type_counts = {}
    for prd, count in product_counts.items():
        if "TL" in prd.upper():
            product_type_counts["TL - Disbursements"] = product_type_counts.get("TL - Disbursements", 0) + count
        elif "DEB" in prd.upper():
            product_type_counts["DEB - Disbursements"] = product_type_counts.get("DEB - Disbursements", 0) + count

    # Calculate TL and DEB counts
    tl_count = sum(1 for row in rows if "TL" in str(row.get("Prd Type Desc", "")).upper())
    deb_count = sum(1 for row in rows if "DEB" in str(row.get("Prd Type Desc", "")).upper())

    disb_ratio_2026 = (
    (len(fy_2026_disb_set) / len(disb_set)) * 100
    if disb_set else 0
    )

    # Build the new response format
    response = {
        "overview": {
            "kpi": {
                "Total_Sanction": {
                    "Title": f"₹{round(total_sanction / 10000000):,} Cr",
                    "Subtitle": f"{str(len(rows))} loan records · {len(proposal_set)} proposals",
                    "Footer": f"{str(len(bp_summary_map))} Borrower Groups · {len(customer_set)} Customers"
                },
                "Outstanding_Amount": {
                    "Title": f"₹{round(total_os_amt / 10000000):,} Cr",
                    "Subtitle": f"Disbursed: ₹{total_exposure / 10000000:,.0f} Cr  total",
                    "Footer": f"Principal Received: ₹{total_prin_rec / 10000000:,.0f} Cr"
                },
                "Total_Exposure": {
                    "Title": f"₹{round(total_exposure / 10000000):,} Cr",
                    "Subtitle": f"Interest Due: ₹{total_int_due/10000000:,.0f} Cr accrued",
                    "Footer": f"Upcoming Interest: ₹{total_upcoming_int/10000000:,.0f} Cr"
                },
               "Avg_IntRate": {
                    "Title": f"{avg_interest_rate:.2f} %",
                    "Subtitle": f"Range: {min_interest_rate:.2f}% - {max_interest_rate:.2f}% pa",
                    "Footer": f"Avg Tenor: {avg_remaining_years:.2f} years"
                }
            },
            "charts": {
                "Group by Outstanding & Sanction": {
                    "values": group_outstanding_sanction
                },
                "Product Type": {
                    "values": product_type_counts
                },
                "Tenor Distribution": {
                    "values": tenor_buckets_disb_counts
                },
                "Rate Distribution": {
                    "values": rate_buckets_disb_counts
                },
                "Collections Overview": {
                    "values": {
                        "Principal Recieved": round(total_prin_rec, 2),
                        "Interest Recieved": round(total_int_rec, 2),
                        "Outstanding Remaining": round(total_os_amt, 2)
                    }
                },
                "Disbursements Activity": {
                    "values": disbursements_activity
                }
            }
        },
        "exposure": {
            "kpi": {
                "Total_Records": {
                    "Title": str(len(rows)),
                    "Subtitle": "Total Records",
                    "Footer": "Disbursement Entries"
                },
                "Borrower_Groups": {
                    "Title": str(len(bp_summary_map)),
                    "Subtitle": "Borrower Groups",
                    "Footer": "Active Group Entities"
                },
                "TL_Disbursements": {
                    "Title": str(tl_count),
                    "Subtitle": "TL Disbursements",
                    "Footer": f"Term Loans · ₹{tl_os_amt / 10000000:,.0f} Cr O/S"
                },
                "DEB_Disbursements": {
                    "Title": str(deb_count),
                    "Subtitle": "DEB Disbursements",
                    "Footer": f"Debentures · ₹{deb_os_amt / 10000000:,.0f} Bn O/S"
                }
            },
            "table": exposure_table
        },
        "loan_portfolio": {
            "table": transaction_table
        },
        "interest_rates": {
            "charts":{
                "Interest Rate Distribution": {
                    "values": rate_buckets_disb_counts
                },
                "Tenor Profile": {
                    "values": tenor_buckets_disb_counts
                },
                "Interest Recieved vs Due": {
                    "values": {
                        "Interest Due": total_int_due,
                        "Interest Recieved": total_int_rec,
                        "Principal Recieved": total_prin_rec,
                        "Upcoming Interest": total_upcoming_int
                    }
                },
                "Upcoming Interest": {
                    "values": upcoming_interest_by_group
                }
            }
        },
        "borrowers": {
            "table" : customer_table
        },
        "transactions":{
        "kpi": {
      "Total_Transactions": {
        "title": str(len(disb_set)),
        "subtitle": {
            f"{str(tl_count)} Term Loans · {str(deb_count)} Debentures"
        },
        "footer": f"{len(proposal_set)} Unique Proposals"
      },
      "Average_Sanction": {
        "title": str(round(total_sanction / len(disb_set), 2)) if disb_set else "0",
        "subtitle": f"Max: ₹{round(max_sanc_amt / 1e9, 2)} Bn · Min: ₹{round(min_sanc_amt / 1e6, 2)} Mn",
        "footer": f"Avg tenor: {avg_remaining_years:.2f} yrs"

      },
      "Principal_Recieved": {
        "title": f"{total_prin_rec:,.0f}",
        "subtitle": f"{((total_prin_rec / total_sanction) * 100):.2f}% of total sanctioned" if total_sanction else "0.00% of total sanctioned",
        "footer": f"Interest Received: ₹{total_int_rec / 1e9:.2f} Bn"
      },
      "Current_FY_Disb": {
        "title": str(len(fy_2026_disb_set)),
        "subtitle": f"{total_sanction_2026/1e7:,.0f} Cr sanctioned (2026)",
        "footer": f"{disb_ratio_2026:.2f}% of total portfolio by count"
      }
    },
    "charts": {
        "Disbursments by Year": {
            "values": disbursements_by_year
        },
        "Loan Size Distribution": {
            "values": sanction_buckets_disb_counts
      },
      "Quaterly Sanction Volume": {
        "values": disbursments_by_quarter
      },
        "Groups_Sacntion_princ": {
            "values": combined_bp_data 
        },
        "Product Type":{
            "values": product_type_counts
        },
        "Rate_Band_Split": {
            "values": rate_buckets_disb_counts
        },
    },
            "table": transaction_table
        }
    }    

    return response
