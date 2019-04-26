# ldm-Dashboard

A dashboard web app based on node.js, which displays the data transition statistic from UCAR to 10 campuses.
MongoDB is used as database in this project to store the statistic data.

### Deploy In your Local Machine:

1. Downloaded the UVA-High-Speed-Networks/LDM7Dashboard/dashboard repository
2. Open up a terminal, cd into the dashboard folder, and type `npm install`.

3. Prepare the Database:
  - You need to propare the MongoDB befeore you run the dashboard website.
  - Tutorial on how to install MongoDB: https://docs.mongodb.com/manual/installation/
  - Then you need to create a database called dashboard, create a collection called test.
  - At last, insert data into the database by reading from ldm7-rtstats.log in UVA-IDC server using Python Script: ldm7-rtstats-decoder.py

4. Start node.js Server:
  - Start your MongoDB first if mongod is not running.
  - In terminal, cd into the dashboard folder, type `DEBUG=dashboard:* npm run devstart`

Open a browser, enter the URL http://localhost:3000, you will be able to see your dashboard running on your local site!
