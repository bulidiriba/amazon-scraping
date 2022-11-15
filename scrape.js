const { google } = require("googleapis");
const { readFileSync } = require("fs");
const { launch } = require("puppeteer");

// spreadsheet id
const spreadsheetId = "1-bUqSrF7GCaGE3flwVYolmYusQiXLEYW5Krl27vYyjU";
const key_file = "./credentials.json";
// const extracted_data = JSON.parse(readFileSync("./result.json"));
const spreadSheetApiURL = "https://www.googleapis.com/auth/spreadsheets";

// const spreadsheetId = "1asVk57bGphji5AGmSEqTbSZaRVx6rM0Hlq5o5kNQCGA";
// const key_file = "./keys.json";

console.log("Reading data....");

( async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: key_file,
        scopes: spreadSheetApiURL,
    });

    // Auth client Object
    const authClientObject = await auth.getClient();
    // Google sheets instance

    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });

    console.log("Reading data from the sheet....");
    let sites = []
    try {
        const readData = await googleSheetsInstance.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "output!A:B"
        });
        let data = readData.data.values;
        data.forEach((item) => {
            sites.push(item)
        });

    } catch(error) {
        console.log(`Error : ${error.message}`)
    }

    var options = {
        headless: false,
        args: [
            "--disable-extensions-except=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
            "--load-extension=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
        ]
    }

    const browser = await launch(options);
    const page = await browser.newPage();
    await page.waitForTimeout(3000);

    

    // Read from the spreadsheet
    try {
        await page.goto("https://www.google.com/", {
            waitUntil: "load",
            timeout: 0
        });

        await page.screenshot({ path: "screenshots/0-google.png"});
        let all_sites = [];
        
        for (let i=1; i < 5; i++) {
            try {
                console.log(`Checking for: ${sites[i][1]}`)
                console.log(`sites: `, sites[i][1]);
                await page.goto(sites[i][1]);

                await page.waitForTimeout(10000);
                await page.screenshot({ path: `screenshots/${i}-source-url.png`});

                let found = await page.evaluate(()=> {
                    let ipAlertDialog = document.querySelector("#ip_alert_modal");
                    if (ipAlertDialog) return "YES"
                    return "NO"
                });
                console.log(`found: ${found}`);
                all_sites.push({"Amazon ASIN URL": sites[i][1], "IP Alert Found": found, "IP Alert LastCheck": new Date().toLocaleString()})
            } catch(error) {
                console.log(`Error Occured : ${error.message}`)
            }
        }

    } catch(error) {
        console.log(`Error : ${error.message}`);
    }
})();