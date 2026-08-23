from datetime import datetime, timedelta, timezone
from app.features.attendance.service import AttendanceStore


def test_percentage_and_late_flag():
    store = AttendanceStore()
    t0 = datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc)
    store.on_created("s1", t0)
    # on-time student present the whole hour
    store.on_join("s1", "u1", "Ann", t0)
    # late student joins 10 min in, leaves 40 min in
    store.on_join("s1", "u2", "Ben", t0 + timedelta(minutes=10))
    store.on_leave("s1", "u2", t0 + timedelta(minutes=40))
    store.on_ended("s1", t0 + timedelta(hours=1))

    report = {r["user_id"]: r for r in store.report("s1")}
    assert report["u1"]["late"] is False
    assert report["u1"]["attendance_pct"] == 100.0
    assert report["u2"]["late"] is True                  # >5 min grace
    assert report["u2"]["attendance_pct"] == 50.0        # 30 of 60 min


def test_csv_has_header_and_rows():
    store = AttendanceStore()
    t0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
    store.on_created("s1", t0); store.on_join("s1", "u1", "Ann", t0)
    store.on_ended("s1", t0 + timedelta(minutes=30))
    csv = store.csv("s1")
    assert "user_id,name,join_time" in csv.splitlines()[0]
    assert "u1" in csv
