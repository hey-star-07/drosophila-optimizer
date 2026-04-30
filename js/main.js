import { JacobiSolver } from './solvers/jacobi.js';
import { GaussSeidelSolver } from './solvers/gaussSeidel.js';
import { SORSolver } from './solvers/sor.js';
import { CGPCSolver } from './solvers/cgpc.js';
import { resolverLUConPasos, calcularNumeroCondicion, esSimetricaDefinidaPositiva } from './utils/matrixUtils.js';
import { getCasoData } from '../data/casoIdeal.js';
import { ThreePlanesVisualizer } from './visualizers/threePlanes.js';

// Estado global
let threeVisualizers = {
    ideal: null,
    estres: null,
    mal: null
};
let convergenceCharts = {};

// Almacenar resultados para la tabla comparativa
let resultadosGlobales = {
    ideal: { jacobi: null, gauss: null, sor: null, cgpc: null, lu: null },
    estres: { jacobi: null, gauss: null, sor: null, cgpc: null, lu: null },
    mal: { jacobi: null, gauss: null, sor: null, cgpc: null, lu: null }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMatrixPanels();
    initMethodButtons();       // Botones individuales (Jacobi, Gauss, SOR, CGPC)
    initLUSolvers();
    initRunAllButtons();       // Botón "Ejecutar todos"
    initThreeJS();
    cargarValoresPorDefecto('ideal');
    cargarValoresPorDefecto('estres');
    cargarValoresPorDefecto('mal');
});

// Navegación
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            if (tabId === 'interpretacion') {
                actualizarTablaComparativa();
                actualizarInterpretacion();
                actualizarConclusion();
            }
            
            if (tabId === 'ideal' || tabId === 'estres' || tabId === 'mal') {
                setTimeout(() => actualizarVisualizador3D(tabId), 150);
            }
        });
    });
}

// Paneles de matriz
function initMatrixPanels() {
    const cases = ['ideal', 'estres', 'mal'];
    cases.forEach(c => {
        const resizeBtn = document.getElementById(`${c}-resize`);
        const resetBtn = document.getElementById(`${c}-reset`);
        const nInput = document.getElementById(`${c}-n`);
        
        if (resizeBtn) {
            resizeBtn.addEventListener('click', () => {
                const newN = parseInt(nInput.value);
                if (newN >= 2 && newN <= 6) {
                    redimensionarMatriz(c, newN);
                    setTimeout(() => actualizarVisualizador3D(c), 100);
                }
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                cargarValoresPorDefecto(c);
                setTimeout(() => actualizarVisualizador3D(c), 100);
            });
        }
    });
}

function redimensionarMatriz(caso, n) {
    const panel = document.getElementById(`${caso}-matrix-panel`);
    if (!panel) return;
    
    let matrix = [[...Array(n)].map(() => [...Array(n)].map(() => 0))];
    let b = Array(n).fill(0);
    
    const currentA = leerMatrizDesdeDOM(caso, true);
    if (currentA && currentA.A) {
        matrix = currentA.A;
        b = currentA.b;
    }
    
    const newMatrix = Array(n).fill().map(() => Array(n).fill(0));
    const newB = Array(n).fill(0);
    for (let i = 0; i < Math.min(matrix.length, n); i++) {
        for (let j = 0; j < Math.min(matrix.length, n); j++) {
            newMatrix[i][j] = matrix[i][j] || 0;
        }
        if (i < b.length) newB[i] = b[i] || 0;
    }
    for (let i = 0; i < n; i++) {
        if (newMatrix[i][i] === 0) newMatrix[i][i] = 1;
    }
    
    generarInputsMatriz(caso, n, newMatrix, newB);
}

