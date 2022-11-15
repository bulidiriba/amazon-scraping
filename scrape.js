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

    const options = {
        headless: false,
        args: [
            "--disable-extensions-except=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
            "--load-extension=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
        ]
    }

    const browser = await launch(options);
    const page = await browser.newPage();

    console.log("Reading data from the sheet....");
    let sites = []
    try {
        const readData = await googleSheetsInstance.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "input!A:B"
        });
        const data = readData.data.values;
        data.forEach((item) => {
            sites.push(item)
        });


        await page.waitForTimeout(3000);
        // Read from the spreadsheet
        await page.goto("https://www.google.com/", {
            waitUntil: "load",
            timeout: 0
        });

        await page.screenshot({ path: "screenshots/0-google.png"});
        let updated_data = [];
        const start_index = 1;
        const end_index = 5;
        
        for (let i=start_index; i < end_index; i++) {
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
                updated_data.push([sites[i][0], sites[i][1], found, new Date().toLocaleString()])
            } catch(error) {
                console.log(`Error Occured : ${error.message}`)
            }
        }

        console.log("\n")
        console.log("Deleting data.......");
        try {
            // Before updating first delete the existing data
            const deleteRequest = {
                auth: auth,
                spreadsheetId: spreadsheetId,
                resource: {
                    'requests': [
                        {
                            'deleteDimension': {
                                'range': {
                                    'sheetId': 0,
                                    'dimension': 'ROWS',
                                    'startIndex': 1,
                                    'endIndex': data.length + 1
                                }
                            }
                        }
                    ]
                }
            }

            googleSheetsInstance.spreadsheets.batchUpdate(deleteRequest, function(err, response) {
                if (err) {
                    console.log(err);
                }
                console.log("Deleted.");
            });
        } catch(error) {
            console.log(`Error: ${error.message}`);
        }

        console.log("updated data: ", updated_data);
        await page.waitForTimeout(10000);
        console.log("\n")
        console.log("Updating data........");
        // Write data into the google sheets
        try{
            googleSheetsInstance.spreadsheets.values.append({
                auth,
                spreadsheetId,
                range: "output!A:D",
                valueInputOption: "USER_ENTERED",
                resource: {
                    values: updated_data
                },
            });
            console.log("Google sheet succesfully updated.");
        } catch(error) {
            console.log(`Error: ${error.message}`);
        }

    } catch(error) {
        console.log(`Error : ${error.message}`);
    } finally {
        await browser.close();
    }
})();