const API = "http://localhost:3000/api";

let token = localStorage.getItem("dayflow_token");

let currentUser = null;


/* API HELPER */

async function api(endpoint, options = {}) {

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    const response =
        await fetch(
            API + endpoint,
            {
                ...options,
                headers
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Something went wrong"
        );

    }

    return data;
}


/* LOGIN */

async function login() {

    const email =
        document.getElementById(
            "email"
        ).value;

    const password =
        document.getElementById(
            "password"
        ).value;

    try {

        const data =
            await api(
                "/auth/login",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );

        token = data.token;

        currentUser = data.user;

        localStorage.setItem(
            "dayflow_token",
            token
        );

        document
            .getElementById(
                "loginPage"
            )
            .classList.add("hidden");

        document
            .getElementById(
                "app"
            )
            .classList.remove("hidden");

        document
            .getElementById(
                "userInfo"
            )
            .innerHTML = `
                <strong>
                    ${currentUser.name}
                </strong>
                <br>
                ${currentUser.role}
            `;

        if (
            currentUser.role ===
            "admin"
        ) {

            document
                .getElementById(
                    "employeesButton"
                )
                .classList.remove(
                    "hidden"
                );

        }

        loadDashboard();

    }

    catch (error) {

        document
            .getElementById(
                "loginMessage"
            )
            .textContent =
                error.message;

    }

}


/* LOGOUT */

function logout() {

    localStorage.removeItem(
        "dayflow_token"
    );

    location.reload();

}


/* PAGE NAVIGATION */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList.add(
                    "hidden"
                )
        );

    document
        .getElementById(page)
        .classList.remove(
            "hidden"
        );


    if (page === "dashboard")
        loadDashboard();

    if (page === "profile")
        loadProfile();

    if (page === "attendance")
        loadAttendance();

    if (page === "leaves")
        loadLeaves();

    if (page === "payroll")
        loadPayroll();

    if (page === "employees")
        loadEmployees();

}


/* DASHBOARD */

async function loadDashboard() {

    const data =
        await api(
            "/dashboard"
        );

    document
        .getElementById(
            "attendanceStatus"
        )
        .textContent =
            data.attendance || "-";

    document
        .getElementById(
            "pendingLeaves"
        )
        .textContent =
            data.pendingLeaves || 0;

    document
        .getElementById(
            "salary"
        )
        .textContent =
            "₹" +
            Number(
                data.salary || 0
            ).toLocaleString();

}


/* PROFILE */

async function loadProfile() {

    const data =
        await api(
            "/profile"
        );

    document.getElementById(
        "profileName"
    ).value = data.name || "";

    document.getElementById(
        "profileEmail"
    ).value = data.email || "";

    document.getElementById(
        "profilePhone"
    ).value = data.phone || "";

    document.getElementById(
        "profileAddress"
    ).value = data.address || "";

    document.getElementById(
        "profileDepartment"
    ).value =
        data.department || "";

    document.getElementById(
        "profileDesignation"
    ).value =
        data.designation || "";

}


async function updateProfile() {

    await api(
        "/profile",
        {
            method: "PUT",

            body:
                JSON.stringify({

                    name:
                        document
                        .getElementById(
                            "profileName"
                        ).value,

                    phone:
                        document
                        .getElementById(
                            "profilePhone"
                        ).value,

                    address:
                        document
                        .getElementById(
                            "profileAddress"
                        ).value,

                    department:
                        document
                        .getElementById(
                            "profileDepartment"
                        ).value,

                    designation:
                        document
                        .getElementById(
                            "profileDesignation"
                        ).value
                })
        }
    );

    alert(
        "Profile updated"
    );

}


/* ATTENDANCE */

async function checkIn() {

    try {

        await api(
            "/attendance/checkin",
            {
                method: "POST"
            }
        );

        alert(
            "Checked in"
        );

        loadAttendance();

    }

    catch (e) {

        alert(e.message);

    }

}


async function checkOut() {

    try {

        await api(
            "/attendance/checkout",
            {
                method: "POST"
            }
        );

        alert(
            "Checked out"
        );

        loadAttendance();

    }

    catch (e) {

        alert(e.message);

    }

}