function generarInputsMatriz(caso, n, matrix, b) {
    const panel = document.getElementById(`${caso}-matrix-panel`);
    if (!panel) return;
    
    let html = `<div class="matrix-section"><h4><i class="fas fa-border-all"></i> Matriz A (${n}x${n})</h4><div class="matrix-grid">`;
    for (let i = 0; i < n; i++) {
        html += `<div class="matrix-row">`;
        html += `<div class="matrix-label" style="font-weight:bold; width:35px;">E${i+1}:</div>`;
        for (let j = 0; j < n; j++) {
            const val = matrix && matrix[i] ? matrix[i][j] : (i === j ? 1 : 0);
            html += `<div class="matrix-cell"><input type="number" step="any" id="${caso}_a_${i}_${j}" value="${val}" style="width:75px"></div>`;
        }
        html += `</div>`;
    }
    html += `</div></div><div class="vector-section"><h4><i class="fas fa-vector-square"></i> Vector b</h4><div class="matrix-row" style="margin-left:40px;">`;
    for (let i = 0; i < n; i++) {
        const val = b && b[i] !== undefined ? b[i] : 1;
        html += `<div class="matrix-cell"><input type="number" step="any" id="${caso}_b_${i}" value="${val}" style="width:75px"></div>`;
    }
    html += `</div></div>`;
    panel.innerHTML = html;
    
    // Event listeners para actualizar visualizador en tiempo real
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const input = document.getElementById(`${caso}_a_${i}_${j}`);
            if (input) {
                input.addEventListener('change', () => actualizarVisualizador3D(caso));
            }
        }
        const inputB = document.getElementById(`${caso}_b_${i}`);
        if (inputB) {
            inputB.addEventListener('change', () => actualizarVisualizador3D(caso));
        }
    }
}

function cargarValoresPorDefecto(caso) {
    const data = getCasoData(caso);
    if (data) {
        const matrix = JSON.parse(JSON.stringify(data.matrix));
        const b = [...data.b];
        const n = matrix.length;
        const nInput = document.getElementById(`${caso}-n`);
        if (nInput) nInput.value = n;
        generarInputsMatriz(caso, n, matrix, b);
        
        // Ocultar paneles de resultados
        const resultsDiv = document.getElementById(`${caso}-results`);
        if (resultsDiv) resultsDiv.style.display = 'none';
        const luDiv = document.getElementById(`${caso}-lu-result`);
        if (luDiv) luDiv.style.display = 'none';
        const allResultsDiv = document.getElementById(`${caso}-all-results`);
        if (allResultsDiv) allResultsDiv.style.display = 'none';
        
        // Limpiar resultados almacenados
        resultadosGlobales[caso] = { jacobi: null, gauss: null, sor: null, cgpc: null, lu: null };
        
        setTimeout(() => actualizarVisualizador3D(caso), 100);
    }
}

function leerMatrizDesdeDOM(caso, returnRaw = false) {
    const nInput = document.getElementById(`${caso}-n`);
    const n = nInput ? parseInt(nInput.value) : 3;
    const A = Array(n).fill().map(() => Array(n).fill(0));
    const b = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const input = document.getElementById(`${caso}_a_${i}_${j}`);
            if (input) A[i][j] = parseFloat(input.value) || 0;
        }
        const inputB = document.getElementById(`${caso}_b_${i}`);
        if (inputB) b[i] = parseFloat(inputB.value) || 0;
    }
    return { A, b, n };
}

// LU Solver
function initLUSolvers() {
    const cases = ['ideal', 'estres', 'mal'];
    cases.forEach(c => {
        const luBtn = document.getElementById(`${c}-solve-lu`);
        if (luBtn) {
            luBtn.addEventListener('click', () => ejecutarLU(c));
        }
    });
}

