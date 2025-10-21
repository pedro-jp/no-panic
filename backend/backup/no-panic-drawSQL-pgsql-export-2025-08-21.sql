-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: metro.proxy.rlwy.net    Database: no_panic
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `atendida_por`
--

DROP TABLE IF EXISTS `atendida_por`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atendida_por` (
  `id_usuario` int NOT NULL,
  `id_sessao` int NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_sessao`),
  UNIQUE KEY `id_sessao` (`id_sessao`),
  CONSTRAINT `fk_atendida_sessao` FOREIGN KEY (`id_sessao`) REFERENCES `sessao` (`id_sessao`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_atendida_terapeuta` FOREIGN KEY (`id_usuario`) REFERENCES `terapeuta` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chamado_panico`
--

DROP TABLE IF EXISTS `chamado_panico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chamado_panico` (
  `id_chamado` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('aberto','atendido','encerrado') DEFAULT 'aberto',
  PRIMARY KEY (`id_chamado`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `fk_chamado_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `interacao_ia`
--

DROP TABLE IF EXISTS `interacao_ia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interacao_ia` (
  `id_interacao` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pergunta` text,
  `resposta` text,
  PRIMARY KEY (`id_interacao`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `fk_interacao_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paciente`
--

DROP TABLE IF EXISTS `paciente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paciente` (
  `id_usuario` int NOT NULL,
  `data_nascimento` date NOT NULL,
  `historico_saude` text,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `fk_paciente_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `participa`
--

DROP TABLE IF EXISTS `participa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participa` (
  `id_usuario` int NOT NULL,
  `id_sessao` int NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_sessao`),
  KEY `id_sessao` (`id_sessao`),
  CONSTRAINT `fk_participa_sessao` FOREIGN KEY (`id_sessao`) REFERENCES `sessao` (`id_sessao`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_participa_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `paciente` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sessao`
--

DROP TABLE IF EXISTS `sessao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessao` (
  `id_sessao` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('chat','voz','video') NOT NULL,
  `data_hora_inicio` datetime NOT NULL,
  `data_hora_fim` datetime DEFAULT NULL,
  `duracao` int DEFAULT NULL,
  `status` enum('agendada','concluida','cancelada') DEFAULT 'agendada',
  PRIMARY KEY (`id_sessao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `terapeuta`
--

DROP TABLE IF EXISTS `terapeuta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terapeuta` (
  `id_usuario` int NOT NULL,
  `especialidade` varchar(100) NOT NULL,
  `CRP` varchar(20) NOT NULL,
  `disponibilidade` varchar(100) NOT NULL,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `fk_terapeuta_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cpf` char(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `primeiro_login` tinyint(1) DEFAULT (true),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'no_panic'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-20  8:47:39
