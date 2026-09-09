// ==========================================
// GOURMET.JS - Reservas do Espaço Gourmet
// ==========================================

const CHAVE_RESERVAS_GOURMET = 'gourmetReservations';
let mesCalendarioGourmet = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let blocoGourmetSelecionado = '';
let apartamentoGourmetSelecionado = '';

function dataLocalISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function reservasGourmet() {
  return DB.get(CHAVE_RESERVAS_GOURMET).filter(reserva => reserva && reserva.date && reserva.apartment);
}

function formatarDataGourmet(dataISO) {
  return new Date(`${dataISO}T00:00:00`).toLocaleDateString('pt-BR');
}

function renderizarCalendarioGourmet() {
  const calendario = document.getElementById('gourmet-calendar');
  const labelMes = document.getElementById('gourmet-month-label');
  if (!calendario || !labelMes) return;

  const reservas = reservasGourmet();
  const ocupadas = new Set(reservas.map(reserva => reserva.date));
  const ano = mesCalendarioGourmet.getFullYear();
  const mes = mesCalendarioGourmet.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const hoje = dataLocalISO(new Date());

  labelMes.textContent = mesCalendarioGourmet.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  calendario.replaceChildren();

  for (let vazio = 0; vazio < primeiroDia; vazio += 1) {
    const celulaVazia = document.createElement('span');
    celulaVazia.className = 'calendar-day empty';
    celulaVazia.setAttribute('aria-hidden', 'true');
    calendario.appendChild(celulaVazia);
  }

  for (let dia = 1; dia <= totalDias; dia += 1) {
    const data = new Date(ano, mes, dia);
    const dataISO = dataLocalISO(data);
    const indisponivel = ocupadas.has(dataISO);
    const passado = dataISO < hoje;
    const bloqueada = indisponivel || passado;
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = `calendar-day ${bloqueada ? 'unavailable' : 'available'}${dataISO === hoje ? ' today' : ''}`;
    botao.textContent = String(dia);
    botao.disabled = bloqueada;
    botao.dataset.date = dataISO;
    botao.setAttribute('aria-label', `${formatarDataGourmet(dataISO)}: ${bloqueada ? 'indisponível' : 'disponível'}`);
    if (!botao.disabled) {
      botao.addEventListener('click', () => selecionarDataGourmet(dataISO));
    }
    calendario.appendChild(botao);
  }
}

function selecionarDataGourmet(dataISO) {
  const reservas = reservasGourmet();
  if (reservas.some(reserva => reserva.date === dataISO)) return;

  const campoData = document.getElementById('dataGourmet');
  const mensagem = document.getElementById('gourmet-selected-date');
  if (campoData) campoData.value = dataISO;
  if (mensagem) mensagem.textContent = `Data selecionada: ${formatarDataGourmet(dataISO)}`;

  document.querySelectorAll('#gourmet-calendar .calendar-day.selected').forEach(dia => dia.classList.remove('selected'));
  const botaoSelecionado = document.querySelector(`#gourmet-calendar [data-date="${dataISO}"]`);
  if (botaoSelecionado) botaoSelecionado.classList.add('selected');
}

function renderizarTabelaGourmet() {
  const tbody = document.getElementById('lista-reservas-gourmet');
  const contador = document.getElementById('gourmet-reservation-count');
  if (!tbody) return;

  const reservas = reservasGourmet().sort((a, b) => a.date.localeCompare(b.date));
  tbody.replaceChildren();
  if (contador) contador.textContent = `${reservas.length} reserva${reservas.length === 1 ? '' : 's'}`;

  reservas.forEach((reserva) => {
    const linha = document.createElement('tr');
    const data = document.createElement('td');
    const apartamento = document.createElement('td');
    const convidados = document.createElement('td');
    const qr = document.createElement('td');
    const acoes = document.createElement('td');
    const cancelar = document.createElement('button');

    data.textContent = formatarDataGourmet(reserva.date);
    apartamento.textContent = `${reserva.apartment} - ${reserva.resident || 'Morador não informado'}`;
    convidados.textContent = reserva.guests?.length ? reserva.guests.join(', ') : 'Nenhum convidado informado';
    if (reserva.guestQrToken) {
      qr.innerHTML = `<img class="reservation-qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(reserva.guestQrToken)}" alt="QR Code dos convidados">`;
    } else {
      qr.textContent = 'QR indisponível';
    }
    cancelar.type = 'button';
    cancelar.className = 'btn btn-danger';
    cancelar.style.padding = '5px 10px';
    cancelar.innerHTML = '<i class="fa-solid fa-trash"></i> Cancelar';
    cancelar.addEventListener('click', () => cancelarReservaGourmet(reserva.date));
    acoes.appendChild(cancelar);
    linha.append(data, apartamento, convidados, qr, acoes);
    tbody.appendChild(linha);
  });
}