async function loadAttendance() {

    const records =
        await api(
            "/attendance"
        );

    const table =
        document.getElementById(
            "attendanceTable"
        );

    table.innerHTML = "";

    records.forEach(
        record => {

            table.innerHTML += `

                <tr>

                    <td>
                        ${record.date}
                    </td>

                    <td>
                        ${record.employeeName}
                    </td>

                    <td>
                        ${record.checkIn}
                    </td>

                    <td>
                        ${record.checkOut || "-"}
                    </td>

                    <td>
                        ${record.status}
                    </td>

                </tr>

            `;

        }
    );

}


/* LEAVE */

async function applyLeave() {

    try {

        await api(
            "/leaves",
            {
                method: "POST",

                body:
                    JSON.stringify({

                        type:
                            document
                            .getElementById(
                                "leaveType"
                            ).value,

                        from:
                            document
                            .getElementById(
                                "leaveFrom"
                            ).value,

                        to:
                            document
                            .getElementById(
                                "leaveTo"
                            ).value,

                        reason:
                            document
                            .getElementById(
                                "leaveReason"
                            ).value

                    })
            }
        );

        alert(
            "Leave request submitted"
        );

        loadLeaves();

    }

    catch (e) {

        alert(
            e.message
        );

    }

}


async function loadLeaves() {

    const leaves =
        await api(
            "/leaves"
        );

    const table =
        document.getElementById(
            "leaveTable"
        );

    table.innerHTML = "";

    leaves.forEach(
        leave => {

            table.innerHTML += `

                <tr>

                    <td>
                        ${leave.type}
                    </td>

                    <td>
                        ${leave.from}
                    </td>

                    <td>
                        ${leave.to}
                    </td>

                    <td>
                        ${leave.status}
                    </td>

                </tr>

            `;

        }
    );

}


/* PAYROLL */

async function loadPayroll() {

    const payroll =
        await api(
            "/payroll"
        );

    const container =
        document.getElementById(
            "payrollContent"
        );

    container.innerHTML = "";

    payroll.forEach(
        p => {

            const net =
                p.basic +
                p.hra +
                p.allowance -
                p.deductions;

            container.innerHTML += `

                <div class="card">

                    <h3>
                        ${p.month}
                    </h3>

                    <p>
                        Basic:
                        ₹${p.basic}
                    </p>

                    <p>
                        HRA:
                        ₹${p.hra}
                    </p>

                    <p>
                        Allowance:
                        ₹${p.allowance}
                    </p>

                    <p>
                        Deductions:
                        ₹${p.deductions}
                    </p>

                    <h2>
                        Net Salary:
                        ₹${net}
                    </h2>

                </div>

            `;

        }
    );

}


/* ADMIN EMPLOYEES */

async function loadEmployees() {

    const employees =
        await api(
            "/employees"
        );

    const table =
        document.getElementById(
            "employeeTable"
        );

    table.innerHTML = "";

    employees.forEach(
        employee => {

            table.innerHTML += `

                <tr>

                    <td>
                        ${employee.id}
                    </td>

                    <td>
                        ${employee.name}
                    </td>

                    <td>
                        ${employee.email}
                    </td>

                    <td>
                        ${employee.department}
                    </td>

                    <td>
                        ₹${employee.salary}
                    </td>

                </tr>

            `;

        }
    );

}


/* AUTO LOGIN */

if (token) {

    api("/me")
        .then(
            user => {

                currentUser = user;

                document
                    .getElementById(
                        "loginPage"
                    )
                    .classList.add(
                        "hidden"
                    );

                document
                    .getElementById(
                        "app"
                    )
                    .classList.remove(
                        "hidden"
                    );

                document
                    .getElementById(
                        "userInfo"
                    )
                    .innerHTML = `
                        <strong>
                            ${user.name}
                        </strong>
                        <br>
                        ${user.role}
                    `;

                if (
                    user.role ===
                    "admin"
                ) {

                    document
                        .getElementById(
                            "employeesButton"
                        )
                        .classList.remove(
                            "hidden"
                        );

                }

                loadDashboard();

            }
        )
        .catch(
            () => logout()
        );

}