export function precondicionadorDiagonal(A) {
    const n = A.length;
    const M = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        M[i][i] = A[i][i];
    }
    return M;
}

export function resolverSistemaPrecondicionador(M, r) {
    const n = M.length;
    const z = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        if (Math.abs(M[i][i]) > 1e-12) {
            z[i] = r[i] / M[i][i];
        } else {
            z[i] = r[i];
        }
    }
    return z;
}

export function factorizacionIncompletaCholesky(A, dropTol = 1e-3) {
    const n = A.length;
    const L = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let k = 0; k < i; k++) {
            sum += L[i][k] * L[i][k];
        }
        L[i][i] = Math.sqrt(Math.max(A[i][i] - sum, 1e-8));
        
        for (let j = i + 1; j < n; j++) {
            let sum2 = 0;
            for (let k = 0; k < i; k++) {
                sum2 += L[j][k] * L[i][k];
            }
            let val = (A[j][i] - sum2) / L[i][i];
            if (Math.abs(val) > dropTol) {
                L[j][i] = val;
            }
        }
    }
    
    return L;
}