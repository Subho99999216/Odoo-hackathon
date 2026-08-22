const API='http://localhost:3000/api';
let token=localStorage.getItem('dayflow_token'),me=null;
const $=x=>document.getElementById(x);
const ini=n=>n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
async function api(u,o={}){
    const h={'Content-Type':'application/json'};
    if(token)h.Authorization='Bearer '+token;
    const r=await fetch(API+u,{...o,headers:h}),d=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(d.message||'Request failed');
    return d}async function login(){
    try{
        let d=await api('/auth/login',{method:'POST',body:JSON.stringify({email:$('email').value,password:$('password').value})});
        token=d.token;
        localStorage.setItem('dayflow_token',token);
        me=d.user;
        start()}catch(e){
        $('msg').textContent=e.message}}function logout(){localStorage.removeItem('dayflow_token');
    location.reload()}function start(){
    $('login').classList.add('hide');
    $('app').classList.remove('hide');
    $('user').innerHTML='<b>'+me.name+'</b><br>'+me.id+' · '+me.role;
    $('name').textContent=me.name;
    if(me.role!=='admin')$('emp').style.display='none';
    page('dashboard')}function page(p){
    $('title').textContent={dashboard:'Dashboard',employees:'Employees',profile:'My Profile',attendance:'Attendance',timeoff:'Time Off',salary:'Salary Info'}[p];
    ({dashboard,employees,profile,attendance,timeoff,salary}[p])()}async function dashboard(){
    let d=await api('/dashboard');
    $('content').innerHTML='<div class="hero"><h2>Good morning, '+me.name.split(' ')[0]+' 👋</h2><p>Here is your workday at a glance.</p></div><div class="stats">'+(me.role==='admin'?`<div class="card"><div class="label">Employees</div><div class="value">${d.employees}</div></div><div class="card"><div class="label">Today Attendance</div><div class="value">${d.todayAttendance}</div></div><div class="card"><div class="label">Pending Time Off</div><div class="value">${d.pendingLeaves}</div></div><div class="card"><div class="label">Payroll</div><div class="value">Ready</div></div>`:`<div class="card"><div class="label">Today's Status</div><div class="value">${d.attendance}</div></div><div class="card"><div class="label">Pending Time Off</div><div class="value">${d.pendingLeaves}</div></div><div class="card"><div class="label">Monthly Salary</div><div class="value">₹${Number(d.salary).toLocaleString()}</div></div><div class="card"><div class="label">Profile</div><div class="value">Active</div></div>`)+`</div><div class="grid"><div class="section"><h3>Quick Actions</h3><div class="toolbar">${me.role==='admin'?'<button onclick="employees()">Employees</button><button onclick="timeoff()">Review Time Off</button>':'<button onclick="checkin()">Check In</button><button onclick="checkout()">Check Out</button><button onclick="timeoff()">Apply Time Off</button>'}</div></div><div class="section"><h3>System Status</h3><p>🟢 Attendance, leave and payroll APIs connected.</p></div></div>`}async function employees(){
    let a=await api('/employees');
    $('content').innerHTML='<div class="section"><h3>Employees</h3><p class="muted">Employee directory and HR management.</p><table><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Salary</th></tr>'+a.map(x=>`<tr><td>${x.id}</td><td><b>${x.name}</b></td><td>${x.email}</td><td>${x.department}</td><td>${x.designation}</td><td>₹${x.salary.toLocaleString()}</td></tr>`).join('')+'</table></div>'}async function profile(){
    let p=await api('/profile');
    $('content').innerHTML=`<div class="section"><h3>My Profile</h3><p><b>${p.name}</b> · ${p.designation||'Employee'} · ${p.department||'—'} · <span class="badge ok">Active</span></p><div class="form"><div class="field"><label>Name</label><input id="pn" value="${p.name}"></div><div class="field"><label>Mobile</label><input id="pp" value="${p.phone||''}"></div><div class="field"><label>Email</label><input value="${p.email}" disabled></div><div class="field"><label>Department</label><input id="pd" value="${p.department||''}"></div><div class="field"><label>Job Position</label><input id="pj" value="${p.designation||''}"></div><div class="field"><label>Company</label><input value="Odoo India" disabled></div><div class="field"><label>Address</label><input id="pa" value="${p.address||''}"></div><div class="field"><label>Nationality</label><input value="Indian"></div></div><button style="margin-top:16px" onclick="saveProfile()">Save Changes</button></div><div class="section"><h3>Private & Bank Information</h3><div class="form"><div class="field"><label>Bank Name</label><input placeholder="Bank"></div><div class="field"><label>Account Number</label><input placeholder="••••••••"></div><div class="field"><label>IFSC</label><input placeholder="IFSC"></div><div class="field"><label>PAN</label><input placeholder="PAN"></div></div></div>`}async function saveProfile(){
    await api('/profile',{method:'PUT',body:JSON.stringify({name:$('pn').value,phone:$('pp').value,address:$('pa').value,department:$('pd').value,designation:$('pj').value})});
    alert('Profile saved');
    profile()}async function checkin(){
    try{
        await api('/attendance/checkin',{method:'POST'});
        alert('Check In recorded');
        attendance()}catch(e){
        alert(e.message)}}async function checkout(){
    try{
        await api('/attendance/checkout',{method:'POST'});
        alert('Check Out recorded');
        attendance()}catch(e){
        alert(e.message)}}async function attendance(){
    let a=await api('/attendance');
    $('content').innerHTML='<div class="section"><h3>Attendance</h3><div class="toolbar"><button onclick="checkin()">Check In</button><button onclick="checkout()">Check Out</button></div><table><tr><th>Date</th><th>Employee</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th></tr>'+a.map(x=>`<tr><td>${x.date}</td><td>${x.employeeName}</td><td>${x.checkIn}</td><td>${x.checkOut||'-'}</td><td>${x.checkOut?'8:00':'—'}</td><td><span class="badge ok">${x.status}</span></td></tr>`).join('')+'</table></div>'}async function timeoff(){
    let a=await api('/leaves');
    $('content').innerHTML=`<div class="grid"><div><div class="section"><h3>Time Off Balances</h3><div class="stats" style="grid-template-columns:1fr 1fr"><div class="card"><div class="label">Paid Time Off</div><div class="value">24</div></div><div class="card"><div class="label">Sick Time Off</div><div class="value">7</div></div></div></div><div class="section"><h3>New Time Off Request</h3><div class="form"><div class="field"><label>Type</label><select id="lt"><option>Paid Leave</option><option>Sick Leave</option><option>Unpaid Leave</option></select></div><div class="field"><label>Employee</label><input value="${me.name}" disabled></div><div class="field"><label>Start</label><input id="lf" type="date"></div><div class="field"><label>End</label><input id="le" type="date"></div></div><button style="margin-top:15px" onclick="applyLeave()">Submit Request</button></div></div><div class="section"><h3>${me.role==='admin'?'Leave Approval':'My Requests'}</h3><table><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr>${a.map(x=>`<tr><td>${x.employeeName}</td><td>${x.type}</td><td>${x.from} → ${x.to}</td><td><span class="badge ${x.status==='Approved'?'ok':x.status==='Rejected'?'bad':'pending'}">${x.status}</span></td><td>${me.role==='admin'&&x.status==='Pending'?`<button onclick="leaveAction('${x.id}','Approved')">Approve</button> <button onclick="leaveAction('${x.id}','Rejected')">Reject</button>`:'—'}</td></tr>`).join('')}</table></div></div>`}async function applyLeave(){
    try{
        await api('/leaves',{method:'POST',body:JSON.stringify({type:$('lt').value,from:$('lf').value,to:$('le').value,reason:''})});
        alert('Request submitted');
        timeoff()}catch(e){
        alert(e.message)}}async function leaveAction(id,status){
    await api('/leaves/'+id,{method:'PUT',body:JSON.stringify({status})});
    timeoff()}async function salary(){
    let a=await api('/payroll');
    $('content').innerHTML='<div class="section"><h3>Salary Information</h3><p class="muted">Payroll components and net salary.</p><div class="salary">'+a.map(p=>`<div class="card"><div class="label">Monthly Wage</div><div class="value">₹${(p.basic+p.hra+p.allowance).toLocaleString()}</div></div><div class="card"><div class="label">Basic Salary</div><div class="value">₹${p.basic.toLocaleString()}</div></div><div class="card"><div class="label">HRA</div><div class="value">₹${p.hra.toLocaleString()}</div></div><div class="card"><div class="label">Standard Allowance</div><div class="value">₹${p.allowance.toLocaleString()}</div></div><div class="card"><div class="label">Professional Tax</div><div class="value">₹${p.deductions.toLocaleString()}</div></div><div class="card"><div class="label">Net Salary</div><div class="value">₹${(p.basic+p.hra+p.allowance-p.deductions).toLocaleString()}</div></div>`).join('')+'</div></div>'}function searchRows(){
    let q=$('search').value.toLowerCase();
    document.querySelectorAll('tbody tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none')}if(token)api('/me').then(x=>{me=x;
    start()}).catch(logout)
