const puppeteer = require("puppeteer");
const xlsx = require("xlsx");

const file = xlsx.readFile("../Ip Alert sample.xlsx");

let sites = []

const sheets = file.SheetNames
for (let i=0; i < 5; i++) {
    const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]])
    temp.forEach((res) => {
        sites.push(res)
    })
}

// console.log(sites);
(async()=> {
    var options = {
        headless: true,
        args: [
            "--disable-extensions-except=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
            "--load-extension=~/.config/google-chrome/Default/Extensions/dcmindjgpiimpmkgmabhkflfaiimioea/2.39_0",
        ]
    }
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.waitForTimeout(3000);

    try {
        await page.goto("https://www.google.com/", {
            waitUntil: "load",
            timeout: 0
        });

        await page.screenshot({ path: "screenshots/0-google.png"});
        let all_sites = [];
        for (let i=0; i < 10; i++) {
            try {
                console.log(`Checking for: ${sites[i]["Amazon ASIN URL"]}`)
                await page.goto(sites[i]["Amazon ASIN URL"]);

                await page.waitForTimeout(10000);
                await page.screenshot({ path: `screenshots/${i}-source-url.png`});

                let found = await page.evaluate(()=> {
                    let ipAlertDialog = document.querySelector("#ip_alert_modal");
                    if (ipAlertDialog) return "YES"
                    return "NO"
                });
                console.log(`found: ${found}`);
                all_sites.push({"Amazon ASIN URL": sites[i]["Amazon ASIN URL"], "IP Alert Found": found, "IP Alert LastCheck": ""})
            } catch(error) {
                console.log(`Error Occured : ${error.message}`)
            }
        }

        all_sites.flat()
        console.log("Save to Excel...");
        const worksheet = xlsx.utils.json_to_sheet(all_sites.flat())
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Responses")
        xlsx.writeFile(workbook, "../result.xlsx");

        console.log("Successfuly written to excel file");

    } catch(error) {
        console.error("------ERROR OCCURED---", error.message);

    } finally {
        await browser.close();
    }

})();