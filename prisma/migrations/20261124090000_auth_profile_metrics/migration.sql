-- Autenticação por e-mail/senha + dados complementares do usuário
ALTER TABLE "users" ALTER COLUMN "githubId" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "githubLogin" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "email" TEXT;
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Índices para consultas de listagem e métricas
CREATE INDEX "meals_user_id_eat_time_idx" ON "meals"("user_id", "eat_time");
CREATE INDEX "foods_user_id_name_idx" ON "foods"("user_id", "name");
CREATE INDEX "weight_logs_user_id_created_at_idx" ON "weight_logs"("user_id", "created_at");
CREATE INDEX "health_data_user_id_is_active_idx" ON "health_data"("user_id", "is_active");

-- Ajuste das regras de exclusão
ALTER TABLE "meals" DROP CONSTRAINT "meals_user_id_fkey";
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "foods" DROP CONSTRAINT "foods_user_id_fkey";
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "weight_logs" DROP CONSTRAINT "weight_logs_user_id_fkey";
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "health_data" DROP CONSTRAINT "health_data_user_id_fkey";
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_foods" DROP CONSTRAINT "meal_foods_meal_id_fkey";
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_foods" DROP CONSTRAINT "meal_foods_food_id_fkey";
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
