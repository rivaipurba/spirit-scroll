// Regression check: the "Scan for updates" button must be visible on mobile.
// It lives in the top navbar and used to be hidden below the `sm` breakpoint
// (`hidden sm:flex`), so mobile users had no way to trigger a scan.
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./client/src/components/TopNavbar.tsx', import.meta.url), 'utf8');

const scanButtonStart = source.indexOf('onClick={onScan}');
if (scanButtonStart === -1) {
    console.error('FAIL: scan button (onClick={onScan}) not found in TopNavbar.tsx');
    process.exit(1);
}

const scanButtonEnd = source.indexOf('</button>', scanButtonStart);
const scanButton = source.slice(scanButtonStart, scanButtonEnd);

const classNameMatch = scanButton.match(/className="([^"]*)"/);
if (!classNameMatch) {
    console.error('FAIL: scan button has no className');
    process.exit(1);
}
const className = classNameMatch[1];

const hasBaseHidden = /(^|\s)hidden(\s|$)/.test(className);
const hasBaseFlex = /(^|\s)flex(\s|$)/.test(className);
const hasIcon = /<Sparkles/.test(scanButton);

if (hasBaseHidden) {
    console.error(`FAIL: scan button is display:none on mobile — className="${className}"`);
    process.exit(1);
}
if (!hasBaseFlex) {
    console.error(`FAIL: scan button has no base display class — className="${className}"`);
    process.exit(1);
}
if (!hasIcon) {
    console.error('FAIL: scan button has no visible icon on mobile');
    process.exit(1);
}

console.log('PASS: scan button is visible on mobile (icon-only below sm, labelled from sm up)');
