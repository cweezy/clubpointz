$(function () {
  $('#scrape-it').click(function () {
    alert('chris is the best');
    var urlToScrape =  $('#url-to-scrape').val()
    $.ajax({
      type: "POST",
      url: 'scrape_url',
      data: {
        urlToScrape: urlToScrape
      }
    });
  });
});