function ejecutarLU(caso) {
    const luDiv = document.getElementById(`${caso}-lu-result`);
    if (!luDiv) return;
    
    luDiv.innerHTML = '<div class="solving"><div class="spinner"></div> Resolviendo con Factorización LU...</div>';
    luDiv.style.display = 'block';
    
    const { A, b } = leerMatrizDesdeDOM(caso);
    actualizarVisualizador3D(caso);
    
    setTimeout(() => {
        const resultado = resolverLUConPasos(A, b);
        const condNumber = calcularNumeroCondicion(A);
        
        resultadosGlobales[caso].lu = {
            iterations: 1,
            converged: true,
            finalError: Math.abs(A[0][0] * resultado.solution[0] + A[0][1] * resultado.solution[1] + A[0][2] * resultado.solution[2] - b[0])
        };
        actualizarTablaComparativa();
        
        let html = `<div class="solution-card">`;
        html += `<h3><i class="fas fa-calculator"></i> Factorización LU - Solución Exacta</h3>`;
        html += `<div class="info-row"><strong>Número de condición κ(A):</strong> ${condNumber.toExponential(6)}</div>`;
        
        html += `<div class="solution-section"><h4>Solución del sistema:</h4><div class="solution-vector">`;
        for (let i = 0; i < resultado.solution.length; i++) {
            let valor = resultado.solution[i];
            let strValor = Number.isInteger(valor) ? valor.toString() : valor.toFixed(10).replace(/\.?0+$/, '');
            html += `<div class="sol-item"><span class="sol-label">x${i+1}:</span> ${strValor}</div>`;
        }
        html += `</div></div>`;
        
        html += `<div class="solution-section"><h4>Factorización LU</h4>`;
        html += `<div style="display:flex; gap:30px; flex-wrap:wrap;">`;
        html += `<div><strong>Matriz L:</strong><div class="matrix-grid" style="margin-top:10px;">`;
        for (let i = 0; i < resultado.L.length; i++) {
            html += `<div class="matrix-row">`;
            for (let j = 0; j < resultado.L.length; j++) {
                html += `<div class="matrix-cell" style="background:#f0f4f8; padding:8px; text-align:center; width:70px; border:1px solid #2d3e50;">${resultado.L[i][j].toFixed(4)}</div>`;
            }
            html += `</div>`;
        }
        html += `</div></div>`;
        
        html += `<div><strong>Matriz U:</strong><div class="matrix-grid" style="margin-top:10px;">`;
        for (let i = 0; i < resultado.U.length; i++) {
            html += `<div class="matrix-row">`;
            for (let j = 0; j < resultado.U.length; j++) {
                html += `<div class="matrix-cell" style="background:#f0f4f8; padding:8px; text-align:center; width:70px; border:1px solid #2d3e50;">${resultado.U[i][j].toFixed(4)}</div>`;
            }
            html += `</div>`;
        }
        html += `</div></div>`;
        html += `</div></div>`;
        
        html += `<div class="steps-section"><h4>Proceso paso a paso:</h4><div class="solution-steps">`;
        for (let paso of resultado.pasos) {
            html += `<div class="step">${paso}</div>`;
        }
        html += `</div></div>`;
        html += `</div>`;
        luDiv.innerHTML = html;
    }, 50);
}

// BOTÓN "EJECUTAR TODOS" - Muestra resumen en tarjetas
function initRunAllButtons() {
    const cases = ['ideal', 'estres', 'mal'];
    cases.forEach(c => {
        const runAllBtn = document.getElementById(`${c}-run-all`);
        if (runAllBtn) {
            runAllBtn.addEventListener('click', () => ejecutarTodosLosMetodos(c));
        }
    });
}

