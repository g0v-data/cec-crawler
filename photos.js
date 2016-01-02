require('shelljs/global');

const PREFIX_URL = 'http://2016.cec.gov.tw/frontsite/proofreader/img/legislatorImg/1/';
var candidates = JSON.parse(cat('candidates.json'));

mkdir('-p', 'images');

Object.keys(candidates).forEach(key => {
  var candidate = candidates[key];
  exec(`wget -c ${PREFIX_URL}${key} -O images/${candidate.cityNo}-${candidate.cityname}-${candidate.sessionname}-${candidate.drawno}-${candidate.candidatename}.jpg`);
});
