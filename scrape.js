const { google } = require("googleapis");
const { launch } = require("puppeteer");

// spreadsheet id
const spreadsheetId = "1-bUqSrF7GCaGE3flwVYolmYusQiXLEYW5Krl27vYyjU";
const key_file = "./credentials.json";
const spreadSheetApiURL = "https://www.googleapis.com/auth/spreadsheets";

console.log("\n...........Automated Scripts to check IP Alert Found for List of given Amazon URLs........");

( async () => {
    const start_time = new Date();
    const auth = new google.auth.GoogleAuth({
        keyFile: key_file,
        scopes: spreadSheetApiURL,
    });

    // Auth client Object
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    console.log(`\nDefining the extension path from file....`);
    const options = {
        headless: false,
        args: [
            "--disable-extensions-except=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
            "--load-extension=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
        ]
    }

    console.log(`\nLaunching the browser...`);
    const browser = await launch(options);
    const page = await browser.newPage();

    let sites = []
    try {
        await page.waitForTimeout(3000);
        console.log(`\nOpening Google...`);
        await page.goto("https://www.google.com/", {
            waitUntil: "load",
            timeout: 0
        });

        await page.screenshot({ path: "screenshots/0-google.png"});
        console.log("\nPlease provide your license key to extension....");
        console.log("Waiting for 30 seconds...");
        await page.waitForTimeout(30000);

        console.log("\nReading Amazon URLs from Google sheet....");
        const readData = await googleSheetsInstance.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "input!A:B"
        });
        const data = readData.data.values;
        data.forEach((item) => {
            sites.push(item)
        });
        await page.waitForTimeout(5000);
        console.log(`\nNumber of Amazon URLs fetched from Google sheet : ${data.length}`);
        await page.waitForTimeout(3000);

        let updated_data = [];
        let error_data = [];
        const start_index = 1001;
        const end_index = 10000;

        console.log(`\nChecking IP Alert Found for Amazon URLs from row ${start_index} to ${end_index}`);
        await page.waitForTimeout(3000);

        for (let i=start_index; i < end_index; i++) {
            try {
                console.log(`\nChecking for Amazon URL of row ${i} : ${sites[i][1]}`);
                await page.goto(sites[i][1]);

                let found = await page.evaluate(()=> {
                    let ipAlertDialog = document.querySelector("#ip_alert_modal");
                    if (ipAlertDialog) return "YES"
                    return "NO"
                });
                console.log(`IP Alert Found : ${found}`);
                const lastCheck = new Date().toLocaleString();
                console.log(`IP Alert Last Check : ${lastCheck}`);
                updated_data.push([sites[i][0], sites[i][1], found, lastCheck])
                
                if (i % 50 === 0) {
                    //console.log("updated data: ", updated_data);
                    await page.waitForTimeout(10000);
                    console.log("\nWriting updated output data to google sheet........");
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

                        googleSheetsInstance.spreadsheets.values.append({
                            auth,
                            spreadsheetId,
                            range: "error!A:C",
                            valueInputOption: "USER_ENTERED",
                            resource: {
                                values: error_data
                            },
                        });
                        updated_data = [];
                        error_data = [];
                        console.log("\nGoogle sheet succesfully updated.");
                    } catch(error) {
                        console.log(`Error: ${error.message}`);
                    }           
                }
            } catch(error) {
                console.log(`Error Occured : ${error.message}`)
                error_data.push([i, sites[i][0], sites[i][1]]);
            }
        }

        const end_time = new Date();
        const numMillisecond = end_time - start_time;
        const numSeconds = parseInt(numMillisecond / 1000);
        //const numMinute = parseInt(numMillisecond / 60000);
        //const numHours = parseInt(numSeconds / 3600);
        const total_amazon_url = end_index - start_index;
        console.log(`\n......Time taken to check all the given ${total_amazon_url} amazon URLs is : ${numSeconds} seconds }\n`);
    } catch(error) {
        console.log(`Error : ${error.message}`);
    } finally {
        await browser.close();
    }
})();