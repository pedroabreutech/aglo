-- O sistema deixou de ter login: usuários e autoria dos relatórios não existem mais.
ALTER TABLE "Report" DROP COLUMN "createdBy";

DROP TABLE "User";
