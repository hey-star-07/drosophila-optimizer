import { precondicionadorDiagonal, resolverSistemaPrecondicionador } from '../utils/precondicionadores.js';

export async function CGPCSolver(A, b, tolerancia = 1e-8, maxIter = 2000) {
    const n = A.length;
    let x = new Array(n).fill(0);
    let r = [];
    for (let i = 0; i < n; i++) {
        let Ax = 0;
        for (let j = 0; j < n; j++) Ax += A[i][j] * x[j];
        r[i] = b[i] - Ax;
    }
    
    const M = precondicionadorDiagonal(A);
    let z = resolverSistemaPrecondicionador(M, r);
    let p = [...z];
    let rz = 0;
    for (let i = 0; i < n; i++) rz += r[i] * z[i];
    
    const historial = [];
    const pasos = [];
    
    let residualNorm = 0;
    for (let i = 0; i < n; i++) residualNorm += r[i] * r[i];
    residualNorm = Math.sqrt(residualNorm);
    
    pasos.push({ 
        iter: 0, 
        x: [...x], 
        error: residualNorm,
        mensaje: `Inicialización: x⁽⁰⁾ = [${x.map(v => v.toFixed(10).replace(/\.?0+$/, ''))}], ||r⁽⁰⁾|| = ${residualNorm.toExponential(4)}`
    });
    
    for (let iter = 0; iter < maxIter; iter++) {
        let Ap = [];
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) sum += A[i][j] * p[j];
            Ap[i] = sum;
        }
        
        let pAp = 0;
        for (let i = 0; i < n; i++) pAp += p[i] * Ap[i];
        
        const alpha = rz / pAp;
        
        for (let i = 0; i < n; i++) {
            x[i] += alpha * p[i];
            r[i] -= alpha * Ap[i];
        }
        
        let error = 0;
        for (let i = 0; i < n; i++) error += r[i] * r[i];
        error = Math.sqrt(error);
        
        historial.push({ iter: iter + 1, error: error });
        
        // GUARDAR TODAS LAS ITERACIONES (sin filtrar)
        pasos.push({ 
            iter: iter + 1, 
            x: [...x], 
            error: error,
            mensaje: `Iteración ${iter + 1}: x = [${x.map(v => v.toFixed(12).replace(/\.?0+$/, '')).join(', ')}], ||r|| = ${error.toExponential(6)}`
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
        
        z = resolverSistemaPrecondicionador(M, r);
        let rzNew = 0;
        for (let i = 0; i < n; i++) rzNew += r[i] * z[i];
        
        const beta = rzNew / rz;
        
        for (let i = 0; i < n; i++) {
            p[i] = z[i] + beta * p[i];
        }
        
        rz = rzNew;
    }
    
    return { solution: x, iterations: maxIter, converged: false, finalError: 1, historial: historial, pasos: pasos };
}