function cancelarReservaGourmet(dataISO) {
  if (!confirm(`Cancelar a reserva de ${formatarDataGourmet(dataISO)}?`)) return;
  DB.set(CHAVE_RESERVAS_GOURMET, reservasGourmet().filter(reserva => reserva.date !== dataISO));
  renderizarCalendarioGourmet();
  renderizarTabelaGourmet();
}

function configurarSeletorUnidadeGourmet() {
  const trigger = document.getElementById('aptGourmet');
  const picker = document.getElementById('gourmet-unit-picker');
  const blocos = document.getElementById('gourmet-block-options');
  const apartamentos = document.getElementById('gourmet-apartment-options');
  const valorUnidade = document.getElementById('gourmet-unit-value');
  const morador = document.getElementById('gourmet-resident');
  if (!trigger || !picker || !blocos || !apartamentos || !valorUnidade) return;

  trigger.addEventListener('click', () => {
    picker.hidden = !picker.hidden;
  });

  ['BLOCO 01', 'BLOCO 02'].forEach((bloco) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'unit-picker-option';
    botao.textContent = bloco;
    botao.addEventListener('click', () => {
      blocoGourmetSelecionado = bloco;
      apartamentos.querySelectorAll('.unit-picker-option').forEach(item => item.classList.remove('selected'));
      blocos.querySelectorAll('.unit-picker-option').forEach(item => item.classList.remove('selected'));
      botao.classList.add('selected');
      apartamentos.hidden = false;
    });
    blocos.appendChild(botao);
  });

  for (let andar = 1; andar <= 9; andar += 1) {
    for (let numero = 1; numero <= 4; numero += 1) {
      const apartamento = `${andar}0${numero}`;
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'unit-picker-option';
      botao.textContent = apartamento;
      botao.addEventListener('click', () => {
        if (!blocoGourmetSelecionado) {
          alert('Primeiro escolha o bloco.');
          return;
        }
        apartamentoGourmetSelecionado = apartamento;
        const unidade = `${apartamento} (${blocoGourmetSelecionado})`;
        valorUnidade.value = unidade;
        trigger.textContent = unidade;
        if (morador) {
          morador.replaceChildren(new Option('Selecione o morador responsável', ''));
          DB.get('people').filter(p => p.unit === unidade).forEach(p => morador.add(new Option(p.name, p.name)));
          if (morador.options.length === 1) morador.add(new Option('Nenhum morador cadastrado', ''));
        }
        apartamentos.querySelectorAll('.unit-picker-option').forEach(item => item.classList.remove('selected'));
        botao.classList.add('selected');
        picker.hidden = true;
      });
      apartamentos.appendChild(botao);
    }
  }

  apartamentos.hidden = false;
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.calendar-booking-form')) picker.hidden = true;
  });
}

