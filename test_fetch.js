const cheerio = require('cheerio');

async function test() {
  const targetUrl = 'https://youtu.be/3jiTlIE5znQ';
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1; kakaotalk-scrap/1.0; +https://devtalk.kakao.com/t/scrap/1.0.97',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const getMetaTag = (name) => 
    $(`meta[property="${name}"]`).attr('content') || 
    $(`meta[name="${name}"]`).attr('content');

  console.log('Title:', getMetaTag('og:title') || $('title').text());
  console.log('Desc:', getMetaTag('og:description'));
  console.log('Image:', getMetaTag('og:image'));
}
test();
