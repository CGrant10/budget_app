# -*- coding: utf-8 -*-
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import csv
import os
import random
import winsound
from datetime import datetime, timedelta
from collections import defaultdict

DATA_FILE = os.path.expanduser("~/.budget_data.json")

CATEGORIES = ["Food", "Transport", "Housing", "Entertainment", "Health", "Shopping", "Income", "Other"]

# ── palette ──────────────────────────────────────────────────────────────────
BG        = "#0f0f14"
SURFACE   = "#1a1a24"
CARD      = "#22222f"
ACCENT    = "#7c6af7"
ACCENT2   = "#f7936a"
SUCCESS   = "#4ecb8d"
WARN      = "#f7c96a"
DANGER    = "#f76a6a"
TEXT      = "#e8e6f0"
MUTED     = "#7a7890"
BORDER    = "#2e2e40"

FONT_MONO = ("Courier New", 10)
FONT_H1   = ("Georgia", 22, "bold")
FONT_H2   = ("Georgia", 14, "bold")
FONT_BODY = ("Courier New", 11)
FONT_SM   = ("Courier New", 9)
FONT_TINY = ("Courier New", 8)


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            d = json.load(f)
        d.setdefault("prefs", {"sounds": True})
        return d
    return {"transactions": [], "budgets": {}, "weekly_plan": {}, "prefs": {"sounds": True}}


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


class BudgetApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("₿udget — Personal Finance")
        self.geometry("1000x720")
        self.minsize(900, 640)
        self.configure(bg=BG)
        self.data = load_data()
        self._process_recurring()
        self._build_ui()
        self.refresh()

    # ── recurring transactions ────────────────────────────────────────────────
    def _process_recurring(self):
        current_month = datetime.today().strftime("%Y-%m")
        added = False
        originals = list(self.data["transactions"])
        for t in originals:
            if t.get("recurring") == True and t.get("recur_month", "") != current_month:
                new_t = dict(t)
                new_t["date"] = current_month + "-01"
                new_t["recur_month"] = current_month
                self.data["transactions"].append(new_t)
                t["recur_month"] = current_month
                added = True
        if added:
            save_data(self.data)

    # ── layout ────────────────────────────────────────────────────────────────
    def _build_ui(self):
        # sidebar
        side = tk.Frame(self, bg=SURFACE, width=200)
        side.pack(side="left", fill="y")
        side.pack_propagate(False)

        tk.Label(side, text="₿UDGET", font=("Georgia", 18, "bold"),
                 bg=SURFACE, fg=ACCENT).pack(pady=(28, 4))
        tk.Label(side, text="personal finance", font=FONT_TINY,
                 bg=SURFACE, fg=MUTED).pack(pady=(0, 30))

        self.nav_btns = {}
        self.current_tab = tk.StringVar(value="dashboard")
        tabs = [("📊  Dashboard", "dashboard"),
                ("➕  Add Entry",  "add"),
                ("📋  Ledger",     "ledger"),
                ("📅  Weekly Plan","weekly"),
                ("💰  Budgets",    "budgets"),
                ("📥  Import CSV", "import")]
        for label, key in tabs:
            b = tk.Button(side, text=label, font=FONT_BODY,
                          bg=SURFACE, fg=TEXT, bd=0, anchor="w",
                          padx=20, pady=10, cursor="hand2",
                          activebackground=CARD, activeforeground=ACCENT,
                          command=lambda k=key: self.show_tab(k))
            b.pack(fill="x")
            self.nav_btns[key] = b

        # sounds toggle
        self.sounds_var = tk.BooleanVar(value=self.data.get("prefs", {}).get("sounds", True))
        def _toggle_sounds():
            self.data.setdefault("prefs", {})["sounds"] = self.sounds_var.get()
            save_data(self.data)
        tk.Checkbutton(side, text="🔔 Sounds", variable=self.sounds_var,
                       command=_toggle_sounds, bg=SURFACE, fg=MUTED,
                       selectcolor=SURFACE, activebackground=SURFACE,
                       font=FONT_TINY).pack(side="bottom", pady=(0, 4))

        # version tag at bottom
        tk.Label(side, text="v1.0", font=FONT_TINY,
                 bg=SURFACE, fg=BORDER).pack(side="bottom", pady=12)

        # main area
        self.main = tk.Frame(self, bg=BG)
        self.main.pack(side="left", fill="both", expand=True)

        # build all frames
        self.frames = {}
        for key in ("dashboard", "add", "ledger", "weekly", "budgets", "import"):
            f = tk.Frame(self.main, bg=BG)
            self.frames[key] = f
            f.place(relx=0, rely=0, relwidth=1, relheight=1)

        self._build_dashboard()
        self._build_add()
        self._build_ledger()
        self._build_weekly()
        self._build_budgets()
        self._build_import()
        self.show_tab("dashboard")

    def show_tab(self, key):
        self.current_tab.set(key)
        for k, b in self.nav_btns.items():
            b.configure(bg=CARD if k == key else SURFACE,
                        fg=ACCENT if k == key else TEXT)
        self.frames[key].lift()
        self.refresh_tab(key)

    def refresh_tab(self, key):
        if key == "dashboard": self._refresh_dashboard()
        elif key == "ledger":  self._refresh_ledger()
        elif key == "weekly":  self._refresh_weekly()
        elif key == "budgets": self._refresh_budgets()

    def refresh(self):
        self.refresh_tab(self.current_tab.get())

    # ── helpers ───────────────────────────────────────────────────────────────
    def _totals(self):
        income = sum(t["amount"] for t in self.data["transactions"] if t["type"] == "income")
        expense = sum(t["amount"] for t in self.data["transactions"] if t["type"] == "expense")
        by_cat = defaultdict(float)
        for t in self.data["transactions"]:
            if t["type"] == "expense":
                by_cat[t["category"]] += t["amount"]
        return income, expense, dict(by_cat)

    def _card(self, parent, title, value, color=TEXT, subtitle=""):
        f = tk.Frame(parent, bg=CARD, padx=18, pady=14)
        tk.Label(f, text=title, font=FONT_SM, bg=CARD, fg=MUTED).pack(anchor="w")
        tk.Label(f, text=value, font=("Georgia", 20, "bold"), bg=CARD, fg=color).pack(anchor="w")
        if subtitle:
            tk.Label(f, text=subtitle, font=FONT_TINY, bg=CARD, fg=MUTED).pack(anchor="w")
        return f

    def _separator(self, parent):
        tk.Frame(parent, bg=BORDER, height=1).pack(fill="x", pady=8)

    def _make_scrollable(self, parent):
        canvas = tk.Canvas(parent, bg=BG, highlightthickness=0)
        sb = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)
        inner = tk.Frame(canvas, bg=BG)
        win_id = canvas.create_window((0, 0), window=inner, anchor="nw")
        inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.bind("<Configure>", lambda e: canvas.itemconfig(win_id, width=e.width))
        def _scroll(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        canvas.bind("<Enter>", lambda e: canvas.bind_all("<MouseWheel>", _scroll))
        canvas.bind("<Leave>", lambda e: canvas.unbind_all("<MouseWheel>"))
        return inner

    # ── sound effects ─────────────────────────────────────────────────────────
    def _play_sound(self, sound_type):
        if not self.data.get("prefs", {}).get("sounds", True):
            return
        try:
            if sound_type == "income":
                winsound.Beep(523, 80)
                winsound.Beep(659, 80)
                winsound.Beep(784, 150)
            elif sound_type == "expense":
                winsound.Beep(494, 120)
                winsound.Beep(392, 120)
                winsound.Beep(330, 150)
                winsound.Beep(262, 200)
        except RuntimeError:
            pass

    # ── milestone animations ──────────────────────────────────────────────────
    def _show_confetti_popup(self, title, color):
        pop = tk.Toplevel(self)
        pop.title("")
        pop.resizable(False, False)
        pop.configure(bg=BG)
        pop.geometry("320x180+{}+{}".format(
            self.winfo_x() + self.winfo_width() // 2 - 160,
            self.winfo_y() + self.winfo_height() // 2 - 90,
        ))
        tk.Label(pop, text=title, font=FONT_H2, bg=BG, fg=color).pack(pady=(12, 4))
        canvas = tk.Canvas(pop, width=300, height=120, bg=BG, highlightthickness=0)
        canvas.pack()
        particles = [
            {
                "x": 150 + random.uniform(-20, 20),
                "y": 60 + random.uniform(-10, 10),
                "vx": random.uniform(-4, 4),
                "vy": random.uniform(-6, -1),
                "color": random.choice([SUCCESS, ACCENT, WARN, ACCENT2, "#ff9eb5"]),
                "size": random.randint(4, 8)
            }
            for _ in range(40)
        ]
        self._confetti_frame(pop, canvas, particles, 0)
        pop.after(3000, lambda: pop.destroy() if pop.winfo_exists() else None)

    def _confetti_frame(self, pop, canvas, particles, f):
        if not pop.winfo_exists() or f > 60:
            return
        canvas.delete("all")
        for p in particles:
            p["x"] += p["vx"]
            p["y"] += p["vy"]
            p["vy"] += 0.4
            canvas.create_oval(
                p["x"] - p["size"] // 2, p["y"] - p["size"] // 2,
                p["x"] + p["size"] // 2, p["y"] + p["size"] // 2,
                fill=p["color"], outline=""
            )
        pop.after(40, lambda: self._confetti_frame(pop, canvas, particles, f + 1))

    def _check_milestones(self, prev_balance, new_balance):
        if prev_balance < 0 and new_balance >= 0:
            self.after(500, lambda: self._show_confetti_popup("Balance is positive! 🎉", SUCCESS))

    def _check_week_milestone(self):
        per_week = float(self.data.get("weekly_plan", {}).get("per_week", 0) or 0)
        if per_week == 0:
            return
        today = datetime.today()
        if today.weekday() != 6:
            return
        this_mon = today - timedelta(days=6)
        this_mon_str = this_mon.strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")
        week_spent = sum(
            t["amount"] for t in self.data["transactions"]
            if t["type"] == "expense"
            and this_mon_str <= t.get("date", "") <= today_str
        )
        iso_week = today.strftime("%Y-W%W")
        if week_spent < per_week and self.data.get("prefs", {}).get("last_week_celebrated", "") != iso_week:
            self.data.setdefault("prefs", {})["last_week_celebrated"] = iso_week
            save_data(self.data)
            self.after(500, lambda: self._show_confetti_popup("Week under budget! 🏆", SUCCESS))

    # ── spending roast ────────────────────────────────────────────────────────
    def _check_roast(self, category):
        ROASTS = [
            "Wow, you really went ham on {cat} this month. A true connoisseur of spending.",
            "Your {cat} budget called. It's crying.",
            "At this rate, you'll need a second job just for {cat}.",
            "{cat}? More like {cat}-astrophe for your wallet.",
            "Bold of you to assume your {cat} budget was just a suggestion.",
            "Financial advisors HATE this one trick: overspend on {cat} every month.",
            "Your {cat} expenses are doing great. Your savings, not so much.",
            "If overspending on {cat} was a sport, you'd be an Olympian.",
        ]
        current_month = datetime.today().strftime("%Y-%m")
        total = sum(
            t["amount"] for t in self.data["transactions"]
            if t["type"] == "expense"
            and t["category"] == category
            and t.get("date", "").startswith(current_month)
        )
        limit = float(self.data.get("budgets", {}).get(category, 0) or 0)
        if limit > 0 and total > limit:
            roast = random.choice(ROASTS).format(cat=category)
            pop = tk.Toplevel(self)
            pop.title("")
            pop.resizable(False, False)
            pop.configure(bg=BG)
            pop.geometry("320x110+{}+{}".format(
                self.winfo_x() + self.winfo_width() // 2 - 160,
                self.winfo_y() + self.winfo_height() // 2 - 55,
            ))
            tk.Label(pop, text=roast, font=FONT_SM, bg=BG, fg=DANGER,
                     wraplength=280, justify="center").pack(expand=True, padx=20, pady=20)
            pop.after(4000, lambda: pop.destroy() if pop.winfo_exists() else None)

    # ── dashboard ─────────────────────────────────────────────────────────────
    def _build_dashboard(self):
        f = self.frames["dashboard"]
        tk.Label(f, text="Dashboard", font=FONT_H1, bg=BG, fg=TEXT).pack(anchor="w", padx=28, pady=(28, 4))
        tk.Label(f, text="your financial snapshot", font=FONT_SM, bg=BG, fg=MUTED).pack(anchor="w", padx=28)
        self._separator(f)

        scroll_area = tk.Frame(f, bg=BG)
        scroll_area.pack(fill="both", expand=True)
        sc = self._make_scrollable(scroll_area)

        self.dash_cards = tk.Frame(sc, bg=BG)
        self.dash_cards.pack(fill="x", padx=28, pady=(0, 16))

        self.chart_canvas = tk.Canvas(sc, bg=BG, highlightthickness=0, height=140)
        self.chart_canvas.pack(fill="x", padx=28, pady=(0, 8))

        self.dash_breakdown = tk.Frame(sc, bg=BG)
        self.dash_breakdown.pack(fill="x", padx=28, pady=8)

    def _draw_spending_chart(self):
        self.chart_canvas.delete("all")
        W = self.chart_canvas.winfo_width() or 560
        today = datetime.today()
        this_mon = today - timedelta(days=today.weekday())

        weeks = []
        for i in range(5, -1, -1):
            mon = this_mon - timedelta(weeks=i)
            sun = mon + timedelta(days=6)
            weeks.append((mon, sun))

        week_data = []
        for mon, sun in weeks:
            mon_str = mon.strftime("%Y-%m-%d")
            sun_str = sun.strftime("%Y-%m-%d")
            inc = sum(
                t["amount"] for t in self.data["transactions"]
                if t["type"] == "income" and mon_str <= t.get("date", "") <= sun_str
            )
            exp = sum(
                t["amount"] for t in self.data["transactions"]
                if t["type"] == "expense" and mon_str <= t.get("date", "") <= sun_str
            )
            week_data.append((mon, inc, exp))

        left_margin = 40
        right_margin = 16
        bottom = 120
        top = 20
        all_vals = [v for _, inc, exp in week_data for v in (inc, exp)]
        max_val = max(all_vals) if any(v > 0 for v in all_vals) else 1

        group_w = (W - left_margin - right_margin) / 6
        bar_w = group_w * 0.35

        # y-axis gridlines
        for gi in range(1, 4):
            gy = bottom - (bottom - top) * gi / 3
            self.chart_canvas.create_line(left_margin, gy, W - right_margin, gy,
                                          fill=BORDER, dash=(2, 4))
            label_val = max_val * gi / 3
            self.chart_canvas.create_text(left_margin - 4, gy, text=f"${label_val:,.0f}",
                                          anchor="e", fill=MUTED, font=FONT_TINY)

        # baseline
        self.chart_canvas.create_line(left_margin, bottom, W - right_margin, bottom, fill=BORDER)

        for i, (mon, inc, exp) in enumerate(week_data):
            gx = left_margin + i * group_w + group_w / 2

            # income bar
            if inc > 0:
                ih = (inc / max_val) * (bottom - top)
                self.chart_canvas.create_rectangle(
                    gx - bar_w, bottom - ih, gx, bottom,
                    fill=SUCCESS, outline=""
                )

            # expense bar
            if exp > 0:
                eh = (exp / max_val) * (bottom - top)
                self.chart_canvas.create_rectangle(
                    gx, bottom - eh, gx + bar_w, bottom,
                    fill=ACCENT2, outline=""
                )

            # week label
            self.chart_canvas.create_text(
                gx + bar_w / 2, bottom + 10,
                text=mon.strftime("%b %-d") if os.name != "nt" else mon.strftime("%b %d").lstrip("0") or "0",
                fill=MUTED, font=FONT_TINY, anchor="n"
            )

        # legend
        self.chart_canvas.create_text(W - right_margin - 70, top + 4,
                                      text="■ Income", fill=SUCCESS, font=FONT_TINY, anchor="w")
        self.chart_canvas.create_text(W - right_margin - 70, top + 16,
                                      text="■ Expenses", fill=ACCENT2, font=FONT_TINY, anchor="w")

    def _refresh_dashboard(self):
        income, expense, by_cat = self._totals()
        balance = income - expense

        for w in self.dash_cards.winfo_children(): w.destroy()
        for w in self.dash_breakdown.winfo_children(): w.destroy()

        bal_color = SUCCESS if balance >= 0 else DANGER
        cards_data = [
            ("BALANCE",  f"${balance:,.2f}",  bal_color,   "income − expenses"),
            ("INCOME",   f"${income:,.2f}",   SUCCESS,     "total earned"),
            ("EXPENSES", f"${expense:,.2f}",  ACCENT2,     "total spent"),
            ("ENTRIES",  str(len(self.data["transactions"])), ACCENT, "transactions"),
        ]
        for i, (title, val, col, sub) in enumerate(cards_data):
            c = self._card(self.dash_cards, title, val, col, sub)
            c.grid(row=0, column=i, padx=(0, 12), sticky="ew")
            self.dash_cards.columnconfigure(i, weight=1)

        self.chart_canvas.update_idletasks()
        self._draw_spending_chart()

        # spending breakdown
        if by_cat:
            tk.Label(self.dash_breakdown, text="Spending by Category",
                     font=FONT_H2, bg=BG, fg=TEXT).pack(anchor="w", pady=(8, 4))
            max_val = max(by_cat.values()) or 1
            budgets = self.data.get("budgets", {})
            for cat, amt in sorted(by_cat.items(), key=lambda x: -x[1]):
                row = tk.Frame(self.dash_breakdown, bg=BG)
                row.pack(fill="x", pady=2)
                tk.Label(row, text=cat, font=FONT_SM, bg=BG, fg=MUTED, width=14, anchor="w").pack(side="left")
                bar_w = int((amt / max_val) * 320)

                # determine bar color based on budget
                limit_str = budgets.get(cat, "")
                bar_color = ACCENT
                over_label = ""
                if limit_str:
                    try:
                        limit = float(limit_str)
                        if limit > 0:
                            pct = amt / limit
                            if pct >= 1.0:
                                bar_color = DANGER
                                over_label = "OVER!"
                            elif pct >= 0.8:
                                bar_color = WARN
                                over_label = "80%"
                    except (ValueError, ZeroDivisionError):
                        pass

                bar_bg = tk.Frame(row, bg=BORDER, height=12, width=320)
                bar_bg.pack(side="left", padx=8)
                bar_bg.pack_propagate(False)
                bar_fill = tk.Frame(bar_bg, bg=bar_color, height=12, width=max(4, bar_w))
                bar_fill.pack(side="left")
                tk.Label(row, text=f"${amt:,.2f}", font=FONT_SM, bg=BG, fg=ACCENT2).pack(side="left", padx=6)
                if over_label:
                    tk.Label(row, text=over_label, font=FONT_TINY, bg=BG, fg=bar_color).pack(side="left", padx=2)

    # ── add entry ─────────────────────────────────────────────────────────────
    def _build_add(self):
        f = self.frames["add"]
        tk.Label(f, text="Add Entry", font=FONT_H1, bg=BG, fg=TEXT).pack(anchor="w", padx=28, pady=(28, 4))
        tk.Label(f, text="record income or expense", font=FONT_SM, bg=BG, fg=MUTED).pack(anchor="w", padx=28)
        self._separator(f)

        form = tk.Frame(f, bg=CARD, padx=32, pady=28)
        form.pack(padx=28, anchor="w")

        def row(label, widget_fn):
            r = tk.Frame(form, bg=CARD)
            r.pack(fill="x", pady=6)
            tk.Label(r, text=label, font=FONT_SM, bg=CARD, fg=MUTED, width=12, anchor="w").pack(side="left")
            w = widget_fn(r)
            w.pack(side="left", padx=(8, 0))
            return w

        entry_cfg = dict(bg=SURFACE, fg=TEXT, insertbackground=TEXT,
                         font=FONT_BODY, relief="flat", bd=0,
                         highlightthickness=1, highlightbackground=BORDER,
                         highlightcolor=ACCENT, width=24)

        self.add_type = tk.StringVar(value="expense")
        type_frame = tk.Frame(form, bg=CARD)
        type_frame.pack(fill="x", pady=6)
        tk.Label(type_frame, text="Type", font=FONT_SM, bg=CARD, fg=MUTED, width=12, anchor="w").pack(side="left")
        for val, lbl in [("expense", "Expense"), ("income", "Income")]:
            rb = tk.Radiobutton(type_frame, text=lbl, variable=self.add_type, value=val,
                                bg=CARD, fg=TEXT, selectcolor=CARD,
                                activebackground=CARD, activeforeground=ACCENT,
                                font=FONT_BODY)
            rb.pack(side="left", padx=(8, 12))

        self.add_amount = row("Amount ($)", lambda p: tk.Entry(p, **entry_cfg))
        self.add_desc   = row("Description", lambda p: tk.Entry(p, **entry_cfg))

        cat_row = tk.Frame(form, bg=CARD)
        cat_row.pack(fill="x", pady=6)
        tk.Label(cat_row, text="Category", font=FONT_SM, bg=CARD, fg=MUTED, width=12, anchor="w").pack(side="left")
        self.add_cat = ttk.Combobox(cat_row, values=CATEGORIES, state="readonly",
                                    font=FONT_BODY, width=22)
        self.add_cat.set("Food")
        self.add_cat.pack(side="left", padx=(8, 0))

        self.add_date = row("Date", lambda p: tk.Entry(p, **entry_cfg))
        self.add_date.insert(0, datetime.today().strftime("%Y-%m-%d"))

        # Recurring checkbox
        self.add_recurring = tk.BooleanVar(value=False)
        tk.Checkbutton(form, text="Recurring monthly", variable=self.add_recurring,
                       bg=CARD, fg=MUTED, selectcolor=CARD, activebackground=CARD,
                       font=FONT_SM).pack(anchor="w", pady=(4, 0))

        tk.Frame(form, bg=BORDER, height=1).pack(fill="x", pady=16)

        self.add_status = tk.StringVar()
        tk.Label(form, textvariable=self.add_status, font=FONT_SM, bg=CARD, fg=SUCCESS).pack(anchor="w", pady=(0, 8))

        tk.Button(form, text="  Add Transaction  ", font=FONT_BODY,
                  bg=ACCENT, fg="white", bd=0, padx=14, pady=8,
                  cursor="hand2", activebackground="#6455d4",
                  command=self._add_transaction).pack(anchor="w")

    def _add_transaction(self):
        try:
            amt = float(self.add_amount.get().strip().replace("$", "").replace(",", ""))
        except ValueError:
            messagebox.showerror("Error", "Enter a valid amount.")
            return
        desc = self.add_desc.get().strip() or "—"
        cat  = self.add_cat.get()
        date = self.add_date.get().strip() or datetime.today().strftime("%Y-%m-%d")
        typ  = self.add_type.get()
        recurring = self.add_recurring.get()

        # compute prev balance for milestone check
        income = sum(t["amount"] for t in self.data["transactions"] if t["type"] == "income")
        expense = sum(t["amount"] for t in self.data["transactions"] if t["type"] == "expense")
        prev_balance = income - expense

        t_entry = {
            "type": typ, "amount": amt,
            "description": desc, "category": cat, "date": date,
            "recurring": recurring,
        }
        if recurring:
            t_entry["recur_month"] = datetime.today().strftime("%Y-%m")

        self.data["transactions"].append(t_entry)
        self._play_sound(typ)
        save_data(self.data)

        # compute new balance
        new_income = sum(t["amount"] for t in self.data["transactions"] if t["type"] == "income")
        new_expense = sum(t["amount"] for t in self.data["transactions"] if t["type"] == "expense")
        new_balance = new_income - new_expense

        self._check_milestones(prev_balance, new_balance)
        self._check_week_milestone()

        self.add_status.set(f"✓  Added {typ}: ${amt:,.2f} ({cat})")
        self.add_amount.delete(0, "end")
        self.add_desc.delete(0, "end")
        self.after(3000, lambda: self.add_status.set(""))
        if typ == "expense":
            self._check_roast(cat)
            self._show_robbery(amt)
        else:
            self._show_payday(amt)

    # ── payday animation (income) ─────────────────────────────────────────────
    def _show_payday(self, amount):
        pop = tk.Toplevel(self)
        pop.title("")
        pop.resizable(False, False)
        pop.configure(bg=BG)
        pop.geometry("380x250+{}+{}".format(
            self.winfo_x() + self.winfo_width()  // 2 - 190,
            self.winfo_y() + self.winfo_height() // 2 - 125,
        ))
        tk.Label(pop, text=f"payday!  +${amount:,.2f}",
                 font=FONT_H2, bg=BG, fg=SUCCESS).pack(pady=(12, 0))
        canvas = tk.Canvas(pop, width=380, height=158, bg=BG, highlightthickness=0)
        canvas.pack()
        tk.Button(pop, text="let's go", font=FONT_TINY, bg=CARD, fg=SUCCESS,
                  bd=0, padx=10, pady=4, cursor="hand2",
                  command=pop.destroy).pack(pady=(0, 10))
        self._payday_frame(pop, canvas, 0, amount)

    def _payday_frame(self, pop, canvas, f, amount):
        if not pop.winfo_exists():
            return

        canvas.delete("all")
        W, GY = 380, 140
        kx = 110   # Mr. Krabs (left, paying)
        sx = 265   # SpongeBob (right, receiving)
        px = 330   # Patrick (background)

        canvas.create_line(0, GY, W, GY, fill=BORDER, width=1)

        # Patrick always in background
        self._draw_patrick(canvas, px, GY + 2)

        # ── phase 0-20: both standing, Krabs nervously counting, SpongeBob eager ──
        if f <= 20:
            progress = f / 20
            self._draw_krabs(canvas, kx, GY, action="count")
            self._draw_spongebob(canvas, sx, GY, action="stand")
            if progress > 0.5:
                canvas.create_text(sx, GY - 82, text="is it Friday?",
                                   fill=MUTED, font=("Courier New", 7, "italic"))
            canvas.create_text(px, GY - 60, text="I'm ready!",
                               fill=MUTED, font=("Courier New", 7, "italic"))

        # ── phase 21-42: Krabs agonises, raises coin toward SpongeBob ──
        elif f <= 42:
            progress = (f - 21) / 21
            self._draw_krabs(canvas, kx, GY, action="shocked")
            self._draw_spongebob(canvas, sx, GY, action="grab")
            canvas.create_text(kx, GY - 90,
                               text="me money... 😭" if progress > 0.5 else "fine... FINE...",
                               fill="#d63000", font=("Courier New", 8, "bold"))

        # ── phase 43-58: coin flies right from Krabs to SpongeBob ──
        elif f <= 58:
            progress = (f - 43) / 15
            self._draw_krabs(canvas, kx, GY, action="shocked")
            self._draw_spongebob(canvas, sx, GY, action="grab")
            for i, (dy, size) in enumerate([(0, 11), (-10, 9), (8, 8)]):
                t = min(progress * 1.6 - i * 0.3, 1.0)
                if t > 0:
                    fx = (kx - 35) + (sx - 20 - (kx - 35)) * t
                    fy = GY - 41 + dy - 22 * t
                    canvas.create_oval(fx-size//2, fy-size//2, fx+size//2, fy+size//2,
                                       fill="#f5c842", outline="#c8a820", width=1)
                    canvas.create_text(fx, fy, text="$", fill="#8B6914",
                                       font=("Courier New", 6, "bold"))

        # ── phase 59-76: SpongeBob celebrates, Krabs weeps ──
        elif f <= 76:
            self._draw_krabs(canvas, kx, GY, action="empty")
            self._draw_spongebob(canvas, sx, GY,
                                 action="happy" if f % 8 < 4 else "flee", coin=True)
            canvas.create_text(sx, GY - 82, text="PAYDAY!!!",
                               fill=SUCCESS, font=("Courier New", 9, "bold"))
            canvas.create_text(kx, GY - 90, text="me money...",
                               fill="#d63000", font=("Courier New", 8, "italic"))
            # Krabs tears
            for tx, ty in [(kx-10, GY-68), (kx+10, GY-68)]:
                drop = min((f - 59) * 3, 18)
                canvas.create_oval(tx-2, ty, tx+2, ty+drop, fill="#4ecb8d", outline="")

        # ── phase 77-90: Patrick celebrates too ──
        else:
            self._draw_krabs(canvas, kx, GY, action="empty")
            self._draw_spongebob(canvas, sx, GY, action="happy", coin=True)
            canvas.create_text(sx, GY - 82, text="PAYDAY!!!",
                               fill=SUCCESS, font=("Courier New", 9, "bold"))
            canvas.create_text(px, GY - 60, text="we're rich!",
                               fill="#ff9eb5", font=("Courier New", 7, "bold"))
            for tx, ty in [(kx-10, GY-68), (kx+10, GY-68)]:
                canvas.create_oval(tx-2, ty, tx+2, ty+18, fill="#4ecb8d", outline="")

        if f < 90:
            pop.after(45, lambda: self._payday_frame(pop, canvas, f + 1, amount))
        else:
            pop.after(2000, pop.destroy)

    # ── spongebob robs mr krabs animation ────────────────────────────────────
    def _show_robbery(self, amount):
        pop = tk.Toplevel(self)
        pop.title("")
        pop.resizable(False, False)
        pop.configure(bg=BG)
        pop.geometry("380x250+{}+{}".format(
            self.winfo_x() + self.winfo_width()  // 2 - 190,
            self.winfo_y() + self.winfo_height() // 2 - 125,
        ))
        tk.Label(pop, text=f"SpongeBob stole  ${amount:,.2f}",
                 font=FONT_H2, bg=BG, fg=DANGER).pack(pady=(12, 0))
        canvas = tk.Canvas(pop, width=380, height=158, bg=BG, highlightthickness=0)
        canvas.pack()
        tk.Button(pop, text="me money...", font=FONT_TINY, bg=CARD, fg=MUTED,
                  bd=0, padx=10, pady=4, cursor="hand2",
                  command=pop.destroy).pack(pady=(0, 10))
        self._robbery_frame(pop, canvas, 0, amount)

    def _draw_krabs(self, canvas, cx, gy, action="count"):
        Y   = gy
        RED = "#d63000"
        DRK = "#8b1e00"

        # ── crab legs (3 each side) ──
        for i in range(3):
            spread = 14 + i * 9
            drop   = 4  + i * 3
            canvas.create_line(cx - 18, Y - 22 + i*4, cx - spread, Y - drop,
                                fill=RED, width=2)
            canvas.create_line(cx + 18, Y - 22 + i*4, cx + spread, Y - drop,
                                fill=RED, width=2)

        # ── body (oval) ──
        canvas.create_oval(cx-22, Y-56, cx+22, Y-18, fill=RED, outline=DRK, width=2)

        # ── eye stalks + eyes ──
        for ex, edir in [(-8, -1), (8, 1)]:
            canvas.create_line(cx+ex, Y-54, cx+ex+edir*2, Y-68, fill=RED, width=3)
            canvas.create_oval(cx+ex+edir*2-7, Y-76, cx+ex+edir*2+7, Y-62,
                                fill=RED, outline=DRK, width=1)
            # pupil — wide if shocked
            if action == "shocked":
                canvas.create_oval(cx+ex+edir*2-5, Y-74, cx+ex+edir*2+5, Y-64,
                                    fill="white", outline="")
                canvas.create_oval(cx+ex+edir*2-2, Y-72, cx+ex+edir*2+2, Y-67,
                                    fill="black", outline="")
            else:
                canvas.create_oval(cx+ex+edir*2-3, Y-72, cx+ex+edir*2+3, Y-66,
                                    fill="black", outline="")

        # ── mouth ──
        if action == "shocked":
            canvas.create_oval(cx-5, Y-40, cx+5, Y-30, outline=DRK, width=2,
                                fill="#ff9999")
        else:
            canvas.create_arc(cx-10, Y-44, cx+10, Y-30, start=200,
                               extent=140, style="arc", outline=DRK, width=2)

        # ── claws ──
        if action == "count":
            # left claw with coin
            canvas.create_oval(cx-46, Y-50, cx-24, Y-32, fill=RED, outline=DRK, width=2)
            canvas.create_arc(cx-46, Y-50, cx-24, Y-32, start=20, extent=70,
                               style="arc", outline=DRK, width=2)
            # coin in claw
            canvas.create_oval(cx-40, Y-46, cx-30, Y-36, fill="#f5c842",
                                outline="#c8a820", width=1)
            canvas.create_text(cx-35, Y-41, text="$", fill="#8B6914",
                                font=("Courier New", 7, "bold"))
            # right claw (normal)
            canvas.create_oval(cx+24, Y-50, cx+46, Y-32, fill=RED, outline=DRK, width=2)
            canvas.create_arc(cx+24, Y-50, cx+46, Y-32, start=110, extent=70,
                               style="arc", outline=DRK, width=2)
        elif action == "shocked":
            # both claws raised in horror
            for sx, sa in [(-1, 20), (1, 110)]:
                bx = cx + sx * 35
                canvas.create_oval(bx-11, Y-68, bx+11, Y-46, fill=RED, outline=DRK, width=2)
                canvas.create_arc(bx-11, Y-68, bx+11, Y-46, start=sa, extent=70,
                                   style="arc", outline=DRK, width=2)
        elif action == "empty":
            # claws drooping, no coin
            canvas.create_oval(cx-44, Y-40, cx-22, Y-22, fill=RED, outline=DRK, width=2)
            canvas.create_arc(cx-44, Y-40, cx-22, Y-22, start=20, extent=70,
                               style="arc", outline=DRK, width=2)
            canvas.create_oval(cx+22, Y-40, cx+44, Y-22, fill=RED, outline=DRK, width=2)
            canvas.create_arc(cx+22, Y-40, cx+44, Y-22, start=110, extent=70,
                               style="arc", outline=DRK, width=2)

    def _draw_spongebob(self, canvas, cx, gy, action="stand", coin=False):
        Y    = gy
        YEL  = "#f5c518"
        DYEL = "#c8a010"
        BRN  = "#7a5230"
        WHT  = "#f0f0f0"

        lox = -5 if action == "run1" else (5 if action == "run2" else 0)

        # shoes — tiny stubs
        canvas.create_oval(cx-11+lox, Y-5, cx,      Y, fill="#111", outline="")
        canvas.create_oval(cx,        Y-5, cx+11-lox,Y, fill="#111", outline="")

        # legs — very short
        canvas.create_rectangle(cx-9+lox, Y-13, cx-3+lox,  Y-4, fill=YEL, outline="")
        canvas.create_rectangle(cx+3-lox, Y-13, cx+9-lox,  Y-4, fill=YEL, outline="")

        # square pants — wide and squat
        canvas.create_rectangle(cx-20, Y-24, cx+20, Y-11, fill=BRN, outline=DYEL, width=1)
        canvas.create_rectangle(cx-20, Y-26, cx+20, Y-23, fill="#3a2010", outline="")
        canvas.create_rectangle(cx-3,  Y-28, cx+3,  Y-22, fill=DYEL, outline="")

        # sponge body — nearly square block, wide
        canvas.create_rectangle(cx-20, Y-52, cx+20, Y-21, fill=YEL, outline=DYEL, width=2)
        for hx, hy in [(-11,-44),(8,-36),(-4,-30),(11,-47),(1,-40)]:
            canvas.create_oval(cx+hx-3, Y+hy-3, cx+hx+3, Y+hy+3, fill=DYEL, outline="")

        # shirt collar + red tie
        canvas.create_rectangle(cx-4, Y-55, cx+4, Y-50, fill=WHT, outline="")
        pts = [cx, Y-54, cx-4, Y-44, cx, Y-38, cx+4, Y-44]
        canvas.create_polygon(pts, fill="#cc2200", outline="")

        # head — wide flat rectangle
        canvas.create_rectangle(cx-19, Y-68, cx+19, Y-50, fill=YEL, outline=DYEL, width=2)

        # eyes — big round on wide head
        for ex in [-8, 8]:
            canvas.create_oval(cx+ex-7, Y-67, cx+ex+7, Y-53, fill=WHT, outline="#444", width=1)
            canvas.create_oval(cx+ex-4, Y-65, cx+ex+3, Y-57, fill="#3af", outline="")
            canvas.create_oval(cx+ex-2, Y-63, cx+ex+1, Y-59, fill="#111", outline="")
        for ex, xd in [(-8,-1),(8,1)]:
            for i in range(3):
                lx = cx + ex - 4 + i*4
                canvas.create_line(lx, Y-67, lx+xd, Y-71, fill="#444", width=1)

        # nose
        canvas.create_oval(cx-2, Y-60, cx+2, Y-56, fill=DYEL, outline="")

        # mouth + buck teeth
        arc_b = Y-51 if action == "happy" else Y-53
        canvas.create_arc(cx-10, Y-59, cx+10, arc_b,
                          start=200, extent=140, style="arc", outline="#444", width=2)
        canvas.create_rectangle(cx-7, Y-58, cx-2, Y-54, fill=WHT, outline="#bbb", width=1)
        canvas.create_rectangle(cx+2, Y-58, cx+7, Y-54, fill=WHT, outline="#bbb", width=1)

        # arms
        if action in ("stand", "run1", "run2"):
            canvas.create_line(cx-20, Y-44, cx-32, Y-35, fill=YEL, width=4, capstyle="round")
            canvas.create_line(cx+20, Y-44, cx+32, Y-35, fill=YEL, width=4, capstyle="round")
        elif action == "grab":
            canvas.create_line(cx-20, Y-44, cx-36, Y-42, fill=YEL, width=4, capstyle="round")
            canvas.create_line(cx+20, Y-44, cx+36, Y-42, fill=YEL, width=4, capstyle="round")
        elif action in ("flee", "happy"):
            canvas.create_line(cx-20, Y-44, cx-28, Y-54, fill=YEL, width=4, capstyle="round")
            canvas.create_line(cx+20, Y-44, cx+30, Y-35, fill=YEL, width=4, capstyle="round")

        # coin
        if coin:
            canvas.create_oval(cx-30, Y-62, cx-18, Y-50, fill="#f5c842", outline="#c8a820", width=2)
            canvas.create_text(cx-24, Y-56, text="$", fill="#8B6914",
                               font=("Courier New", 8, "bold"))

    def _draw_patrick(self, canvas, cx, gy):
        import math
        Y    = gy
        PINK = "#ff9eb5"
        DPK  = "#c4607a"

        # star body — proper 5-point star polygon
        cy = Y - 32
        R, r = 24, 11   # outer / inner radius
        pts = []
        for i in range(10):
            angle = math.pi * i / 5 - math.pi / 2
            radius = R if i % 2 == 0 else r
            pts.extend([cx + radius * math.cos(angle),
                        cy + radius * math.sin(angle)])
        canvas.create_polygon(pts, fill=PINK, outline=DPK, width=1)

        # shorts over lower star
        canvas.create_rectangle(cx-13, Y-18, cx+13, Y-7,
                                 fill="#5a3a8a", outline="#3a1a6a", width=1)
        canvas.create_oval(cx-3, Y-16, cx+3, Y-10, fill="#f5c518", outline="")

        # face (centre of star)
        fy = cy - 2
        for ex in [-6, 6]:
            canvas.create_oval(cx+ex-4, fy-4, cx+ex+4, fy+4,
                               fill="white", outline="#444", width=1)
            canvas.create_oval(cx+ex-2, fy-2, cx+ex+2, fy+2,
                               fill="#111", outline="")
        canvas.create_arc(cx-7, fy+3, cx+7, fy+10,
                          start=200, extent=140, style="arc", outline="#444", width=1)

    def _robbery_frame(self, pop, canvas, f, amount):
        if not pop.winfo_exists():
            return

        canvas.delete("all")
        W, GY = 380, 140
        kx  = 100  # Mr. Krabs
        px  = 318  # Patrick (background, right side)

        canvas.create_line(0, GY, W, GY, fill=BORDER, width=1)

        run = "run1" if f % 6 < 3 else "run2"

        # Patrick is always in the background — draw him first so he's behind
        bob_y = int(GY + 2 - 2 * abs((f % 20) - 10) / 10)  # gentle bob
        self._draw_patrick(canvas, px, GY + 2)
        # Patrick label (faint, in background)
        if f >= 10:
            canvas.create_text(px, GY - 92, text="I'm helping!",
                               fill=MUTED, font=("Courier New", 7, "italic"))

        # ── phase 0-24: SpongeBob runs in from right ──
        if f <= 24:
            sx = int(340 - (340 - 200) * f / 24)
            self._draw_krabs(canvas, kx, GY, action="count")
            self._draw_spongebob(canvas, sx, GY, action=run, )

        # ── phase 25-42: SpongeBob demands the money ──
        elif f <= 42:
            progress = (f - 25) / 17
            self._draw_krabs(canvas, kx, GY,
                             action="shocked" if progress > 0.5 else "count")
            self._draw_spongebob(canvas, 200, GY, action="grab", )
            if progress > 0.4:
                canvas.create_text(185, 18, text="GIVE ME THE MONEY!!",
                                   fill=DANGER, font=("Courier New", 9, "bold"))

        # ── phase 43-58: coins fly ──
        elif f <= 58:
            progress = (f - 43) / 15
            self._draw_krabs(canvas, kx, GY, action="shocked")
            self._draw_spongebob(canvas, 200, GY, action="grab", )
            for i, (dy, size) in enumerate([(0, 11), (-14, 9), (10, 8)]):
                t = min(progress * 1.6 - i * 0.3, 1.0)
                if t > 0:
                    fx = kx - 35 + (178 - (kx - 35)) * t
                    fy = GY - 41 + dy - 22 * t
                    canvas.create_oval(fx-size//2, fy-size//2, fx+size//2, fy+size//2,
                                       fill="#f5c842", outline="#c8a820", width=1)
                    canvas.create_text(fx, fy, text="$", fill="#8B6914",
                                       font=("Courier New", 6, "bold"))
            canvas.create_text(kx, GY - 90, text="ME MONEY!!!",
                               fill="#d63000", font=("Courier New", 8, "bold"))

        # ── phase 59-78: SpongeBob flees left ──
        elif f <= 78:
            progress = (f - 59) / 20
            sx = int(200 - 230 * progress)
            self._draw_krabs(canvas, kx, GY, action="empty")
            self._draw_spongebob(canvas, sx, GY,
                                 action="flee" if f % 6 < 3 else "happy",
                                 coin=True, )
            canvas.create_text(max(sx, 10), GY - 82, text="I'M READY!",
                               fill=WARN, font=("Courier New", 8, "bold"))

        # ── phase 79-90: Krabs weeps, Patrick waves ──
        else:
            self._draw_krabs(canvas, kx, GY, action="empty")
            canvas.create_text(kx, GY - 90, text="me money...",
                               fill=MUTED, font=("Courier New", 8, "italic"))
            for tx, ty in [(kx-10, GY-68), (kx+10, GY-68)]:
                drop = min((f - 79) * 3, 18)
                canvas.create_oval(tx-2, ty, tx+2, ty+drop,
                                   fill="#4ecb8d", outline="")
            # Patrick cheers from the background
            canvas.create_text(px, GY - 100, text="We did it!!",
                               fill="#ff9eb5", font=("Courier New", 7, "bold"))

        if f < 90:
            pop.after(45, lambda: self._robbery_frame(pop, canvas, f + 1, amount))
        else:
            pop.after(2000, pop.destroy)

    # ── ledger ────────────────────────────────────────────────────────────────
    def _build_ledger(self):
        f = self.frames["ledger"]
        tk.Label(f, text="Ledger", font=FONT_H1, bg=BG, fg=TEXT).pack(anchor="w", padx=28, pady=(28, 4))
        tk.Label(f, text="all transactions", font=FONT_SM, bg=BG, fg=MUTED).pack(anchor="w", padx=28)
        self._separator(f)

        toolbar = tk.Frame(f, bg=BG)
        toolbar.pack(fill="x", padx=28, pady=(0, 8))

        search_cfg = dict(bg=SURFACE, fg=TEXT, insertbackground=TEXT, font=FONT_SM,
                          relief="flat", bd=0, highlightthickness=1,
                          highlightbackground=BORDER, highlightcolor=ACCENT, width=22)
        self.ledger_search = tk.Entry(toolbar, **search_cfg)
        self.ledger_search.pack(side="left", padx=(0, 12))
        self.ledger_search.bind("<KeyRelease>", lambda e: self._refresh_ledger())

        tk.Button(toolbar, text="🗑  Clear All", font=FONT_SM,
                  bg=CARD, fg=DANGER, bd=0, padx=10, pady=6,
                  cursor="hand2", command=self._clear_all).pack(side="right")
        tk.Button(toolbar, text="✕  Delete Selected", font=FONT_SM,
                  bg=CARD, fg=DANGER, bd=0, padx=10, pady=6,
                  cursor="hand2", command=self._delete_selected).pack(side="right", padx=(0, 8))

        # date editor — sits below toolbar, above tree
        edit_zone = tk.Frame(f, bg=CARD, padx=16, pady=8)
        edit_zone.pack(fill="x", padx=28, pady=(0, 6))
        tk.Label(edit_zone, text="Edit date:", font=FONT_SM, bg=CARD, fg=MUTED).pack(side="left")
        ecfg = dict(bg=SURFACE, fg=TEXT, insertbackground=TEXT,
                    font=FONT_BODY, relief="flat", bd=0,
                    highlightthickness=1, highlightbackground=BORDER,
                    highlightcolor=ACCENT, width=14)
        self.ledger_date_entry = tk.Entry(edit_zone, **ecfg)
        self.ledger_date_entry.pack(side="left", padx=8)
        tk.Label(edit_zone, text="YYYY-MM-DD", font=FONT_TINY, bg=CARD, fg=BORDER).pack(side="left")
        tk.Button(edit_zone, text="Save", font=FONT_SM, bg=ACCENT, fg="white", bd=0,
                  padx=10, pady=4, cursor="hand2",
                  command=self._save_ledger_date).pack(side="left", padx=(10, 0))
        self.ledger_edit_status = tk.StringVar()
        tk.Label(edit_zone, textvariable=self.ledger_edit_status,
                 font=FONT_TINY, bg=CARD, fg=SUCCESS).pack(side="left", padx=8)

        cols = ("Date", "Type", "Category", "Description", "Amount")
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Budget.Treeview",
                        background=CARD, foreground=TEXT,
                        fieldbackground=CARD, rowheight=28,
                        font=FONT_MONO, borderwidth=0)
        style.configure("Budget.Treeview.Heading",
                        background=SURFACE, foreground=MUTED,
                        font=FONT_SM, relief="flat", borderwidth=0)
        style.map("Budget.Treeview", background=[("selected", ACCENT)])

        tree_frame = tk.Frame(f, bg=BG)
        tree_frame.pack(fill="both", expand=True, padx=28, pady=(0, 16))

        self.tree = ttk.Treeview(tree_frame, columns=cols, show="headings",
                                  style="Budget.Treeview")
        widths = [90, 70, 110, 260, 90]
        for col, w in zip(cols, widths):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w, anchor="w" if col != "Amount" else "e")

        sb = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")
        self.tree.bind("<<TreeviewSelect>>", self._on_ledger_select)

    def _refresh_ledger(self):
        query = self.ledger_search.get().strip().lower() if hasattr(self, "ledger_search") else ""
        for row in self.tree.get_children():
            self.tree.delete(row)
        total = len(self.data["transactions"])
        for i, t in enumerate(reversed(self.data["transactions"])):
            idx = total - 1 - i
            if query and not (
                query in t["description"].lower()
                or query in t["category"].lower()
                or query in str(t["amount"])
            ):
                continue
            sign = "+" if t["type"] == "income" else "-"
            color_tag = "income" if t["type"] == "income" else "expense"
            desc = t["description"]
            if t.get("recurring"):
                desc = "↻ " + desc
            self.tree.insert("", "end", iid=str(idx),
                             values=(t.get("date",""), t["type"].upper(),
                                     t["category"], desc,
                                     f"{sign}${t['amount']:,.2f}"),
                             tags=(color_tag,))
        self.tree.tag_configure("income",  foreground=SUCCESS)
        self.tree.tag_configure("expense", foreground=ACCENT2)

    def _delete_selected(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Delete", "Select a transaction first.")
            return
        idx = int(sel[0])
        t = self.data["transactions"][idx]
        if messagebox.askyesno("Delete", f"Delete: {t['description']} (${t['amount']:,.2f})?"):
            del self.data["transactions"][idx]
            save_data(self.data)
            self._refresh_ledger()
            self._refresh_dashboard()

    def _on_ledger_select(self, event):
        sel = self.tree.selection()
        if not sel:
            return
        idx = int(sel[0])
        t = self.data["transactions"][idx]
        self.ledger_date_entry.delete(0, "end")
        self.ledger_date_entry.insert(0, t.get("date", ""))

    def _save_ledger_date(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Edit Date", "Select a transaction first.")
            return
        new_date = self.ledger_date_entry.get().strip()
        try:
            datetime.strptime(new_date, "%Y-%m-%d")
        except ValueError:
            messagebox.showerror("Error", "Date must be YYYY-MM-DD")
            return
        idx = int(sel[0])
        self.data["transactions"][idx]["date"] = new_date
        save_data(self.data)
        self.ledger_edit_status.set(f"✓  Date updated")
        self._refresh_ledger()
        self.tree.selection_set(str(idx))
        self.after(3000, lambda: self.ledger_edit_status.set(""))

    def _clear_all(self):
        if messagebox.askyesno("Clear All", "Delete all transactions? This cannot be undone."):
            self.data["transactions"] = []
            save_data(self.data)
            self._refresh_ledger()
            self._refresh_dashboard()

    # ── budget limits ─────────────────────────────────────────────────────────
    def _build_budgets(self):
        f = self.frames["budgets"]
        tk.Label(f, text="Budget Limits", font=FONT_H1, bg=BG, fg=TEXT).pack(anchor="w", padx=28, pady=(28, 4))
        tk.Label(f, text="monthly cap per category", font=FONT_SM, bg=BG, fg=MUTED).pack(anchor="w", padx=28)
        self._separator(f)

        scroll_area = tk.Frame(f, bg=BG)
        scroll_area.pack(fill="both", expand=True)
        sc = self._make_scrollable(scroll_area)

        card = tk.Frame(sc, bg=CARD, padx=24, pady=18)
        card.pack(fill="x", padx=28, pady=(0, 16))

        entry_cfg = dict(bg=SURFACE, fg=TEXT, insertbackground=TEXT,
                         font=FONT_BODY, relief="flat", bd=0,
                         highlightthickness=1, highlightbackground=BORDER,
                         highlightcolor=ACCENT, width=14)

        self.budget_entries = {}
        for cat in CATEGORIES:
            row = tk.Frame(card, bg=CARD)
            row.pack(fill="x", pady=4)
            tk.Label(row, text=cat, font=FONT_SM, bg=CARD, fg=TEXT, width=14, anchor="w").pack(side="left")
            e = tk.Entry(row, **entry_cfg)
            e.insert(0, self.data.get("budgets", {}).get(cat, ""))
            e.pack(side="left", padx=(8, 0))
            tk.Label(row, text="$/month", font=FONT_SM, bg=CARD, fg=MUTED).pack(side="left", padx=8)
            self.budget_entries[cat] = e

        btn_row = tk.Frame(sc, bg=BG)
        btn_row.pack(anchor="w", padx=28, pady=(0, 8))
        tk.Button(btn_row, text="  Save Limits  ", font=FONT_BODY,
                  bg=ACCENT, fg="white", bd=0, padx=14, pady=8,
                  cursor="hand2", activebackground="#6455d4",
                  command=self._save_budgets).pack(side="left")
        self.budgets_status = tk.StringVar()
        tk.Label(btn_row, textvariable=self.budgets_status, font=FONT_SM,
                 bg=BG, fg=SUCCESS).pack(side="left", padx=12)

    def _save_budgets(self):
        budgets = {}
        for cat, e in self.budget_entries.items():
            val = e.get().strip()
            if val:
                try:
                    budgets[cat] = str(float(val))
                except ValueError:
                    pass
        self.data["budgets"] = budgets
        save_data(self.data)
        self.budgets_status.set("✓  Saved")
        self.after(3000, lambda: self.budgets_status.set(""))

    def _refresh_budgets(self):
        for cat, e in self.budget_entries.items():
            e.delete(0, "end")
            e.insert(0, self.data.get("budgets", {}).get(cat, ""))

    # ── weekly planner ────────────────────────────────────────────────────────
    def _build_weekly(self):
        f = self.frames["weekly"]
        tk.Label(f, text="Weekly Planner", font=FONT_H1, bg=BG, fg=TEXT).pack(anchor="w", padx=28, pady=(28, 4))
        tk.Label(f, text="estimate how much you can spend each week", font=FONT_SM, bg=BG, fg=MUTED).pack(anchor="w", padx=28)
        self._separator(f)

        scroll_area = tk.Frame(f, bg=BG)
        scroll_area.pack(fill="both", expand=True)
        sc = self._make_scrollable(scroll_area)

        entry_cfg = dict(bg=SURFACE, fg=TEXT, insertbackground=TEXT,
                         font=FONT_BODY, relief="flat", bd=0,
                         highlightthickness=1, highlightbackground=BORDER,
                         highlightcolor=ACCENT, width=14)

        wp = self.data.get("weekly_plan", {})
        income, expense, _ = self._totals()
        default_balance = f"{income - expense:.2f}"
        default_pay = (datetime.today() + timedelta(days=14)).strftime("%Y-%m-%d")

        # ── current balance display ──
        bal = income - expense
        bal_color = SUCCESS if bal >= 0 else DANGER
        bal_row = tk.Frame(sc, bg=BG)
        bal_row.pack(fill="x", padx=28, pady=(0, 12))

        # ── inputs ──
        inp = tk.Frame(sc, bg=CARD, padx=24, pady=18)
        inp.pack(fill="x", padx=28, pady=(0, 16))
        bal_card = tk.Frame(bal_row, bg=CARD, padx=14, pady=10)
        bal_card.pack(side="left")
        tk.Label(bal_card, text="CURRENT BALANCE", font=FONT_SM, bg=CARD, fg=MUTED).pack(anchor="w")
        tk.Label(bal_card, text=f"${bal:,.2f}", font=("Georgia", 18, "bold"), bg=CARD, fg=bal_color).pack(anchor="w")
        tk.Label(bal_card, text="income − expenses", font=FONT_TINY, bg=CARD, fg=MUTED).pack(anchor="w")

        # row 1
        r1 = tk.Frame(inp, bg=CARD)
        r1.pack(fill="x", pady=4)
        tk.Label(r1, text="Remaining balance ($)", font=FONT_SM, bg=CARD, fg=MUTED, width=22, anchor="w").pack(side="left")
        self.wk_balance = tk.Entry(r1, **entry_cfg)
        self.wk_balance.insert(0, wp.get("balance", default_balance))
        self.wk_balance.pack(side="left", padx=(8, 0))

        # row 2
        r2 = tk.Frame(inp, bg=CARD)
        r2.pack(fill="x", pady=4)
        tk.Label(r2, text="Fixed bills still due ($)", font=FONT_SM, bg=CARD, fg=MUTED, width=22, anchor="w").pack(side="left")
        self.wk_bills = tk.Entry(r2, **entry_cfg)
        self.wk_bills.insert(0, wp.get("bills", "0"))
        self.wk_bills.pack(side="left", padx=(8, 0))

        # row 3 — next paycheck date
        r3 = tk.Frame(inp, bg=CARD)
        r3.pack(fill="x", pady=4)
        tk.Label(r3, text="Next paycheck date", font=FONT_SM, bg=CARD, fg=MUTED, width=22, anchor="w").pack(side="left")
        self.wk_paydate = tk.Entry(r3, **entry_cfg)
        self.wk_paydate.insert(0, wp.get("paydate", default_pay))
        self.wk_paydate.pack(side="left", padx=(8, 0))
        tk.Label(r3, text="YYYY-MM-DD", font=FONT_TINY, bg=CARD, fg=BORDER).pack(side="left", padx=8)
        self.wk_paydate.bind("<Return>", lambda e: self._refresh_weekly())
        self.wk_paydate.bind("<FocusOut>", lambda e: self._refresh_weekly())

        # row 4 — buffer slider (live)
        r4 = tk.Frame(inp, bg=CARD)
        r4.pack(fill="x", pady=4)
        tk.Label(r4, text="Emergency buffer (%)", font=FONT_SM, bg=CARD, fg=MUTED, width=22, anchor="w").pack(side="left")
        self.wk_buf_var = tk.IntVar(value=wp.get("buffer", 10))
        self.wk_buf_label = tk.Label(r4, text=f"{wp.get('buffer', 10)}%", font=FONT_BODY, bg=CARD, fg=TEXT, width=8, anchor="w")
        self.wk_buf_label.pack(side="right")

        def _on_buf_slide(v):
            self.wk_buf_label.config(text=f"{v}%")
            self._refresh_weekly()

        sl2 = tk.Scale(r4, from_=0, to=30, orient="horizontal",
                       variable=self.wk_buf_var, bg=CARD, fg=TEXT,
                       highlightthickness=0, troughcolor=BORDER,
                       activebackground=ACCENT, sliderrelief="flat",
                       showvalue=False, length=200,
                       command=_on_buf_slide)
        sl2.pack(side="left", padx=(8, 0))

        btn_row = tk.Frame(inp, bg=CARD)
        btn_row.pack(anchor="w", pady=(12, 0))
        tk.Button(btn_row, text="  Calculate  ", font=FONT_BODY,
                  bg=ACCENT, fg="white", bd=0, padx=14, pady=6,
                  cursor="hand2", activebackground="#6455d4",
                  command=self._refresh_weekly).pack(side="left")
        tk.Button(btn_row, text="  Save  ", font=FONT_BODY,
                  bg=CARD, fg=SUCCESS, bd=1, padx=14, pady=6,
                  cursor="hand2", relief="solid",
                  command=self._save_weekly_settings).pack(side="left", padx=(8, 0))
        self.wk_save_status = tk.StringVar()
        tk.Label(btn_row, textvariable=self.wk_save_status,
                 font=FONT_TINY, bg=CARD, fg=SUCCESS).pack(side="left", padx=8)

        # ── results area ──
        self.wk_results = tk.Frame(sc, bg=BG)
        self.wk_results.pack(fill="x", padx=28, pady=(0, 16))

    def _save_weekly_settings(self):
        # Calculate per_week so it can be locked in
        try:
            balance = float(self.wk_balance.get().replace("$","").replace(",",""))
        except ValueError:
            balance = 0
        try:
            bills = float(self.wk_bills.get().replace("$","").replace(",",""))
        except ValueError:
            bills = 0
        try:
            paydate = datetime.strptime(self.wk_paydate.get().strip(), "%Y-%m-%d")
            days = max(1, (paydate - datetime.today()).days + 1)
        except ValueError:
            days = 14
        buf_pct  = self.wk_buf_var.get()
        spendable = max(0, balance - bills)
        available = max(0, spendable - round(spendable * buf_pct / 100, 2))
        weeks     = max(1, -(-days // 7))
        per_week  = available / weeks

        self.data["weekly_plan"] = {
            "balance":  self.wk_balance.get(),
            "bills":    self.wk_bills.get(),
            "paydate":  self.wk_paydate.get().strip(),
            "buffer":   buf_pct,
            "per_week": per_week,
        }
        save_data(self.data)
        self.wk_save_status.set("✓  Saved")
        self.after(3000, lambda: self.wk_save_status.set(""))

    def _refresh_weekly(self):
        for w in self.wk_results.winfo_children():
            w.destroy()

        try:
            balance = float(self.wk_balance.get().replace("$", "").replace(",", ""))
        except ValueError:
            balance = 0
        try:
            bills = float(self.wk_bills.get().replace("$", "").replace(",", ""))
        except ValueError:
            bills = 0

        try:
            paydate = datetime.strptime(self.wk_paydate.get().strip(), "%Y-%m-%d")
            days = max(1, (paydate - datetime.today()).days + 1)
        except ValueError:
            days = 14
        buf_pct = self.wk_buf_var.get()

        spendable = max(0, balance - bills)
        buffer    = round(spendable * buf_pct / 100, 2)
        available = max(0, spendable - buffer)
        weeks     = max(1, -(-days // 7))   # ceiling division
        per_week  = available / weeks
        per_day   = available / days if days else available

        # Use locked-in weekly limit for tracker; only update it on explicit Save
        saved_per_week = self.data.get("weekly_plan", {}).get("per_week", per_week)

        # ── summary cards ──
        cards_row = tk.Frame(self.wk_results, bg=BG)
        cards_row.pack(fill="x", pady=(8, 16))

        summary = [
            ("SPENDABLE",  f"${available:,.2f}",  TEXT,    "after bills" + (" + buffer" if buf_pct else "")),
            ("PER WEEK",   f"${per_week:,.2f}",   SUCCESS, f"across {weeks} week{'s' if weeks!=1 else ''}"),
            ("PER DAY",    f"${per_day:,.2f}",    ACCENT,  "daily limit"),
        ]
        if buf_pct:
            summary.append(("BUFFER", f"${buffer:,.2f}", WARN, "emergency fund"))

        for i, (title, val, col, sub) in enumerate(summary):
            c = self._card(cards_row, title, val, col, sub)
            c.grid(row=0, column=i, padx=(0, 12), sticky="ew")
            cards_row.columnconfigure(i, weight=1)

        # ── this week actual tracker ──
        week_start = datetime.today() - timedelta(days=datetime.today().weekday())
        week_start_str = week_start.strftime("%Y-%m-%d")
        week_spent = sum(
            t["amount"] for t in self.data["transactions"]
            if t["type"] == "expense" and t.get("date", "") >= week_start_str
        )
        week_pct  = min(week_spent / saved_per_week, 1.0) if saved_per_week else 0
        bar_color = DANGER if week_pct >= 1.0 else (WARN if week_pct >= 0.8 else SUCCESS)

        tracker = tk.Frame(self.wk_results, bg=CARD, padx=20, pady=14)
        tracker.pack(fill="x", pady=(4, 16))

        header_row = tk.Frame(tracker, bg=CARD)
        header_row.pack(fill="x")
        tk.Label(header_row, text="THIS WEEK", font=FONT_SM, bg=CARD, fg=MUTED).pack(side="left")
        tk.Label(header_row, text=f"(Mon {week_start.strftime('%b %d')} – today)",
                 font=FONT_TINY, bg=CARD, fg=MUTED).pack(side="left", padx=8)
        pct_lbl = f"{week_pct*100:.0f}% used"
        tk.Label(header_row, text=pct_lbl, font=FONT_SM, bg=CARD, fg=bar_color).pack(side="right")

        amt_row = tk.Frame(tracker, bg=CARD)
        amt_row.pack(fill="x", pady=(4, 6))
        tk.Label(amt_row, text=f"${week_spent:,.2f}", font=("Georgia", 20, "bold"),
                 bg=CARD, fg=bar_color).pack(side="left")
        tk.Label(amt_row, text=f"  /  ${saved_per_week:,.2f} weekly budget",
                 font=FONT_BODY, bg=CARD, fg=MUTED).pack(side="left")

        bar_bg = tk.Frame(tracker, bg=BORDER, height=8)
        bar_bg.pack(fill="x")
        bar_fill = tk.Frame(bar_bg, bg=bar_color, height=8)
        bar_fill.place(relx=0, rely=0, relwidth=week_pct, relheight=1)

        # ── week breakdown bars ──
        tk.Label(self.wk_results, text="Week-by-week breakdown",
                 font=FONT_H2, bg=BG, fg=TEXT).pack(anchor="w", pady=(4, 8))

        today = datetime.today()
        for w in range(weeks):
            start_day = w * 7
            end_day   = min((w + 1) * 7, days)
            days_this = end_day - start_day
            amt       = (days_this / days) * available if days else 0

            start_dt = datetime.fromordinal(today.toordinal() + start_day)
            end_dt   = datetime.fromordinal(today.toordinal() + end_day - 1)
            date_str = f"{start_dt.strftime('%b %d')} – {end_dt.strftime('%b %d')}"

            bar_pct = amt / available if available else 0
            bar_w   = max(4, int(bar_pct * 340))

            row = tk.Frame(self.wk_results, bg=BG)
            row.pack(fill="x", pady=3)

            tk.Label(row, text=f"Week {w+1}", font=FONT_SM, bg=BG, fg=MUTED, width=7, anchor="w").pack(side="left")
            tk.Label(row, text=date_str, font=FONT_SM, bg=BG, fg=MUTED, width=14, anchor="w").pack(side="left")

            bar_bg = tk.Frame(row, bg=BORDER, height=12, width=340)
            bar_bg.pack(side="left", padx=8)
            bar_bg.pack_propagate(False)
            bar_fill = tk.Frame(bar_bg, bg=SUCCESS, height=12, width=bar_w)
            bar_fill.pack(side="left")

            tk.Label(row, text=f"${amt:,.2f}", font=FONT_SM, bg=BG, fg=SUCCESS).pack(side="left", padx=6)
            tk.Label(row, text=f"(${per_day:,.2f}/day)", font=FONT_TINY, bg=BG, fg=MUTED).pack(side="left")

    # ── CSV import ────────────────────────────────────────────────────────────
    def _build_import(self):
        f = self.frames["import"]
        tk.Label(f, text="Import CSV", font=FONT_H1, bg=BG, fg=TEXT).pack(anchor="w", padx=28, pady=(28, 4))
        tk.Label(f, text="bulk-load transactions from a spreadsheet", font=FONT_SM, bg=BG, fg=MUTED).pack(anchor="w", padx=28)
        self._separator(f)

        card = tk.Frame(f, bg=CARD, padx=28, pady=24)
        card.pack(padx=28, anchor="w")

        tk.Label(card, text="Expected CSV columns:", font=FONT_SM, bg=CARD, fg=MUTED).pack(anchor="w")
        tk.Label(card, text="  date, type (income/expense), category, description, amount",
                 font=FONT_MONO, bg=CARD, fg=ACCENT).pack(anchor="w", pady=(2, 12))
        tk.Label(card, text="Example row:", font=FONT_SM, bg=CARD, fg=MUTED).pack(anchor="w")
        tk.Label(card, text='  2024-03-15, expense, Food, "Grocery run", 87.50',
                 font=FONT_MONO, bg=CARD, fg=MUTED).pack(anchor="w", pady=(2, 20))

        self.import_status = tk.StringVar()
        tk.Label(card, textvariable=self.import_status, font=FONT_SM,
                 bg=CARD, fg=SUCCESS, wraplength=480, justify="left").pack(anchor="w", pady=(0, 10))

        tk.Button(card, text="  Choose CSV File…  ", font=FONT_BODY,
                  bg=ACCENT, fg="white", bd=0, padx=14, pady=8,
                  cursor="hand2", command=self._import_csv).pack(anchor="w")

    def _import_csv(self):
        path = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv"), ("All files", "*.*")])
        if not path:
            return
        added = 0
        errors = 0
        try:
            with open(path, newline="", encoding="utf-8") as csvfile:
                reader = csv.DictReader(csvfile)
                for i, row in enumerate(reader, 1):
                    try:
                        # flexible key matching
                        keys = {k.strip().lower(): v.strip() for k, v in row.items()}
                        t = {
                            "date":        keys.get("date", datetime.today().strftime("%Y-%m-%d")),
                            "type":        keys.get("type", "expense").lower(),
                            "category":    keys.get("category", "Other"),
                            "description": keys.get("description", "—"),
                            "amount":      float(keys.get("amount", "0").replace("$", "").replace(",", "")),
                        }
                        self.data["transactions"].append(t)
                        added += 1
                    except Exception:
                        errors += 1
            save_data(self.data)
            msg = f"✓  Imported {added} transactions."
            if errors:
                msg += f"  ({errors} rows skipped)"
            self.import_status.set(msg)
        except Exception as e:
            self.import_status.set(f"Error: {e}")


if __name__ == "__main__":
    app = BudgetApp()
    app.mainloop()
