document.addEventListener('DOMContentLoaded', function () {
    const chave = document.getElementById('chave');
    const destino = document.getElementById('destino');

    chave.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text', 'chave');
    });

    destino.addEventListener('dragover', (e) => e.preventDefault());

    destino.addEventListener('drop', (e) => {
        e.preventDefault();

        if (e.dataTransfer.getData('text') === 'chave') {
            destino.innerText = "Chave aceita!";
            destino.style.backgroundColor = "#d4edda";

            iniciarFluxo();
        }
    });
});

// ENDEREÇO EMPRESA (Rua Antônio Alves Diniz, 37 - Pindamonhangaba/SP)
const LAT_EMPRESA = -22.9251224;
const LON_EMPRESA = -45.4616987;

//  INÍCIO 
function iniciarFluxo() {
    document.getElementById('painel-biometrico').style.display = 'block';

    ativarUpload();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mostrarPopup("Seu dispositivo não tem câmera. Anexe uma foto.");
        return;
    }

    iniciarCamera();
}

//  UPLOAD 
function ativarUpload() {
    const input = document.getElementById('inputFotoVistoria');
    const canvas = document.getElementById('canvasComprovante');
    const ctx = canvas.getContext('2d');

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();

            img.onload = function () {
                canvas.width = 400;
                canvas.height = 300;

                ctx.drawImage(img, 0, 0, 400, 300);

                carimbarImagem(ctx);

                finalizarTudo();
            };

            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    };
}

//  CAMERA 
async function iniciarCamera() {
    const video = document.getElementById('videoPreview');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        video.srcObject = stream;
        video.style.display = 'block';

        const botao = document.getElementById('btnCapturar');
        botao.style.display = 'block';

        botao.onclick = () => {
            const canvas = document.getElementById('canvasComprovante');
            const ctx = canvas.getContext('2d');

            canvas.width = 400;
            canvas.height = 300;

            ctx.drawImage(video, 0, 0, 400, 300);

            carimbarImagem(ctx);

            stream.getTracks().forEach(t => t.stop());

            video.style.display = 'none';
            botao.style.display = 'none';

            finalizarTudo();
        };

    } catch (erro) {
        mostrarPopup("Não foi possível acessar a câmera. Anexe uma foto.");
    }
}

//  CARIMBO 
function carimbarImagem(ctx) {
    const agora = new Date();

    ctx.fillStyle = "red";
    ctx.font = "16px Arial";

    ctx.fillText("VISTORIADO", 10, 20);
    ctx.fillText(agora.toLocaleString(), 10, 40);
}

//  DISTÂNCIA 
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = x => x * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

//  ENDEREÇO (API grátis)
async function obterEndereco(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        const res = await fetch(url);
        const data = await res.json();

        return data.display_name || "Endereço não encontrado";
    } catch (e) {
        return "Erro ao obter endereço";
    }
}

//  FINAL 
function finalizarTudo() {
    navigator.geolocation.getCurrentPosition((pos) => {

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const distancia = calcularDistancia(lat, lon, LAT_EMPRESA, LON_EMPRESA);

        console.log("Distância:", distancia);

        if (distancia > 124000) {
            mostrarPopup("🚫 Fora do pátio! Vistoria bloqueada.");
            return;
        }

        obterEndereco(lat, lon).then(endereco => {

            document.getElementById('acesso').innerText =
                `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}
Distância: ${Math.round(distancia)}m
Endereço: ${endereco}`;

        });

        const placeholder = document.getElementById('mapa-placeholder');

        const bbox = `${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}`;
        const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

        placeholder.innerHTML = `
            <iframe 
                width="100%" 
                height="200" 
                frameborder="0" 
                style="border:0; border-radius:8px;"
                src="${url}">
            </iframe>
        `;

        if (typeof exibirExtratoEsquerda === 'function') {
            exibirExtratoEsquerda();
        }

        setTimeout(() => gerarPDF(), 1500);

    }, () => {
        mostrarPopup("Permita a localização para continuar.");
    });
}

//  PDF 
function gerarPDF() {
    try {
        if (!ultimaConta || !carroAtual) {
            mostrarPopup("Sem dados para gerar PDF");
            return;
        }

        const pdf = new window.jspdf.jsPDF();
        let y = 20;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("COMPROVANTE DE DEVOLUÇÃO", 20, y);

        y += 10;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        pdf.text(`Veículo: ${carroAtual.modelo} (${carroAtual.placa})`, 20, y);
        y += 8;

        const dias = document.getElementById('dias-aluguel').value;
        pdf.text(`Dias: ${dias}`, 20, y);
        y += 10;

        pdf.line(20, y, 190, y);
        y += 10;

        pdf.text(`Subtotal: R$ ${ultimaConta.base.toFixed(2)}`, 20, y);
        y += 8;

        const taxas = pdf.splitTextToSize(`Taxas: ${ultimaConta.detalheTaxas}`, 170);
        pdf.text(taxas, 20, y);
        y += taxas.length * 6;

        pdf.text(`Multas: R$ ${ultimaConta.taxasExtras.toFixed(2)}`, 20, y);
        y += 10;

        pdf.line(20, y, 190, y);
        y += 10;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(`TOTAL: R$ ${ultimaConta.valorFinal.toFixed(2)}`, 20, y);

        y += 12;

        pdf.setFont("helvetica", "normal");
        pdf.text("Foto da vistoria:", 20, y);
        y += 5;

        const canvas = document.getElementById('canvasComprovante');
        if (canvas && canvas.width > 0) {
            const img = canvas.toDataURL("image/png");
            pdf.addImage(img, 'PNG', 20, y, 60, 45);
        }

        y += 50;

        const gps = document.getElementById('acesso').innerText;
        pdf.setFontSize(10);
        pdf.text(gps, 20, y);

        pdf.save("Comprovante.pdf");

    } catch (err) {
        console.error(err);
        mostrarPopup("Erro ao gerar PDF");
    }
}

// POPUP 
function mostrarPopup(msg) {
    const antigo = document.getElementById('popup');
    if (antigo) antigo.remove();

    const popup = document.createElement('div');

    popup.id = 'popup';
    popup.innerHTML = `
        <div style="
            position:fixed;
            top:0;left:0;
            width:100%;height:100%;
            background:rgba(0,0,0,0.5);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:9999;
        ">
            <div style="
                background:#fff;
                padding:20px;
                border-radius:10px;
                text-align:center;
            ">
                <h4>⚠️ Atenção</h4>
                <p>${msg}</p>
                <button onclick="document.getElementById('popup').remove()"
                style="background:#0d6efd;color:#fff;border:none;padding:8px 15px;border-radius:6px;">
                OK
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);
}