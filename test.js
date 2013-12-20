var races = {
  '3/3 5K' : "Coogan's Salsa, Blues and Shamrocks",
  '4/6 10K' : "Scotland Run",
  '6/16 5M' : "Portugal Day",
  '6/29 5M' : "Front Runners New York LGBT Pride Run",
  '8/3 5M' : "Team Championships",
  '9/7 4M' : "Autism Speaks",
  '9/22 1M' : "NYRR Fifth Avenue Mile"
};

var addTooltips = function () {
  _.each($('.race-link'), function (link) {
    $(link).tooltip({
      'title' : races[$(link).text()]
    });
  });
};

window.onload = addTooltips;

