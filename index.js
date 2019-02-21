const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseUrl = 'https://www.golfbidder.co.uk'
const path = '/models/6581/Mizuno_Iron_Set_MP-18_SC.html'


function wait() {
  return new Promise((resolve) => setTimeout(() => resolve(true), Math.random() * 150));
}

function getProductList() {
  return axios.get(baseUrl + path).then((resp) => {
    const $ = cheerio.load(resp.data);
    let list = [];
    $('.product-list-item').find('.col-price .wd-button').map((i, el) => list.push($(el).attr('href')));
    return list;
  })
}

function getProductDetails(productPath) {
  return wait()
    .then(() => axios.get(baseUrl + productPath))
    .then((resp) => {
      const $ = cheerio.load(resp.data);
      let details = {
        url: baseUrl + productPath
      };
      $('.item-attributes').find('tr').map((i, el) => {
        const key = $(el).find('.attribute-label span').text();
        const attrValue = $(el).find('.attribute-value span').length > 0 ? $(el).find('.attribute-value span') : $(el).find('.attribute-value label');
        if (key) details[key] = attrValue.text();
      })
      return details;
    })
}

function generateCsv(data) {
  const headers = Object.keys(data[0]);
  const content = data.map(row => headers.map(field => row[field] || '').join(','));
  return `${headers.join(',')}\n${content.join('\n')}`;
}

const name = path.substring(path.lastIndexOf('/'), path.lastIndexOf('.'))

getProductList()
  .then((productUrls) => Promise.all(productUrls.map((url) => getProductDetails(url))))
  .then((data) => {
    fs.writeFileSync(`./data/${name}.csv`, generateCsv(data));
    fs.writeFileSync(`./data/${name}.json`, JSON.stringify(data, null, 4));
  });