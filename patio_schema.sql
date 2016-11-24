-- MySQL Script generated by MySQL Workbench
-- 11/24/16 13:23:58
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema patio
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `patio` ;

-- -----------------------------------------------------
-- Schema patio
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `patio` DEFAULT CHARACTER SET utf8 ;
USE `patio` ;

-- -----------------------------------------------------
-- Table `patio`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `patio`.`users` (
  `email` VARCHAR(50) NOT NULL,
  `id` INT NOT NULL AUTO_INCREMENT,
  `pass_md5_hex` VARCHAR(32) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `patio`.`restaurants`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `patio`.`restaurants` (
  `name` VARCHAR(50) NOT NULL,
  `lat` DOUBLE NOT NULL,
  `long` DOUBLE NOT NULL,
  `id` VARCHAR(45) NOT NULL,
  `cuisine` VARCHAR(45) NOT NULL,
  `indoor` TINYINT(1) NOT NULL,
  `outdoor` TINYINT(1) NOT NULL,
  `days` BIT(7) NULL,
  `open` TIME NULL,
  `close` TIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
