# pwl-pertemuan6
# 1. Jalankan MySQL
docker compose -f .devcontainer/docker-compose.yml up -d

# 2. Tunggu 20 detik, lalu import DB (kalau belum pernah)
docker exec -i mysql-db mysql -uroot -proot < sql/database.sql

# 3. Jalankan server
bun run index.ts
