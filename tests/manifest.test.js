// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.join(__dirname, "..");

function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
}

test("manifest keeps only the required permissions", () => {
  const manifest = readManifest();

  assert.deepEqual(manifest.permissions, [
    "storage",
    "clipboardRead",
    "clipboardWrite",
    "scripting",
  ]);
});

test("manifest exposes extension icons for Chrome and Edge", () => {
  const manifest = readManifest();
  const expectedIcons = {
    16: "assets/icons/icon16.png",
    32: "assets/icons/icon32.png",
    48: "assets/icons/icon48.png",
    128: "assets/icons/icon128.png",
  };

  assert.deepEqual(manifest.icons, expectedIcons);
  assert.deepEqual(manifest.action.default_icon, expectedIcons);

  for (const iconPath of Object.values(expectedIcons)) {
    assert.ok(fs.existsSync(path.join(root, iconPath)), `${iconPath} is missing`);
  }
});

test("manifest stays scoped to DWService pages", () => {
  const manifest = readManifest();
  const matches = manifest.content_scripts.flatMap((script) => script.matches);
  const uniqueMatches = [...new Set(matches)];
  const expectedMatches = [
    "https://dwservice.net/*",
    "https://access.dwservice.net/*",
    "https://www.dwservice.net/*",
    "https://*.dwservice.net/*",
  ];

  assert.deepEqual(uniqueMatches, expectedMatches);
  assert.deepEqual(manifest.host_permissions, expectedMatches);
});

test("manifest registers the self-healing background worker", () => {
  const manifest = readManifest();

  assert.deepEqual(manifest.background, {
    service_worker: "src/background/background.js",
  });
});

test("package metadata declares the MPL-2.0 license", () => {
  const packageJson = readPackageJson();

  assert.equal(packageJson.license, "MPL-2.0");
});

test("manifest and package versions stay aligned", () => {
  const manifest = readManifest();
  const packageJson = readPackageJson();

  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(packageJson.version, manifest.version);
});
