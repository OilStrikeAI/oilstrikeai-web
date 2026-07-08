// OilStrikeAI — shared PDF report template, ported from the manually-built
// report generator (pdf-template/ at the project root) into the deployed app
// so real customer/audit PDFs can be generated server-side on Vercel. Layout
// rules (break-inside:avoid on tables/findings, the fraud-alert box
// deliberately NOT using break-inside:avoid) are preserved exactly as tuned
// against three real contracts earlier — do not "simplify" them without
// re-testing against a real multi-page PDF.
import { logoLockupHtml } from "./logo";

export function buildReportHtml({
  reportTitle,
  metaLines,
  bodyHtml,
}: {
  reportTitle: string;
  metaLines: string[];
  bodyHtml: string;
}): string {
  const metaHtml = metaLines.map((line) => `<div class="meta-line">${line}</div>`).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${reportTitle} — OilStrikeAI</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
    color: #1a1a1a;
    font-size: 11pt;
    line-height: 1.5;
  }
  .header {
    background: #0b1220;
    padding: 22px 18mm;
  }
  .header .title {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
    margin-top: 14px;
  }
  .header .meta-line {
    font-size: 9.5pt;
    color: #cfd3da;
    margin-top: 4px;
  }
  .content { padding: 20px 18mm 10px 18mm; }
  h2 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14pt;
    border-bottom: 2px solid #d4a017;
    padding-bottom: 4px;
    margin-top: 26px;
    break-after: avoid;
    page-break-after: avoid;
  }
  table {
    width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt;
    break-inside: avoid; page-break-inside: avoid;
  }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f2f2f2; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .finding {
    margin-bottom: 14px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .finding .title { font-weight: bold; }
  .finding .meta { font-size: 9.5pt; color: #555; margin-top: 2px; }
  .finding .note { font-size: 9.5pt; color: #333; margin-top: 3px; font-style: italic; }
  .finding .action { font-size: 9.5pt; color: #0b1220; margin-top: 3px; }
  .finding .action strong { color: #0b1220; }
  .tag-red { color: #b91c1c; }
  .tag-yellow { color: #92700a; }
  .tag-white { color: #555; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
  .dot-red { background: #b91c1c; }
  .dot-yellow { background: #d4a017; }
  .dot-white { background: #999999; }
  .checklist li { margin-bottom: 4px; }
  .appendix-quote {
    font-style: italic; color: #333; background: #f7f7f5;
    padding: 8px 10px; border-left: 3px solid #d4a017; margin: 6px 0 14px 0; font-size: 10pt;
    break-inside: avoid; page-break-inside: avoid;
  }
  .exec-summary {
    background: #fbf8f0; border: 1px solid #e5dcc0; padding: 12px 14px; font-size: 10.5pt;
    break-inside: avoid; page-break-inside: avoid;
  }
  .fraud-alert {
    background: #1a0505; color: #ffffff; border: 2px solid #b91c1c;
    padding: 14px 16px; margin: 10px 0 16px 0;
  }
  .fraud-alert .fraud-title {
    font-family: Arial, Helvetica, sans-serif; font-size: 13pt; font-weight: bold;
    color: #ff6b6b; margin-bottom: 8px;
    break-after: avoid; page-break-after: avoid;
  }
  .fraud-alert ul { margin: 6px 0; padding-left: 20px; }
  .fraud-alert li {
    margin-bottom: 6px; font-size: 10pt;
    break-inside: avoid; page-break-inside: avoid;
  }
  .fraud-alert .recommendation {
    margin-top: 10px; padding-top: 10px; border-top: 1px solid #b91c1c;
    font-weight: bold; font-size: 10pt;
    break-inside: avoid; page-break-inside: avoid;
  }
</style>
</head>
<body>

<div class="header">
  ${logoLockupHtml()}
  <div class="title">${reportTitle}</div>
  ${metaHtml}
</div>

<div class="content">
  ${bodyHtml}
</div>

</body>
</html>
`;
}
