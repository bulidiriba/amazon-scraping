const { google } = require("googleapis");
const { launch } = require("puppeteer");
const { readFileSync } = require("fs");

// get the config
const config = JSON.parse(readFileSync("./config.json"));
const spreadsheetId = config.spreadsheetId;
const key_file = config.keyFile;
const spreadSheetApiURL = config.spreadSheetApiURL;
const inputSheet = config.inputSheet;
const outputSheet = config.outputSheet;
const errorSheet  = config.errorSheet;
const startIndex = config.startIndex;
const endIndex = config.endIndex;
const saveAfter = config.saveAfter;
const extensionPath = config.extensionPath;

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
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
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
            range: `${inputSheet}!A:B`
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


        console.log(`\nChecking IP Alert Found for Amazon URLs from row ${startIndex} to ${endIndex}`);
        await page.waitForTimeout(3000);

        for (let i=startIndex; i < endIndex; i++) {
            try {
                console.log(`\nChecking for Amazon URL of row ${i} : ${sites[i][1]}`);
                await page.goto(sites[i][1], {
                    waitUntil: "load",
                    timeout: 0
                });        

                let found = await page.evaluate(()=> {
                    let ipAlertDialog = document.querySelector("#ip_alert_modal");
                    if (ipAlertDialog) return "YES"
                    return "NO"
                });

                // if not found, check weather the page is normal or captcha page
                let captcha = await page.evaluate(() => {
                    let captchaElt = document.querySelector("#captchacharacters");
                    if (captchaElt) return true
                    return false
                })

                if (captcha) {
                    console.log(`\nThe Page is asking for captcha so browser is going to be closed....`);
                    console.log(`\nPlease restart the scripts again`);
                    await browser.close();
                    return
                }

                console.log(`IP Alert Found : ${found}`);
                const lastCheck = new Date().toLocaleString();
                console.log(`IP Alert Last Check : ${lastCheck}`);
                updated_data.push([sites[i][0], sites[i][1], found, lastCheck])
                
            } catch(error) {
                console.log(`Error Occured : ${error.message}`)
                error_data.push([i, sites[i][0], sites[i][1]]);
            }

            if (i % saveAfter === 0) {
                //console.log("updated data: ", updated_data);
                await page.waitForTimeout(10000);
                console.log("\nWriting updated output data to google sheet........");
                // Write data into the google sheets
                try{
                    googleSheetsInstance.spreadsheets.values.append({
                        auth,
                        spreadsheetId,
                        range: `${outputSheet}!A:D`,
                        valueInputOption: "USER_ENTERED",
                        resource: {
                            values: updated_data
                        },
                    });

                    googleSheetsInstance.spreadsheets.values.append({
                        auth,
                        spreadsheetId,
                        range: `${errorSheet}!A:C`,
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
            await page.waitForTimeout(5000);
        }

        const end_time = new Date();
        const numMillisecond = end_time - start_time;
        const numSeconds = parseInt(numMillisecond / 1000);
        //const numMinute = parseInt(numMillisecond / 60000);
        //const numHours = parseInt(numSeconds / 3600);
        const total_amazon_url = endIndex - startIndex;
        console.log(`\n......Time taken to check all the given ${total_amazon_url} amazon URLs is : ${numSeconds} seconds }\n`);
    } catch(error) {
        console.log(`Error : ${error.message}`);
    } finally {
        await browser.close();
    }
})();