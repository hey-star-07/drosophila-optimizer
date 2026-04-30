export const defaultMatrices = {
    ideal: {
        matrix: [
            [3.0, -1.0, 0.0],
            [-1.0, 3.0, -1.0],
            [0.0, -1.0, 3.0]
        ],
        b: [2.0, 1.0, 2.0]
    },
    estres: {
        matrix: [
            [50.0, -20.0, -5.0],
            [-20.0, 80.0, -30.0],
            [-5.0, -30.0, 60.0]
        ],
        b: [25.0, 30.0, 25.0]
    },
    mal: {
        matrix: [
            [1.0, 0.9999, 0.5],
            [0.9999, 1.0, 0.5],
            [0.5, 0.5, 1.0]
        ],
        b: [2.4999, 2.4999, 2.0]
    }
};

export function getCasoData(caso) {
    return defaultMatrices[caso] || null;
}