// Рисует кубик в клеточку
"use strict";

// Исходный код вершинного шейдера
const vsSource = `#version 300 es

// Координаты вершины. Атрибут, инициализируется через буфер.
in vec3 vertexPosition;

// Выходной параметр с координатами вершины, интерполируется и передётся во фрагментный шейдер 
out vec3 vPosition;

void main() {
    // Поворачиаем вершину и присваиваем волшебной переменной gl_Position
    gl_Position = vec4(vertexPosition, 2.0);

    // Передаём непреобразованную координату во фрагментный шейдер
    vPosition = vertexPosition;
}
`;

// Исходный код фрагментного шейдера
const fsSource = `#version 300 es
// WebGl требует явно установить точность флоатов, так что ставим 32 бита
precision mediump float;

// Интерполированные координаты вершины, передаются из вершинного шейдера
in vec3 vPosition;

// Цвет, который будем отрисовывать
out vec4 color; 

void main() {
    // Тут происходит магия, чтобы кубик выглядел красиво
    float k = 9.0;
    int sum = int(vPosition.x * k);
    if (sum % 2 == 0 && vPosition.x < 0.0) {
        color = vec4(1.0, 0.0, 0.0, 1.0);
    } else if ( sum % 2 != 0 && vPosition.x > 0.0) {
        color = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        color = vec4(1, 1, 1, 1);
    }
}
`;

window.onload = function main() {
    // Получаем канвас из html
    const canvas = document.querySelector("#gl_canvas");
    // Получаем контекст webgl2
    const gl = canvas.getContext("webgl2");

    // Обработка ошибок
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    // Устанавливаем размер вьюпорта
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Включаем z-buffer
    gl.enable(gl.DEPTH_TEST);

    // Создаём шейдерную программу
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    // Для удобства создадим объект с информацией о программе
    const programInfo = {
        // Сама программа
        program: shaderProgram,
        // Расположение параметров-аттрибутов в шейдере
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'vertexPosition'),
        },
    };

    // Инициализируем буфер
    const buffers = initBuffer(gl)

    drawScene(gl, programInfo, buffers);
}

// Функция загрузки шейдера
function loadShader(gl, type, source) {
    // Создаём шейдер
    const shader = gl.createShader(type);

    // Компилируем шейдер
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Обрабатываем ошибки
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Функция инициализации шейдерной программы
function initShaderProgram(gl, vsSource, fsSource) {
    // Загружаем вершинный шейдер
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    // Загружаем фрагментный шейдер
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    //Создаём программу и прикрепляем шейдеры к ней
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Обрабатываем ошибки
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Инициализируем и заполняем буфер вершин кубика
function initBuffer(gl) {
    // Треугольники, из которых состоит кубик
    const positions = [
        [-1, -1, 0],
        [-1,  1, 0],
        [1,  1, 0],
        [1, -1, 0],
    ].flat(2) // Превращаем в плоский массив

    const positionBuffer = makeF32ArrayBuffer(gl, positions);

    return {
        positionBuffer,
        bufferLength: positions.length,
    };
}

function makeF32ArrayBuffer(gl, array) {
    // Создаём буфер
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Заполняем буффер массивом флоатов
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(array),
        gl.STATIC_DRAW
    );

    return buffer
}


function drawScene(gl, programInfo, buffers) {
    // Чистим экран
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Подключаем VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    // Указываем формат данных, содержащихся в буфере
    gl.vertexAttribPointer(
        // Позиция параметра в шейдере, которую вы сохранили заранее
        programInfo.attribLocations.vertexPosition,
        // Количество компонент. У нас 3, потому что мы передаём только координаты x, y, z.
        3,
        // Тип элемента. У нас 32-битный флоат.
        gl.FLOAT,
        // Нормализация нужна только для целочисленных параметров
        false,
        // Расстояние между компонентами нулевое
        0,
        // Сдвиг от начала не нужен
        0
    );
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition
    );

    // Устанавливаем используемую программу
    gl.useProgram(programInfo.program);
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount);
}