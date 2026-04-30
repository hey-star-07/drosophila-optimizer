export function JacobiSolver(A, b, tolerancia = 1e-8, maxIter = 2000) {
    const n = A.length;
    let x = new Array(n).fill(0);
    let xOld = new Array(n).fill(0);
    const historial = [];
    const pasos = [];
    
    // Verificar diagonal dominante
    let esDiagonalDominante = true;
    for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) {
            if (j !== i) suma += Math.abs(A[i][j]);
        }
        if (Math.abs(A[i][i]) <= suma) {
            esDiagonalDominante = false;
        }
    }
    
    // Guardar iteración 0
    pasos.push({ 
        iter: 0, 
        x: [...x], 
        error: Infinity,
        mensaje: `Inicialización: x⁽⁰⁾ = [${x.map(v => v.toFixed(10).replace(/\.?0+$/, ''))}]${!esDiagonalDominante ? ' (Atención: La matriz no es diagonal dominante)' : ''}`
    });
    
    for (let iter = 0; iter < maxIter; iter++) {
        let maxDiff = 0;
        
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) sum += A[i][j] * xOld[j];
            }
            const newX = (b[i] - sum) / A[i][i];
            const diff = Math.abs(newX - x[i]);
            maxDiff = Math.max(maxDiff, diff);
            x[i] = newX;
        }
        
        const error = maxDiff;
        historial.push({ iter: iter + 1, error: error });
        
        // GUARDAR TODAS LAS ITERACIONES (sin filtrar)
        pasos.push({ 
            iter: iter + 1, 
            x: [...x], 
            error: error,
            mensaje: `Iteración ${iter + 1}: x = [${x.map(v => v.toFixed(12).replace(/\.?0+$/, '')).join(', ')}]`
        });
        
        if (error < tolerancia) {
            pasos.push({ 
                iter: iter + 1, 
                x: [...x], 
                error: error,
                mensaje: `✅ Convergencia alcanzada en ${iter + 1} iteraciones con error = ${error.toExponential(6)}`
            });
            return { 
                solution: x, 
                iterations: iter + 1, 
                converged: true, 
                finalError: error, 
                historial: historial, 
                pasos: pasos 
            };
        }
        
        xOld = [...x];
    }
    
    let error = 0;
    for (let i = 0; i < n; i++) error += Math.abs(x[i] - xOld[i]);
    pasos.push({ iter: maxIter, x: [...x], error: error, mensaje: `⚠️ Máximo de iteraciones (${maxIter}) sin convergencia` });
    
    return { solution: x, iterations: maxIter, converged: false, finalError: error, historial: historial, pasos: pasos };
}