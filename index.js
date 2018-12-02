const fetch = require('node-fetch');
const $ = require('cheerio');
const entities = require('html-entities').AllHtmlEntities;
const elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

function main() {

    fetch('https://sqadays.com/ru/program/62415')
        .then(res => res.text())
        .then(body => {
            $('.talk-wrapper', body).each((i, el) => {
                const authors = $('.program-talk-author', el).map((index, author) => {
                    const metaData = $('.talk-authordata', author).html().split('<br>', 2);

                    return {
                        name: $('.talk-author', author).text(),
                        company: entities.decode(metaData[0]),
                        location: entities.decode(metaData[1])
                    };
                }).get();

                const talk = {
                    authors: authors,
                    name: $('.title', el).text(),
                    preview: 'https://sqadays.com' + $('.title', el).attr('href')
                }

                console.log(talk);
            });
        });

    client.ping({
        requestTimeout: 1000
    }, function (error) {
        if (error) {
            console.trace('elasticsearch cluster is down!');
        } else {
            console.log('All is well');
        }
    });
}


main();