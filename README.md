# amazon-scraping

Step to run

1. First make sure that node installed on your machine
    check 
    
        node --version

2. Create the google sheet api and replace the downloaded credentials in   `credentials.json`

3. Create the spread sheet and replace the spread sheet name and other configs in `config.json`

        a. spreadSheetId -- The ID of the spread sheet,  

        b. key file -- The google console api `credentials.json` file
       
        c. spreadSheetApiURL -- google api URL, it will never changed
        
        d. inputSheet -- the name of input sheet, which the input is going to be read from
        
        e. outputSheet -- the name of output sheet, where result is going to be stored
        
        f. errorSheet -- the name of sheet where the error sites will be stored, means if the connection gets lost while scraping or other error
        
        g. startIndex -- the index of sites at which scraping to be started
        
        h. endIndex -- the index or rows of site at which scraping ends
        
        i. saveAfter -- the range to save the results, eg save the result to google sheet after extracting for 10 sheets every
        
        j. extensionPath -- the path of extension from local directory.

4. Get the path of the ip alert extension from local file and replace it with `extensionPath` in `config.json`

4. Go to `amazon-ip-alert-checking`

        cd amazon-ip-alert-checking

5. Install the required packages: 

        npm install

6. Make sure that `credentials.json` and `config.json` updated as needed

7. Run the `scrape.js`

        node scrape.js

8. While the browser launched click on extension icon and copy paste the extension license

9. Then check the log of scraping, it should run and save the result to the respective `output` of the google sheet after each `saveAfter` attribute