async function ejecutarTodosLosMetodos(caso) {
    const allResultsDiv = document.getElementById(`${caso}-all-results`);
    if (!allResultsDiv) return;
    
    allResultsDiv.style.display = 'block';
    allResultsDiv.innerHTML = '<div class="solving"><div class="spinner"></div> Ejecutando todos los métodos...</div>';
    
    // Ocultar resultados individuales anteriores
    const resultsDiv = document.getElementById(`${caso}-results`);
    if (resultsDiv) resultsDiv.style.display = 'none';
    const luDiv = document.getElementById(`${caso}-lu-result`);
    if (luDiv) luDiv.style.display = 'none';
    
    const { A, b } = leerMatrizDesdeDOM(caso);
    actualizarVisualizador3D(caso);
    
    if (!esSimetricaDefinidaPositiva(A)) {
        allResultsDiv.innerHTML = '<div class="error-card"><i class="fas fa-exclamation-triangle"></i> Error: La matriz no es simétrica definida positiva.</div>';
        return;
    }
    
    const condNumber = calcularNumeroCondicion(A);
    const tolerancia = 1e-8;
    const maxIter = 2000;
    const omega = 1.3;
    
    // Ejecutar los 4 métodos
    const [jacobi, gauss, sor, cgpc] = await Promise.all([
        JacobiSolver(A, b, tolerancia, maxIter),
        GaussSeidelSolver(A, b, tolerancia, maxIter),
        SORSolver(A, b, omega, tolerancia, maxIter),
        CGPCSolver(A, b, tolerancia, maxIter)
    ]);
    
    // Guardar resultados
    resultadosGlobales[caso] = {
        jacobi: { iterations: jacobi.iterations, converged: jacobi.converged, finalError: jacobi.finalError, solution: jacobi.solution },
        gauss: { iterations: gauss.iterations, converged: gauss.converged, finalError: gauss.finalError, solution: gauss.solution },
        sor: { iterations: sor.iterations, converged: sor.converged, finalError: sor.finalError, solution: sor.solution },
        cgpc: { iterations: cgpc.iterations, converged: cgpc.converged, finalError: cgpc.finalError, solution: cgpc.solution }
    };
    
    actualizarTablaComparativa();
    
    // Mostrar tarjetas de resumen
    let html = `<h3><i class="fas fa-chart-bar"></i> Resumen de resultados - Todos los métodos</h3>`;
    html += `<div class="info-row"><strong>Número de condición κ(A):</strong> ${condNumber.toExponential(6)}</div>`;
    html += `<div class="methods-grid">`;
    
    // Jacobi Card
    html += `<div class="method-card jacobi">`;
    html += `<h4><i class="fas fa-chart-line"></i> Jacobi</h4>`;
    html += `<div class="info-row"><strong>Convergencia:</strong> ${jacobi.converged ? '<span class="converged-yes">Sí</span>' : '<span class="converged-no">No</span>'}</div>`;
    html += `<div class="info-row"><strong>Iteraciones:</strong> ${jacobi.iterations}</div>`;
    html += `<div class="info-row"><strong>Error final:</strong> ${jacobi.finalError.toExponential(6)}</div>`;
    html += `<div class="solution-preview">x = [${jacobi.solution.map(v => v.toFixed(10).replace(/\.?0+$/, '')).join(', ')}]</div>`;
    html += `</div>`;
    
    // Gauss-Seidel Card
    html += `<div class="method-card gauss">`;
    html += `<h4><i class="fas fa-chart-simple"></i> Gauss-Seidel</h4>`;
    html += `<div class="info-row"><strong>Convergencia:</strong> ${gauss.converged ? '<span class="converged-yes">Sí</span>' : '<span class="converged-no">No</span>'}</div>`;
    html += `<div class="info-row"><strong>Iteraciones:</strong> ${gauss.iterations}</div>`;
    html += `<div class="info-row"><strong>Error final:</strong> ${gauss.finalError.toExponential(6)}</div>`;
    html += `<div class="solution-preview">x = [${gauss.solution.map(v => v.toFixed(10).replace(/\.?0+$/, '')).join(', ')}]</div>`;
    html += `</div>`;
    
    // SOR Card
    html += `<div class="method-card sor">`;
    html += `<h4><i class="fas fa-tachometer-alt"></i> SOR (ω=${omega})</h4>`;
    html += `<div class="info-row"><strong>Convergencia:</strong> ${sor.converged ? '<span class="converged-yes">Sí</span>' : '<span class="converged-no">No</span>'}</div>`;
    html += `<div class="info-row"><strong>Iteraciones:</strong> ${sor.iterations}</div>`;
    html += `<div class="info-row"><strong>Error final:</strong> ${sor.finalError.toExponential(6)}</div>`;
    html += `<div class="solution-preview">x = [${sor.solution.map(v => v.toFixed(10).replace(/\.?0+$/, '')).join(', ')}]</div>`;
    html += `</div>`;
    
    // CGPC Card
    html += `<div class="method-card cgpc">`;
    html += `<h4><i class="fas fa-magic"></i> Gradiente Conjugado Precondicionado</h4>`;
    html += `<div class="info-row"><strong>Convergencia:</strong> ${cgpc.converged ? '<span class="converged-yes">Sí</span>' : '<span class="converged-no">No</span>'}</div>`;
    html += `<div class="info-row"><strong>Iteraciones:</strong> ${cgpc.iterations}</div>`;
    html += `<div class="info-row"><strong>Error final:</strong> ${cgpc.finalError.toExponential(6)}</div>`;
    html += `<div class="solution-preview">x = [${cgpc.solution.map(v => v.toFixed(10).replace(/\.?0+$/, '')).join(', ')}]</div>`;
    html += `</div>`;
    
    html += `</div>`;
    
    // Gráfico de convergencia para CGPC (solo en resumen)
    if (cgpc.historial && cgpc.historial.length > 0) {
        html += `<div class="convergence-chart" id="cgpc-chart-${caso}"><canvas id="cgpc-canvas-${caso}"></canvas></div>`;
    }
    
    allResultsDiv.innerHTML = html;
    
    // Crear gráfico
    if (cgpc.historial && cgpc.historial.length > 0) {
        const canvas = document.getElementById(`cgpc-canvas-${caso}`);
        if (canvas) {
            if (convergenceCharts[caso]) convergenceCharts[caso].destroy();
            
            const errors = cgpc.historial.map(h => h.error);
            const iterations = cgpc.historial.map(h => h.iter);
            
            convergenceCharts[caso] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: iterations,
                    datasets: [{
                        label: 'Error de convergencia (CGPC)',
                        data: errors,
                        borderColor: '#d97a7a',
                        backgroundColor: 'rgba(217, 122, 122, 0.1)',
                        borderWidth: 3,
                        pointRadius: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: { type: 'logarithmic', title: { display: true, text: 'Error' } }
                    }
                }
            });
        }
    }
}

