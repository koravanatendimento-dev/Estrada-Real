const API = localStorage.getItem('moradorApiUrl') || (location.protocol === 'file:' ? 'http://localhost:3002' : location.origin);
const state = { token: localStorage.getItem('moradorToken'), resident: null };
const units = [];
for (let floor=1; floor<=9; floor += 1) for (let apt=1; apt<=4; apt += 1) {
  const apartment = `${floor}0${apt}`;
  units.push(`${apartment} (BLOCO 01)`, `${apartment} (BLOCO 02)`);
}
const $ = id => document.getElementById(id);
async function request(path, options={}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(state.token ? { Authorization:`Bearer ${state.token}` } : {}), ...(options.headers||{}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}
function showMessage(text) { $('auth-message').textContent = text; }
function populateUnits() { units.forEach(unit => $('register-unit').add(new Option(unit, unit))); }
async function showApp(resident) {
  state.resident = resident; $('auth-view').hidden=true; $('app-view').hidden=false;
  $('resident-summary').textContent=`${resident.name} · ${resident.unit}`;
  try {
    await Promise.all([loadParcels(), loadReservations(), loadOccurrences(), loadNotifications()]);
  } catch (error) {
    $('parcels-screen').innerHTML=`<h2>Minhas encomendas</h2><p class="message">${error.message}</p>`;
  }
}
async function login(identifier, password) { const data=await request('/api/moradores/login',{method:'POST',body:JSON.stringify({identifier,password})}); state.token=data.accessToken; localStorage.setItem('moradorToken',state.token); await showApp(data.resident); }
async function register() {
  const password=$('register-password').value;
  if(password!==$('register-password-confirm').value) throw new Error('As senhas não conferem.');
  const photoFile=$('register-photo').files[0];
  if(!photoFile) throw new Error('Tire uma foto para concluir o cadastro.');
  const photo=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(photoFile);});
  const body={name:$('register-name').value,cpf:$('register-cpf').value,email:$('register-email').value,phone:$('register-phone').value,unit:$('register-unit').value,rg:$('register-rg').value,birthDate:$('register-birth-date').value,emergencyContact:$('register-emergency-contact').value,emergencyPhone:$('register-emergency-phone').value,photo,password};
  const data=await request('/api/moradores/cadastro',{method:'POST',body:JSON.stringify(body)}); state.token=data.accessToken; localStorage.setItem('moradorToken',state.token); await showApp(data.resident);
}
async function loadParcels() {
  const data=await request('/api/moradores/me/encomendas'); $('parcels-screen').innerHTML='<h2>Minhas encomendas</h2>';
  if(!data.encomendas.length) $('parcels-screen').innerHTML+='<p class="muted">Nenhuma encomenda registrada para sua unidade.</p>';
  data.encomendas.forEach(parcel=>{ const qrData=`ZAPCONDO|ENCOMENDA|${parcel.id}|${parcel.unit}|${parcel.protocolo}|${parcel.code}`; $('parcels-screen').innerHTML+=`<article class="card"><h3>📦 ${parcel.tipo||'Pacote'}</h3><span class="badge">${parcel.status}</span><p><b>Protocolo:</b> ${parcel.protocolo}</p><p><b>Código:</b> ${parcel.code}</p><p><b>Recebida:</b> ${parcel.date}</p>${parcel.photo?`<img class="parcel-photo" src="${parcel.photo}" alt="Foto da encomenda">`:''}<img class="parcel-qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}" alt="QR Code para retirada"></article>`; });
}
async function loadReservations() {
  const data=await request('/api/moradores/me/reservas'); $('reservations-screen').innerHTML='<h2>Espaço Gourmet</h2><form id="reservation-form"><input id="reservation-date" type="date" required><textarea id="reservation-guests" rows="5" placeholder="Convidados, um por linha"></textarea><span class="guest-count">Máximo de 35 convidados</span><button class="primary">Reservar espaço</button><p id="reservation-message" class="message"></p></form><h3>Minhas reservas</h3>';
  data.reservas.forEach(item=>{ $('reservations-screen').innerHTML+=`<article class="card"><b>${item.date}</b><p>${item.guests.length} convidado(s) · QR disponível no registro</p></article>`; });
  $('reservation-form').addEventListener('submit',async event=>{event.preventDefault();const guests=$('reservation-guests').value.split('\n').map(v=>v.trim()).filter(Boolean);try{await request('/api/moradores/me/reservas',{method:'POST',body:JSON.stringify({date:$('reservation-date').value,guests})});loadReservations();}catch(error){$('reservation-message').textContent=error.message;}});
}
async function loadNotifications() { const data=await request('/api/moradores/me/notificacoes'); $('notifications-screen').innerHTML='<h2>Notificações</h2>'; if(!data.notificacoes.length)$('notifications-screen').innerHTML+='<p class="muted">Nenhuma notificação.</p>'; data.notificacoes.forEach(item=>{$('notifications-screen').innerHTML+=`<article class="card"><h3>${item.title}</h3><p>${item.message}</p><small>${item.createdAt}</small></article>`;}); }
async function loadOccurrences() {
  const data=await request('/api/moradores/me/ocorrencias');
  $('occurrences-screen').innerHTML='<h2>Ocorrências do condomínio</h2><p class="muted">Informe problemas, manutenção ou situações que precisam da portaria.</p><form id="occurrence-form"><select id="occurrence-type" required><option value="">Tipo de ocorrência</option><option>Barulho / perturbação</option><option>Vazamento / infiltração</option><option>Falha de iluminação</option><option>Elevador</option><option>Portão / acesso</option><option>Manutenção</option><option>Outro</option></select><input id="occurrence-title" placeholder="Título ou resumo" required><textarea id="occurrence-description" rows="4" placeholder="Descreva a ocorrência" required></textarea><button class="primary">Enviar ocorrência</button><p id="occurrence-message" class="message"></p></form><h3>Minhas solicitações</h3>';
  if(!data.ocorrencias.length) $('occurrences-screen').innerHTML+='<p class="muted">Nenhuma ocorrência registrada.</p>';
  data.ocorrencias.forEach(item=>{ $('occurrences-screen').innerHTML+=`<article class="card"><h3>${item.title}</h3><span class="badge">${item.status}</span><p>${item.type}</p><p>${item.description}</p><small>${new Date(item.createdAt).toLocaleString('pt-BR')}</small></article>`; });
  $('occurrence-form').addEventListener('submit', async event => {
    event.preventDefault();
    const message = $('occurrence-message');
    try {
      await request('/api/moradores/me/ocorrencias', { method:'POST', body:JSON.stringify({ type:$('occurrence-type').value, title:$('occurrence-title').value, description:$('occurrence-description').value }) });
      await loadOccurrences();
      message.textContent = 'Ocorrência enviada para a portaria.';
    } catch (error) { message.textContent = error.message; }
  });
}
$('login-tab').onclick=()=>{$('login-panel').classList.remove('is-hidden');$('register-panel').classList.add('is-hidden');showMessage('');};
$('register-tab').onclick=()=>{$('login-panel').classList.add('is-hidden');$('register-panel').classList.remove('is-hidden');showMessage('');};
$('login-form').onsubmit=async e=>{e.preventDefault();try{await login($('login-identifier').value,$('login-password').value);}catch(error){showMessage(error.message);}};
$('register-form').onsubmit=async e=>{e.preventDefault();try{await register();}catch(error){showMessage(error.message);}};
$('logout').onclick=()=>{localStorage.removeItem('moradorToken');location.reload();};
document.querySelectorAll('.tabs button').forEach(button=>button.onclick=()=>{document.querySelectorAll('.tabs button').forEach(item=>item.classList.remove('active'));document.querySelectorAll('.screen').forEach(item=>item.hidden=true);button.classList.add('active');$(`${button.dataset.screen}-screen`).hidden=false;});
populateUnits();
if('serviceWorker' in navigator) navigator.serviceWorker.register('/moradores/sw.js', { scope: '/moradores/' });
if(state.token) request('/api/moradores/me').then(data=>showApp(data.resident)).catch(()=>{localStorage.removeItem('moradorToken');});
