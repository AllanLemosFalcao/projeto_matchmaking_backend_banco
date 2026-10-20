select * from usuario;
select * from INTERESSE;
select * from mensagem;
select * from match_conexao;
select * from conversa;
select * from mensagem;
select * from consentimento_lgpd;

DELETE FROM match_conexao where id_match = '31d3b8b8-6968-4c4a-88e1-aeebd26a9495';
DELETE FROM match_conexao where id_match = '9ae0b281-d65a-48d4-a744-8ef7e33e97a4';

DELETE FROM INTERESSE;
DROP TABLE MATCHES;


SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

DELETE FROM MENSAGEM;
DELETE FROM CONVERSA;
DELETE FROM MATCHES;
DELETE FROM INTERESSE;

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

