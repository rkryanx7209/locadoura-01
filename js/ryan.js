const listaCarros = [
    { modelo: "Corolla", placa: "ABC1234", valor: 250 },
    { modelo: "Onix", placa: "XYZ5678", valor: 120 },
    { modelo: "Civic", placa: "DEF9012", valor: 220 },
    { modelo: "Kwid", placa: "GHI3456", valor: 100 },
    { modelo: "T-Cross", placa: "JKL7890", valor: 180 }
];

let carroAtual = null;
let ultimaConta = null;

document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById('select-carro');

    listaCarros.forEach((carro, index) => {
        let option = document.createElement('option');
        option.value = index;
        option.text = `${carro.modelo} | Placa: ${carro.placa} | R$ ${carro.valor}/dia`;
        select.appendChild(option);
    });
});

class Veiculo {
    constructor(modelo, placa, valorDiaria) {
        this.modelo = modelo;
        this.placa = placa;
        this.valorDiaria = parseFloat(valorDiaria);
        this.statusAluguel = false;
    }

    alugar() {
        this.statusAluguel = true;
        return `Veículo <strong>${this.modelo}</strong> alugado com sucesso!`;
    }

    devolver(dias, sujo, riscado, danificado) {
        if (this.statusAluguel === false) return null;
        this.statusAluguel = false;

        let valorBase = dias * this.valorDiaria;
        let multaSujeira = sujo ? 50 : 0;
        let multaRisco = riscado ? 150 : 0;
        let multaDano = danificado ? 300 : 0;

        let taxasAplicadas = [];
        if (sujo) taxasAplicadas.push("Limpeza (R$ 50,00)");
        if (riscado) taxasAplicadas.push("Reparo de Riscos (R$ 150,00)");
        if (danificado) taxasAplicadas.push("Avaria Grave (R$ 300,00)");

        return {
            base: valorBase,
            taxasExtras: multaSujeira + multaRisco + multaDano,
            detalheTaxas: taxasAplicadas.length > 0 ? taxasAplicadas.join(", ") : "Nenhuma",
            valorFinal: valorBase + multaSujeira + multaRisco + multaDano
        };
    }
}

function registrarAluguel() {
    const select = document.getElementById('select-carro');
    const index = select.value;

    if (index === "") {
        alert("Selecione um carro!");
        return;
    }

    const info = listaCarros[index];
    carroAtual = new Veiculo(info.modelo, info.placa, info.valor);

    document.getElementById('resultado').innerHTML = carroAtual.alugar();
}

function registrarDevolucao() {
    if (!carroAtual || carroAtual.statusAluguel === false) {
        alert("Nenhum carro alugado!");
        return;
    }

    const dias = document.getElementById('dias-aluguel').value;

    if (!dias || dias <= 0) {
        alert("Informe os dias!");
        return;
    }

    document.getElementById('secao-comprovante').style.display = 'block';
    document.getElementById('resultado').innerHTML = "🔒 Aguardando validação...";
}

function exibirExtratoEsquerda() {
    if (!carroAtual) return;

    const dias = document.getElementById('dias-aluguel').value;
    const s = document.getElementById('check-sujo').checked;
    const r = document.getElementById('check-riscado').checked;
    const d = document.getElementById('check-danificado').checked;

    if (!ultimaConta) {
        ultimaConta = carroAtual.devolver(parseInt(dias), s, r, d);
    }

    if (!ultimaConta) return;

    document.getElementById('resultado').innerHTML = `
        <div style="text-align:left; border:1px solid #000; padding:10px; border-radius:8px;">
            <h5><strong>COMPROVANTE DE DEVOLUÇÃO</strong></h5>
            <p>Veículo: ${carroAtual.modelo} (${carroAtual.placa})</p>
            <p>Dias: ${dias}</p>
            <hr>
            <p>Subtotal: R$ ${ultimaConta.base.toFixed(2)}</p>
            <p>Taxas: ${ultimaConta.detalheTaxas}</p>
            <p>Multas: R$ ${ultimaConta.taxasExtras.toFixed(2)}</p>
            <hr>
            <h5>Total: R$ ${ultimaConta.valorFinal.toFixed(2)}</h5>
        </div>
    `;
}