// BOTONES INDIVIDUALES - Muestran solución PASO A PASO
function initMethodButtons() {
    const buttons = document.querySelectorAll('.method-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const method = btn.getAttribute('data-method');
            const caso = btn.getAttribute('data-case');
            
            // Ocultar paneles de resumen y LU
            const allResultsDiv = document.getElementById(`${caso}-all-results`);
            if (allResultsDiv) allResultsDiv.style.display = 'none';
            const luDiv = document.getElementById(`${caso}-lu-result`);
            if (luDiv) luDiv.style.display = 'none';
            
            await ejecutarMetodoIndividual(caso, method);
        });
    });
}

async function ejecutarMetodoIndividual(caso, method) {
    const resultsDiv = document.getElementById(`${caso}-results`);
    if (!resultsDiv) return;
    
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="solving"><div class="spinner"></div> Resolviendo sistema...</div>';
    
    const { A, b } = leerMatrizDesdeDOM(caso);
    actualizarVisualizador3D(caso);
    
    if (!esSimetricaDefinidaPositiva(A)) {
        resultsDiv.innerHTML = '<div class="error-card"><i class="fas fa-exclamation-triangle"></i> Error: La matriz no es simétrica definida positiva.</div>';
        return;
    }
    
    const condNumber = calcularNumeroCondicion(A);
    const tolerancia = 1e-8;
    const maxIter = 2000;
    let resultado = null;
    
    switch(method) {
        case 'jacobi':
            resultado = JacobiSolver(A, b, tolerancia, maxIter);
            resultadosGlobales[caso].jacobi = { iterations: resultado.iterations, converged: resultado.converged, finalError: resultado.finalError, solution: resultado.solution };
            break;
        case 'gauss':
            resultado = GaussSeidelSolver(A, b, tolerancia, maxIter);
            resultadosGlobales[caso].gauss = { iterations: resultado.iterations, converged: resultado.converged, finalError: resultado.finalError, solution: resultado.solution };
            break;
        case 'sor':
            const omega = 1.3;
            resultado = SORSolver(A, b, omega, tolerancia, maxIter);
            resultadosGlobales[caso].sor = { iterations: resultado.iterations, converged: resultado.converged, finalError: resultado.finalError, solution: resultado.solution };
            break;
        case 'cgpc':
            resultado = await CGPCSolver(A, b, tolerancia, maxIter);
            resultadosGlobales[caso].cgpc = { iterations: resultado.iterations, converged: resultado.converged, finalError: resultado.finalError, solution: resultado.solution };
            break;
        default:
            resultado = { error: true, message: 'Método no reconocido' };
    }
    
    actualizarTablaComparativa();
    
    const nombreMetodo = obtenerNombreMetodo(method);
    mostrarResultadosDetallados(resultsDiv, resultado, nombreMetodo, condNumber);
    
    if (method === 'cgpc' && resultado.historial && resultado.historial.length > 0) {
        mostrarGraficoConvergencia(resultsDiv, resultado.historial, caso + '_individual');
    }
}