function configurarLeitorQrConvidado() {
      const botao = document.getElementById('gourmet-scan-guest-qr');
      const resultado = document.getElementById('gourmet-guest-scan-result');
      const video = document.getElementById('gourmet-guest-qr-camera');
      if (!botao || !resultado || !video) return;
      botao.addEventListener('click', async () => {
        if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
          resultado.textContent = 'Leitura por câmera não disponível neste navegador. Informe o conteúdo do QR Code:';
          const tokenManual = prompt(resultado.textContent);
          if (!tokenManual) return;
          await validarQrConvidado(tokenManual, resultado);
          return;
        }
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          video.srcObject = stream;
          video.hidden = false;
          resultado.textContent = 'Aponte a câmera para o QR Code do convidado.';
          const detector = new BarcodeDetector({ formats: ['qr_code'] });
          const ler = async () => {
            if (video.hidden) return;
            const codigos = await detector.detect(video);
            if (codigos.length && codigos[0].rawValue) {
              video.hidden = true;
              stream.getTracks().forEach(track => track.stop());
              await validarQrConvidado(codigos[0].rawValue, resultado);
              return;
            }
            requestAnimationFrame(ler);
          };
          requestAnimationFrame(ler);
        } catch (erro) {
          resultado.textContent = erro.message;
          resultado.className = 'guest-scan-result error';
          if (stream) stream.getTracks().forEach(track => track.stop());
        }
      });
    }

async function validarQrConvidado(token, resultado) {
      const resposta = await fetch(`http://localhost:3001/api/portaria/convidados/${encodeURIComponent(token)}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.error || 'QR Code inválido.');
      resultado.textContent = `Entrada autorizada: ${dados.convidado.morador} · ${dados.convidado.unidade} · ${dados.convidado.data}`;
      resultado.className = 'guest-scan-result success';
}

function configurarFormularioGourmet() {
  const formGourmet = document.getElementById('form-gourmet');
  if (!formGourmet) return;

  configurarSeletorUnidadeGourmet();
  configurarLeitorQrConvidado();
  document.getElementById('gourmet-prev-month')?.addEventListener('click', () => {
    mesCalendarioGourmet = new Date(mesCalendarioGourmet.getFullYear(), mesCalendarioGourmet.getMonth() - 1, 1);
    renderizarCalendarioGourmet();
  });
  document.getElementById('gourmet-next-month')?.addEventListener('click', () => {
    mesCalendarioGourmet = new Date(mesCalendarioGourmet.getFullYear(), mesCalendarioGourmet.getMonth() + 1, 1);
    renderizarCalendarioGourmet();
  });

  formGourmet.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const apartamento = document.getElementById('gourmet-unit-value')?.value;
    const morador = document.getElementById('gourmet-resident')?.value;
    const convidados = document.getElementById('gourmet-guests')?.value
      .split('\n')
      .map(nome => nome.trim())
      .filter(Boolean);
    const data = document.getElementById('dataGourmet')?.value;
    if (!apartamento || !morador || !data) {
      alert('Informe a unidade, selecione o morador e escolha uma data disponível.');
      return;
    }

    if (convidados.length > 35) {
      alert('A reserva permite no máximo 35 convidados.');
      return;
    }
    if (reservasGourmet().some(reserva => reserva.date === data)) {
      alert('Esta data já está reservada. Escolha outra data disponível.');
      renderizarCalendarioGourmet();
      return;
    }

    DB.set(CHAVE_RESERVAS_GOURMET, [...reservasGourmet(), {
      date: data,
      apartment: apartamento,
      resident: morador,
      guests: convidados
    }]);
    formGourmet.reset();
    blocoGourmetSelecionado = '';
    apartamentoGourmetSelecionado = '';
    const seletorUnidade = document.getElementById('aptGourmet');
    if (seletorUnidade) seletorUnidade.textContent = 'Selecione o apartamento e o bloco';
    const mensagem = document.getElementById('gourmet-selected-date');
    if (mensagem) mensagem.textContent = 'Selecione uma data disponível.';
    renderizarCalendarioGourmet();
    renderizarTabelaGourmet();
  });

  renderizarCalendarioGourmet();
  renderizarTabelaGourmet();
}

window.renderTabelaGourmet = renderizarTabelaGourmet;
window.configurarFormularioGourmet = configurarFormularioGourmet;
