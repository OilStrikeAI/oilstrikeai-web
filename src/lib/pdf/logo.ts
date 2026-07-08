// OilStrikeAI logo mark — inline SVG so it never breaks from a missing/misplaced file.
export const logoMarkSvg = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="#0b1220" stroke="#d4a017" stroke-width="1.5"/>
  <text x="20" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22"
        font-style="italic" font-weight="bold" fill="#d4a017" text-anchor="middle">O</text>
</svg>
`;

export function logoLockupHtml(): string {
  return `
    <div style="display:flex; align-items:center; gap:12px;">
      ${logoMarkSvg}
      <span style="font-family: Arial, Helvetica, sans-serif; font-size:20px; font-weight:bold; color:#ffffff;">
        OilStrike<span style="color:#d4a017; font-style:italic;">AI</span>
      </span>
    </div>
  `;
}
