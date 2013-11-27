# clubpointz 
## An NYRR Club Points Viewer

This'll be cool.

### Scraping Data

Result scraping can be done by running the following grunt commands. Currently we're scraping the first 250 results for each race, and skipping data parsing for races that are already saved in the DB. We're also skipping races with irregular result pages (such as the NYC Marathon). There are two ways to specify the races for which you want to scrape data:

#### Default: Scraping the NYRR Race Results Page
```
> grunt scrape
```
Visits [NYRR Race Results page](http://web2.nyrrc.org/cgi-bin/start.cgi/aes-programs/results/resultsarchive.htm) and parses info to scrape the races displayed (latest 10 NYRR races).

#### From a File
```
> grunt scrape:from_file
```
Reads from <code>tasks/scraper/races.json</code> and parses info to scrape the races in this file.
