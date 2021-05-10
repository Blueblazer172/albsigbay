# AlbsigBay - Online Bücherleihe
# Installation
## 1. First clone the repo:
```bash
git clone https://github.com/Blueblazer172/albsigbay.git

cd albsigbay
```
## 2. Install Dependencies
```bash
npm ci
```
# Run
```bash
node server.js
```
and
```bash
node api.js
```
# Demodaten
>### Admin Account für Bücherverwaltung
>>username: admin <br>
>>passwort: admin
> - kann Bücher hinzufügen
> - kann Bücher bearbeiten

>### User Account 1 für Bücherausleihe
>> username: testuser <br>
>> password: Test1234
>- ##### Hat 3 ausgeliehene Bücher
>- ##### Hat 5 vorher ausgeliehene Bücher

>### User Account 2 für Bücherausleihe
>> username: testuser2 <br>
>> password: Test12345
>- ##### Hat 1 ausgeliehenes Buch
>- ##### Hat 1 vorher ausgeliehenes Buch

>### User Account 3 für Bücherausleihe
>> username: testuser3 <br>
>> password: Test123456
>- ##### Hat keine ausgeliehene Bücher
>- ##### Hat 1 vorher ausgeliehenes Bücher
>- ##### Kann seinen Account löschen
