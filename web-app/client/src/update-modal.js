const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'pages', 'Home.js');
const subPath = path.join(__dirname, 'pages', 'Subscriptions.js');

let homeContent = fs.readFileSync(homePath, 'utf8');
let subContent = fs.readFileSync(subPath, 'utf8');

// Extract subscription modal block from Home.js
const homeStart = homeContent.indexOf('{subscriptionModal && selectedPlan && (');
const homeEndMarker = '{/* QR Code Modal */}';
const homeEnd = homeContent.indexOf(homeEndMarker);

if (homeStart === -1 || homeEnd === -1) {
  console.error('Could not find markers in Home.js');
  process.exit(1);
}

let homeBlock = homeContent.substring(homeStart, homeEnd).trimEnd();

// Clean excessive blank lines in Home.js block (keep at most 1 blank line)
homeBlock = homeBlock.replace(/\n\n\n+/g, '\n\n');

// Find the subscription modal block in Subscriptions.js
const subStart = subContent.indexOf('{/* Subscription Confirmation Modal */}');
const subEndMarker = '{/* QR Code Modal */}';
const subEnd = subContent.indexOf(subEndMarker);

if (subStart === -1 || subEnd === -1) {
  console.error('Could not find markers in Subscriptions.js');
  process.exit(1);
}

// Get the part before and after the modal in Subscriptions.js
const before = subContent.substring(0, subStart);
const after = subContent.substring(subEnd);

// Replace
subContent = before + homeBlock + '\n\n        ' + after;

fs.writeFileSync(subPath, subContent);
console.log('Subscriptions.js modal updated successfully');
