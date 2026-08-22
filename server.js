const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const defaultData = {
  users: [
    {
      id: "EMP001",
      name: "Rahul Sharma",
      email: "employee@dayflow.com",
      password: "employee123",
      role: "employee",
      phone: "9876543210",
      address: "Kolkata, India",
      department: "Engineering",
      designation: "Software Engineer",
      salary: 45000
    },
    {
      id: "HR001",
      name: "Admin HR",
      email: "admin@dayflow.com",
      password: "admin123",
      role: "admin",
      phone: "9000000000",
      address: "Kolkata, India",
      department: "Human Resources",
      designation: "HR Officer",
      salary: 70000
    }
  ],
  attendance: [],
  leaves: [],
  payroll: [
    {
      employeeId: "EMP001",
      month: "August 2026",
      basic: 30000,
      hra: 9000,
      allowance: 6000,
      deductions: 2000
    }
  ]
};

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();
const sessions = new Map();

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = sessions.get(token);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const user = data.users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ message: "User not found" });
  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin/HR access required" });
  }
  next();
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = data.users.find(
    u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, user.id);

  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post("/api/auth/register", (req, res) => {
  const { id, name, email, password, role = "employee" } = req.body;

  if (!id || !name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.id === id)) {
    return res.status(409).json({ message: "Employee ID or email already exists" });
  }

  const user = {
    id, name, email, password,
    role: role === "admin" ? "admin" : "employee",
    phone: "",
    address: "",
    department: "",
    designation: "",
    salary: 0
  };

  data.users.push(user);
  saveData(data);

  const { password: _, ...safeUser } = user;
  res.status(201).json({ user: safeUser });
});

app.get("/api/me", auth, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json(safeUser);
});

app.get("/api/employees", auth, adminOnly, (req, res) => {
  res.json(data.users.filter(u => u.role === "employee").map(({ password, ...u }) => u));
});

app.get("/api/profile", auth, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json(safeUser);
});

app.put("/api/profile", auth, (req, res) => {
  const allowed = ["name", "phone", "address", "department", "designation"];
  allowed.forEach(key => {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  });
  saveData(data);
  const { password: _, ...safeUser } = req.user;
  res.json(safeUser);
});

app.get("/api/attendance", auth, (req, res) => {
  const records = req.user.role === "admin"
    ? data.attendance
    : data.attendance.filter(a => a.employeeId === req.user.id);
  res.json(records);
});

app.post("/api/attendance/checkin", auth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const existing = data.attendance.find(
    a => a.employeeId === req.user.id && a.date === today
  );

  if (existing) return res.status(409).json({ message: "Already checked in today" });

  const record = {
    id: crypto.randomUUID(),
    employeeId: req.user.id,
    employeeName: req.user.name,
    date: today,
    checkIn: new Date().toLocaleTimeString(),
    checkOut: null,
    status: "Present"
  };

  data.attendance.push(record);
  saveData(data);
  res.status(201).json(record);
});

app.post("/api/attendance/checkout", auth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const record = data.attendance.find(
    a => a.employeeId === req.user.id && a.date === today
  );

  if (!record) return res.status(404).json({ message: "Check in first" });
  if (record.checkOut) return res.status(409).json({ message: "Already checked out" });

  record.checkOut = new Date().toLocaleTimeString();
  saveData(data);
  res.json(record);
});

app.get("/api/leaves", auth, (req, res) => {
  const records = req.user.role === "admin"
    ? data.leaves
    : data.leaves.filter(l => l.employeeId === req.user.id);
  res.json(records);
});

app.post("/api/leaves", auth, (req, res) => {
  const { type, from, to, reason } = req.body;
  if (!type || !from || !to) {
    return res.status(400).json({ message: "Leave type and dates are required" });
  }

  const leave = {
    id: crypto.randomUUID(),
    employeeId: req.user.id,
    employeeName: req.user.name,
    type,
    from,
    to,
    reason: reason || "",
    status: "Pending",
    adminComment: "",
    createdAt: new Date().toISOString()
  };

  data.leaves.push(leave);
  saveData(data);
  res.status(201).json(leave);
});

app.put("/api/leaves/:id", auth, adminOnly, (req, res) => {
  const leave = data.leaves.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  const { status, adminComment = "" } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  leave.status = status;
  leave.adminComment = adminComment;
  saveData(data);
  res.json(leave);
});

app.get("/api/payroll", auth, (req, res) => {
  const records = req.user.role === "admin"
    ? data.payroll
    : data.payroll.filter(p => p.employeeId === req.user.id);
  res.json(records);
});

app.put("/api/employees/:id/salary", auth, adminOnly, (req, res) => {
  const employee = data.users.find(u => u.id === req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  employee.salary = Number(req.body.salary || 0);

  let payroll = data.payroll.find(
    p => p.employeeId === employee.id && p.month === "August 2026"
  );

  if (!payroll) {
    payroll = {
      employeeId: employee.id,
      month: "August 2026",
      basic: Math.round(employee.salary * 0.67),
      hra: Math.round(employee.salary * 0.2),
      allowance: Math.round(employee.salary * 0.13),
      deductions: Math.round(employee.salary * 0.05)
    };
    data.payroll.push(payroll);
  }

  saveData(data);
  res.json({ message: "Salary updated", employee });
});

app.get("/api/dashboard", auth, (req, res) => {
  if (req.user.role === "admin") {
    res.json({
      employees: data.users.filter(u => u.role === "employee").length,
      pendingLeaves: data.leaves.filter(l => l.status === "Pending").length,
      todayAttendance: data.attendance.filter(
        a => a.date === new Date().toISOString().slice(0, 10)
      ).length
    });
  } else {
    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = data.attendance.find(
      a => a.employeeId === req.user.id && a.date === today
    );
    res.json({
      attendance: todayAttendance?.status || "Not Checked In",
      pendingLeaves: data.leaves.filter(
        l => l.employeeId === req.user.id && l.status === "Pending"
      ).length,
      salary: req.user.salary
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dayflow running at http://localhost:${PORT}`);
});