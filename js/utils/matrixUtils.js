export function resolverLUConPasos(A, b) {
    const n = A.length;
    const L = Array(n).fill().map(() => Array(n).fill(0));
    const U = Array(n).fill().map(() => Array(n).fill(0));
    const pasos = [];
    
    pasos.push(`=== FACTORIZACIÓN LU ===`);
    pasos.push(`Matriz A original (${n}x${n}):`);
    for (let i = 0; i < n; i++) {
        pasos.push(`  Fila ${i+1}: [${A[i].map(v => v.toFixed(6)).join(', ')}]`);
    }
    pasos.push(`Vector b: [${b.map(v => v.toFixed(6)).join(', ')}]`);
    pasos.push(``);
    
    for (let i = 0; i < n; i++) {
        // Calcular U[i][j]
        for (let j = i; j < n; j++) {
            let sum = 0;
            for (let k = 0; k < i; k++) sum += L[i][k] * U[k][j];
            U[i][j] = A[i][j] - sum;
        }
        pasos.push(`Paso ${i+1}.1: Cálculo de fila ${i+1} de U:`);
        pasos.push(`  U[${i+1}][*] = [${U[i].map(v => v.toFixed(6)).join(', ')}]`);
        
        // Calcular L[j][i]
        L[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
            let sum = 0;
            for (let k = 0; k < i; k++) sum += L[j][k] * U[k][i];
            L[j][i] = (A[j][i] - sum) / U[i][i];
        }
        if (i < n - 1) {
            pasos.push(`Paso ${i+1}.2: Cálculo de columna ${i+1} de L:`);
            const colL = [];
            for (let j = i + 1; j < n; j++) colL.push(L[j][i]);
            pasos.push(`  L[${i+2}..${n}][${i+1}] = [${colL.map(v => v.toFixed(6)).join(', ')}]`);
        }
        pasos.push(``);
    }
    
    pasos.push(`=== MATRICES L y U ===`);
    pasos.push(`Matriz L (triangular inferior con diagonal 1):`);
    for (let i = 0; i < n; i++) {
        pasos.push(`  Fila ${i+1}: [${L[i].map(v => v.toFixed(6)).join(', ')}]`);
    }
    pasos.push(`Matriz U (triangular superior):`);
    for (let i = 0; i < n; i++) {
        pasos.push(`  Fila ${i+1}: [${U[i].map(v => v.toFixed(6)).join(', ')}]`);
    }
    pasos.push(``);
    
    // Verificación
    const verificacion = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k = 0; k < n; k++) {
                verificacion[i][j] += L[i][k] * U[k][j];
            }
        }
    }
    pasos.push(`=== VERIFICACIÓN A = L × U ===`);
    for (let i = 0; i < n; i++) {
        pasos.push(`  Fila ${i+1}: [${verificacion[i].map(v => v.toFixed(6)).join(', ')}]`);
    }
    pasos.push(``);
    
    // Resolver Ly = b (sustitución progresiva)
    const y = Array(n).fill(0);
    pasos.push(`=== SOLUCIÓN DEL SISTEMA Ly = b ===`);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < i; j++) sum += L[i][j] * y[j];
        y[i] = b[i] - sum;
        pasos.push(`  y${i+1} = b${i+1} - (${L[i].map((v, idx) => v !== 0 ? `${v.toFixed(4)}·y${idx+1}` : '').filter(s => s).join(' + ') || 0}) = ${y[i].toFixed(6)}`);
    }
    pasos.push(`Vector y: [${y.map(v => v.toFixed(6)).join(', ')}]`);
    pasos.push(``);
    
    // Resolver Ux = y (sustitución regresiva)
    const x = Array(n).fill(0);
    pasos.push(`=== SOLUCIÓN DEL SISTEMA Ux = y ===`);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += U[i][j] * x[j];
        x[i] = (y[i] - sum) / U[i][i];
        pasos.push(`  x${i+1} = (y${i+1} - (${U[i].map((v, idx) => idx > i && v !== 0 ? `${v.toFixed(4)}·x${idx+1}` : '').filter(s => s).join(' + ') || 0})) / ${U[i][i].toFixed(4)} = ${x[i].toFixed(10)}`);
    }
    pasos.push(``);
    pasos.push(`=== SOLUCIÓN FINAL ===`);
    pasos.push(`x = [${x.map(v => v.toFixed(10)).join(', ')}]`);
    
    return { solution: x, L: L, U: U, verificacion: verificacion, pasos: pasos };
}

export function calcularNumeroCondicion(A) {
    const n = A.length;
    let maxLambda = 0;
    let minLambda = Infinity;
    
    for (let iter = 0; iter < 150; iter++) {
        let v = Array(n).fill(0);
        for (let i = 0; i < n; i++) v[i] = Math.random() - 0.5;
        let norm = 0;
        for (let i = 0; i < n; i++) norm += v[i] * v[i];
        norm = Math.sqrt(norm);
        for (let i = 0; i < n; i++) v[i] /= norm;
        
        for (let power = 0; power < 30; power++) {
            let Av = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) Av[i] += A[i][j] * v[j];
            }
            let lambda = 0;
            for (let i = 0; i < n; i++) lambda += v[i] * Av[i];
            let normAv = 0;
            for (let i = 0; i < n; i++) normAv += Av[i] * Av[i];
            normAv = Math.sqrt(normAv);
            if (normAv > 0) {
                for (let i = 0; i < n; i++) v[i] = Av[i] / normAv;
            }
            if (power > 20) {
                maxLambda = Math.max(maxLambda, Math.abs(lambda));
                minLambda = Math.min(minLambda, Math.abs(lambda));
            }
        }
    }
    
    if (minLambda < 1e-12) return 1e12;
    return maxLambda / minLambda;
}

export function esSimetricaDefinidaPositiva(A) {
    const n = A.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (Math.abs(A[i][j] - A[j][i]) > 1e-8) return false;
        }
    }
    for (let i = 0; i < n; i++) {
        if (A[i][i] <= 0) return false;
    }
    return true;
}

