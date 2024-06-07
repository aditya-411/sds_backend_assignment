# Library management system

## Instructions to run:
1) create an empty mysql database
2) cd to the bin folder of mysql in terminal and use the command `mysql -u root -p "password" db_name < database.sql(with the absolute path);` to clone the database details to your database
3) cd to the folder with this repo
4) create a .env and add the following to it:
    * PORT   -> set it to what port you want to run the server on (I used 3000)
    * DB_USER  -> set this to the username for database, I used root user
    * DB_PASS  -> set this to the password for the user in database
    * DB_HOST  -> set it to '127.0.0.1'
    * DATABASE  -> "library" (or update database name in mysql and keep it whatever you want)
    * SALT_ROUNDS  -> set it to how many rounds of salting you want while encrypting passwords
    * JWT_SECRET  -> set it to the JWT secret you want
5) use `npm start`