function mostrarResultadosDetallados(container, resultado, nombreMetodo, condNumber) {
    if (resultado.error) {
        container.innerHTML = `<div class="error-card">${resultado.message}</div>`;
        return;
    }
    
    let html = `<div class="solution-card">`;
    html += `<h3><i class="fas fa-chart-line"></i> Resultados - ${nombreMetodo}</h3>`;
    html += `<div class="info-row"><strong>Número de condición κ(A):</strong> ${condNumber.toExponential(6)}</div>`;
    html += `<div class="info-row"><strong>Convergencia:</strong> ${resultado.converged ? '<span class="converged-yes">Sí</span>' : '<span class="converged-no">No</span>'}</div>`;
    html += `<div class="info-row"><strong>Iteraciones:</strong> ${resultado.iterations}</div>`;
    html += `<div class="info-row"><strong>Error final:</strong> ${resultado.finalError.toExponential(8)}</div>`;
    
    html += `<div class="solution-section"><h4>Solución encontrada:</h4><div class="solution-vector">`;
    for (let i = 0; i < resultado.solution.length; i++) {
        let valor = resultado.solution[i];
        let strValor = Number.isInteger(valor) ? valor.toString() : valor.toFixed(10).replace(/\.?0+$/, '');
        html += `<div class="sol-item"><span class="sol-label">x${i+1}:</span> ${strValor}</div>`;
    }
    html += `</div></div>`;
    
    // TABLA DE ITERACIONES CON ESTILO CARTOON
    if (resultado.pasos && resultado.pasos.length > 0) {
        html += `<div class="steps-section"><h4><i class="fas fa-table"></i> Proceso iterativo paso a paso:</h4>`;
        html += `<div class="iterations-table-wrapper">`;
        html += `<table class="iterations-table cartoon-table">`;
        html += `<thead>`;
        html += `<tr>`;
        html += `<th>#</th>`;
        html += `<th>x₁</th>`;
        html += `<th>x₂</th>`;
        html += `<th>x₃</th>`;
        html += `<th>Error</th>`;
        html += `</tr>`;
        html += `</thead>`;
        html += `<tbody>`;
        
        // Mostrar todas las iteraciones (sin filtro)
        for (let paso of resultado.pasos) {
            if (paso.iter === 0) {
                // Iteración 0 (inicial)
                html += `<tr class="iteration-initial">`;
                html += `<td class="iter-num">0</td>`;
                for (let i = 0; i < paso.x.length; i++) {
                    let val = paso.x[i];
                    let strVal = val.toFixed(8).replace(/\.?0+$/, '');
                    html += `<td class="iter-value">${strVal}</td>`;
                }
                let errorStr = paso.error === Infinity ? '∞' : paso.error.toExponential(6);
                html += `<td class="iter-error">${errorStr}</td>`;
                html += `</tr>`;
            } else {
                // Iteraciones normales
                let rowClass = '';
                if (paso.iter === resultado.pasos[resultado.pasos.length - 1].iter && resultado.converged) {
                    rowClass = 'iteration-final';
                }
                html += `<tr class="${rowClass}">`;
                html += `<td class="iter-num">${paso.iter}</td>`;
                for (let i = 0; i < paso.x.length; i++) {
                    let val = paso.x[i];
                    let strVal = val.toFixed(10).replace(/\.?0+$/, '');
                    html += `<td class="iter-value">${strVal}</td>`;
                }
                html += `<td class="iter-error">${paso.error.toExponential(6)}</td>`;
                html += `</tr>`;
            }
        }
        
        html += `</tbody>`;
        html += `</table>`;
        html += `</div>`;
        
        // Resumen de convergencia
        if (resultado.converged) {
            html += `<div class="convergence-summary">`;
            html += `<i class="fas fa-check-circle"></i> Convergencia alcanzada en ${resultado.iterations} iteraciones`;
            html += `</div>`;
        }
        
        html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

function mostrarGraficoConvergencia(container, historial, id) {
    const chartId = `cgpc-chart-${id}`;
    let chartDiv = container.querySelector('.convergence-chart');
    if (!chartDiv) {
        chartDiv = document.createElement('div');
        chartDiv.className = 'convergence-chart';
        chartDiv.id = chartId;
        chartDiv.innerHTML = '<canvas id="cgpc-canvas-individual"></canvas>';
        const solutionCard = container.querySelector('.solution-card');
        if (solutionCard) {
            solutionCard.appendChild(chartDiv);
        } else {
            container.appendChild(chartDiv);
        }
    }
    
    const canvas = chartDiv.querySelector('canvas');
    if (!canvas) return;
    
    if (convergenceCharts[id]) convergenceCharts[id].destroy();
    
    const errors = historial.map(h => h.error);
    const iterations = historial.map(h => h.iter);
    
    convergenceCharts[id] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: iterations,
            datasets: [{
                label: 'Error de convergencia (CGPC)',
                data: errors,
                borderColor: '#e8a87c',
                backgroundColor: 'rgba(232, 168, 124, 0.1)',
                borderWidth: 3,
                pointRadius: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { type: 'logarithmic', title: { display: true, text: 'Error' } }
            }
        }
    });
}

