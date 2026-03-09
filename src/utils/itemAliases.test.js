import { resolveAlias, fuzzyMatchItem, isSuspiciousPrice } from './itemAliases.js';

let countAll = 0;
let countPass = 0;

function assert(condition, message) {
    countAll++;
    if (condition) {
        countPass++;
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
    }
}

console.log("--- Běh testov pre itemAliases.js ---");

// Test 1
assert(resolveAlias("CC18 Typhoon") === "CC-18 Typhoon", 'resolveAlias("CC18 Typhoon") -> "CC-18 Typhoon"');

// Test 2
assert(resolveAlias("Jormungand") === "Jormungandr", 'resolveAlias("Jormungand") -> "Jormungandr"');

// Test 3
assert(resolveAlias("Breaker") === "Breaker", 'resolveAlias("Breaker") -> "Breaker"');

// Mock items
const mockItems = [
    { id: 1, name: "CC-18 Typhoon" },
    { id: 2, name: "Jormungandr" },
    { id: 3, name: "Breaker" },
    { id: 4, name: "RL-9 Helicon" },
    { id: 5, name: "ZS-52 Mastodon" },
    { id: 6, name: "RA-1 Heather" },
    { id: 7, name: "Thyrsus II" },
    { id: 8, name: "Punisher" }
];

// Test 4
const match1 = fuzzyMatchItem("CC18 Typhoon", mockItems);
assert(match1 && match1.score >= 0.9 && match1.item.name === "CC-18 Typhoon", 'fuzzyMatchItem("CC18 Typhoon") -> score >= 0.9, item.name === "CC-18 Typhoon"');

// Test 5
const match2 = fuzzyMatchItem("Brekr", mockItems);
assert(match2 && match2.score < 0.9, 'fuzzyMatchItem("Brekr") -> score < 0.9 (unmatched)');

// Test 6
assert(isSuspiciousPrice(15000, 10000) === true, 'isSuspiciousPrice(15000, 10000) -> true (sale > purchase)');

// Test 7
assert(isSuspiciousPrice(10000, 15000) === false, 'isSuspiciousPrice(10000, 15000) -> false (sale < purchase)');

console.log(`\nVýsledok: ${countPass} / ${countAll} PASS`);
if (countPass !== countAll) {
    process.exit(1);
}
