// Renders report HTML to a PDF buffer. Vercel's serverless functions don't
// have a full Chrome install, so production uses @sparticuz/chromium (a
// Chromium build packaged for serverless environments); local development
// reuses the same locally-installed Chrome already used by the standalone
// report-generation scripts in pdf-template/ at the project root.
import puppeteer from "puppeteer-core";

const LOCAL_CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export async function renderPdf(
  html: string,
  { runningHeaderText = "" }: { runningHeaderText?: string } = {}
): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  let launchOptions: Parameters<typeof puppeteer.launch>[0];
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    launchOptions = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
  } else {
    launchOptions = {
      executablePath: LOCAL_CHROME_PATH,
      headless: true,
    };
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%; font-family:Arial,Helvetica,sans-serif; font-size:8px; color:#888;
                    padding:0 18mm; display:flex; align-items:center; justify-content:space-between;">
          <span style="font-weight:bold; color:#0b1220;">OilStrike<span style="color:#d4a017; font-style:italic;">AI</span></span>
          <span>${runningHeaderText}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size:8px; width:100%; text-align:center; color:#888; font-family:Arial,Helvetica,sans-serif;">
          OilStrikeAI &mdash; Confidential &nbsp;|&nbsp; Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: { top: "12mm", bottom: "16mm", left: "0mm", right: "0mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
