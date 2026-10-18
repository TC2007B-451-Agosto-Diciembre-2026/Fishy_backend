CREATE DATABASE IF NOT EXISTS fishy;
USE fishy;

CREATE TABLE IF NOT EXISTS rol (
    id CHAR(36) PRIMARY KEY, 
    nombre VARCHAR(50) NOT NULL UNIQUE,
    gatename VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuario (
    id CHAR(36) PRIMARY KEY,
    correo VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    nombreUsuario VARCHAR(30) NOT NULL UNIQUE,
    contrasenaHash VARCHAR(255) NOT NULL,
    tieneRol CHAR(36) NOT NULL,
    fecha_creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tieneRol) REFERENCES rol(id)
);

CREATE TABLE IF NOT EXISTS categoria (
    id CHAR(36) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS estado (
    id CHAR(36) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS riesgo (
    id CHAR(36) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS reporte (
    id CHAR(36) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,

    fecha_pub TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_aprob TIMESTAMP NULL,

    perteneceA CHAR(36) NULL,
    tieneEstado CHAR(36) NOT NULL,
    tieneRiesgo CHAR(36) NULL,

    FOREIGN KEY (perteneceA) REFERENCES usuario(id) ON DELETE SET NULL,
    FOREIGN KEY (tieneEstado) REFERENCES estado(id),
    FOREIGN KEY (tieneRiesgo) REFERENCES riesgo(id)
);

CREATE TABLE IF NOT EXISTS reporte_like (
    usuario_id CHAR(36) NOT NULL,
    reporte_id CHAR(36) NOT NULL,
    fecha_like TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (usuario_id, reporte_id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (reporte_id) REFERENCES reporte(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidencia (
    id CHAR(36) PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    foto VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    perteneceAReporte CHAR(36) NOT NULL,

    FOREIGN KEY (perteneceAReporte) REFERENCES reporte(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reporte_categoria (
    reporte_id CHAR(36) NOT NULL,
    categoria_id CHAR(36) NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (reporte_id, categoria_id),
    FOREIGN KEY (reporte_id) REFERENCES reporte(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

CREATE TABLE IF NOT EXISTS lecturas (
    id CHAR(36) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    modulo INT NOT NULL DEFAULT 1,
    orden INT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS progreso_lecturas (
    usuario_id CHAR(36) NOT NULL,
    lectura_id CHAR(36) NOT NULL,
    completada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_completado TIMESTAMP NULL,

    PRIMARY KEY (usuario_id, lectura_id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (lectura_id) REFERENCES lecturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comentario (
    id CHAR(36) PRIMARY KEY,
    contenido VARCHAR(500) NOT NULL,

    fecha_creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    perteneceA CHAR(36) NULL,
    perteneceAReporte CHAR(36) NOT NULL,

    INDEX idx_comentario_reporte_fecha (perteneceAReporte, fecha_creado),

    FOREIGN KEY (perteneceA) REFERENCES usuario(id) ON DELETE SET NULL,
    FOREIGN KEY (perteneceAReporte) REFERENCES reporte(id) ON DELETE CASCADE
);