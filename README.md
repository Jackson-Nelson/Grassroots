# Grassroots
Pre-requisites to run our code:
1. Install PostgreSQL
a. Remember the password you set for postgres and the port you choose.
b. Create a database called “grassroots” and run schema.sql to create the
database.
2. Install Node.js
3. In ~/frontend and ~/backend run `npm install`
4. Setup local DB (from ~/backend)
# Connect to PostgreSQL (default user is 'postgres')
$ psql -U postgres
# You'll be prompted for password (set during installation)
# Once connected, create the database:
$ CREATE DATABASE grassroots;
# Exit psql
$ \q
# Run the schema file to create all tables
$ psql -U postgres -d grassroots -f schema.sql
5. Create a file called ‘.env’ in ~/backend including database config that looks like these:
PORT=4000
DB_HOST=localhost
DB_PORT={your_postgres_port}
DB_NAME=grassroots
DB_USER=postgres
DB_PASSWORD={your_password}
JSON_TOKEN_SECRET_KEY={whatever you want}
Steps to run it:
1. From the backend folder, start the server with npm run dev
a. Make sure your port is available
2. From the frontend folder, start the frontend with npm start
a. If it asks to run on a different port, agree
3. You should see the frontend at http://localhost:3000
4. To see events and your groups, you can log in with:
a. Email: test@example.com
b. Password: password