function obtenerNombreMetodo(method) {
    const nombres = { 
        jacobi: 'Jacobi', 
        gauss: 'Gauss-Seidel', 
        sor: 'SOR (ω=1.3)', 
        cgpc: 'Gradiente Conjugado Precondicionado' 
    };
    return nombres[method] || method;
}

// Three.js
function initThreeJS() {
    const cases = ['ideal', 'estres', 'mal'];
    cases.forEach(c => {
        const container = document.getElementById(`three-${c}`);
        if (container) {
            threeVisualizers[c] = new ThreePlanesVisualizer();
        }
    });
}

function actualizarVisualizador3D(caso) {
    const { A, b, n } = leerMatrizDesdeDOM(caso);
    if (n === 3 && threeVisualizers[caso]) {
        const container = document.getElementById(`three-${caso}`);
        if (container) {
            threeVisualizers[caso].actualizarPlanos(container, A, b);
        }
    } else if (n !== 3 && threeVisualizers[caso]) {
        const container = document.getElementById(`three-${caso}`);
        if (container) {
            container.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; background:#f0f4f8; border-radius:20px;">
                <p style="text-align:center;"><i class="fas fa-cube" style="font-size:2rem; display:block;"></i>Visualización 3D disponible solo para n = 3</p>
            </div>`;
        }
    }
}

// Tabla comparativa
function actualizarTablaComparativa() {
    const container = document.getElementById('comparison-table');
    if (!container) return;
    
    const getIterText = (resultado) => {
        if (!resultado) return '-';
        if (!resultado.converged && resultado.iterations >= 1999) return 'N/A (div.)';
        return resultado.iterations;
    };
    
    container.innerHTML = `<table class="comparison-table">
        <thead>
            <tr style="background:#c7e9d7;">
                <th>Método</th>
                <th>Iter. (Ideal)</th>
                <th>Iter. (Estrés)</th>
                <th>Iter. (Mal C.)</th>
                <th>Conv. (Ideal/Estrés/Mal C.)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Jacobi</strong></td>
                <td>${getIterText(resultadosGlobales.ideal.jacobi)}</td>
                <td>${getIterText(resultadosGlobales.estres.jacobi)}</td>
                <td>${getIterText(resultadosGlobales.mal.jacobi)}</td>
                <td>${resultadosGlobales.ideal.jacobi ? (resultadosGlobales.ideal.jacobi.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.estres.jacobi ? (resultadosGlobales.estres.jacobi.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.mal.jacobi ? (resultadosGlobales.mal.jacobi.converged ? 'S' : 'N') : '-'}</td>
            </tr>
            <tr>
                <td><strong>Gauss-Seidel</strong></td>
                <td>${getIterText(resultadosGlobales.ideal.gauss)}</td>
                <td>${getIterText(resultadosGlobales.estres.gauss)}</td>
                <td>${getIterText(resultadosGlobales.mal.gauss)}</td>
                <td>${resultadosGlobales.ideal.gauss ? (resultadosGlobales.ideal.gauss.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.estres.gauss ? (resultadosGlobales.estres.gauss.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.mal.gauss ? (resultadosGlobales.mal.gauss.converged ? 'S' : 'N') : '-'}</td>
            </tr>
            <tr>
                <td><strong>SOR (ω=1.3)</strong></td>
                <td>${getIterText(resultadosGlobales.ideal.sor)}</td>
                <td>${getIterText(resultadosGlobales.estres.sor)}</td>
                <td>${getIterText(resultadosGlobales.mal.sor)}</td>
                <td>${resultadosGlobales.ideal.sor ? (resultadosGlobales.ideal.sor.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.estres.sor ? (resultadosGlobales.estres.sor.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.mal.sor ? (resultadosGlobales.mal.sor.converged ? 'S' : 'N') : '-'}</td>
            </tr>
            <tr>
                <td><strong>Grad. Conj. Prec.</strong></td>
                <td>${getIterText(resultadosGlobales.ideal.cgpc)}</td>
                <td>${getIterText(resultadosGlobales.estres.cgpc)}</td>
                <td>${getIterText(resultadosGlobales.mal.cgpc)}</td>
                <td>${resultadosGlobales.ideal.cgpc ? (resultadosGlobales.ideal.cgpc.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.estres.cgpc ? (resultadosGlobales.estres.cgpc.converged ? 'S' : 'N') : '-'} / 
                    ${resultadosGlobales.mal.cgpc ? (resultadosGlobales.mal.cgpc.converged ? 'S' : 'N') : '-'}</td>
            </tr>
            <tr>
                <td><strong>Factorización LU</strong></td>
                <td>1*</td>
                <td>1*</td>
                <td>1* (inest.)</td>
                <td>S / S / S*</td>
            </tr>
        </tbody>
    </table>
    <p class="table-note">(*) LU converge en 1 paso pero acumula errores de redondeo graves en el caso mal condicionado. N/A = no converge dentro de 2000 iteraciones.</p>`;
}

function actualizarInterpretacion() {
    const container = document.getElementById('interpretation-text');
    if (!container) return;
    
    container.innerHTML = `
        <div style="background:#c7e9d7; padding:20px; border-radius:20px; border:3px solid #2d3e50; margin-bottom:20px;">
            <h4><i class="fas fa-chart-line"></i> Caso Ideal — Todos los métodos funcionan bien</h4>
            <p>Con κ pequeño, cualquier método iterativo converge rápidamente. El Gradiente Conjugado Precondicionado necesita pocas iteraciones, en concordancia con la propiedad teórica del método demostrada en el artículo de Suñagua (2020).</p>
        </div>
        
        <div style="background:#fef9e6; padding:20px; border-radius:20px; border:3px solid #2d3e50; margin-bottom:20px;">
            <h4><i class="fas fa-bolt"></i> Caso Bajo Estrés — Diagonal dominante preservada</h4>
            <p>La estructura diagonal dominante garantiza la convergencia de Jacobi y Gauss-Seidel. El GCP es el más eficiente porque el precondicionador reduce κ efectivo.</p>
        </div>
        
        <div style="background:#ffe0e0; padding:20px; border-radius:20px; border:3px solid #2d3e50; margin-bottom:20px;">
            <h4><i class="fas fa-skull-crossbones"></i> Caso Mal Condicionado — Solo GCP converge</h4>
            <p>Jacobi y Gauss-Seidel divergen porque la condición de diagonal dominante se viola. SOR tampoco converge. Solo el GCP logra convergencia, validando la tesis central del artículo: <strong>el precondicionado es esencial para matrices mal condicionadas</strong>.</p>
        </div>`;
}

function actualizarConclusion() {
    const container = document.getElementById('conclusion-text');
    if (!container) return;
    
    container.innerHTML = `
        <p>El <strong>número de condición κ(A)</strong> determina el comportamiento de todos los métodos:</p>
        <ul style="margin: 15px 0 15px 25px;">
            <li><strong>κ pequeño (Ideal)</strong> → Todos convergen rápido</li>
            <li><strong>κ moderado (Estrés)</strong> → Todos iterativos convergen, GCP el más rápido</li>
            <li><strong>κ grande (Mal C.)</strong> → Solo GCP converge; LU inestable numéricamente</li>
        </ul>
        <p>La tasa de convergencia del GCP sigue la ecuación (2) del artículo:</p>
        <div style="background:#1a2a3a; color:#a8ffc5; padding:15px; border-radius:16px; font-family:monospace; text-align:center;">
            ||x<sub>k</sub> - A⁻¹b||<sub>2</sub> ≤ 2√κ · ((√κ-1)/(√κ+1))<sup>k</sup> · ||x<sub>0</sub> - A⁻¹b||<sub>2</sub>
        </div>`;
}

