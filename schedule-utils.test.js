// c:\Users\Admin\Documents\GitHub\horario\tests\schedule-utils.test.js

import { getCurrentAndNextClass } from '../schedule-utils.js';

// `describe` agrupa un conjunto de pruebas relacionadas.
describe('getCurrentAndNextClass', () => {

    // `it` o `test` define un caso de prueba individual.
    it('should return the current class and next class when in the middle of a class', () => {
        // Simulamos estar un Lunes a las 12:45 PM
        const date = new Date('2024-05-27T12:45:00.000-07:00'); // Lunes

        const { currentClass, nextClass } = getCurrentAndNextClass(date);

        // `expect` es la aserción. Comprobamos si el resultado es el esperado.
        expect(currentClass).not.toBeNull();
        expect(currentClass.name).toBe('Cultura Digital I');

        expect(nextClass).not.toBeNull();
        expect(nextClass.name).toBe('Ingles I');
    });

    it('should return null for current class and the first class as next when before classes start', () => {
        // Simulamos estar un Lunes a las 10:00 AM
        const date = new Date('2024-05-27T10:00:00.000-07:00'); // Lunes

        const { currentClass, nextClass } = getCurrentAndNextClass(date);

        expect(currentClass).toBeNull();

        expect(nextClass).not.toBeNull();
        expect(nextClass.name).toBe('Cultura Digital I');
    });

    it('should handle recess correctly', () => {
        // Simulamos estar un Lunes a las 3:10 PM (durante el receso)
        const date = new Date('2024-05-27T15:10:00.000-07:00'); // Lunes

        const { currentClass, nextClass } = getCurrentAndNextClass(date);

        expect(currentClass).not.toBeNull();
        expect(currentClass.name).toBe('Receso');

        expect(nextClass).not.toBeNull();
        expect(nextClass.name).toBe('Humanidades I');
    });

    it('should return the last class and a "Fin de clases" message for next class', () => {
        // Simulamos estar un Viernes a las 5:30 PM
        const date = new Date('2024-05-31T17:30:00.000-07:00'); // Viernes

        const { currentClass, nextClass } = getCurrentAndNextClass(date);

        expect(currentClass).not.toBeNull();
        expect(currentClass.name).toBe('Pensamiento Matemático I');

        expect(nextClass).not.toBeNull();
        expect(nextClass.name).toBe('Fin de clases por hoy');
    });

    it('should return the first class of Monday when it is Sunday', () => {
        // Simulamos estar un Domingo
        const date = new Date('2024-06-02T20:00:00.000-07:00'); // Domingo

        const { currentClass, nextClass } = getCurrentAndNextClass(date);

        expect(currentClass).toBeNull(); // No hay clase actual

        expect(nextClass).not.toBeNull();
        expect(nextClass.name).toBe('Cultura Digital I'); // La primera del Lunes
        expect(nextClass.isNextDay).toBe(true); // Verifica que la bandera es correcta
    });

});