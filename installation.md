# Installation

In this little guide we're assuming you're either on Ubuntu or Debian,  though this guide might as well work for other Linux distributions.

### Requirements

* [Redis](https://redis.io/)
* [Rethinkdb](https://www.rethinkdb.com/)
* [Node.js 7+](https://nodejs.org/en/)
* [Discord bot account](https://discordapp.com/developers/docs/intro)
* And if not already installed: git and curl

### Download the project's files

```bash
$ git clone https://github.com/pyraxo/natsu
$ cd natsu
$ sudo npm i gulp -g
$ gulp
```

### Configuration

1. Create a logs folder in the directory: `mkdir logs`.
2. Create a new `.env` file from `.env.example` and edit the values as desired.

For Redis and Rethinkdb you can use these values:

```ini
REDIS_HOST=localhost
REDIS_PORT=6379

DB_HOST=localhost
DB_PORT=28015
DB_DBNAME=base
DB_AUTHKEY=
```

You may want to enable the debug mode `CLIENT_DEBUG=true` if you don't want to use `gulp` everytime changes are made.

You can leave all the API keys empty.
If you leave the API keys empty you will have an error message logged in the console when the bot will be running. It has to do with the youtube API key being empty, *the bot will be able to run nonetheless*.

### Databases

#### Redis

1. Start Redis with `redis-server` and leave the console running.
2. Use `redis-cli ping` on another console -- it should return `PONG`.

#### RethinkDB

1. Start RethinkDB with `rethinkdb --daemon` and leave the console running.
2. Check that the server is running by using `curl localhost:8080` in your console.

### Running the bot
If you disabled debug mode in `.env`, use `gulp` before running the bot.

```bash
$ node index.js
```