import { apiUrl, getAuthToken, getCurrentUser, logout, verifySession } from './auth.js';

const errorBox = document.getElementById('health-error');
function showError(message) { errorBox.hidden = false; errorBox.textContent = message; }
function renderList(id, rows, empty) {
    const target = document.getElementById(id); target.replaceChildren();
    if (!rows.length) { const p=document.createElement('p'); p.className='record-muted'; p.textContent=empty; target.appendChild(p); return; }
    rows.forEach(row => {
        const item=document.createElement('article'); item.className='record-item';
        item.textContent = row.file_name || row.status || row.appointment_type || row.title || 'Record';
        if (row.file_name && row.$id) {
            const download = document.createElement('button');
            download.className = 'btn btn-outline'; download.textContent = 'Download';
            download.addEventListener('click', async () => {
                download.disabled = true;
                try {
                    const token = await getAuthToken();
                    const response = await fetch(apiUrl(`/api/health-record/reports/${encodeURIComponent(row.$id)}/download`), {headers: {Authorization: `Bearer ${token}`} });
                    if (!response.ok) throw new Error('Unable to download report.');
                    const blob = await response.blob();
                    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = row.file_name;
                    link.click(); URL.revokeObjectURL(link.href);
                } catch (error) { showError(error.message); } finally { download.disabled = false; }
            });
            item.appendChild(download);
        }
        target.appendChild(item);
    });
}
async function request(path, options={}) {
    const token = await getAuthToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(apiUrl(path), {...options, signal: controller.signal, headers:{...(options.headers||{}), Authorization:`Bearer ${token}`}});
        const data=await response.json().catch(() => ({}));
        if(!response.ok || data.success === false) throw new Error(data.error?.message || data.error || 'Request failed');
        return data;
    } finally {
        clearTimeout(timeout);
    }
}
async function load() {
    const user=await verifySession(['patient', 'super_admin']);
    if(!user) { window.location.href='../patient/login.html'; return; }
    const profile=await request('/api/health-record/profile'); document.getElementById('profile-summary').textContent=`${profile.data.full_name || user.email} · ${profile.data.status}`;
    const records=await request('/api/health-record/records'); const data=records.data;
    document.getElementById('appointment-count').textContent=data.appointments.total; document.getElementById('report-count').textContent=data.medical_reports.total; document.getElementById('pharmacy-count').textContent=data.pharmacy_records.total; document.getElementById('notification-count').textContent=data.notifications.total; document.getElementById('consultation-count').textContent=data.consultation_records?.total || 0; document.getElementById('advice-count').textContent=data.doctor_advice?.total || 0;
    renderList('reports', data.medical_reports.data, 'No medical reports yet.'); renderList('appointments', data.appointments.data, 'No appointments yet.');
}
document.getElementById('logout').addEventListener('click',()=>logout());
document.getElementById('report-form').addEventListener('submit',async event=>{event.preventDefault(); const status=document.getElementById('upload-status'); const file=document.getElementById('report-file').files[0]; if(!file)return; status.textContent='Uploading...'; const form=new FormData(); form.append('document',file); try { await request('/api/health-record/reports',{method:'POST',body:form}); status.textContent='Uploaded'; await load(); event.target.reset(); } catch(error) { status.textContent=error.message; }});
load().catch(error=>{console.error(error);showError(error.message);});