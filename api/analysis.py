import base64
import io

import matplotlib
matplotlib.use("Agg")
from matplotlib.figure import Figure
from fastapi import APIRouter

from database import pool

router = APIRouter()

TOP_N = 10

QUERIES = {
    "expensive_cycles": {
        "title": "Most expensive cycles",
        "unit": "Price per hour (₹)",
        "sql": """
            SELECT c.title AS label, u.username AS detail, c.price_per_hour::float AS value
            FROM cycles c JOIN users u ON u.id = c.owner_id
            ORDER BY c.price_per_hour DESC, c.id
            LIMIT %s""",
    },
    "most_rented_cycles": {
        "title": "Most rented cycles",
        "unit": "Completed rides",
        "sql": """
            SELECT c.title AS label, u.username AS detail, COUNT(b.id)::float AS value
            FROM cycles c
            JOIN users u ON u.id = c.owner_id
            JOIN bookings b ON b.cycle_id = c.id AND b.status = 'completed'
            GROUP BY c.id, c.title, u.username
            ORDER BY value DESC, c.id
            LIMIT %s""",
    },
    "top_rated_cycles": {
        "title": "Highest rated cycles",
        "unit": "Average stars (out of 5)",
        "sql": """
            SELECT c.title AS label, COUNT(r.id) || ' ratings' AS detail,
                   ROUND(AVG(r.stars), 2)::float AS value
            FROM reviews r
            JOIN bookings b ON b.id = r.booking_id
            JOIN cycles c ON c.id = b.cycle_id
            WHERE r.target = 'cycle'
            GROUP BY c.id, c.title
            ORDER BY value DESC, COUNT(r.id) DESC
            LIMIT %s""",
    },
    "top_rated_renters": {
        "title": "Highest rated renters",
        "unit": "Average stars (out of 5)",
        "sql": """
            SELECT u.username AS label, COUNT(r.id) || ' ratings' AS detail,
                   ROUND(AVG(r.stars), 2)::float AS value
            FROM reviews r
            JOIN bookings b ON b.id = r.booking_id
            JOIN users u ON u.id = b.renter_id
            WHERE r.target = 'renter'
            GROUP BY u.id, u.username
            ORDER BY value DESC, COUNT(r.id) DESC
            LIMIT %s""",
    },
    "costliest_fares": {
        "title": "Costliest fares",
        "unit": "Total fare (₹)",
        "sql": """
            SELECT '#' || b.id || ' ' || c.title AS label, u.username AS detail, b.total_fare::float AS value
            FROM bookings b
            JOIN cycles c ON c.id = b.cycle_id
            JOIN users u ON u.id = b.renter_id
            WHERE b.status = 'completed' AND b.total_fare IS NOT NULL
            ORDER BY b.total_fare DESC, b.id
            LIMIT %s""",
    },
    # A booking counts as accepted once a start OTP was issued (start_otp is set only on accept).
    # Bookings still 'requested' are left out because the owner has not decided yet.
    "owner_acceptance": {
        "title": "Owners with highest acceptance rate",
        "unit": "Acceptance rate (%)",
        "sql": """
            SELECT u.username AS label,
                   COUNT(*) FILTER (WHERE b.start_otp IS NOT NULL) || ' of ' || COUNT(*) || ' requests' AS detail,
                   ROUND(100.0 * COUNT(*) FILTER (WHERE b.start_otp IS NOT NULL) / COUNT(*), 1)::float AS value
            FROM bookings b
            JOIN cycles c ON c.id = b.cycle_id
            JOIN users u ON u.id = c.owner_id
            WHERE b.status <> 'requested'
            GROUP BY u.id, u.username
            ORDER BY value DESC, COUNT(*) DESC
            LIMIT %s""",
    },
}


def bar_chart(title: str, unit: str, rows: list[dict]) -> str | None:
    if not rows:
        return None
    labels = [r["label"] if len(r["label"]) <= 24 else r["label"][:23] + "…" for r in rows][::-1]
    values = [r["value"] for r in rows][::-1]

    fig = Figure(figsize=(7, 0.45 * len(rows) + 1.4), dpi=110)
    ax = fig.subplots()
    bars = ax.barh(labels, values, color="#2563eb")
    ax.bar_label(bars, labels=[f"{v:g}" for v in values], padding=3, fontsize=9, color="#111827")
    ax.set_title(title, fontsize=12, color="#111827", loc="left")
    ax.set_xlabel(unit, fontsize=9, color="#374151")
    ax.tick_params(colors="#374151", labelsize=9)
    ax.set_xlim(0, max(values) * 1.15 or 1)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.grid(axis="x", color="#e5e7eb", linewidth=0.8)
    ax.set_axisbelow(True)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    return base64.b64encode(buf.getvalue()).decode()


@router.get("/analysis")
def analysis():
    sections = []
    with pool.connection() as conn:
        for key, q in QUERIES.items():
            rows = conn.execute(q["sql"], (TOP_N,)).fetchall()
            sections.append({
                "key": key,
                "title": q["title"],
                "unit": q["unit"],
                "rows": rows,
                "chart": bar_chart(q["title"], q["unit"], rows),
            })
    return {"top_n": TOP_N, "sections": sections}
