const fetch = require('node-fetch');
const $ = require('cheerio');
const entities = require('html-entities').AllHtmlEntities;
const elasticsearch = require('elasticsearch');
const sha = require('sha256');

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

function main() {

    const conference = {
        name: 'SQADays',
        years: [{
                year: '2017',
                url: [
                    'https://sqadays.com/ru/program/52247',
                    'https://sqadays.com/ru/program/45127'
                ]
            },
            {
                year: '2018',
                url: [
                    'https://sqadays.com/ru/program/62415',
                    'https://sqadays.com/ru/program/55692',
                ]
            }
        ]
    };

    parseAndSave('SQADays', '2018', 'https://sqadays.com/ru/program/55692');
}

function parseAndSave(nameConference, year, url) {
    fetch(url)
        .then(res => res.text())
        .then(body => $('.talk-wrapper', body).each(createTalk(nameConference, year)));
}

function createTalk(nameConference, year) {
    return (i, el) => {
        const authors = $('.program-talk-author', el)
            .map(extractMetadata)
            .get();

        const talk = {
            authors: authors,
            name: $('.title', el).text(),
            preview: 'https://sqadays.com' + $('.title', el).attr('href'),
            conference: {
                name: nameConference,
                year: year
            }
        }
        createDataInElasticsearch(talk);
    };
};

function createDataInElasticsearch(talk) {
    if (talk.authors.length == 0) {
        console.log('author is empty');
    } else
        client.index({
            index: 'shikary',
            type: 'talks',
            body: talk,
            id: sha(talk.conference.name + talk.conference.year + talk.name)
        });
}

function extractMetadata(index, author) {
    const metaData = $('.talk-authordata', author).html().split('<br>', 2);

    return {
        name: $('.talk-author', author).text(),
        company: entities.decode(metaData[0]),
        location: entities.decode(metaData[1])
    };
}

main();