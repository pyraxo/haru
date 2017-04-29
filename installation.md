# Installation

In this little guide we're assuming you're either on Ubuntu or Debian. Though this guide might as well work for other Linux distributions.

### Requirements

* [Redis](https://redis.io/)
* [Rethinkdb](https://www.rethinkdb.com/)
* [Node.js 7+](https://nodejs.org/en/)
* A setup [discord application and bot account](https://discordapp.com/developers/docs/intro)
* And if not already installed: git and curl

### Download the project's files

```
$ git clone https://github.com/pyraxo/natsu
$ cd natsu
$ sudo npm i gulp -g
```
Once this is done we will need to make some configurations before being able to start the bot.

### Configuration

In the natsu directory create a new `.env` file from `.env.example` and edit the values as desired.
For Redis and Rethinkdb you can use these values:
```
REDIS_HOST=localhost
REDIS_PORT=6379

DB_HOST=localhost
DB_PORT=28015
DB_DBNAME=base
DB_AUTHKEY=
```
You also need to enable the debug mode: `CLIENT_DEBUG=true`

You can leave all the API keys empty.
If you leave the API keys empty you will have an error message logged in the console when the bot will be running. It has to do with the youtube API key being empty, *the bot will be able to run nonetheless*. If this log is disturbing you can use a dummy youtube API key (such as this one: ALzaSyATXkcq28fWdjrYHzabSGGYuY6JtpaHjKj ) or generate a real one.

### Start Redis

Open another console and start Redis with the following command: `redis-server`. Now just leave this console open.

### Start Rethinkdb

In your main console write `rethinkdb --daemon`. It should start Rethinkdb. You can make sure that it is running by writing `curl localhost:8080` in your console, if you get some html back it means Rethinkdb is running.

### Start the bot

Now you just have to start the bot. In the natsu directory run `node index.js` and the bot should start.
