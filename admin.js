const API='http://localhost:3000/api',token=localStorage.getItem('dayflow_token');
async function api(u,o={}){
    const r=await fetch(API+u,{...o,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}});
    return r.json()}async function load(){
    let d=await api('/dashboard');
    document.getElementById('stats').innerHTML=`<div class="stat">Employees<b>${d.employees}</b></div><div class="stat">Today's Attendance<b>${d.todayAttendance}</b></div><div class="stat">Pending Leave<b>${d.pendingLeaves}</b></div><div class="stat">Payroll<b>Ready</b></div>`;
    let e=await api('/employees');
    document.getElementById('employees').innerHTML='<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Salary</th></tr>'+e.map(x=>`<tr><td>${x.id}</td><td>${x.name}</td><td>${x.email}</td><td>${x.department}</td><td>${x.designation}</td><td>₹${x.salary.toLocaleString()}</td></tr>`).join('')+'</table>';
    let l=await api('/leaves');
    document.getElementById('leaves').innerHTML='<table><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr>'+l.map(x=>`<tr><td>${x.employeeName}</td><td>${x.type}</td><td>${x.from} → ${x.to}</td><td>${x.status}</td><td>${x.status==='Pending'?`<button onclick="act('${x.id}','Approved')">Approve</button> <button onclick="act('${x.id}','Rejected')">Reject</button>`:'—'}</td></tr>`).join('')+'</table>';
    let p=await api('/payroll');
    document.getElementById('payroll').innerHTML='<table><tr><th>Employee</th><th>Month Wage</th><th>Basic</th><th>HRA</th><th>Allowance</th><th>Tax</th><th>Net</th></tr>'+p.map(x=>`<tr><td>${x.employeeId}</td><td>₹${(x.basic+x.hra+x.allowance).toLocaleString()}</td><td>₹${x.basic.toLocaleString()}</td><td>₹${x.hra.toLocaleString()}</td><td>₹${x.allowance.toLocaleString()}</td><td>₹${x.deductions.toLocaleString()}</td><td><b>₹${(x.basic+x.hra+x.allowance-x.deductions).toLocaleString()}</b></td></tr>`).join('')+'</table>'}async function act(id,status){
    await api('/leaves/'+id,{method:'PUT',body:JSON.stringify({status})});
    load()}function logout(){localStorage.removeItem('dayflow_token');
    location.href='../frontend/index.html'}load();
