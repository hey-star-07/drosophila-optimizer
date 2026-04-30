export function SORSolver(A, b, omega = 1.3, tolerancia = 1e-8, maxIter = 2000) {
    const n = A.length;
    let x = new Array(n).fill(0);
    const historial = [];
    const pasos = [];
    
    pasos.push({ 
        iter: 0, 
        x: [...x], 
        error: Infinity,
        mensaje: `Inicialización: x⁽⁰⁾ = [${x.map(v => v.toFixed(10).replace(/\.?0+$/, ''))}], ω = ${omega}`
    });
    
    for (let iter = 0; iter < maxIter; iter++) {
        let xOld = [...x];
        let maxDiff = 0;
        
        for (let i = 0; i < n; i++) {
            let sum1 = 0;
            let sum2 = 0;
            for (let j = 0; j < i; j++) sum1 += A[i][j] * x[j];
            for (let j = i + 1; j < n; j++) sum2 += A[i][j] * xOld[j];
            
            const gs = (b[i] - sum1 - sum2) / A[i][i];
            const newX = (1 - omega) * xOld[i] + omega * gs;
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
    }
    
    return { solution: x, iterations: maxIter, converged: false, finalError: 1, historial: historial, pasos: pasos };
}