// schedule-logic.js

const classDuration = 50;

// UNIFIED SCHEDULE DATA
const schedule = [
    // Lunes (Day 1)
    [
        { time: [12, 30], name: "Cultura Digital I", teacher: "Armenta Felix Ana Cristina" },
        { time: [13, 20], name: "Ingles I", teacher: "Falcon Oliovan Andrea Mariel" },
        { time: [14, 10], name: "Ingles I", teacher: "Falcon Oliovan Andrea Mariel" },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [16, 10], name: "Lengua y Comunicación I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [17, 0], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto" },
    ],
    // Martes (Day 2)
    [
        { time: [13, 20], name: "Cultura Digital I", teacher: "Armenta Felix Ana Cristina" },
        { time: [14, 10], name: "Cultura Digital I", teacher: "Armenta Felix Ana Cristina" },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Lengua y Comunicación I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [16, 10], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto" },
        { time: [17, 0], name: "Ingles I", teacher: "Falcon Oliovan Andrea Mariel" },
    ],
    // Miércoles (Day 3)
    [
        { time: [14, 10], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [16, 10], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna" },
        { time: [17, 0], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto" },
    ],
    // Jueves (Day 4)
    [
        { time: [14, 10], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna" },
        { time: [16, 10], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna" },
        { time: [17, 0], name: "Ciencias Sociales I", teacher: "Yañez Núñez Lorena Esmeralda" },
    ],
    // Viernes (Day 5)
    [
        { time: [13, 20], name: "Formación Socioemocional I", teacher: "Chávez Arriola Luis Mario" },
        { time: [14, 10], name: "Ciencias Sociales I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Lengua y Comunicación I", teacher: "Yañez Núñez Lorena Esmeralda" },
        { time: [16, 10], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto" },
        { time: [17, 0], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna" },
    ],
];

// REUSABLE LOGIC FUNCTION
function getCurrentAndNextClass(date) {
    const day = date.getDay();
    const currentTotalMinutes = date.getHours() * 60 + date.getMinutes();

    let currentClass = null;
    let nextClass = null;
    let foundCurrent = false;

    if (day >= 1 && day <= 5) {
        const todaySchedule = schedule[day - 1];

        // Find current and next class
        for (let i = 0; i < todaySchedule.length; i++) {
            const classItem = todaySchedule[i];
            const classStartMinutes = classItem.time[0] * 60 + classItem.time[1];
            const duration = classItem.duration || classDuration;
            const classEndMinutes = classStartMinutes + duration;

            if (currentTotalMinutes >= classStartMinutes && currentTotalMinutes < classEndMinutes) {
                currentClass = classItem;
                if (i + 1 < todaySchedule.length) {
                    nextClass = todaySchedule[i + 1];
                } else {
                    nextClass = { name: "Fin de clases por hoy", time: null };
                }
                foundCurrent = true;
                break;
            }
        }
        
        // If no current class, find the next one
        if (!foundCurrent) {
            for (const classItem of todaySchedule) {
                 const classStartMinutes = classItem.time[0] * 60 + classItem.time[1];
                 if(classStartMinutes > currentTotalMinutes){
                    nextClass = classItem;
                    break;
                 }
            }
        }
    }
    
    // If still no next class today, look for the next school day
    if (!nextClass) {
         for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (day + i - 1) % 7; // 0=Sun, 1=Mon...
            if (nextDayIndex < 5 && schedule[nextDayIndex].length > 0) {
                 nextClass = schedule[nextDayIndex][0];
                 // Add a flag to indicate it's on a future day
                 nextClass.isNextDay = true; 
                 break;
            }
        }
    }


    return { currentClass, nextClass };
}