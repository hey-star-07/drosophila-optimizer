export const defaultMatrices = {
    ideal: {
        matrix: [
            [ 4.0, -1.5,  0.0],  // Larvas: alta permanencia, interacción moderada con pupas
            [-1.5,  5.0, -2.0],  // Pupas: dominancia en su diagonal, transición hacia adultos
            [ 0.0, -2.0,  3.5]   // Adultos: balance simétrico y estable
        ],
        b: [2.5, 1.5, 1.0]       
    },

    estres: {
        matrix: [
            [50.0, -10.0,  0.0], // Larvas bajo fuerte estrés (mortalidad masiva o competencia)
            [-10.0, 60.0, -15.0], // Pupas estancadas en el medio texturizado
            [ 0.0, -15.0, 45.0]  // Adultos con alta tasa de desaparición reproductiva
        ],
        b: [0.5, 0.2, 0.1]       
    },

    mal: {
        matrix: [
            [1.0,    0.9995, 0.2],
            [0.9995, 1.0,    0.2],
            [0.2,    0.2,    1.0]
        ],
        b: [1.1995, 1.1995, 0.4] 
    }
};

export function getCasoData(caso) {
    return defaultMatrices[caso] || null;
}